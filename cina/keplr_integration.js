/**
 * Keplr 钱包集成脚本
 * 
 * 使用方法:
 * 1. 在网页中引入此脚本
 * 2. 调用 addCinaToKeplr() 添加 cina 链到 Keplr
 */

// cina 链配置
const cinaChainConfig = {
  chainId: "cina",
  chainName: "Cina Chain",
  rpc: "https://rpc.cinachain.com",
  rest: "https://api.cinachain.com",
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: "cosmos",
    bech32PrefixAccPub: "cosmos" + "pub",
    bech32PrefixValAddr: "cosmos" + "valoper",
    bech32PrefixValPub: "cosmos" + "valoperpub",
    bech32PrefixConsAddr: "cosmos" + "valcons",
    bech32PrefixConsPub: "cosmos" + "valconspub",
  },
  currencies: [
    {
      coinDenom: "STAKE",
      coinMinimalDenom: "stake",
      coinDecimals: 6,
      coinGeckoId: "staking-token", // 可选：CoinGecko ID
    },
  ],
  feeCurrencies: [
    {
      coinDenom: "STAKE",
      coinMinimalDenom: "stake",
      coinDecimals: 6,
      coinGeckoId: "staking-token",
      gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.03,
      },
    },
  ],
  stakeCurrency: {
    coinDenom: "STAKE",
    coinMinimalDenom: "stake",
    coinDecimals: 6,
    coinGeckoId: "staking-token",
  },
  features: [
    "stargate",
    "ibc-transfer",
    "ibc-go",
    "cosmwasm", // 如果支持 CosmWasm
  ],
};

/**
 * 添加 cina 链到 Keplr 钱包
 */
async function addCinaToKeplr() {
  if (!window.keplr) {
    alert("请安装 Keplr 钱包扩展！\nhttps://www.keplr.app/");
    return false;
  }

  try {
    // 建议链给用户
    await window.keplr.experimentalSuggestChain(cinaChainConfig);
    console.log("✅ Cina Chain 已添加到 Keplr");
    return true;
  } catch (error) {
    console.error("❌ 添加失败:", error);
    alert("添加失败，请手动配置");
    return false;
  }
}

/**
 * 获取 Keplr 签名者
 */
async function getKeplrSigner() {
  if (!window.keplr) {
    throw new Error("请安装 Keplr 钱包");
  }

  // 启用 cina 链
  await window.keplr.enable("cina");

  // 获取离线签名者
  const offlineSigner = window.getOfflineSigner("cina");
  
  // 获取账户信息
  const accounts = await offlineSigner.getAccounts();
  console.log("账户:", accounts[0]);

  return {
    offlineSigner,
    account: accounts[0],
  };
}

/**
 * 查询域名解析 (ICS-DNS)
 */
async function resolveDomain(domain) {
  const response = await fetch(
    `https://api.cinachain.com/icsdns/domain/${domain}`
  );
  const data = await response.json();
  return data;
}

/**
 * 通过域名发送代币
 */
async function sendViaDomain(domain, amount, denom = "stake") {
  try {
    // 解析域名
    const domainData = await resolveDomain(domain);
    const address = domainData.addresses.find(
      (addr) => addr.chain_id === "cina"
    )?.address;

    if (!address) {
      throw new Error("域名未设置地址映射");
    }

    // 获取签名者
    const { offlineSigner, account } = await getKeplrSigner();

    // 构建交易
    const msg = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: {
        fromAddress: account.bech32Address,
        toAddress: address,
        amount: [
          {
            denom: denom,
            amount: amount.toString(),
          },
        ],
      },
    };

    // 获取 Gas 价格
    const fee = {
      amount: [
        {
          denom: denom,
          amount: "2000", // 0.002 STAKE
        },
      ],
      gas: "200000",
    };

    // 签名并广播交易
    const result = await offlineSigner.signAndBroadcast(
      account.bech32Address,
      [msg],
      fee,
      `发送到 ${domain}`
    );

    console.log("✅ 交易成功:", result.transactionHash);
    return result;
  } catch (error) {
    console.error("❌ 发送失败:", error);
    throw error;
  }
}

/**
 * 注册域名
 */
async function registerDomain(domain, adminAddress) {
  try {
    const { offlineSigner, account } = await getKeplrSigner();

    const msg = {
      typeUrl: "/cina.icsdns.v1.MsgRegisterDomain",
      value: {
        domain: domain,
        admin: adminAddress || account.bech32Address,
        expire: Math.floor(Date.now() / 1000) + 31536000, // 1 年
      },
    };

    const fee = {
      amount: [
        {
          denom: "stake",
          amount: "100000", // 100 STAKE
        },
      ],
      gas: "200000",
    };

    const result = await offlineSigner.signAndBroadcast(
      account.bech32Address,
      [msg],
      fee,
      `注册域名 ${domain}.cina`
    );

    console.log("✅ 域名注册成功:", result.transactionHash);
    return result;
  } catch (error) {
    console.error("❌ 注册失败:", error);
    throw error;
  }
}

// 导出函数
window.CinaChain = {
  addCinaToKeplr,
  getKeplrSigner,
  resolveDomain,
  sendViaDomain,
  registerDomain,
  config: cinaChainConfig,
};

// 自动检测 Keplr
if (window.keplr) {
  console.log("✅ Keplr 已安装");
} else {
  console.log("⚠️ Keplr 未安装");
}
