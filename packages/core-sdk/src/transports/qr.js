/**
 * QR Code connection transport.
 *
 * Generates QR codes for WalletConnect-style pairing URIs and
 * manages the connection lifecycle for wallet scanning.
 */
import { Connector } from '../connector.js';
import { RelayTransport } from './relay.js';
/**
 * QRTransport enables wallet connection via QR code scanning.
 *
 * Flow:
 * 1. Generate a pairing URI with our relay endpoint
 * 2. Display as QR code for user to scan with wallet
 * 3. Wait for wallet to connect via relay WebSocket
 * 4. Establish encrypted session
 */
export class QRTransport extends Connector {
    constructor(config) {
        super();
        this.id = 'qr';
        this.name = 'Scan QR Code';
        this.icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTMgMTEoOGg4VjNIM3Y4em0yLTZoNHY0SDVWNXptOC0ydjRoNHYtNGgtNHptMiAydjJoMlY3aC0yeiIvPjwvc3ZnPg==';
        this.type = 'qr';
        this.currentUri = null;
        this.connectedAccounts = [];
        this.connectedChainId = null;
        this.config = {
            relayUrl: config.relayUrl,
            qrTimeout: config.qrTimeout ?? 300000, // 5 minutes
            projectId: config.projectId,
        };
        this.relay = new RelayTransport({ url: config.relayUrl });
        this.setupRelayListeners();
    }
    get installed() {
        // QR transport is always available — user scans with their wallet
        return true;
    }
    setupRelayListeners() {
        this.relay.on('message', (_topic, payload) => {
            // Parse incoming encrypted message
            try {
                const data = JSON.parse(payload);
                this.emit('message', data);
            }
            catch {
                // Encrypted payload — will be decrypted at the session layer
                this.emit('encryptedMessage', payload);
            }
        });
        this.relay.on('connected', () => {
            this.emit('relayConnected');
        });
        this.relay.on('disconnected', () => {
            this.emit('relayDisconnected');
        });
    }
    /**
     * Generate a pairing URI for QR code display.
     * @returns The pairing URI to encode as a QR code.
     */
    async generatePairingUri() {
        // Connect relay first
        if (!this.relay.isConnected()) {
            await this.relay.connect();
        }
        // Generate pairing topic and keypair
        const pairingTopic = this.generateTopic();
        const symKey = this.generateSymKey();
        // Construct WalletConnect-compatible URI
        const uri = `wc:${pairingTopic}@2?relay-protocol=ws&relay-url=${encodeURIComponent(this.config.relayUrl)}&symKey=${symKey}`;
        this.currentUri = uri;
        // Set QR timeout
        setTimeout(() => {
            if (this.currentUri === uri) {
                this.currentUri = null;
                this.emit('qrExpired');
            }
        }, this.config.qrTimeout);
        return uri;
    }
    /**
     * Connect via QR code.
     *
     * This generates a pairing URI and waits for the wallet to scan
     * and confirm the connection.
     *
     * @param params - Optional connection parameters.
     * @returns Connection result.
     */
    async connect(params) {
        const uri = params?.uri ?? (await this.generatePairingUri());
        // Wait for connection confirmation from relay
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.relay.off('message', handler);
                reject(new Error('QR connection timed out'));
            }, this.config.qrTimeout);
            const handler = (_topic, payload) => {
                try {
                    const data = JSON.parse(payload);
                    if (data.method === 'wc_sessionPropose') {
                        clearTimeout(timeout);
                        this.relay.off('message', handler);
                        // In production: approve session and get accounts/chainId
                        // For now, emit the proposal for UI handling
                        this.emit('sessionProposal', data);
                        reject(new Error('Session proposal received — handle approval in UI layer'));
                    }
                }
                catch {
                    // Encrypted — ignore at transport level
                }
            };
            this.relay.on('message', handler);
        });
    }
    async disconnect() {
        this.relay.disconnect();
        this.connectedAccounts = [];
        this.connectedChainId = null;
        this.emit('disconnect');
    }
    async getAccounts() {
        return this.connectedAccounts;
    }
    async getChainId() {
        if (this.connectedChainId === null) {
            throw new Error('Not connected');
        }
        return this.connectedChainId;
    }
    async switchChain(_chainId) {
        throw new Error('QR transport does not support chain switching directly');
    }
    async signMessage(_message) {
        throw new Error('Sign via session layer, not transport');
    }
    async signTransaction(_tx) {
        throw new Error('Sign via session layer, not transport');
    }
    /** Get the current QR URI (if active). */
    getUri() {
        return this.currentUri;
    }
    /** Generate a random 32-byte topic (64 hex chars). */
    generateTopic() {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
    /** Generate a random symmetric key (64 hex chars). */
    generateSymKey() {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
}
//# sourceMappingURL=qr.js.map