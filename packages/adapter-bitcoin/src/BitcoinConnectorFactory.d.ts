export declare class BitcoinConnectorFactory {
    private static instance;
    private registry;
    private constructor();
    static getInstance(): BitcoinConnectorFactory;
    private registerBuiltInConnectors;
    register(connector: BitcoinConnector): void;
    getConnector(id: string): BitcoinConnector | undefined;
    getAllConnectors(): BitcoinConnector[];
    detectAvailableConnectors(): BitcoinConnector[];
    getRecommendedConnectors(): BitcoinConnector[];
}
export declare const bitcoinConnectorFactory: BitcoinConnectorFactory;
//# sourceMappingURL=BitcoinConnectorFactory.d.ts.map