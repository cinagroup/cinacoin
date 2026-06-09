/**
 * Hardhat Deployment Script for Cinacoin Paymasters
 *
 * Deploys CinacoinPaymaster, VerifyingPaymaster, and TokenPaymaster
 * using Hardhat runtime environment.
 *
 * Usage:
 *   npx hardhat run deploy/hardhat-deploy.ts --network sepolia
 *   npx hardhat run deploy/hardhat-deploy.ts --network mainnet
 *
 * Environment variables:
 *   TRUSTED_SIGNER - Address of the trusted signer for VerifyingPaymaster
 */

import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

// Default EntryPoint v0.7 address
const DEFAULT_ENTRY_POINT = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';

interface DeploymentOutput {
  network: string;
  chainId: number;
  entryPoint: string;
  contracts: {
    cinacoinPaymaster: string;
    verifyingPaymaster: string;
    tokenPaymaster: string;
  };
  deployer: string;
  timestamp: string;
}

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log('='.repeat(60));
  console.log('Cinacoin Paymaster Deployment (Hardhat)');
  console.log('='.repeat(60));
  console.log(`Network: ${network.name} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH\n`);

  const entryPoint = process.env.ENTRY_POINT || DEFAULT_ENTRY_POINT;
  const trustedSigner = process.env.TRUSTED_SIGNER || deployer.address;

  console.log(`EntryPoint: ${entryPoint}`);
  console.log(`Trusted Signer: ${trustedSigner}\n`);

  // Deploy CinacoinPaymaster
  console.log('Deploying CinacoinPaymaster...');
  const CinacoinPaymaster = await ethers.getContractFactory('CinacoinPaymaster');
  const cinacoinPaymaster = await CinacoinPaymaster.deploy(entryPoint);
  await cinacoinPaymaster.waitForDeployment();
  const cinacoinPaymasterAddress = await cinacoinPaymaster.getAddress();
  console.log(`✅ CinacoinPaymaster deployed at: ${cinacoinPaymasterAddress}`);

  // Deploy VerifyingPaymaster
  console.log('\nDeploying VerifyingPaymaster...');
  const VerifyingPaymaster = await ethers.getContractFactory('VerifyingPaymaster');
  const verifyingPaymaster = await VerifyingPaymaster.deploy(entryPoint, trustedSigner);
  await verifyingPaymaster.waitForDeployment();
  const verifyingPaymasterAddress = await verifyingPaymaster.getAddress();
  console.log(`✅ VerifyingPaymaster deployed at: ${verifyingPaymasterAddress}`);

  // Deploy TokenPaymaster
  console.log('\nDeploying TokenPaymaster...');
  const TokenPaymaster = await ethers.getContractFactory('TokenPaymaster');
  const tokenPaymaster = await TokenPaymaster.deploy(entryPoint);
  await tokenPaymaster.waitForDeployment();
  const tokenPaymasterAddress = await tokenPaymaster.getAddress();
  console.log(`✅ TokenPaymaster deployed at: ${tokenPaymasterAddress}`);

  // Fund paymasters with some ETH for gas
  const fundAmount = ethers.parseEther('0.01');
  console.log(`\nFunding paymasters with ${ethers.formatEther(fundAmount)} ETH each...`);

  await (await deployer.sendTransaction({
    to: cinacoinPaymasterAddress,
    value: fundAmount,
  })).wait();
  console.log(`  CinacoinPaymaster funded ✅`);

  await (await deployer.sendTransaction({
    to: verifyingPaymasterAddress,
    value: fundAmount,
  })).wait();
  console.log(`  VerifyingPaymaster funded ✅`);

  // Write deployment output
  const output: DeploymentOutput = {
    network: network.name,
    chainId,
    entryPoint,
    contracts: {
      cinacoinPaymaster: cinacoinPaymasterAddress,
      verifyingPaymaster: verifyingPaymasterAddress,
      tokenPaymaster: tokenPaymasterAddress,
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, `../deployments/hardhat-${network.name}.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n📄 Deployment saved to: ${outputPath}`);
  console.log('\n' + '='.repeat(60));
  console.log('Deployment complete!');
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('Deployment failed:', error);
  process.exitCode = 1;
});
