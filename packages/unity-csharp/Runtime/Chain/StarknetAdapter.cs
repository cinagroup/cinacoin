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
    /// Starknet chain adapter.
    /// Uses Starknet JSON-RPC v0.6+ for balance, block, and transaction queries.
    /// </summary>
    public class StarknetAdapter : IChainAdapter
    {
        private string _rpcUrl;
        private static int _rpcId;

        public string Namespace => "starknet";
        public string ChainReference => "SN_MAIN";
        public string ChainId => "starknet:SN_MAIN";
        public string ChainName => "Starknet Mainnet";

        public StarknetAdapter() { }

        public void Init(string rpcUrl)
        {
            _rpcUrl = string.IsNullOrEmpty(rpcUrl) ? "https://starknet-mainnet.public.blastapi.io" : rpcUrl;
        }

        public async Task<BigInteger> GetBalanceAsync(string address)
        {
            // STRK token address on Starknet
            var strkAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
            var response = await CallRpcAsync<StarknetBalanceResponse>(
                "starknet_call", new object[]
                {
                    new {
                        contract_address = strkAddress,
                        entry_point_selector = "0x03404966841637ba1f5cb400da4e884b41b4c84229e929ee182448598f25490b",
                        calldata = new[] { address, "0x0" }
                    },
                    "latest"
                });

            if (response.Result != null && response.Result.Length >= 1)
                return BigInteger.Parse(response.Result[0]);

            return BigInteger.Zero;
        }

        public async Task<string> GetBalanceFormattedAsync(string address)
        {
            var strk = await GetBalanceAsync(address);
            return ((double)strk / 1e18).ToString("F4");
        }

        public async Task<long> GetLatestBlockAsync()
        {
            var response = await CallRpcAsync<StarknetBlockNumberResponse>("starknet_blockNumber", Array.Empty<object>());
            return response;
        }

        public async Task<BigInteger> EstimateFeeAsync(string from, string to, string data = null)
        {
            // Starknet fees are in STRK tokens, typically very low
            // Estimate: ~100,000 gas units * gas price
            return new BigInteger(100_000_000_000_000); // 0.0001 STRK
        }

        public async Task<string> SendTransactionAsync(string signedTx)
        {
            var response = await CallRpcAsync<StarknetTxResult>(
                "starknet_addInvokeTransaction", new object[] { signedTx });
            return response.TransactionHash;
        }

        public async Task<string> GetTransactionAsync(string txHash)
        {
            var response = await CallRpcAsync<StarknetTxStatusResponse>(
                "starknet_getTransactionStatus", new object[] { txHash });
            return response.FinalityStatus;
        }

        public bool IsValidAddress(string address)
        {
            if (string.IsNullOrEmpty(address)) return false;
            // Starknet addresses: 0x followed by up to 64 hex chars
            return address.StartsWith("0x") && address.Length >= 3 && address.Length <= 66;
        }

        private async Task<T> CallRpcAsync<T>(string method, object[] parameters)
        {
            var id = System.Threading.Interlocked.Increment(ref _rpcId);
            var request = new StarknetRpcRequest { Id = id, Method = method, Parameters = parameters };
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
                throw new Exception($"Starknet RPC failed: {http.error}");

            var response = JsonConvert.DeserializeObject<StarknetRpcResponse<T>>(http.downloadHandler.text);
            if (response.Error != null)
                throw new Exception($"Starknet RPC error: {response.Error.Message}");

            return response.Result;
        }
    }

    internal class StarknetRpcRequest
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

    internal class StarknetRpcResponse<T>
    {
        [JsonProperty("result")]
        public T Result { get; set; }
        [JsonProperty("error")]
        public StarknetRpcError Error { get; set; }
    }

    internal class StarknetRpcError
    {
        [JsonProperty("message")]
        public string Message { get; set; }
    }

    internal class StarknetBalanceResponse
    {
        [JsonProperty("result")]
        public string[] Result { get; set; }
    }

    internal class StarknetTxResult
    {
        [JsonProperty("transaction_hash")]
        public string TransactionHash { get; set; }
    }

    internal class StarknetTxStatusResponse
    {
        [JsonProperty("finality_status")]
        public string FinalityStatus { get; set; }
    }

    internal class StarknetBlockNumberResponse { }
}
