import type { Cypress } from 'cypress';

declare global {
  namespace Cypress {
    interface Chainable {
      connectWallet(walletName: string): Chainable<void>;
      disconnectWallet(): Chainable<void>;
      switchNetwork(chainId: string): Chainable<void>;
      getBalance(): Chainable<string>;
      openModal(): Chainable<void>;
      closeModal(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('connectWallet', (walletName: string) => {
  cy.get('[data-testid="connect-button"]').click();
  cy.get(`[data-testid="wallet-${walletName}"]`).click();
  cy.get('[data-testid="connect-button"]').should('not.exist');
});

Cypress.Commands.add('disconnectWallet', () => {
  cy.get('[data-testid="account-button"]').click();
  cy.get('[data-testid="disconnect-button"]').click();
  cy.get('[data-testid="connect-button"]').should('be.visible');
});

Cypress.Commands.add('switchNetwork', (chainId: string) => {
  cy.get('[data-testid="network-button"]').click();
  cy.get(`[data-testid="network-${chainId}"]`).click();
});

Cypress.Commands.add('getBalance', () => {
  return cy.get('[data-testid="balance"]').invoke('text');
});

Cypress.Commands.add('openModal', () => {
  cy.get('[data-testid="connect-button"]').click();
  cy.get('[data-testid="modal"]').should('be.visible');
});

Cypress.Commands.add('closeModal', () => {
  cy.get('[data-testid="modal-close"]').click();
  cy.get('[data-testid="modal"]').should('not.exist');
});
