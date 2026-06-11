# Unity C#.

> `@cinacoin/unity-types` — Unity game engine integration for CinaCoin.

## Installation.

Install via Unity Package Manager or download the `.unitypackage` from the releases page.

## Usage.

```csharp
using CinaCoin.Unity;

var cinaConnect = new CinaCoinManager(projectId: "your-project-id");
await cinaConnect.ConnectAsync();
```

## Features.

- WebGL wallet connection
- In-game wallet UI
- Unity UI components

## Related.

- [.NET C#](/api/dotnet)
