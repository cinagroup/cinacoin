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
    /// NEAR Protocol chain adapter.
    /// Uses NEAR JSON-RPC for balance, block, and transaction queries.
    /// </summary>
    public class NearAdapter : IChainAdapter
    {
        private string _rpcUrl;
        private static int _rpcId;

        public string Namespace => "near";
        public string ChainReference => "mainnet";
        public string ChainId => "near:mainnet";
        public string ChainName => "NEAR Protocol";

        public NearAdapter() { }

        public void Init(string rpcUrl)
        {
            _rpcUrl = string.IsNullOrEmpty(rpcUrl) ? "https://rpc.mainnet.near.org" : rpcUrl;
        }

        public async Task<BigInteger> GetBalanceAsync(string address)
        {
            var response = await CallRpcAsync<NearBalanceResult>(
                "query", new object[]
                {
                    new { request_type = "view_account", finality = "final", account_id = address }
                });
            return BigInteger.Parse(response.Amount);
        }

        public async Task<string> GetBalanceFormattedAsync(string address)
        {
            var yoctoNear = await GetBalanceAsync(address);
            return ((double)yoctoNear / 1e24).ToString("F4");
        }

        public async Task<long> GetLatestBlockAsync()
        {
            var response = await CallRpcAsync<NearBlockResult>(
                "block", new object[] { new { finality = "final" } });
            return (long)response.Header.Height;
        }

        public async Task<BigInteger> EstimateFeeAsync(string from, string to, string data = null)
        {
            // NEAR fees are very low: ~0.0001 NEAR for basic transactions
            return new BigInteger(100_000_000_000_000_000_000); // 0.0001 NEAR in yoctoNEAR
        }

        public async Task<string> SendTransactionAsync(string signedTx)
        {
            var response = await CallRpcAsync<NearTxResult>("send_tx", new object[] { signedTx });
            return response.Transaction.Hash;
        }

        public async Task<string> GetTransactionAsync(string txHash)
        {
            var response = await CallRpcAsync<NearTxDetailResult>(
                "tx", new object[] { txHash, "" });
            return response.Transaction.Hash;
        }

        public bool IsValidAddress(string address)
        {
            if (string.IsNullOrEmpty(address)) return false;
            // NEAR accounts: 2-64 chars, lowercase alphanumeric with . and -
            // Top-level accounts are 32+ chars, sub-accounts are shorter
            return System.Text.RegularExpressions.Regex.IsMatch(
                address, @"^[a-z0-9][a-z0-9\-]*\.?[a-z0-9]+$");
        }

        private async Task<T> CallRpcAsync<T>(string method, object[] parameters)
        {
            var id = System.Threading.Interlocked.Increment(ref _rpcId);
            var request = new NearRpcRequest { Id = id, Method = method, Parameters = parameters };
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
                throw new Exception($"NEAR RPC failed: {http.error}");

            var response = JsonConvert.DeserializeObject<NearRpcResponse<T>>(http.downloadHandler.text);
            if (response.Error != null)
                throw new Exception($"NEAR RPC error: {response.Error.Message}");

            return response.Result;
        }
    }

    internal class NearRpcRequest
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

    internal class NearRpcResponse<T>
    {
        [JsonProperty("result")]
        public T Result { get; set; }
        [JsonProperty("error")]
        public NearRpcError Error { get; set; }
    }

    internal class NearRpcError
    {
        [JsonProperty("message")]
        public string Message { get; set; }
    }

    internal class NearBalanceResult
    {
        [JsonProperty("amount")]
        public string Amount { get; set; }
    }

    internal class NearBlockResult
    {
        [JsonProperty("header")]
        public NearBlockHeader Header { get; set; }
    }

    internal class NearBlockHeader
    {
        [JsonProperty("height")]
        public ulong Height { get; set; }
    }

    internal class NearTxResult
    {
        [JsonProperty("transaction")]
        public NearTxInfo Transaction { get; set; }
    }

    internal class NearTxInfo
    {
        [JsonProperty("hash")]
        public string Hash { get; set; }
    }

    internal class NearTxDetailResult
    {
        [JsonProperty("transaction")]
        public NearTxInfo Transaction { get; set; }
    }
}
