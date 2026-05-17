namespace CinaConnect.Models
{
    /// <summary>Represents a blockchain network.</summary>
    public class Network
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public int ChainId { get; set; }
        public string RpcUrl { get; set; }
        public string Currency { get; set; }
        public string ExplorerUrl { get; set; }
        public bool IsTestnet { get; set; }
    }
}
