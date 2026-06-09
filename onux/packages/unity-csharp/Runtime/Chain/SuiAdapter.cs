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
    /// Sui chain adapter.
    /// Uses Sui JSON-RPC for balance, block, and transaction queries.
    /// </summary>
    public class SuiAdapter : IChainAdapter
    {
        private string _rpcUrl;
        private static int _rpcId;

        public string Namespace => "sui";
        public string ChainReference => "mainnet";
        public string ChainId => "sui:mainnet";
        public string ChainName => "Sui Mainnet";

        public SuiAdapter() { }

        public void Init(string rpcUrl)
        {
            _rpcUrl = string.IsNullOrEmpty(rpcUrl) ? "https://fullnode.mainnet.sui.io" : rpcUrl;
        }

        public async Task<BigInteger> GetBalanceAsync(string address)
        {
            var response = await CallRpcAsync<SuiBalanceResponse>(
                "suix_getBalance", new object[] { address, "0x2::sui::SUI" });
            return BigInteger.Parse(response.TotalBalance);
        }

        public async Task<string> GetBalanceFormattedAsync(string address)
        {
            var mist = await GetBalanceAsync(address);
            return ((double)mist / 1e9).ToString("F9");
        }

        public async Task<long> GetLatestBlockAsync()
        {
            var response = await CallRpcAsync<SuiCheckpointResponse>("suix_getLatestCheckpointSequenceNumber", Array.Empty<object>());
            return long.TryParse(response, out var seq) ? seq : 0;
        }

        public async Task<BigInteger> EstimateFeeAsync(string from, string to, string data = null)
        {
            // Sui fees: computation cost + storage cost + storage rebate
            // Basic transfer: ~500,000 MIST
            return new BigInteger(500_000);
        }

        public async Task<string> SendTransactionAsync(string signedTx)
        {
            var response = await CallRpcAsync<SuiTxResult>(
                "eth_sendRawTransaction", new object[] { signedTx });
            return response;
        }

        public async Task<string> GetTransactionAsync(string txHash)
        {
            var response = await CallRpcAsync<SuiTxEffectResponse>(
                "suix_getTransactionBlock", new object[] { txHash, new { showEvents = true, showEffects = true } });
            return response.Digest;
        }

        public bool IsValidAddress(string address)
        {
            if (string.IsNullOrEmpty(address)) return false;
            // Sui addresses: 0x followed by 64 hex chars (32 bytes)
            return address.StartsWith("0x") && (address.Length == 66 || address.Length == 64);
        }

        private async Task<T> CallRpcAsync<T>(string method, object[] parameters)
        {
            var id = System.Threading.Interlocked.Increment(ref _rpcId);
            var request = new SuiRpcRequest { Id = id, Method = method, Parameters = parameters };
            var json = JsonConvert.SerializeObject(request);

            using var http = new UnityWebRequest(_rpcUrl, "POST")
            {
                uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json)),
                downloadHandler = new DownloadHandlerBuffer(),
                timeout = 30
            };
            http.SetRequestHeader("Content-Type", "application/json");

            var operation = http.SendWebRequest();
            while (!operation.isDone) await Task.Delay(1);

            if (http.result != UnityWebRequest.Result.Success)
                throw new Exception($"Sui RPC failed: {http.error}");

            var response = JsonConvert.DeserializeObject<SuiRpcResponse<T>>(http.downloadHandler.text);
            if (response.Error != null)
                throw new Exception($"Sui RPC error: {response.Error.Message}");

            return response.Result;
        }
    }

    internal class SuiRpcRequest
    {
        [JsonProperty("jsonrpc")]
        public string JsonRpc => "2.0";
        [JsonProperty("id")]
        public long Id { get; set; }
        [JsonProperty("method")]
        public string Method { get; set; }
        [JsonProperty("params")]
        public object[] Parameters { get; set; }
    }

    internal class SuiRpcResponse<T>
    {
        [JsonProperty("result")]
        public T Result { get; set; }
        [JsonProperty("error")]
        public SuiRpcError Error { get; set; }
    }

    internal class SuiRpcError
    {
        [JsonProperty("message")]
        public string Message { get; set; }
    }

    internal class SuiBalanceResponse
    {
        [JsonProperty("totalBalance")]
        public string TotalBalance { get; set; }
    }

    internal class SuiTxEffectResponse
    {
        [JsonProperty("digest")]
        public string Digest { get; set; }
    }

    internal class SuiCheckpointResponse { }
    internal class SuiTxResult { }
}
