import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { logger } from '@cinacoin/logger';

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
  logger.info(`\n🚀 Deploying Cross-Chain Bridge to ${network.name} (chainId: ${chainId})\n`);

  // ── Configuration ──────────────────────────────────────────────────────
  const deployer = await ethers.getSigners()[0];
  logger.info(`📋 Deployer: ${deployer.address}`);
  logger.info(`💰 Balance:  ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

  // Relayer addresses for MultiSig
  const relayers = process.env.RELAYER_ADDRESSES
    ? process.env.RELAYER_ADDRESSES.split(",")
    : [deployer.address]; // Default: deployer is the only relayer
  const threshold = Math.min(2, relayers.length); // 2-of-N or 1-of-1

  logger.info(`🔑 Relayers: ${relayers.join(", ")}`);
  logger.info(`🔒 MultiSig Threshold: ${threshold} of ${relayers.length}\n`);

  // ── Deploy HTLC ────────────────────────────────────────────────────────
  logger.info("┌─────────────────────────────────────┐");
  logger.info("│  1. Deploying HTLC Contract...      │");
  logger.info("└─────────────────────────────────────┘");

  const HTLC = await ethers.getContractFactory("HTLC");
  const htlc = await HTLC.deploy();
  await htlc.waitForDeployment();
  const htlcAddress = await htlc.getAddress();
  logger.info(`✅ HTLC deployed to: ${htlcAddress}\n`);

  // ── Deploy BridgeRouter ────────────────────────────────────────────────
  logger.info("┌─────────────────────────────────────┐");
  logger.info("│  2. Deploying BridgeRouter...       │");
  logger.info("└─────────────────────────────────────┘");

  const BridgeRouter = await ethers.getContractFactory("BridgeRouter");
  const bridgeRouter = await BridgeRouter.deploy();
  await bridgeRouter.waitForDeployment();
  const bridgeRouterAddress = await bridgeRouter.getAddress();
  logger.info(`✅ BridgeRouter deployed to: ${bridgeRouterAddress}\n`);

  // ── Deploy MultiSig ────────────────────────────────────────────────────
  logger.info("┌─────────────────────────────────────┐");
  logger.info("│  3. Deploying MultiSig Contract...  │");
  logger.info("└─────────────────────────────────────┘");

  const MultiSig = await ethers.getContractFactory("MultiSig");
  const multiSig = await MultiSig.deploy(relayers, threshold);
  await multiSig.waitForDeployment();
  const multiSigAddress = await multiSig.getAddress();
  logger.info(`✅ MultiSig deployed to: ${multiSigAddress}\n`);

  // ── Configuration ──────────────────────────────────────────────────────
  logger.info("┌─────────────────────────────────────┐");
  logger.info("│  4. Configuring BridgeRouter...     │");
  logger.info("└─────────────────────────────────────┘");

  // Add additional relayers to BridgeRouter
  for (const relayer of relayers) {
    if (relayer.toLowerCase() !== deployer.address.toLowerCase()) {
      const tx = await bridgeRouter.addRelayer(relayer);
      await tx.wait();
      logger.info(`  ✅ Added relayer: ${relayer}`);
    }
  }

  // Set signature threshold
  if (threshold > 1) {
    const tx = await bridgeRouter.setSignatureThreshold(threshold);
    await tx.wait();
    logger.info(`  ✅ Signature threshold set to: ${threshold}`);
  }

  logger.info("");

  // ── Verification ───────────────────────────────────────────────────────
  logger.info("┌─────────────────────────────────────┐");
  logger.info("│  5. Verifying Contracts...          │");
  logger.info("└─────────────────────────────────────┘");

  try {
    await htlc.waitForDeployment();
    await run("verify:verify", {
      address: htlcAddress,
      constructorArguments: [],
    });
    logger.info("✅ HTLC verified");
  } catch (e) {
    logger.info(`⚠️  HTLC verification skipped: ${(e as Error).message}`);
  }

  try {
    await bridgeRouter.waitForDeployment();
    await run("verify:verify", {
      address: bridgeRouterAddress,
      constructorArguments: [],
    });
    logger.info("✅ BridgeRouter verified");
  } catch (e) {
    logger.info(`⚠️  BridgeRouter verification skipped: ${(e as Error).message}`);
  }

  try {
    await multiSig.waitForDeployment();
    await run("verify:verify", {
      address: multiSigAddress,
      constructorArguments: [relayers, threshold],
    });
    logger.info("✅ MultiSig verified");
  } catch (e) {
    logger.info(`⚠️  MultiSig verification skipped: ${(e as Error).message}`);
  }

  logger.info("");

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
  logger.info(`📄 Deployment info saved to: ${outputPath}\n`);

  // ── Summary ────────────────────────────────────────────────────────────
  logger.info("╔══════════════════════════════════════════════════╗");
  logger.info("║          DEPLOYMENT COMPLETE                     ║");
  logger.info("╠══════════════════════════════════════════════════╣");
  logger.info(`║  Network:     ${output.network.padEnd(36)}║`);
  logger.info(`║  Chain ID:    ${chainId.toString().padEnd(36)}║`);
  logger.info(`║  HTLC:        ${htlcAddress.padEnd(36)}║`);
  logger.info(`║  BridgeRouter:${bridgeRouterAddress.padEnd(36)}║`);
  logger.info(`║  MultiSig:    ${multiSigAddress.padEnd(36)}║`);
  logger.info("╚══════════════════════════════════════════════════╝\n");
}

// Run with ethers exception handling
main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
