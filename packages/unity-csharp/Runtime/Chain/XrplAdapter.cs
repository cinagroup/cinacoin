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
    /// XRP Ledger (XRPL) chain adapter.
    /// Uses XRPL JSON-RPC for balance, ledger, and transaction queries.
    /// </summary>
    public class XrplAdapter : IChainAdapter
    {
        private string _rpcUrl;
        private static int _rpcId;

        public string Namespace => "xrpl";
        public string ChainReference => "mainnet";
        public string ChainId => "xrpl:mainnet";
        public string ChainName => "XRP Ledger";

        public XrplAdapter() { }

        public void Init(string rpcUrl)
        {
            _rpcUrl = string.IsNullOrEmpty(rpcUrl) ? "https://xrplcluster.com" : rpcUrl;
        }

        public async Task<BigInteger> GetBalanceAsync(string address)
        {
            var response = await CallRpcAsync<XrplAccountInfoResponse>(
                "account_info", new object[]
                {
                    new { account = address, ledger_index = "current" }
                });
            var drops = response.AccountData.Balance;
            return BigInteger.Parse(drops);
        }

        public async Task<string> GetBalanceFormattedAsync(string address)
        {
            var drops = await GetBalanceAsync(address);
            return ((double)drops / 1e6).ToString("F6");
        }

        public async Task<long> GetLatestBlockAsync()
        {
            var response = await CallRpcAsync<XrplLedgerResponse>(
                "ledger", new object[] { new { ledger_index = "current" } });
            return response.Ledger.LedgerIndex;
        }

        public async Task<BigInteger> EstimateFeeAsync(string from, string to, string data = null)
        {
            // XRPL base fee is 10 drops (0.00001 XRP)
            var response = await CallRpcAsync<XrplFeeResponse>("fee", Array.Empty<object>());
            return BigInteger.Parse(response.Drops.OpenLedgerFee);
        }

        public async Task<string> SendTransactionAsync(string signedTx)
        {
            var response = await CallRpcAsync<XrplSubmitResponse>(
                "submit", new object[] { signedTx });
            return response.EngineResult;
        }

        public async Task<string> GetTransactionAsync(string txHash)
        {
            var response = await CallRpcAsync<XrplTxResponse>(
                "tx", new object[] { txHash, false, "validated" });
            return response.Hash;
        }

        public bool IsValidAddress(string address)
        {
            if (string.IsNullOrEmpty(address)) return false;
            // Classic XRP address: starts with 'r', 26-35 chars, base58
            if (address.StartsWith("r") && address.Length >= 26 && address.Length <= 35) return true;
            // X-address format (newer): starts with 'X' or 'T', 77 chars
            if ((address.StartsWith("X") || address.StartsWith("T")) && address.Length == 77) return true;
            return false;
        }

        private async Task<T> CallRpcAsync<T>(string method, object[] parameters)
        {
            var id = System.Threading.Interlocked.Increment(ref _rpcId);
            var request = new XrplRpcRequest { Id = id, Method = method, Parameters = parameters };
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
                throw new Exception($"XRPL RPC failed: {http.error}");

            var response = JsonConvert.DeserializeObject<XrplRpcResponse<T>>(http.downloadHandler.text);
            if (response.Error != null)
                throw new Exception($"XRPL RPC error [{response.Error.Code}]: {response.Error.Message}");
            if (response.Result.Status == "error")
                throw new Exception($"XRPL error: {response.Result.ErrorMessage ?? response.Result.Error}");

            return response.Result;
        }
    }

    internal class XrplRpcRequest
    {
        [JsonProperty("id")]
        public long Id { get; set; }
        [JsonProperty("command")]
        public string Method { get; set; }
    }

    internal class XrplRpcResponse<T>
    {
        [JsonProperty("result")]
        public T Result { get; set; }
        [JsonProperty("error")]
        public string Error { get; set; }
        [JsonProperty("error_message")]
        public string ErrorMessage { get; set; }
    }

    internal class XrplAccountInfoResponse
    {
        [JsonProperty("account_data")]
        public XrplAccountData AccountData { get; set; }
    }

    internal class XrplAccountData
    {
        [JsonProperty("Balance")]
        public string Balance { get; set; }
        [JsonProperty("Account")]
        public string Account { get; set; }
    }

    internal class XrplLedgerResponse
    {
        [JsonProperty("ledger")]
        public XrplLedgerInfo Ledger { get; set; }
    }

    internal class XrplLedgerInfo
    {
        [JsonProperty("ledger_index")]
        public long LedgerIndex { get; set; }
    }

    internal class XrplFeeResponse
    {
        [JsonProperty("drops")]
        public XrplFeeDrops Drops { get; set; }
    }

    internal class XrplFeeDrops
    {
        [JsonProperty("open_ledger_fee")]
        public string OpenLedgerFee { get; set; }
    }

    internal class XrplSubmitResponse
    {
        [JsonProperty("engine_result")]
        public string EngineResult { get; set; }
    }

    internal class XrplTxResponse
    {
        [JsonProperty("hash")]
        public string Hash { get; set; }
    }
}
