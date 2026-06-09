# ─── Cinacoin SDK consumer rules ────────────────────────────────────────────
# These rules are automatically applied by consuming apps.
# ProGuard/R8 will merge these into the app's own rules.

# ─── Keep SDK public API ────────────────────────────────────────────────────
-keep class com.cinacoin.sdk.** { *; }
-keep public class com.cinacoin.sdk.** { public protected *; }

# ─── Kotlinx Serialization ──────────────────────────────────────────────────
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keep class kotlinx.serialization.json.** { *; }
-keep class kotlinx.serialization.protobuf.** { *; }

# ─── Keep coroutines ────────────────────────────────────────────────────────
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.internal.MainDispatcherFactory

# ─── Keep WalletConnect classes ─────────────────────────────────────────────
-keep class com.walletconnect.** { *; }
-dontwarn com.walletconnect.**

# ─── Keep security-crypto ───────────────────────────────────────────────────
-keep class androidx.security.crypto.** { *; }

# ─── WalletConnect transitive deps ──────────────────────────────────────────
-dontwarn io.ktor.**
-dontwarn org.bouncycastle.**
-dontwarn okhttp3.**
-dontwarn okio.**
