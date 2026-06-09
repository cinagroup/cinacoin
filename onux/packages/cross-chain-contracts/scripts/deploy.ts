import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentOutput {
  network: string;
  chainId: number;
  contracts: {
    HTLC: string;
    BridgeRouter: string;
    MultiSig: string;
  };
  deployedAt: string;
  relayers: string[];
  multisigThreshold: number;
}

async function main() {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log(`\n🚀 Deploying Cross-Chain Bridge to ${network.name} (chainId: ${chainId})\n`);

  // ── Configuration ──────────────────────────────────────────────────────
  const deployer = await ethers.getSigners()[0];
  console.log(`📋 Deployer: ${deployer.address}`);
  console.log(`💰 Balance:  ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

  // Relayer addresses for MultiSig
  const relayers = process.env.RELAYER_ADDRESSES
    ? process.env.RELAYER_ADDRESSES.split(",")
    : [deployer.address]; // Default: deployer is the only relayer
  const threshold = Math.min(2, relayers.length); // 2-of-N or 1-of-1

  console.log(`🔑 Relayers: ${relayers.join(", ")}`);
  console.log(`🔒 MultiSig Threshold: ${threshold} of ${relayers.length}\n`);

  // ── Deploy HTLC ────────────────────────────────────────────────────────
  console.log("┌─────────────────────────────────────┐");
  console.log("│  1. Deploying HTLC Contract...      │");
  console.log("└─────────────────────────────────────┘");

  const HTLC = await ethers.getContractFactory("HTLC");
  const htlc = await HTLC.deploy();
  await htlc.waitForDeployment();
  const htlcAddress = await htlc.getAddress();
  console.log(`✅ HTLC deployed to: ${htlcAddress}\n`);

  // ── Deploy BridgeRouter ────────────────────────────────────────────────
  console.log("┌─────────────────────────────────────┐");
  console.log("│  2. Deploying BridgeRouter...       │");
  console.log("└─────────────────────────────────────┘");

  const BridgeRouter = await ethers.getContractFactory("BridgeRouter");
  const bridgeRouter = await BridgeRouter.deploy();
  await bridgeRouter.waitForDeployment();
  const bridgeRouterAddress = await bridgeRouter.getAddress();
  console.log(`✅ BridgeRouter deployed to: ${bridgeRouterAddress}\n`);

  // ── Deploy MultiSig ────────────────────────────────────────────────────
  console.log("┌─────────────────────────────────────┐");
  console.log("│  3. Deploying MultiSig Contract...  │");
  console.log("└─────────────────────────────────────┘");

  const MultiSig = await ethers.getContractFactory("MultiSig");
  const multiSig = await MultiSig.deploy(relayers, threshold);
  await multiSig.waitForDeployment();
  const multiSigAddress = await multiSig.getAddress();
  console.log(`✅ MultiSig deployed to: ${multiSigAddress}\n`);

  // ── Configuration ──────────────────────────────────────────────────────
  console.log("┌─────────────────────────────────────┐");
  console.log("│  4. Configuring BridgeRouter...     │");
  console.log("└─────────────────────────────────────┘");

  // Add additional relayers to BridgeRouter
  for (const relayer of relayers) {
    if (relayer.toLowerCase() !== deployer.address.toLowerCase()) {
      const tx = await bridgeRouter.addRelayer(relayer);
      await tx.wait();
      console.log(`  ✅ Added relayer: ${relayer}`);
    }
  }

  // Set signature threshold
  if (threshold > 1) {
    const tx = await bridgeRouter.setSignatureThreshold(threshold);
    await tx.wait();
    console.log(`  ✅ Signature threshold set to: ${threshold}`);
  }

  console.log("");

  // ── Verification ───────────────────────────────────────────────────────
  console.log("┌─────────────────────────────────────┐");
  console.log("│  5. Verifying Contracts...          │");
  console.log("└─────────────────────────────────────┘");

  try {
    await htlc.waitForDeployment();
    await run("verify:verify", {
      address: htlcAddress,
      constructorArguments: [],
    });
    console.log("✅ HTLC verified");
  } catch (e) {
    console.log(`⚠️  HTLC verification skipped: ${(e as Error).message}`);
  }

  try {
    await bridgeRouter.waitForDeployment();
    await run("verify:verify", {
      address: bridgeRouterAddress,
      constructorArguments: [],
    });
    console.log("✅ BridgeRouter verified");
  } catch (e) {
    console.log(`⚠️  BridgeRouter verification skipped: ${(e as Error).message}`);
  }

  try {
    await multiSig.waitForDeployment();
    await run("verify:verify", {
      address: multiSigAddress,
      constructorArguments: [relayers, threshold],
    });
    console.log("✅ MultiSig verified");
  } catch (e) {
    console.log(`⚠️  MultiSig verification skipped: ${(e as Error).message}`);
  }

  console.log("");

  // ── Save Deployment Output ─────────────────────────────────────────────
  const output: DeploymentOutput = {
    network: network.name === "unknown" ? `chain-${chainId}` : network.name,
    chainId,
    contracts: {
      HTLC: htlcAddress,
      BridgeRouter: bridgeRouterAddress,
      MultiSig: multiSigAddress,
    },
    deployedAt: new Date().toISOString(),
    relayers,
    multisigThreshold: threshold,
  };

  const outputDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${chainId}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`📄 Deployment info saved to: ${outputPath}\n`);

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║          DEPLOYMENT COMPLETE                     ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Network:     ${output.network.padEnd(36)}║`);
  console.log(`║  Chain ID:    ${chainId.toString().padEnd(36)}║`);
  console.log(`║  HTLC:        ${htlcAddress.padEnd(36)}║`);
  console.log(`║  BridgeRouter:${bridgeRouterAddress.padEnd(36)}║`);
  console.log(`║  MultiSig:    ${multiSigAddress.padEnd(36)}║`);
  console.log("╚══════════════════════════════════════════════════╝\n");
}

// Run with ethers exception handling
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
