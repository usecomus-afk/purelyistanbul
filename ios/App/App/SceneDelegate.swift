import UIKit
import Capacitor
import AVFoundation
import WebKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var splashContainer: UIView?
    private var splashPlayer: AVPlayer?
    private var splashPlayerLayer: AVPlayerLayer?
    private var splashEndObserver: NSObjectProtocol?
    private var isSplashDismissed = false

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let creamColor = UIColor(red: 0.965, green: 0.945, blue: 0.906, alpha: 1.0)
        let bridgeVC: CAPBridgeViewController

        if let existingWindow = self.window, let existingVC = existingWindow.rootViewController as? CAPBridgeViewController {
            bridgeVC = existingVC
        } else {
            let newWindow = UIWindow(windowScene: windowScene)
            let newVC = CAPBridgeViewController()
            newWindow.rootViewController = newVC
            self.window = newWindow
            bridgeVC = newVC
        }

        window?.backgroundColor = creamColor
        window?.makeKeyAndVisible()

        bridgeVC.edgesForExtendedLayout = .all
        bridgeVC.extendedLayoutIncludesOpaqueBars = true
        bridgeVC.webView?.backgroundColor = creamColor
        bridgeVC.webView?.scrollView.backgroundColor = creamColor
        bridgeVC.webView?.scrollView.contentInsetAdjustmentBehavior = .never
        bridgeVC.webView?.scrollView.contentInset = .zero
        bridgeVC.webView?.scrollView.scrollIndicatorInsets = .zero

        let videoURL = Bundle.main.url(forResource: "splash-intro", withExtension: "mp4", subdirectory: "public/videos")
            ?? Bundle.main.url(forResource: "splash-intro", withExtension: "mp4")

        if let win = self.window, let videoURL = videoURL {
            let scriptSource = "try { sessionStorage.setItem('purely_splash_v6_played', 'true'); sessionStorage.setItem('purely_splash_played', 'true'); window.__PURELY_NATIVE_VIDEO_SPLASH_V6__ = true; window.__PURELY_NATIVE_VIDEO_SPLASH__ = true; } catch(e) {}"
            let userScript = WKUserScript(source: scriptSource, injectionTime: .atDocumentStart, forMainFrameOnly: false)
            bridgeVC.webView?.configuration.userContentController.addUserScript(userScript)
            bridgeVC.webView?.evaluateJavaScript(scriptSource, completionHandler: nil)

            try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try? AVAudioSession.sharedInstance().setActive(true)

            let container = UIView(frame: win.bounds)
            container.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            container.backgroundColor = UIColor(red: 0.059, green: 0.090, blue: 0.118, alpha: 1.0)
            container.clipsToBounds = true

            let player = AVPlayer(url: videoURL)
            player.isMuted = true
            player.automaticallyWaitsToMinimizeStalling = false

            let playerLayer = AVPlayerLayer(player: player)
            playerLayer.frame = container.bounds
            playerLayer.videoGravity = .resize
            container.layer.addSublayer(playerLayer)

            let progressTrack = UIView(frame: CGRect(x: 0, y: container.bounds.height - 4, width: container.bounds.width, height: 4))
            progressTrack.autoresizingMask = [.flexibleWidth, .flexibleTopMargin]
            progressTrack.backgroundColor = UIColor(red: 0.706, green: 0.667, blue: 0.588, alpha: 0.4)

            let progressFill = UIView(frame: CGRect(x: 0, y: 0, width: 0, height: 4))
            progressFill.backgroundColor = UIColor(red: 0.788, green: 0.682, blue: 0.510, alpha: 1.0)
            progressTrack.addSubview(progressFill)
            container.addSubview(progressTrack)

            let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleSplashTap))
            container.addGestureRecognizer(tapGesture)

            win.addSubview(container)

            self.splashContainer = container
            self.splashPlayer = player
            self.splashPlayerLayer = playerLayer

            self.splashEndObserver = NotificationCenter.default.addObserver(
                forName: .AVPlayerItemDidPlayToEndTime,
                object: player.currentItem,
                queue: .main
            ) { [weak self] _ in
                self?.dismissSplash()
            }

            player.playImmediately(atRate: 1.0)

            UIView.animate(withDuration: 10.2, delay: 0, options: [.curveEaseInOut, .allowUserInteraction]) {
                progressFill.frame.size.width = container.bounds.width
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 10.5) { [weak self] in
                self?.dismissSplash()
            }
        }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    @objc private func handleSplashTap() {
        dismissSplash()
    }

    private func dismissSplash() {
        guard !isSplashDismissed else { return }
        isSplashDismissed = true

        if let observer = splashEndObserver {
            NotificationCenter.default.removeObserver(observer)
            splashEndObserver = nil
        }

        if let bridgeVC = self.window?.rootViewController as? CAPBridgeViewController {
            let hideWebSplash = "try { document.querySelectorAll('#purely-intro-splash').forEach(function(el){ el.style.display = 'none'; }); } catch(e) {}"
            bridgeVC.webView?.evaluateJavaScript(hideWebSplash, completionHandler: nil)
        }

        guard let container = splashContainer else { return }
        container.isUserInteractionEnabled = false

        UIView.animate(withDuration: 0.45, delay: 0, options: [.curveEaseOut]) {
            container.alpha = 0
            container.transform = CGAffineTransform(scaleX: 1.02, y: 1.02)
        } completion: { [weak self] _ in
            self?.splashPlayer?.pause()
            self?.splashPlayerLayer?.removeFromSuperlayer()
            self?.splashPlayer = nil
            self?.splashPlayerLayer = nil
            container.removeFromSuperview()
            self?.splashContainer = nil
            if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
                appDelegate.startSilentBackgroundKeepAlive()
                appDelegate.pollFirestoreServiceRequests()
            }
        }
    }

    func sceneWillResignActive(_ scene: UIScene) {
        if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
            appDelegate.applicationWillResignActive(UIApplication.shared)
        }
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
            appDelegate.applicationDidEnterBackground(UIApplication.shared)
        }
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
            appDelegate.applicationWillEnterForeground(UIApplication.shared)
        }
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
            appDelegate.applicationDidBecomeActive(UIApplication.shared)
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

