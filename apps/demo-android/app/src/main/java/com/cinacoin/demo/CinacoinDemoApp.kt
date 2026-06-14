package com.cinacoin.demo

import android.app.Application
import com.cinacoin.appkit.config.AppKitConfig
import com.cinacoin.appkit.config.CinacoinAppKit
import com.cinacoin.appkit.auth.AuthManager

class CinacoinDemoApp : Application() {
    override fun onCreate() {
        super.onCreate()

        // Configure AppKit
        CinacoinAppKit.configure(
            AppKitConfig(
                projectId = "YOUR_PROJECT_ID",
                metadata = AppKitConfig.AppMetadata(
                    name = "Cinacoin Demo",
                    description = "Cinacoin Android SDK Demo",
                    url = "https://demo.cinacoin.com",
                    icons = listOf("https://cinacoin.com/icon.png")
                ),
                themeMode = AppKitConfig.ThemeMode.DARK
            )
        )

        // Configure Auth
        AuthManager.configure(projectId = "YOUR_PROJECT_ID")
    }
}
