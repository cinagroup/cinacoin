/**
 * Paymaster error types
 */

export class PaymasterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymasterError';
  }
}

export class PaymasterConfigError extends PaymasterError {
  constructor(message: string) {
    super(message);
    this.name = 'PaymasterConfigError';
  }
}

export class PaymasterRpcError extends PaymasterError {
  constructor(message: string) {
    super(message);
    this.name = 'PaymasterRpcError';
  }
}

export class PaymasterDepositError extends PaymasterError {
  constructor(message: string) {
    super(message);
    this.name = 'PaymasterDepositError';
  }
}

export class PaymasterPolicyError extends PaymasterError {
  constructor(message: string) {
    super(message);
    this.name = 'PaymasterPolicyError';
  }
}

export class PaymasterInsufficientFundsError extends PaymasterError {
  constructor(message: string) {
    super(message);
    this.name = 'PaymasterInsufficientFundsError';
  }
}
