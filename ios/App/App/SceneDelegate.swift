import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

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

        if let win = self.window {
            let splashView = UIImageView(frame: win.bounds)
            splashView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            splashView.contentMode = .scaleToFill
            splashView.clipsToBounds = true
            let hour = Calendar.current.component(.hour, from: Date())
            splashView.overrideUserInterfaceStyle = (hour >= 18 || hour < 6) ? .dark : .light
            splashView.image = UIImage(named: "Splash")
            win.addSubview(splashView)

            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                UIView.animate(withDuration: 0.35, animations: {
                    splashView.alpha = 0
                }, completion: { _ in
                    splashView.removeFromSuperview()
                })
            }
        }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
