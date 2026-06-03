using System;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using UnityEngine.Networking;
using Newtonsoft.Json;

namespace Cinacoin.Chain
{
    /// <summary>
    /// Hedera chain adapter (Hashgraph).
    /// Uses Hedera Mirror Node REST API for balance and transaction queries.
    /// For transactions, use the Hedera JSON-RPC Relay.
    /// </summary>
    public class HederaAdapter : IChainAdapter
    {
        private string _rpcUrl;
        private string _mirrorUrl;

        public string Namespace => "hedera";
        public string ChainReference => "mainnet";
        public string ChainId => "hedera:mainnet";
        public string ChainName => "Hedera Mainnet";

        public HederaAdapter() { }

        public void Init(string rpcUrl)
        {
            _rpcUrl = string.IsNullOrEmpty(rpcUrl) ? "https://mainnet.hashio.io/api" : rpcUrl;
            _mirrorUrl = "https://mainnet-public.mirrornode.hedera.com/api/v1";
        }

        public async Task<BigInteger> GetBalanceAsync(string address)
        {
            // Hedera account IDs are like "0.0.123456"
            var url = $"{_mirrorUrl}/accounts/{address}";
            var response = await CallJsonAsync<HederaAccountResponse>(url);
            var balance = response.Balance?.Balance ?? 0;
            return new BigInteger(balance);
        }

        public async Task<string> GetBalanceFormattedAsync(string address)
        {
            var tinybars = await GetBalanceAsync(address);
            return ((double)tinybars / 1e8).ToString("F8");
        }

        public async Task<long> GetLatestBlockAsync()
        {
            var url = $"{_mirrorUrl}/blocks?order=desc&limit=1";
            var response = await CallJsonAsync<HederaBlockListResponse>(url);
            return response.Blocks?.Count > 0 ? response.Blocks[0].Number : 0;
        }

        public async Task<BigInteger> EstimateFeeAsync(string from, string to, string data = null)
        {
            // Hedera fees are typically very low: ~0.001 HBAR for basic transactions
            return new BigInteger(100_000); // 0.001 HBAR in tinybars
        }

        public async Task<string> SendTransactionAsync(string signedTx)
        {
            // Use Hedera JSON-RPC relay for sending (EVM-compatible)
            var response = await PostJsonAsync<HederaTxResult>(
                _rpcUrl,
                new { jsonrpc = "2.0", method = "eth_sendRawTransaction", @params = new[] { signedTx }, id = 1 });
            return response.Result;
        }

        public async Task<string> GetTransactionAsync(string txHash)
        {
            var url = $"{_mirrorUrl}/transactions/{txHash}";
            return await CallJsonAsync<string>(url);
        }

        public bool IsValidAddress(string address)
        {
            if (string.IsNullOrEmpty(address)) return false;
            // Hedera account ID format: shard.realm.num (e.g. "0.0.123456")
            if (address.StartsWith("0.0.")) return true;
            // Solidity address format: 0x + 40 hex chars
            if (address.StartsWith("0x") && address.Length == 42) return true;
            return false;
        }

        private async Task<T> CallJsonAsync<T>(string url)
        {
            using var request = new UnityWebRequest(url, "GET")
            {
                downloadHandler = new DownloadHandlerBuffer(),
                timeout = 30
            };
            var operation = request.SendWebRequest();
            while (!operation.isDone) await Task.Delay(1);

            if (request.result != UnityWebRequest.Result.Success)
                throw new Exception($"Hedera request failed: {request.error}");

            return JsonConvert.DeserializeObject<T>(request.downloadHandler.text);
        }

        private async Task<T> PostJsonAsync<T>(string url, object body)
        {
            var json = JsonConvert.SerializeObject(body);
            using var request = new UnityWebRequest(url, "POST")
            {
                uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json)),
                downloadHandler = new DownloadHandlerBuffer(),
                timeout = 30
            };
            request.SetRequestHeader("Content-Type", "application/json");

            var operation = request.SendWebRequest();
            while (!operation.isDone) await Task.Delay(1);

            if (request.result != UnityWebRequest.Result.Success)
                throw new Exception($"Hedera POST failed: {request.error}");

            return JsonConvert.DeserializeObject<T>(request.downloadHandler.text);
        }
    }

    internal class HederaAccountResponse
    {
        [JsonProperty("balance")]
        public HederaBalance Balance { get; set; }
        [JsonProperty("account")]
        public string Account { get; set; }
    }

    internal class HederaBalance
    {
        [JsonProperty("balance")]
        public long Balance { get; set; }
        [JsonProperty("timestamp")]
        public string Timestamp { get; set; }
    }

    internal class HederaBlockListResponse
    {
        [JsonProperty("blocks")]
        public List<HederaBlock> Blocks { get; set; }
    }

    internal class HederaBlock
    {
        [JsonProperty("number")]
        public long Number { get; set; }
    }

    internal class HederaTxResult
    {
        [JsonProperty("result")]
        public string Result { get; set; }
    }
}
