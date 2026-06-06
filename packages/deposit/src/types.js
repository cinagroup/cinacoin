/** Supported deposit statuses. */
export var DepositStatus;
(function (DepositStatus) {
    /** Deposit initiated, awaiting user action. */
    DepositStatus["PENDING"] = "pending";
    /** Deposit transaction submitted, awaiting confirmation. */
    DepositStatus["PROCESSING"] = "processing";
    /** Deposit confirmed and funds received. */
    DepositStatus["COMPLETED"] = "completed";
    /** Deposit failed or rejected. */
    DepositStatus["FAILED"] = "failed";
})(DepositStatus || (DepositStatus = {}));
//# sourceMappingURL=types.js.map