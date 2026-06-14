# 快速开始 — Flutter

> 5 分钟从零到钱包连接。适用于 Flutter (Dart) SDK。

## 概述

本指南帮助你在 Flutter 应用中快速集成 Cinacoin SDK，实现：

- ✅ 钱包连接（通过 Cinacoin 协议）
- ✅ 账户状态管理
- ✅ 消息签名
- ✅ QR 码扫码连接

**预计完成时间：** 5 分钟

---

## 前置条件

- **Flutter** ≥ 3.19
- **Dart** ≥ 3.3
- **Android Studio / VS Code**（已安装 Flutter 插件）

---

## 第一步：添加依赖

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter

  # Cinacoin SDK
  cinacoin: ^0.1.0

  # 可选：QR 码扫描
  mobile_scanner: ^5.0.0

  # 可选：状态管理
  flutter_riverpod: ^2.4.0
```

安装依赖：

```bash
flutter pub get
```

---

## 第二步：初始化 SDK

在 `main.dart` 中初始化 Cinacoin：

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:cinacoin/cinacoin.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // 初始化全局实例
  Cinacoin.instance.initialize(
    CinacoinConfig(
      projectId: 'your-project-id',
      relayUrl: 'wss://relay.yourdomain.com/v1',
      chains: [
        Chain(
          id: 1,
          name: 'Ethereum',
          nativeCurrency: NativeCurrency(
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          ),
          rpcUrl: 'https://rpc.yourdomain.com/eth',
        ),
        Chain(
          id: 137,
          name: 'Polygon',
          nativeCurrency: NativeCurrency(
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
          ),
          rpcUrl: 'https://rpc.yourdomain.com/polygon',
        ),
      ],
      metadata: AppMetadata(
        name: 'My Flutter dApp',
        description: 'Flutter dApp built with Cinacoin',
        url: 'https://mydapp.com',
        icons: ['https://mydapp.com/icon.png'],
      ),
    ),
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'My dApp',
      theme: ThemeData(
        colorSchemeSeed: Colors.blue,
        useMaterial3: true,
      ),
      home: const WalletScreen(),
    );
  }
}
```

---

## 第三步：连接钱包

### 连接界面示例

```dart
// lib/screens/wallet_screen.dart
import 'package:flutter/material.dart';
import 'package:cinacoin/cinacoin.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final _cinacoin = Cinacoin.instance;
  String? _address;
  int? _chainId;

  @override
  void initState() {
    super.initState();

    // 监听账户变化
    _cinacoin.onAccountChanged.listen((address) {
      setState(() => _address = address);
    });

    // 监听链切换
    _cinacoin.onChainChanged.listen((chainId) {
      setState(() => _chainId = chainId);
    });
  }

  Future<void> _connect(String walletId) async {
    try {
      final result = await _cinacoin.connect(walletId: walletId);
      setState(() {
        _address = result.accounts.firstOrNull;
        _chainId = result.chainId;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('连接失败: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('🔢 钱包连接')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 连接状态
            if (_address != null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.green, size: 48),
                      const SizedBox(height: 8),
                      Text('地址: $_address', style: const TextStyle(fontFamily: 'monospace')),
                      if (_chainId != null) Text('链 ID: $_chainId'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => _cinacoin.disconnect(),
                child: const Text('断开连接'),
              ),
            ] else ...[
              // 钱包选择
              ListTile(
                leading: const Icon(Icons.account_balance_wallet),
                title: const Text('MetaMask'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _connect('metamask'),
              ),
              ListTile(
                leading: const Icon(Icons.shield),
                title: const Text('Trust Wallet'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _connect('trust'),
              ),
              ListTile(
                leading: const Icon(Icons.qr_code_scanner),
                title: const Text('扫码连接 (Cinacoin)'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _openQRScanner(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _openQRScanner() {
    // TODO: 使用 mobile_scanner 打开 QR 码扫描
    // final uri = await MobileScannerController.scan();
    // await _cinacoin.connectWithUri(uri.text);
  }
}
```

---

## 第四步：消息签名

```dart
import 'package:cinacoin/cinacoin.dart';

class SignMessageScreen extends StatelessWidget {
  const SignMessageScreen({super.key});

  Future<void> _sign(BuildContext context) async {
    try {
      final signature = await Cinacoin.instance.signMessage('Hello Cinacoin!');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('签名成功: $signature')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('签名失败: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () => _sign(context),
      child: const Text('签名消息'),
    );
  }
}
```

---

## 平台配置

### Android

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="cinacoin-flutter" />
</intent-filter>
```

### iOS

```xml
<!-- ios/Runner/Info.plist -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.mydapp.flutter</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>cinacoin-flutter</string>
    </array>
  </dict>
</array>
```

---

## 下一步

- [Mobile SDK API](/api/mobile) — 移动端参考
- [Android 快速开始](/guides/quickstart-android) — Android Kotlin 指南
- [iOS 快速开始](/guides/quickstart-ios) — iOS Swift 指南
- [配置选项](/guide/configuration) — 完整配置参考
