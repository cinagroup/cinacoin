using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace CinaConnect
{
    /// <summary>
    /// Main client for interacting with the CinaConnect SDK.
    /// Provides wallet connectivity, transaction signing, and network switching.
    /// </summary>
    public class CinaConnectClient : IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly string _projectId;
        private bool _disposed;

        /// <summary>
        /// Creates a new CinaConnect client instance.
        /// </summary>
        /// <param name="projectId">Your CinaConnect project ID</param>
        /// <param name="baseUrl">API base URL (default: https://api.cinaconnect.com)</param>
        public CinaConnectClient(string projectId, string baseUrl = "https://api.cinaconnect.com")
        {
            _projectId = projectId ?? throw new ArgumentNullException(nameof(projectId));
            _httpClient = new HttpClient { BaseAddress = new Uri(baseUrl) };
            _httpClient.DefaultRequestHeaders.Add("X-Project-Id", projectId);
        }

        /// <summary>
        /// Gets account information for the connected wallet.
        /// </summary>
        public async Task<Account> GetAccountAsync(string walletId)
        {
            var response = await _httpClient.GetAsync($"/v1/wallets/{walletId}/account");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<Account>(json);
        }

        /// <summary>
        /// Gets the balance for a given address.
        /// </summary>
        public async Task<decimal> GetBalanceAsync(string address, string chainId = "1")
        {
            var response = await _httpClient.GetAsync($"/v1/balance?address={address}&chainId={chainId}");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonConvert.DeserializeObject<Dictionary<string, object>>(json);
            return Convert.ToDecimal(result["balance"]);
        }

        /// <summary>
        /// Gets available networks.
        /// </summary>
        public async Task<List<Network>> GetNetworksAsync()
        {
            var response = await _httpClient.GetAsync("/v1/networks");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<List<Network>>(json);
        }

        /// <summary>
        /// Creates a new wallet session.
        /// </summary>
        public async Task<SessionResult> CreateSessionAsync(string walletId, string namespace_)
        {
            var payload = new { walletId, @namespace = namespace_ };
            var content = new StringContent(JsonConvert.SerializeObject(payload), System.Text.Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("/v1/sessions", content);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<SessionResult>(json);
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _httpClient.Dispose();
                _disposed = true;
            }
        }
    }

    public class SessionResult
    {
        public string SessionId { get; set; }
        public string Uri { get; set; }
    }
}
