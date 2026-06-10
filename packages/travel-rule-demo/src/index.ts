import { logger } from '@cinacoin/logger';
/**
 * Travel Rule Demo - VASP Compliance Integration
 * Demonstrates FATF Travel Rule compliance for crypto transfers
 */

interface TravelRulePayload {
  originator: {
    name: string;
    walletAddress: string;
    geographicAddress: string;
    nationalId?: string;
    dateOfBirth?: string;
  };
  beneficiary: {
    name: string;
    walletAddress: string;
    geographicAddress: string;
    nationalId?: string;
    dateOfBirth?: string;
  };
  amount: string;
  asset: string;
  txId: string;
}

const demoTravelRule: TravelRulePayload = {
  originator: {
    name: "Alice Smith",
    walletAddress: "0x1234...",
    geographicAddress: "123 Main St, New York, USA",
    nationalId: "US-SSN-123-45-6789",
    dateOfBirth: "1990-01-15",
  },
  beneficiary: {
    name: "Bob Johnson",
    walletAddress: "0x5678...",
    geographicAddress: "456 Oak Ave, London, UK",
    nationalId: "UK-PASSPORT-GB123456789",
    dateOfBirth: "1985-06-20",
  },
  amount: "1000",
  asset: "ETH",
  txId: "0xabcd...",
};

logger.info("Travel Rule Demo");
logger.info(JSON.stringify(demoTravelRule, null, 2));
logger.info("\nVASP Integration Steps:");
logger.info("1. Identify transfer above threshold ($1000 USD)");
logger.info("2. Collect originator PII");
logger.info("3. Collect beneficiary PII");
logger.info("4. Exchange data with beneficiary VASP");
logger.info("5. Record compliance metadata");
