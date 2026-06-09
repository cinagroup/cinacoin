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
    /// Tron chain adapter.
    /// Uses TronGrid API for balance, transaction, and block queries.
    /// Compatible with Tron mainnet and testnet (Shasta).
    /// </summary>
    public class TronAdapter : IChainAdapter
    {
        private string _rpcUrl;
        private string _apiKey;
        private static int _rpcId;

        public string Namespace => "tron";
        public string ChainReference => "mainnet";
        public string ChainId => "tron:mainnet";
        public string ChainName => "Tron Mainnet";

        public TronAdapter(string apiKey = null) { _apiKey = apiKey; }

        public void Init(string rpcUrl)
        {
            _rpcUrl = string.IsNullOrEmpty(rpcUrl) ? "https://api.trongrid.io" : rpcUrl;
        }

        public async Task<BigInteger> GetBalanceAsync(string address)
        {
            var url = $"{_rpcUrl}/v1/accounts/{NormalizeAddress(address)}";
            var response = await CallJsonAsync<TronAccountResponse>(url);
            var balance = response.Data[0].Balance;
            return new BigInteger(balance);
        }

        public async Task<string> GetBalanceFormattedAsync(string address)
        {
            var sun = await GetBalanceAsync(address);
            return ((double)sun / 1e6).ToString("F6");
        }

        public async Task<long> GetLatestBlockAsync()
        {
            var url = $"{_rpcUrl}/wallet/block/now";
            var response = await PostJsonAsync<TronBlock>(url, new { });
            return response.BlockHeader.RawData.Number;
        }

        public async Task<BigInteger> EstimateFeeAsync(string from, string to, string data = null)
        {
            // Tron bandwidth/energy fee estimation
            // Base fee for a TRX transfer is ~0 TRX (bandwidth only)
            // Smart contract calls consume energy
            if (string.IsNullOrEmpty(data))
                return new BigInteger(0); // Free bandwidth for TRX transfers

            // Estimate energy for contract call (rough estimate)
            return new BigInteger(65000); // ~65,000 energy units
        }

        public async Task<string> SendTransactionAsync(string signedTx)
        {
            var url = $"{_rpcUrl}/wallet/broadcasttransaction";
            var response = await PostJsonAsync<TronBroadcastResult>(url, signedTx);
            return response.TxId;
        }

        public async Task<string> GetTransactionAsync(string txHash)
        {
            var url = $"{_rpcUrl}/wallet/gettransactionbyid";
            var body = new { value = txHash };
            return await PostJsonAsync<string>(url, body);
        }

        /// Broadcast a signed transaction.
        public async Task<TronBroadcastResult> BroadcastTransactionAsync(TronTransaction signedTx)
        {
            var url = $"{_rpcUrl}/wallet/broadcasttransaction";
            return await PostJsonAsync<TronBroadcastResult>(url, signedTx);
        }

        public bool IsValidAddress(string address)
        {
            if (string.IsNullOrEmpty(address)) return false;
            // Tron addresses start with 'T' and are 34 characters (base58)
            if (address.StartsWith("T") && address.Length == 34) return true;
            // Hex format: 42 characters starting with 0x41
            if (address.StartsWith("41") && address.Length == 42) return true;
            return false;
        }

        private string NormalizeAddress(string address)
        {
            // Convert hex address to base58 if needed
            if (address.StartsWith("0x")) address = address.Substring(2);
            return address;
        }

        private async Task<T> CallJsonAsync<T>(string url)
        {
            using var request = new UnityWebRequest(url, "GET")
            {
                downloadHandler = new DownloadHandlerBuffer(),
                timeout = 30
            };
            if (!string.IsNullOrEmpty(_apiKey))
                request.SetRequestHeader("TRON-PRO-API-KEY", _apiKey);

            var operation = request.SendWebRequest();
            while (!operation.isDone) await Task.Delay(1);

            if (request.result != UnityWebRequest.Result.Success)
                throw new Exception($"Tron request failed: {request.error}");

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
            if (!string.IsNullOrEmpty(_apiKey))
                request.SetRequestHeader("TRON-PRO-API-KEY", _apiKey);

            var operation = request.SendWebRequest();
            while (!operation.isDone) await Task.Delay(1);

            if (request.result != UnityWebRequest.Result.Success)
                throw new Exception($"Tron POST failed: {request.error}");

            return JsonConvert.DeserializeObject<T>(request.downloadHandler.text);
        }
    }

    // ─── Tron API Response Types ────────────────────────────────────────

    internal class TronAccountResponse
    {
        [JsonProperty("data")]
        public List<TronAccount> Data { get; set; }
    }

    internal class TronAccount
    {
        [JsonProperty("balance")]
        public long Balance { get; set; }
        [JsonProperty("address")]
        public string Address { get; set; }
    }

    internal class TronBlock
    {
        [JsonProperty("block_header")]
        public TronBlockHeader BlockHeader { get; set; }
    }

    internal class TronBlockHeader
    {
        [JsonProperty("raw_data")]
        public TronBlockRawData RawData { get; set; }
    }

    internal class TronBlockRawData
    {
        [JsonProperty("number")]
        public long Number { get; set; }
    }

    internal class TronBroadcastResult
    {
        [JsonProperty("txid")]
        public string TxId { get; set; }
        [JsonProperty("result")]
        public bool Result { get; set; }
        [JsonProperty("message")]
        public string Message { get; set; }
    }

    internal class TronTransaction
    {
        [JsonProperty("visible")]
        public bool Visible { get; set; }
        [JsonProperty("txID")]
        public string TxId { get; set; }
        [JsonProperty("raw_data")]
        public Dictionary<string, object> RawData { get; set; }
        [JsonProperty("raw_data_hex")]
        public string RawDataHex { get; set; }
        [JsonProperty("signature")]
        public List<string> Signature { get; set; }
    }
}
