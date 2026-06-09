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
    /// Polkadot chain adapter.
    /// Uses Polkadot JSON-RPC (via substrate) for balance and block queries.
    /// Note: Full transaction signing requires integration with a Polkadot.js-compatible library.
    /// This adapter handles read operations and provides the interface for WC-based signing.
    /// </summary>
    public class PolkadotAdapter : IChainAdapter
    {
        private string _rpcUrl;
        private static int _rpcId;

        public string Namespace => "polkadot";
        public string ChainReference => "91b171bb158e2d3848fa23a9f1c25182";
        public string ChainId => "polkadot:91b171bb158e2d3848fa23a9f1c25182";
        public string ChainName => "Polkadot";

        public PolkadotAdapter() { }

        public void Init(string rpcUrl)
        {
            _rpcUrl = string.IsNullOrEmpty(rpcUrl) ? "wss://rpc.polkadot.io" : rpcUrl;
        }

        public async Task<BigInteger> GetBalanceAsync(string address)
        {
            // Use REST API via Polkadot/Substrate
            var url = $"https://api.subscan.io/api/scan/account";
            var body = new { account = address };
            var response = await PostJsonAsync<PolkadotAccountResponse>(url, body);
            if (response.Data != null)
                return BigInteger.Parse(response.Data.Balance);
            return BigInteger.Zero;
        }

        public async Task<string> GetBalanceFormattedAsync(string address)
        {
            var plancks = await GetBalanceAsync(address);
            return ((double)plancks / 1e10).ToString("F4");
        }

        public async Task<long> GetLatestBlockAsync()
        {
            var url = $"https://api.subscan.io/api/scan/block";
            var body = new { row = 1, page = 0 };
            var response = await PostJsonAsync<PolkadotBlockListResponse>(url, body);
            return response.Data?.Count > 0 ? response.Data[0].BlockNum : 0;
        }

        public async Task<BigInteger> EstimateFeeAsync(string from, string to, string data = null)
        {
            // Polkadot transfer fee: ~0.0015 DOT (15,000,000 plancks)
            return new BigInteger(15_000_000);
        }

        public async Task<string> SendTransactionAsync(string signedTx)
        {
            // In production, submit via Polkadot.js API or WC signing
            // This is a placeholder for the WC-based flow
            return "0x" + signedTx.Substring(0, Math.Min(64, signedTx.Length));
        }

        public async Task<string> GetTransactionAsync(string txHash)
        {
            var url = $"https://api.subscan.io/api/scan/extrinsic";
            var body = new { hash = txHash };
            var response = await PostJsonAsync<PolkadotExtrinsicResponse>(url, body);
            return response.Data?.BlockNum.ToString() ?? string.Empty;
        }

        public bool IsValidAddress(string address)
        {
            if (string.IsNullOrEmpty(address)) return false;
            // Polkadot addresses: SS58 format, typically 47-48 characters
            if (address.Length >= 47 && address.Length <= 48) return true;
            // Raw hex: 0x + 64 hex chars (32 bytes)
            if (address.StartsWith("0x") && address.Length == 66) return true;
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
                throw new Exception($"Polkadot request failed: {request.error}");

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
                throw new Exception($"Polkadot POST failed: {request.error}");

            return JsonConvert.DeserializeObject<T>(request.downloadHandler.text);
        }
    }

    internal class PolkadotAccountResponse
    {
        [JsonProperty("data")]
        public PolkadotAccountData Data { get; set; }
    }

    internal class PolkadotAccountData
    {
        [JsonProperty("balance")]
        public string Balance { get; set; }
        [JsonProperty("available")]
        public string Available { get; set; }
    }

    internal class PolkadotBlockListResponse
    {
        [JsonProperty("data")]
        public List<PolkadotBlock> Data { get; set; }
    }

    internal class PolkadotBlock
    {
        [JsonProperty("block_num")]
        public long BlockNum { get; set; }
    }

    internal class PolkadotExtrinsicResponse
    {
        [JsonProperty("data")]
        public PolkadotExtrinsicData Data { get; set; }
    }

    internal class PolkadotExtrinsicData
    {
        [JsonProperty("block_num")]
        public long BlockNum { get; set; }
        [JsonProperty("extrinsic_index")]
        public int ExtrinsicIndex { get; set; }
    }
}
