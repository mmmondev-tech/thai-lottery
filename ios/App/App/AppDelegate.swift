import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
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

// MARK: - Ticket photo scanning
// Kept in this file so it is compiled without editing the Xcode project file.

import Vision

/// Main screen. Registers the app's own TicketScanner plugin with Capacitor.
/// (Main.storyboard uses this class instead of CAPBridgeViewController.)
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(TicketScannerPlugin())
    }
}

/// Reads text from a photo on the device with Apple Vision (offline).
@objc(TicketScannerPlugin)
public class TicketScannerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TicketScannerPlugin"
    public let jsName = "TicketScanner"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "recognize", returnType: CAPPluginReturnPromise)
    ]

    @objc func recognize(_ call: CAPPluginCall) {
        guard var image = call.getString("image"), !image.isEmpty else {
            call.reject("Missing image")
            return
        }
        if let comma = image.firstIndex(of: ",") { image = String(image[image.index(after: comma)...]) }
        guard let data = Data(base64Encoded: image, options: .ignoreUnknownCharacters),
              let cgImage = UIImage(data: data)?.cgImage else {
            call.reject("Could not decode image")
            return
        }
        let request = VNRecognizeTextRequest { request, error in
            if let error = error {
                call.reject("Text recognition failed: \(error.localizedDescription)")
                return
            }
            let observations = request.results as? [VNRecognizedTextObservation] ?? []
            let lines = observations.compactMap { $0.topCandidates(1).first?.string }
            call.resolve(["lines": lines])
        }
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = false // ticket numbers are not words
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try VNImageRequestHandler(cgImage: cgImage, options: [:]).perform([request])
            } catch {
                call.reject("Text recognition failed: \(error.localizedDescription)")
            }
        }
    }
}
