using System;
using System.Threading.Tasks;
using CinaConnect;
using CinaConnect.Models;
using CinaConnect.Services;

namespace CinaConnect.Example
{
    /// <summary>
    /// Example usage of the CinaConnect .NET SDK.
    /// </summary>
    public class Program
    {
        public static async Task Main(string[] args)
        {
            // Initialize the client
            using var client = new CinaConnectClient("YOUR_PROJECT_ID");
            var walletService = new WalletService(client);

            // Get available networks
            var networks = await walletService.GetNetworksAsync();
            Console.WriteLine("Available Networks:");
            foreach (var network in networks)
            {
                Console.WriteLine($"  {network.Name} (Chain ID: {network.ChainId})");
            }

            // Check balance
            var address = "0x1234567890123456789012345678901234567890";
            var balance = await walletService.GetTokenBalanceAsync(address);
            Console.WriteLine($"\nBalance for {address}:");
            Console.WriteLine($"  {balance} ETH");

            // Get account info
            var account = await client.GetAccountAsync("metamask");
            Console.WriteLine($"\nAccount:");
            Console.WriteLine($"  Address: {account.Address}");
            Console.WriteLine($"  Label: {account.Label}");

            Console.WriteLine("\nDone!");
        }
    }
}
