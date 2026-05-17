import { OnInit, OnDestroy } from '@angular/core';
import { CinaConnectService, type Account } from '../cinaconnect.service.js';
/**
 * Button component showing the current account with disconnect capability.
 *
 * ```html
 * <cina-account-button></cina-account-button>
 * <cina-account-button *ngIf="account$ | async as account"></cina-account-button>
 * ```
 */
export declare class AccountButtonComponent implements OnInit, OnDestroy {
    private _service;
    /** Button size: 'sm', 'md', or 'lg'. Defaults to 'md'. */
    size: 'sm' | 'md' | 'lg';
    account: Account | null;
    private _subscription?;
    constructor(_service: CinaConnectService);
    ngOnInit(): void;
    ngOnDestroy(): void;
    toggleDropdown(): void;
    disconnect(): void;
}
//# sourceMappingURL=account-button.component.d.ts.map