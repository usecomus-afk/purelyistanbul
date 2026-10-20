import UIKit
import Capacitor
import UserNotifications
import AVFoundation
import MediaPlayer

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?
    private var requestPollTimer: Timer?
    private var isPolling = false

    private static let notifiedStorageKey = "xenios_ios_native_notified_ids_v3"
    private static let notifiedInitKey = "xenios_ios_native_notified_init_v3"
    private static let apnsTokenStorageKey = "xenios_ios_apns_device_token"
    private static let lockQueue = DispatchQueue(label: "com.usecomus.olympus.notifiedIds")

    static var notifiedRequestIds: Set<String> = {
        let saved = UserDefaults.standard.stringArray(forKey: notifiedStorageKey) ?? []
        return Set(saved)
    }()

    static func isInitialSeedDone() -> Bool {
        return lockQueue.sync {
            return UserDefaults.standard.bool(forKey: notifiedInitKey)
        }
    }

    static func markInitialSeedDone() {
        lockQueue.sync {
            UserDefaults.standard.set(true, forKey: notifiedInitKey)
        }
    }

    static func markIfNew(_ id: String) -> Bool {
        return lockQueue.sync {
            if notifiedRequestIds.contains(id) {
                return false
            }
            notifiedRequestIds.insert(id)
            let arr = Array(notifiedRequestIds.suffix(400))
            UserDefaults.standard.set(arr, forKey: notifiedStorageKey)
            return true
        }
    }

    func requestNotificationPermissions() {
        AppDelegate.requestNotificationPermissions()
    }

    static func requestNotificationPermissions() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            if granted {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
        if let savedToken = UserDefaults.standard.string(forKey: apnsTokenStorageKey), !savedToken.isEmpty {
            syncApnsTokenWithBackend(tokenHex: savedToken)
        }
    }

    static func syncApnsTokenWithBackend(tokenHex: String, hotelId: String? = nil) {
        guard !tokenHex.isEmpty else { return }
        let endpointUrls = [
            "https://purelyistanbul--xenios-prod-c55cd.us-central1.hosted.app/api/notifications/register-device",
            "https://purelyistanbul.com/api/notifications/register-device"
        ]
        var payload: [String: Any] = [
            "deviceToken": tokenHex,
            "apnsToken": tokenHex,
            "platform": "ios",
            "role": "staff"
        ]
        if let hotelId = hotelId, !hotelId.isEmpty {
            payload["hotelId"] = hotelId
        }
        guard let httpBody = try? JSONSerialization.data(withJSONObject: payload, options: []) else { return }

        for urlString in endpointUrls {
            guard let url = URL(string: urlString) else { continue }
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.timeoutInterval = 8.0
            request.httpBody = httpBody
            URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
        }
    }

    func clearNowPlayingAndDisableBackgroundAudio() {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        UIApplication.shared.endReceivingRemoteControlEvents()
        let commandCenter = MPRemoteCommandCenter.shared()
        commandCenter.playCommand.isEnabled = false
        commandCenter.pauseCommand.isEnabled = false
        commandCenter.stopCommand.isEnabled = false
        commandCenter.togglePlayPauseCommand.isEnabled = false
        commandCenter.nextTrackCommand.isEnabled = false
        commandCenter.previousTrackCommand.isEnabled = false
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        UNUserNotificationCenter.current().delegate = self

        clearNowPlayingAndDisableBackgroundAudio()
        AppDelegate.requestNotificationPermissions()
        startFirestoreRequestWatcher()

        return true
    }

    func startFirestoreRequestWatcher() {
        requestPollTimer?.invalidate()
        let timer = Timer(timeInterval: 3.5, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            guard UIApplication.shared.applicationState == .active else { return }
            self.pollFirestoreServiceRequests()
        }
        RunLoop.main.add(timer, forMode: .common)
        self.requestPollTimer = timer

        pollFirestoreServiceRequests()
    }

    func pollFirestoreServiceRequests() {
        guard !isPolling else { return }
        guard let url = URL(string: "https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents:runQuery") else {
            return
        }

        isPolling = true
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
        request.timeoutInterval = 7.0

        let queryBody: [String: Any] = [
            "structuredQuery": [
                "from": [["collectionId": "service_requests"]],
                "orderBy": [["field": ["fieldPath": "createdAt"], "direction": "DESCENDING"]],
                "limit": 40
            ]
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: queryBody, options: [])

        URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
            guard let self = self else { return }
            defer { self.isPolling = false }

            guard let data = data,
                  let rows = try? JSONSerialization.jsonObject(with: data, options: []) as? [[String: Any]] else {
                return
            }

            let isFirstEverPoll = !AppDelegate.isInitialSeedDone()
            if isFirstEverPoll {
                AppDelegate.markInitialSeedDone()
            }
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            let fallbackFormatter = ISO8601DateFormatter()

            for row in rows.reversed() {
                guard let doc = row["document"] as? [String: Any],
                      let fields = doc["fields"] as? [String: [String: Any]] else {
                    continue
                }

                let docName = (doc["name"] as? String) ?? ""
                let fallbackId = docName.components(separatedBy: "/").last ?? ""
                let reqId = (fields["id"]?["stringValue"] as? String) ?? fallbackId
                if reqId.isEmpty {
                    continue
                }

                let status = (fields["status"]?["stringValue"] as? String) ?? "pending"
                let isActiveStatus = status == "pending"
                let roomNumber = (fields["roomNumber"]?["stringValue"] as? String) ?? "101"
                let hotelName = (fields["hotelName"]?["stringValue"] as? String) ?? "Purely Istanbul"
                let serviceTitle = (fields["serviceTitle"]?["stringValue"] as? String) ?? "Birim Hizmeti Talebi"
                let notes = (fields["notes"]?["stringValue"] as? String) ?? ""
                let priority = (fields["priority"]?["stringValue"] as? String) ?? "standart"
                let createdAtStr = (fields["createdAt"]?["stringValue"] as? String) ?? ""
                let createdDate = isoFormatter.date(from: createdAtStr) ?? fallbackFormatter.date(from: createdAtStr)
                let ageSeconds = createdDate != nil ? Date().timeIntervalSince(createdDate!) : 999999.0

                if isFirstEverPoll {
                    let isRecentOnFirstBoot = ageSeconds > -300.0 && ageSeconds < 180.0
                    if AppDelegate.markIfNew(reqId) && isRecentOnFirstBoot && isActiveStatus {
                        let isUrgent = priority == "acil"
                        let title = isUrgent ? "🚨 Acil Misafir Talebi! 🛎️" : "Yeni Misafir Talebi! 🛎️"
                        let cleanNotes = notes.replacingOccurrences(of: "\n", with: " ")
                        let body = cleanNotes.isEmpty ? "Birim \(roomNumber) - \(serviceTitle) Siparişi Verildi." : "Birim \(roomNumber) - \(serviceTitle) (\(cleanNotes)) Siparişi Verildi."
                        AppDelegate.deliverLocalNotification(id: reqId, title: title, subtitle: hotelName, body: body)
                    }
                } else {
                    let isWithinActiveWindow = ageSeconds > -300.0 && ageSeconds < 1800.0
                    if AppDelegate.markIfNew(reqId) && isWithinActiveWindow && isActiveStatus {
                        let isUrgent = priority == "acil"
                        let title = isUrgent ? "🚨 Acil Misafir Talebi! 🛎️" : "Yeni Misafir Talebi! 🛎️"
                        let cleanNotes = notes.replacingOccurrences(of: "\n", with: " ")
                        let body = cleanNotes.isEmpty ? "Birim \(roomNumber) - \(serviceTitle) Siparişi Verildi." : "Birim \(roomNumber) - \(serviceTitle) (\(cleanNotes)) Siparişi Verildi."
                        AppDelegate.deliverLocalNotification(id: reqId, title: title, subtitle: hotelName, body: body)
                    }
                }
            }
        }.resume()
    }

    static func deliverLocalNotification(id: String, title: String, subtitle: String?, body: String, completion: ((Bool) -> Void)? = nil) {
        let content = UNMutableNotificationContent()
        content.title = title
        if let sub = subtitle, !sub.isEmpty {
            content.subtitle = sub
        }
        content.body = body
        content.sound = UNNotificationSound.default
        content.badge = 1

        let request = UNNotificationRequest(identifier: id.isEmpty ? UUID().uuidString : id, content: content, trigger: nil)

        UNUserNotificationCenter.current().add(request) { error in
            completion?(error == nil)
        }
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let tokenHex = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        UserDefaults.standard.set(tokenHex, forKey: AppDelegate.apnsTokenStorageKey)
        AppDelegate.syncApnsTokenWithBackend(tokenHex: tokenHex)
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Remote notification registration note: \(error.localizedDescription)")
    }

    func application(_ application: UIApplication,
                     didReceiveRemoteNotification userInfo: [AnyHashable: Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        if let reqId = userInfo["requestId"] as? String, !reqId.isEmpty {
            _ = AppDelegate.markIfNew(reqId)
        }
        completionHandler(.newData)
    }

    // Display banner and play sound even when the app is open in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let reqId = notification.request.identifier
        if !reqId.isEmpty {
            _ = AppDelegate.markIfNew(reqId)
        }
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge, .list])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        DispatchQueue.main.async {
            if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let rootVC = scene.windows.first?.rootViewController as? CAPBridgeViewController {
                rootVC.webView?.evaluateJavaScript("window.location.href = '/hotel-portal/requests';", completionHandler: nil)
            }
        }
        completionHandler()
    }

    func applicationWillResignActive(_ application: UIApplication) {
        clearNowPlayingAndDisableBackgroundAudio()
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        clearNowPlayingAndDisableBackgroundAudio()
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        clearNowPlayingAndDisableBackgroundAudio()
        pollFirestoreServiceRequests()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        UIApplication.shared.applicationIconBadgeNumber = 0
        clearNowPlayingAndDisableBackgroundAudio()
        pollFirestoreServiceRequests()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        clearNowPlayingAndDisableBackgroundAudio()
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

@objc(XeniosNotificationPlugin)
public class XeniosNotificationPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "XeniosNotificationPlugin"
    public let jsName = "XeniosNotifications"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestNotificationPermissions", returnType: "promise"),
        CAPPluginMethod(name: "checkNotificationPermissions", returnType: "promise"),
        CAPPluginMethod(name: "scheduleNotification", returnType: "promise")
    ]

    @objc public func requestNotificationPermissions(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            call.resolve(["display": granted ? "granted" : "denied"])
        }
    }

    @objc public func checkNotificationPermissions(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let granted = settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
            call.resolve(["display": granted ? "granted" : "prompt"])
        }
    }

    @objc public func scheduleNotification(_ call: CAPPluginCall) {
        let reqId = call.getString("id", "")
        let title = call.getString("title", "Purely Istanbul Bildirim")
        let subtitle = call.getString("subtitle", "")
        let body = call.getString("body", "Yeni misafir talebi")

        if !reqId.isEmpty && !AppDelegate.markIfNew(reqId) {
            call.resolve(["success": true, "deduped": true])
            return
        }

        AppDelegate.deliverLocalNotification(
            id: reqId.isEmpty ? UUID().uuidString : reqId,
            title: title,
            subtitle: subtitle,
            body: body
        ) { ok in
            call.resolve(["success": ok])
        }
    }
}
