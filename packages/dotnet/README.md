# CinaConnect .NET SDK

[![NuGet](https://img.shields.io/nuget/v/CinaConnect.svg)](https://www.nuget.org/packages/CinaConnect)

## Installation

```bash
dotnet add package CinaConnect
```

## Quick Start

```csharp
using CinaConnect;
using CinaConnect.Services;

var client = new CinaConnectClient("YOUR_PROJECT_ID");
var walletService = new WalletService(client);

// Get networks
var networks = await walletService.GetNetworksAsync();

// Check balance
var balance = await walletService.GetTokenBalanceAsync("0x...");
```

## Supported Frameworks

- .NET Standard 2.0
- .NET Core 3.1+
- .NET 5+
- .NET Framework 4.7.2+
