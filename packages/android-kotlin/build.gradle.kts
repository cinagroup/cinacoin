import org.jetbrains.dokka.gradle.DokkaTask

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    kotlin("plugin.serialization") version "1.9.24"
    id("org.jetbrains.dokka") version "1.9.20"
    id("maven-publish")
    id("signing")
}

// ─── Versioning ────────────────────────────────────────────────────────────
val sdkVersion = "1.0.0"

android {
    namespace = "com.cinacoin.sdk"
    compileSdk = 34

    defaultConfig {
        minSdk = 26  // Android 8.0+
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        versionName = sdkVersion
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            consumerProguardFiles("consumer-rules.pro")
        }
        debug {
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
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
            withJavadocJar()
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

    // ─── Kotlinx Serialization ─────────────────────────────────────────────
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

    // ─── EncryptedSharedPreferences ────────────────────────────────────────
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // ─── Jetpack Compose (UI components) ───────────────────────────────────
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")

    // ─── Coil (Image loading for Compose) ─────────────────────────────────
    implementation("io.coil-kt:coil-compose:2.7.0")

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

// ─── Dokka (API Documentation) ─────────────────────────────────────────────

tasks.withType<DokkaTask>().configureEach {
    dokkaSourceSets.named("main") {
        moduleName.set("Cinacoin Wallet SDK")
        moduleVersion.set(sdkVersion)
        includes.from("README.md")
    }
}

val dokkaJavadocJar by tasks.registering(Jar::class) {
    group = "documentation"
    description = "Assembles Javadoc jar from Dokka output"
    archiveClassifier.set("javadoc")
    from(tasks.named("dokkaJavadoc"))
}

// ─── Source Jar ────────────────────────────────────────────────────────────

val sourcesJar by tasks.registering(Jar::class) {
    group = "build"
    description = "Assembles sources jar"
    archiveClassifier.set("sources")
    from(android.sourceSets["main"].java.srcDirs)
}

// ─── Maven Central Publishing (Sonatype OSSRH) ─────────────────────────────

afterEvaluate {
    publishing {
        publications {
            register("release", MavenPublication::class) {
                from(components["release"])

                groupId = "com.cinacoin"
                artifactId = "sdk-android"
                version = sdkVersion

                // Attach source and javadoc jars
                artifact(sourcesJar)
                artifact(dokkaJavadocJar)

                pom {
                    name.set("Cinacoin Wallet SDK")
                    description.set("Android SDK for Cinacoin Wallet — WalletConnect v2, EVM chain support, signing, and transactions.")
                    url.set("https://github.com/cinacoin/sdk-android")
                    licenses {
                        license {
                            name.set("MIT License")
                            url.set("https://opensource.org/licenses/MIT")
                        }
                    }
                    developers {
                        developer {
                            id.set("cinacoin")
                            name.set("Cinacoin Team")
                            email.set("dev@cinacoin.com")
                        }
                    }
                    scm {
                        connection.set("scm:git:git://github.com/cinacoin/sdk-android.git")
                        developerConnection.set("scm:git:ssh://github.com/cinacoin/sdk-android.git")
                        url.set("https://github.com/cinacoin/sdk-android")
                    }
                }
            }
        }

        repositories {
            maven {
                name = "sonatype"
                val releasesRepoUrl = uri("https://s01.oss.sonatype.org/service/local/staging/deploy/maven2/")
                val snapshotsRepoUrl = uri("https://s01.oss.sonatype.org/content/repositories/snapshots/")
                url = if (version.toString().endsWith("SNAPSHOT")) snapshotsRepoUrl else releasesRepoUrl
                credentials {
                    username = findProperty("ossrhUsername")?.toString() ?: System.getenv("OSSRH_USERNAME") ?: ""
                    password = findProperty("ossrhPassword")?.toString() ?: System.getenv("OSSRH_PASSWORD") ?: ""
                }
            }
        }
    }
}

// ─── Signing ───────────────────────────────────────────────────────────────

signing {
    val signingKeyId = findProperty("signing.keyId")?.toString() ?: System.getenv("SIGNING_KEY_ID") ?: ""
    val signingPassword = findProperty("signing.password")?.toString() ?: System.getenv("SIGNING_PASSWORD") ?: ""
    val signingKey = findProperty("signingKey")?.toString() ?: System.getenv("SIGNING_KEY") ?: ""

    if (signingKeyId.isNotEmpty() && signingPassword.isNotEmpty() && signingKey.isNotEmpty()) {
        useInMemoryPgpKeys(signingKeyId, signingKey, signingPassword)
        sign(publishing.publications["release"])
    }
}

tasks.withType<Sign>().configureEach {
    onlyIf {
        findProperty("signing.keyId") != null || System.getenv("SIGNING_KEY_ID") != null
    }
}
