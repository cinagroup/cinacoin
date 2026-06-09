# ─── ProGuard rules for Cinacoin SDK library ───────────────────────────────
# These rules are applied when building the SDK itself (not consumed by apps).

# ─── WalletConnect v2 ──────────────────────────────────────────────────────
-keep class com.walletconnect.** { *; }
-dontwarn com.walletconnect.**

# ─── Kotlin Coroutines ─────────────────────────────────────────────────────
-keepclassmembers class kotlinx.coroutines.** {
    *** *;
}
-keep class kotlinx.coroutines.internal.MainDispatcherFactory { *; }
-dontwarn kotlinx.coroutines.internal.MainDispatcherFactory

# ─── Kotlinx Serialization ─────────────────────────────────────────────────
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.** {
    *** *;
}
-keep class kotlinx.serialization.json.** { *; }
-keep class kotlinx.serialization.protobuf.** { *; }

# ─── Ktor / OkHttp (WalletConnect transitive deps) ─────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn io.ktor.**
-keep class io.ktor.** { *; }
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# ─── BouncyCastle ──────────────────────────────────────────────────────────
-dontwarn org.bouncycastle.**
-keep class org.bouncycastle.** { *; }

# ─── AndroidX Security ─────────────────────────────────────────────────────
-keep class androidx.security.crypto.** { *; }

# ─── Keep SDK public API ───────────────────────────────────────────────────
-keep public class com.cinacoin.sdk.** { *; }
