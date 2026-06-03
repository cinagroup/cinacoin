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
    /// TON (The Open Network) chain adapter.
    /// Uses toncenter.com HTTP API for balance, block, and transaction queries.
    /// </summary>
    public class TonAdapter : IChainAdapter
    {
        private string _rpcUrl;
        private string _apiKey;

        public string Namespace => "ton";
        public string ChainReference => "-3";
        public string ChainId => "ton:-3";
        public string ChainName => "TON Mainnet";

        public TonAdapter(string apiKey = null) { _apiKey = apiKey; }

        public void Init(string rpcUrl)
        {
            _rpcUrl = string.IsNullOrEmpty(rpcUrl) ? "https://toncenter.com/api/v2" : rpcUrl;
        }

        public async Task<BigInteger> GetBalanceAsync(string address)
        {
            var url = $"{_rpcUrl}/getAddressBalance?address={address}";
            if (!string.IsNullOrEmpty(_apiKey)) url += $"&api_key={_apiKey}";

            var response = await CallJsonAsync<TonBalanceResponse>(url);
            return BigInteger.Parse(response.Result);
        }

        public async Task<string> GetBalanceFormattedAsync(string address)
        {
            var nanoTon = await GetBalanceAsync(address);
            return ((double)nanoTon / 1e9).ToString("F9");
        }

        public async Task<long> GetLatestBlockAsync()
        {
            var url = $"{_rpcUrl}/getBlock";
            if (!string.IsNullOrEmpty(_apiKey)) url += $"?api_key={_apiKey}";

            var response = await CallJsonAsync<TonBlockResponse>(url);
            return response.Result.SeqNo;
        }

        public async Task<BigInteger> EstimateFeeAsync(string from, string to, string data = null)
        {
            // TON uses a simple fee model: base fee + storage fee + message fee
            // Estimate ~0.001 TON for a basic transfer
            return BigInteger.Parse("1000000"); // 0.001 TON in nanotons
        }

        public async Task<string> SendTransactionAsync(string signedTx)
        {
            var url = $"{_rpcUrl}/sendBoc";
            var body = new { boc = signedTx };
            return await PostJsonAsync<TonSendResult>(url, body);
        }

        public async Task<string> GetTransactionAsync(string txHash)
        {
            var url = $"{_rpcUrl}/getTransactions?address={txHash}&limit=1";
            if (!string.IsNullOrEmpty(_apiKey)) url += $"&api_key={_apiKey}";

            return await CallJsonAsync<string>(url);
        }

        public bool IsValidAddress(string address)
        {
            if (string.IsNullOrEmpty(address)) return false;
            // TON addresses are base64url-encoded (48 characters) or hex (66 characters with tag)
            if (address.Length == 48) return true;
            if (address.Length == 66 && address.StartsWith("0:")) return true;
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
                throw new Exception($"TON request failed: {request.error}");

            var json = request.downloadHandler.text;
            var parsed = JsonConvert.DeserializeObject<TonApiResponse<T>>(json);

            if (!parsed.Ok) throw new Exception($"TON API error: {parsed.Error ?? json}");
            return parsed.Result;
        }

        private async Task<string> PostJsonAsync<T>(string url, object body)
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
                throw new Exception($"TON POST failed: {request.error}");

            return request.downloadHandler.text;
        }
    }

    internal class TonApiResponse<T>
    {
        [JsonProperty("ok")]
        public bool Ok { get; set; }
        [JsonProperty("result")]
        public T Result { get; set; }
        [JsonProperty("error")]
        public string Error { get; set; }
    }

    internal class TonBalanceResponse
    {
        [JsonProperty("balance")]
        public string Result { get; set; }
    }

    internal class TonBlockResponse
    {
        [JsonProperty("seqno")]
        public long SeqNo { get; set; }
    }

    internal class TonSendResult { }
}
