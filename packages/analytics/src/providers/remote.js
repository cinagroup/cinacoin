/**
 * Remote Analytics Provider
 *
 * Sends analytics events to a remote endpoint.
 */
export class RemoteProvider {
    constructor(config) {
        this.queue = [];
        this.flushTimer = null;
        this.allEvents = [];
        this.config = {
            endpoint: config.endpoint,
            apiKey: config.apiKey ?? "",
            batchSize: config.batchSize ?? 10,
            flushInterval: config.flushInterval ?? 5000,
        };
    }
    async track(event) {
        this.queue.push(event);
        this.allEvents.push(event);
        if (this.queue.length >= this.config.batchSize) {
            await this.flush();
        }
        else if (!this.flushTimer) {
            this.flushTimer = setTimeout(() => {
                this.flush();
            }, this.config.flushInterval);
        }
    }
    /**
     * Flush pending events to the remote endpoint.
     */
    async flush() {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        if (this.queue.length === 0)
            return;
        const events = [...this.queue];
        this.queue = [];
        try {
            // Simulated send — in production, make actual fetch call
            const response = { ok: true };
            if (!response.ok) {
                // Re-queue on failure
                this.queue.unshift(...events);
            }
        }
        catch {
            // Re-queue on network failure
            this.queue.unshift(...events);
        }
    }
    async getEvents() {
        return [...this.allEvents];
    }
    async clear() {
        this.queue = [];
        this.allEvents = [];
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
    }
}
//# sourceMappingURL=remote.js.map