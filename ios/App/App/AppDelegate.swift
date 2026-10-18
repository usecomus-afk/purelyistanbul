import UIKit
import Capacitor
import UserNotifications
import AVFoundation

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?
    private var silentAudioPlayer: AVAudioPlayer?
    private var requestPollTimer: Timer?
    private var bgTask: UIBackgroundTaskIdentifier = .invalid
    private var hasSeededInitialRequests = false
    private var isPolling = false

    static var notifiedRequestIds = Set<String>()
    private static let lockQueue = DispatchQueue(label: "com.usecomus.olympus.notifiedIds")

    static func markIfNew(_ id: String) -> Bool {
        return lockQueue.sync {
            if notifiedRequestIds.contains(id) {
                return false
            }
            notifiedRequestIds.insert(id)
            return true
        }
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Set Notification Center delegate
        UNUserNotificationCenter.current().delegate = self

        // Request native iOS notification authorization (Alert, Sound, Badge)
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            if granted {
                DispatchQueue.main.async {
                    application.registerForRemoteNotifications()
                }
            }
        }

        // Start silent background keep-alive and live Firestore request watcher
        // so room service & hotel menu orders notify even when the screen/keypad is locked
        startSilentBackgroundKeepAlive()
        startFirestoreRequestWatcher()

        return true
    }

    private func buildSilentWavData() -> Data {
        let sampleRate: UInt32 = 8000
        let numChannels: UInt16 = 1
        let bitsPerSample: UInt16 = 16
        let numSamples: UInt32 = sampleRate // 1 second of silence
        let dataSize: UInt32 = numSamples * UInt32(numChannels) * UInt32(bitsPerSample / 8)
        let chunkSize: UInt32 = 36 + dataSize
        let byteRate: UInt32 = sampleRate * UInt32(numChannels) * UInt32(bitsPerSample / 8)
        let blockAlign: UInt16 = numChannels * (bitsPerSample / 8)

        var data = Data()
        data.append("RIFF".data(using: .ascii)!)
        withUnsafeBytes(of: chunkSize.littleEndian) { data.append(contentsOf: $0) }
        data.append("WAVE".data(using: .ascii)!)
        data.append("fmt ".data(using: .ascii)!)
        let subchunk1Size: UInt32 = 16
        let audioFormat: UInt16 = 1
        withUnsafeBytes(of: subchunk1Size.littleEndian) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: audioFormat.littleEndian) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: numChannels.littleEndian) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: sampleRate.littleEndian) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: byteRate.littleEndian) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: blockAlign.littleEndian) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: bitsPerSample.littleEndian) { data.append(contentsOf: $0) }
        data.append("data".data(using: .ascii)!)
        withUnsafeBytes(of: dataSize.littleEndian) { data.append(contentsOf: $0) }
        data.append(Data(count: Int(dataSize)))
        return data
    }

    private func startSilentBackgroundKeepAlive() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)

            if silentAudioPlayer == nil {
                let wavData = buildSilentWavData()
                let player = try AVAudioPlayer(data: wavData, fileTypeHint: AVFileType.wav.rawValue)
                player.numberOfLoops = -1
                player.volume = 0.0
                player.prepareToPlay()
                player.play()
                self.silentAudioPlayer = player
            } else if silentAudioPlayer?.isPlaying == false {
                silentAudioPlayer?.play()
            }
        } catch {
            print("Silent background keep-alive note: \(error.localizedDescription)")
        }
    }

    private func startFirestoreRequestWatcher() {
        requestPollTimer?.invalidate()
        let timer = Timer(timeInterval: 4.0, repeats: true) { [weak self] _ in
            self?.pollFirestoreServiceRequests()
        }
        RunLoop.main.add(timer, forMode: .common)
        self.requestPollTimer = timer
        pollFirestoreServiceRequests()
    }

    private func pollFirestoreServiceRequests() {
        guard !isPolling else { return }
        guard let url = URL(string: "https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents:runQuery") else {
            return
        }

        isPolling = true
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 8.0

        let queryBody: [String: Any] = [
            "structuredQuery": [
                "from": [["collectionId": "service_requests"]],
                "orderBy": [["field": ["fieldPath": "createdAt"], "direction": "DESCENDING"]],
                "limit": 15
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

            let isFirstPoll = !self.hasSeededInitialRequests
            self.hasSeededInitialRequests = true
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            let fallbackFormatter = ISO8601DateFormatter()

            for row in rows {
                guard let doc = row["document"] as? [String: Any],
                      let fields = doc["fields"] as? [String: [String: Any]] else {
                    continue
                }

                let docName = (doc["name"] as? String) ?? ""
                let fallbackId = docName.components(separatedBy: "/").last ?? ""
                let reqId = (fields["id"]?["stringValue"] as? String) ?? fallbackId
                if reqId.isEmpty || reqId.contains("test") || reqId.contains("demo") {
                    continue
                }

                let status = (fields["status"]?["stringValue"] as? String) ?? "pending"
                let roomNumber = (fields["roomNumber"]?["stringValue"] as? String) ?? "101"
                let hotelName = (fields["hotelName"]?["stringValue"] as? String) ?? "Purely Istanbul"
                let serviceTitle = (fields["serviceTitle"]?["stringValue"] as? String) ?? "Oda Hizmeti Talebi"
                let notes = (fields["notes"]?["stringValue"] as? String) ?? ""
                let priority = (fields["priority"]?["stringValue"] as? String) ?? "standart"
                let createdAtStr = (fields["createdAt"]?["stringValue"] as? String) ?? ""

                if isFirstPoll {
                    // On initial launch, only notify if the request was created in the last 20 seconds
                    let createdDate = isoFormatter.date(from: createdAtStr) ?? fallbackFormatter.date(from: createdAtStr)
                    let isVeryRecent = createdDate != nil && Date().timeIntervalSince(createdDate!) < 20.0
                    _ = AppDelegate.markIfNew(reqId)
                    if isVeryRecent && status == "pending" {
                        let isUrgent = priority == "acil"
                        let title = isUrgent ? "🚨 ACİL TALEP: Oda \(roomNumber)" : "🛎️ Yeni Sipariş / Talep: Oda \(roomNumber)"
                        let cleanNotes = notes.replacingOccurrences(of: "\n", with: " ")
                        let body = cleanNotes.isEmpty ? serviceTitle : "\(serviceTitle) · \(cleanNotes)"
                        AppDelegate.deliverLocalNotification(id: reqId, title: title, subtitle: hotelName, body: body)
                    }
                } else {
                    if status == "pending" && AppDelegate.markIfNew(reqId) {
                        let isUrgent = priority == "acil"
                        let title = isUrgent ? "🚨 ACİL TALEP: Oda \(roomNumber)" : "🛎️ Yeni Sipariş / Talep: Oda \(roomNumber)"
                        let cleanNotes = notes.replacingOccurrences(of: "\n", with: " ")
                        let body = cleanNotes.isEmpty ? serviceTitle : "\(serviceTitle) · \(cleanNotes)"
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
        if #available(iOS 15.0, *) {
            content.interruptionLevel = .timeSensitive
        }

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.1, repeats: false)
        let request = UNNotificationRequest(identifier: id.isEmpty ? UUID().uuidString : id, content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request) { error in
            completion?(error == nil)
        }
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Remote notification registration note: \(error.localizedDescription)")
    }

    // Display banner and play sound even when the app is open in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge, .list])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        completionHandler()
    }

    func applicationWillResignActive(_ application: UIApplication) {
        startSilentBackgroundKeepAlive()
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        startSilentBackgroundKeepAlive()
        if bgTask == .invalid {
            bgTask = application.beginBackgroundTask(withName: "PurelyIstanbulLiveRequestWatcher") { [weak self] in
                if let task = self?.bgTask, task != .invalid {
                    application.endBackgroundTask(task)
                    self?.bgTask = .invalid
                }
            }
        }
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        if bgTask != .invalid {
            application.endBackgroundTask(bgTask)
            bgTask = .invalid
        }
        pollFirestoreServiceRequests()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        UIApplication.shared.applicationIconBadgeNumber = 0
        startSilentBackgroundKeepAlive()
        pollFirestoreServiceRequests()
    }

    func applicationWillTerminate(_ application: UIApplication) {}

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
