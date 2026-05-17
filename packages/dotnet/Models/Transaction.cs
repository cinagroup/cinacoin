namespace CinaConnect.Models
{
    /// <summary>Represents a blockchain transaction.</summary>
    public class Transaction
    {
        public string Hash { get; set; }
        public string From { get; set; }
        public string To { get; set; }
        public string Value { get; set; }
        public string GasLimit { get; set; }
        public string GasPrice { get; set; }
        public string Data { get; set; }
        public string ChainId { get; set; }
        public int Status { get; set; }
        public long BlockNumber { get; set; }
        public long Timestamp { get; set; }
    }
}
