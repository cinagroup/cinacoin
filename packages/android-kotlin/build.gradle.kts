plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("maven-publish")
}

android {
    namespace = "com.cinacoin.sdk"
    compileSdk = 34

    defaultConfig {
        minSdk = 26  // Android 8.0+
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            consumerProguardFiles("consumer-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
}

dependencies {
    // ─── WalletConnect v2 ──────────────────────────────────────────────────
    implementation("com.walletconnect:android-core:1.19.2")
    implementation("com.walletconnect:sign:1.19.2")

    // ─── Kotlin Coroutines ─────────────────────────────────────────────────
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")

    // ─── EncryptedSharedPreferences ────────────────────────────────────────
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // ─── Jetpack Compose (UI components) ───────────────────────────────────
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")

    // ─── AndroidX Core ─────────────────────────────────────────────────────
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.activity:activity-compose:1.9.1")
    implementation("androidx.fragment:fragment-ktx:1.8.2")

    // ─── Unit Testing ──────────────────────────────────────────────────────
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
    testImplementation("org.mockito:mockito-core:5.12.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit:2.0.0")

    // ─── Instrumented Testing ──────────────────────────────────────────────
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}

// ─── Maven Central Publishing ──────────────────────────────────────────────

afterEvaluate {
    publishing {
        publications {
            register("release", MavenPublication::class) {
                from(components["release"])
                groupId = "com.cinacoin"
                artifactId = "sdk-android"
                version = "0.1.0"

                pom {
                    name.set("Cinacoin Wallet SDK")
                    description.set("Android SDK for Cinacoin Wallet — WalletConnect v2, EVM chain support, signing, and transactions.")
                    url.set("https://github.com/cinacoin/sdk-android")
                    licenses {
                        license {
                            name.set("MIT")
                            url.set("https://opensource.org/licenses/MIT")
                        }
                    }
                    developers {
                        developer {
                            id.set("cinacoin")
                            name.set("Cinacoin Team")
                        }
                    }
                    scm {
                        connection.set("scm:git:git://github.com/cinacoin/sdk-android.git")
                        url.set("https://github.com/cinacoin/sdk-android")
                    }
                }
            }
        }
    }
}
