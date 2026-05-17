namespace CinaConnect.Models
{
    /// <summary>Represents a blockchain account.</summary>
    public class Account
    {
        public string Address { get; set; }
        public string ChainId { get; set; }
        public string Balance { get; set; }
        public string Label { get; set; }
    }
}
