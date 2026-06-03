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
    /// Bitcoin chain adapter (BIP-122 namespace).
    /// Provides UTXO balance queries, fee estimation, and mempool interaction.
    /// Uses Blockstream.info REST API for mainnet/testnet.
    /// </summary>
    public class BitcoinAdapter : IChainAdapter
    {
        private string _rpcUrl;
        private static int _requestCounter;

        public string Namespace => "bip122";
        public string ChainReference => "000000000019d6689c085ae165831e93";
        public string ChainId => "bip122:000000000019d6689c085ae165831e93";
        public string ChainName => "Bitcoin Mainnet";

        public void Init(string rpcUrl)
        {
            _rpcUrl = string.IsNullOrEmpty(rpcUrl) ? "https://blockstream.info/api" : rpcUrl;
        }

        public async Task<BigInteger> GetBalanceAsync(string address)
        {
            if (string.IsNullOrEmpty(address))
                throw new ArgumentException("Address cannot be null or empty");

            var url = $"{_rpcUrl}/address/{address}";
            var response = await CallRestAsync<AddressInfo>(url);
            var confirmedSatoshis = response.ChainStats.FundedTxSum - response.ChainStats.SpentTxSum;
            var mempoolSatoshis = response.MempoolStats.FundedTxSum - response.MempoolStats.SpentTxSum;
            return new BigInteger(confirmedSatoshis + mempoolSatoshis);
        }

        public async Task<string> GetBalanceFormattedAsync(string address)
        {
            var satoshis = await GetBalanceAsync(address);
            return ((double)satoshis / 1e8).ToString("F8");
        }

        public async Task<long> GetLatestBlockAsync()
        {
            var blocks = await CallRestAsync<List<BlockInfo>>($"{_rpcUrl}/blocks");
            return blocks?.Count > 0 ? blocks[0].Id : 0;
        }

        public async Task<BigInteger> EstimateFeeAsync(string from, string to, string data = null)
        {
            var fees = await CallRestAsync<FeeEstimates>($"{_rpcUrl}/fee-estimates");
            // Return medium priority fee (blocks=3) in satoshis per byte
            return new BigInteger((long)(fees.MediumPriority * 1000));
        }

        public async Task<string> SendTransactionAsync(string signedTx)
        {
            var url = $"{_rpcUrl}/tx";
            var result = await PostRestAsync<string>(url, signedTx);
            return result;
        }

        public async Task<string> GetTransactionAsync(string txHash)
        {
            return await CallRestAsync<string>($"{_rpcUrl}/tx/{txHash}/status");
        }

        /// Get UTXOs for an address.
        public async Task<List<Utxo>> GetUtxosAsync(string address)
        {
            return await CallRestAsync<List<Utxo>>($"{_rpcUrl}/address/{address}/utxo");
        }

        /// Get recommended fee rates.
        public async Task<FeeEstimates> GetFeeEstimatesAsync()
        {
            return await CallRestAsync<FeeEstimates>($"{_rpcUrl}/fee-estimates");
        }

        public bool IsValidAddress(string address)
        {
            if (string.IsNullOrEmpty(address)) return false;
            // Basic format checks for legacy, SegWit, and Taproot addresses
            if (address.StartsWith("1") && (address.Length >= 26 && address.Length <= 35)) return true;
            if (address.StartsWith("3") && (address.Length >= 26 && address.Length <= 35)) return true;
            if (address.StartsWith("bc1") && (address.Length >= 42 && address.Length <= 62)) return true;
            if (address.StartsWith("tb1") && (address.Length >= 42 && address.Length <= 62)) return true;
            return false;
        }

        private async Task<T> CallRestAsync<T>(string url)
        {
            using var request = new UnityWebRequest(url, "GET")
            {
                downloadHandler = new DownloadHandlerBuffer(),
                timeout = 30
            };

            var operation = request.SendWebRequest();
            while (!operation.isDone) await Task.Delay(1);

            if (request.result != UnityWebRequest.Result.Success)
                throw new Exception($"Bitcoin REST request failed: {request.error}");

            return JsonConvert.DeserializeObject<T>(request.downloadHandler.text);
        }

        private async Task<T> PostRestAsync<T>(string url, string body)
        {
            using var request = new UnityWebRequest(url, "POST")
            {
                uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body)),
                downloadHandler = new DownloadHandlerBuffer(),
                timeout = 30
            };
            request.SetRequestHeader("Content-Type", "text/plain");

            var operation = request.SendWebRequest();
            while (!operation.isDone) await Task.Delay(1);

            if (request.result != UnityWebRequest.Result.Success)
                throw new Exception($"Bitcoin POST failed: {request.error}");

            return JsonConvert.DeserializeObject<T>(request.downloadHandler.text);
        }
    }

    // ─── Bitcoin API Response Types ─────────────────────────────────────

    internal class AddressInfo
    {
        [JsonProperty("chain_stats")]
        public ChainStats ChainStats { get; set; }
        [JsonProperty("mempool_stats")]
        public MempoolStats MempoolStats { get; set; }
    }

    internal class ChainStats
    {
        [JsonProperty("funded_txo_sum")]
        public long FundedTxSum { get; set; }
        [JsonProperty("spent_txo_sum")]
        public long SpentTxSum { get; set; }
    }

    internal class MempoolStats
    {
        [JsonProperty("funded_txo_sum")]
        public long FundedTxSum { get; set; }
        [JsonProperty("spent_txo_sum")]
        public long SpentTxSum { get; set; }
    }

    internal class BlockInfo
    {
        [JsonProperty("id")]
        public long Id { get; set; }
    }

    internal class FeeEstimates
    {
        [JsonProperty("1")]
        public double FastestPriority { get; set; }
        [JsonProperty("2")]
        public double HalfHourPriority { get; set; }
        [JsonProperty("3")]
        public double MediumPriority { get; set; }
        [JsonProperty("6")]
        public double EconomyPriority { get; set; }
    }

    internal class Utxo
    {
        [JsonProperty("txid")]
        public string TxId { get; set; }
        [JsonProperty("vout")]
        public int Vout { get; set; }
        [JsonProperty("value")]
        public long Value { get; set; }
        [JsonProperty("status")]
        public UtxoStatus Status { get; set; }
    }

    internal class UtxoStatus
    {
        [JsonProperty("confirmed")]
        public bool Confirmed { get; set; }
        [JsonProperty("block_height")]
        public int BlockHeight { get; set; }
    }
}
