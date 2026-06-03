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
    /// Cosmos SDK chain adapter (cosmos:cosmoshub-4).
    /// Uses Cosmos REST API for balance, block, and fee queries.
    /// Compatible with any Cosmos SDK chain (Cosmos Hub, Osmosis, etc.).
    /// </summary>
    public class CosmosAdapter : IChainAdapter
    {
        private string _rpcUrl;
        private string _bech32Prefix;

        public string Namespace => "cosmos";
        public string ChainReference => "cosmoshub-4";
        public string ChainId => "cosmos:cosmoshub-4";
        public string ChainName => "Cosmos Hub";

        public CosmosAdapter(string bech32Prefix = "cosmos")
        {
            _bech32Prefix = bech32Prefix;
        }

        public void Init(string rpcUrl)
        {
            _rpcUrl = string.IsNullOrEmpty(rpcUrl) ? "https://cosmos-rpc.polkachu.com" : rpcUrl;
        }

        public async Task<BigInteger> GetBalanceAsync(string address)
        {
            var url = $"{_rpcUrl}/cosmos/bank/v1beta1/balances/{address}";
            var response = await CallJsonAsync<CosmosBalanceResponse>(url);

            // Find ATOM balance
            foreach (var coin in response.Balances)
            {
                if (coin.Denom == "uatom")
                    return BigInteger.Parse(coin.Amount);
            }
            return BigInteger.Zero;
        }

        public async Task<string> GetBalanceFormattedAsync(string address)
        {
            var microAtom = await GetBalanceAsync(address);
            return ((double)microAtom / 1e6).ToString("F6");
        }

        public async Task<long> GetLatestBlockAsync()
        {
            var url = $"{_rpcUrl}/cosmos/base/tendermint/v1beta1/blocks/latest";
            var response = await CallJsonAsync<CosmosBlockResponse>(url);
            return long.TryParse(response.Block.Header.Height, out var h) ? h : 0;
        }

        public async Task<BigInteger> EstimateFeeAsync(string from, string to, string data = null)
        {
            // Cosmos fee: gas price * gas limit
            // Standard Cosmos transfer: 100,000 gas * 0.0025 uatom/gas = 250 uatom
            return new BigInteger(250000); // 250,000 gas units in uatom
        }

        public async Task<string> SendTransactionAsync(string signedTx)
        {
            var url = $"{_rpcUrl}/cosmos/tx/v1beta1/txs";
            var result = await PostJsonAsync<CosmosTxResult>(url, signedTx);
            return result.TxResponse?.TxHash ?? string.Empty;
        }

        public async Task<string> GetTransactionAsync(string txHash)
        {
            var url = $"{_rpcUrl}/cosmos/tx/v1beta1/txs/{txHash}";
            return await CallJsonAsync<string>(url);
        }

        /// Get all token balances for an address.
        public async Task<List<CosmosCoin>> GetAllBalancesAsync(string address)
        {
            var url = $"{_rpcUrl}/cosmos/bank/v1beta1/balances/{address}";
            var response = await CallJsonAsync<CosmosBalanceResponse>(url);
            return response.Balances;
        }

        public bool IsValidAddress(string address)
        {
            if (string.IsNullOrEmpty(address)) return false;
            // Cosmos addresses start with the bech32 prefix (e.g. "cosmos1...")
            if (address.StartsWith(_bech32Prefix + "1") && address.Length >= 30)
                return true;
            return false;
        }

        private async Task<T> CallJsonAsync<T>(string url)
        {
            using var request = new UnityWebRequest(url, "GET")
            {
                downloadHandler = new DownloadHandlerBuffer(),
                timeout = 30
            };
            request.SetRequestHeader("Accept", "application/json");

            var operation = request.SendWebRequest();
            while (!operation.isDone) await Task.Delay(1);

            if (request.result != UnityWebRequest.Result.Success)
                throw new Exception($"Cosmos request failed: {request.error}");

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
                throw new Exception($"Cosmos POST failed: {request.error}");

            return JsonConvert.DeserializeObject<T>(request.downloadHandler.text);
        }
    }

    // ─── Cosmos API Response Types ──────────────────────────────────────

    internal class CosmosBalanceResponse
    {
        [JsonProperty("balances")]
        public List<CosmosCoin> Balances { get; set; }
        [JsonProperty("pagination")]
        public CosmosPagination Pagination { get; set; }
    }

    internal class CosmosCoin
    {
        [JsonProperty("denom")]
        public string Denom { get; set; }
        [JsonProperty("amount")]
        public string Amount { get; set; }
    }

    internal class CosmosPagination
    {
        [JsonProperty("next_key")]
        public string NextKey { get; set; }
        [JsonProperty("total")]
        public string Total { get; set; }
    }

    internal class CosmosBlockResponse
    {
        [JsonProperty("block")]
        public CosmosBlockInfo Block { get; set; }
    }

    internal class CosmosBlockInfo
    {
        [JsonProperty("header")]
        public CosmosBlockHeader Header { get; set; }
    }

    internal class CosmosBlockHeader
    {
        [JsonProperty("height")]
        public string Height { get; set; }
    }

    internal class CosmosTxResult
    {
        [JsonProperty("tx_response")]
        public CosmosTxResponse TxResponse { get; set; }
    }

    internal class CosmosTxResponse
    {
        [JsonProperty("txhash")]
        public string TxHash { get; set; }
        [JsonProperty("code")]
        public int Code { get; set; }
        [JsonProperty("raw_log")]
        public string RawLog { get; set; }
    }
}
