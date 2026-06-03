/**
 * NetworkMonitor.kt — Network connectivity observation.
 *
 * Uses Android's ConnectivityManager to observe network status changes
 * and emits [NetworkStatus] via a Kotlin Flow.
 */
package com.cinacoin.sdk

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class NetworkMonitor {

    private val _status = MutableStateFlow<NetworkStatus>(NetworkStatus.Connected)
    val status: StateFlow<NetworkStatus> = _status.asStateFlow()

    private var connectivityManager: ConnectivityManager? = null
    private var callback: ConnectivityManager.NetworkCallback? = null

    /**
     * Start observing network changes.
     * Should be called once at SDK initialization.
     */
    fun start(context: Context) {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return
        connectivityManager = cm

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                _status.value = NetworkStatus.Connected
            }

            override fun onLost(network: Network) {
                _status.value = NetworkStatus.Disconnected
            }

            override fun onCapabilitiesChanged(
                network: Network,
                networkCapabilities: NetworkCapabilities
            ) {
                val hasInternet = networkCapabilities.hasCapability(
                    NetworkCapabilities.NET_CAPABILITY_INTERNET
                )
                val isMetered = networkCapabilities.hasCapability(
                    NetworkCapabilities.NET_CAPABILITY_NOT_METERED
                ).not()

                _status.value = when {
                    !hasInternet -> NetworkStatus.Disconnected
                    isMetered -> NetworkStatus.Weak("Metered connection")
                    else -> NetworkStatus.Connected
                }
            }
        }

        cm.registerNetworkCallback(request, callback!!)
    }

    /**
     * Stop observing network changes.
     */
    fun stop() {
        val cm = connectivityManager ?: return
        callback?.let { cm.unregisterNetworkCallback(it) }
        callback = null
        connectivityManager = null
    }

    /**
     * Check if currently connected (blocking, one-shot).
     */
    fun isConnected(): Boolean {
        val cm = connectivityManager ?: return false
        val active = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(active) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    /**
     * Check if on a metered connection.
     */
    fun isMetered(): Boolean {
        val cm = connectivityManager ?: return true // conservative
        val active = cm.activeNetwork ?: return true
        val caps = cm.getNetworkCapabilities(active) ?: return true
        return !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED)
    }
}
