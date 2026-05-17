using System;
using System.Threading.Tasks;
using CinaConnect.Models;

namespace CinaConnect.Services
{
    /// <summary>
    /// Service for wallet operations.
    /// Provides high-level wallet interaction methods.
    /// </summary>
    public class WalletService
    {
        private readonly CinaConnectClient _client;

        /// <summary>
        /// Creates a new WalletService instance.
        /// </summary>
        /// <param name="client">The CinaConnect client to use</param>
        public WalletService(CinaConnectClient client)
        {
            _client = client ?? throw new ArgumentNullException(nameof(client));
        }

        /// <summary>
        /// Gets the balance for a specific token.
        /// </summary>
        /// <param name="address">Wallet address</param>
        /// <param name="chainId">Chain ID (default: 1 for Ethereum mainnet)</param>
        /// <returns>The balance as a decimal</returns>
        public async Task<decimal> GetTokenBalanceAsync(string address, string chainId = "1")
        {
            return await _client.GetBalanceAsync(address, chainId);
        }

        /// <summary>
        /// Gets available networks.
        /// </summary>
        /// <returns>List of available networks</returns>
        public async Task<Network[]> GetNetworksAsync()
        {
            var networks = await _client.GetNetworksAsync();
            return networks.ToArray();
        }
    }
}
