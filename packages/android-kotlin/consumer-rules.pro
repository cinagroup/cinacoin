# ─── Cinacoin SDK consumer rules ────────────────────────────────────────────
# These rules are automatically applied by consuming apps.

# Keep SDK public API
-keep class com.cinacoin.sdk.** { *; }

# Keep coroutines
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.internal.MainDispatcherFactory

# Keep WalletConnect classes
-keep class com.walletconnect.** { *; }

# Keep security-crypto
-keep class androidx.security.crypto.** { *; }
