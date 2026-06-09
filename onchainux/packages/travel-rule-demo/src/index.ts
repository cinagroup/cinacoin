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

console.log("Travel Rule Demo");
console.log(JSON.stringify(demoTravelRule, null, 2));
console.log("\nVASP Integration Steps:");
console.log("1. Identify transfer above threshold ($1000 USD)");
console.log("2. Collect originator PII");
console.log("3. Collect beneficiary PII");
console.log("4. Exchange data with beneficiary VASP");
console.log("5. Record compliance metadata");
