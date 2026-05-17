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
declare const demoTravelRule: TravelRulePayload;
//# sourceMappingURL=index.d.ts.map