/**
 * KYC Provider Integrations — SumSub, Onfido
 *
 * Provider adapter interfaces and implementations for
 * external KYC verification services.
 */

import type { KycStatus } from "./types.js";

// ============================================================
// Types
// ============================================================

/** KYC verification level. */
export type KycLevel = "basic" | "intermediate" | "advanced";

/** KYC document type. */
export type DocumentType =
  | "passport"
  | "national_id"
  | "drivers_license"
  | "residence_permit";

/** A document uploaded for KYC verification. */
export interface KycDocument {
  /** Document type */
  type: DocumentType;
  /** Front image URL or base64 */
  front: string;
  /** Back image URL or base64 (for double-sided docs) */
  back?: string;
  /** Selfie / liveness image */
  selfie?: string;
  /** Proof of address document */
  proofOfAddress?: string;
  /** Upload timestamp */
  uploadedAt: string;
}

/** KYC applicant data sent to providers. */
export interface KycApplicant {
  /** External reference (user ID / wallet address) */
  externalId: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Date of birth (YYYY-MM-DD) */
  dateOfBirth?: string;
  /** Country of residence (ISO 3166-1 alpha-2) */
  country?: string;
  /** Email address */
  email?: string;
  /** Phone number (E.164) */
  phone?: string;
}

/** Result from a KYC provider. */
export interface KycProviderResult {
  /** Provider-specific applicant/inspection ID */
  providerId: string;
  /** KYC status */
  status: KycStatus;
  /** KYC level achieved */
  level?: KycLevel;
  /** Rejection reason (if rejected/flagged) */
  rejectReason?: string;
  /** Review required flag */
  reviewRequired: boolean;
  /** Documents that were processed */
  documents: KycDocument[];
  /** Raw provider response */
  rawResponse?: Record<string, unknown>;
  /** Result timestamp */
  timestamp: string;
}

// ============================================================
// Provider Interface
// ============================================================

/** Abstract interface for KYC providers. */
export interface KycProvider {
  /** Provider identifier */
  id: string;
  /** Provider display name */
  name: string;

  /**
   * Create a new KYC applicant.
   * Returns the applicant ID from the provider.
   */
  createApplicant(applicant: KycApplicant): Promise<string>;

  /**
   * Upload documents for an applicant.
   */
  uploadDocuments(applicantId: string, documents: KycDocument): Promise<void>;

  /**
   * Get the current KYC status for an applicant.
   */
  getApplicantStatus(applicantId: string): Promise<KycProviderResult>;

  /**
   * Get a redirect URL for the provider's verification flow.
   * (For providers that use an embedded web UI)
   */
  getVerificationUrl(applicantId: string): Promise<string>;

  /**
   * Handle a webhook callback from the provider.
   */
  handleWebhook(payload: Record<string, unknown>): Promise<KycProviderResult>;
}

// ============================================================
// SumSub Provider
// ============================================================

export interface SumSubConfig {
  /** SumSub API token (server-side) */
  apiToken: string;
  /** SumSub API secret */
  apiSecret: string;
  /** Level name configured in SumSub dashboard */
  levelName: string;
  /** Environment */
  environment: "sandbox" | "production";
}

export class SumSubProvider implements KycProvider {
  public readonly id = "sumsub";
  public readonly name = "SumSub";

  private config: SumSubConfig;

  constructor(config: SumSubConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    const subdomain = this.config.environment === "sandbox" ? "sandbox" : "api";
    return `https://${subdomain}.sumsub.com/resources/rs`;
  }

  async createApplicant(applicant: KycApplicant): Promise<string> {
    const url = `${this.getBaseUrl()}/applicants`;

    const body = {
      externalUserId: applicant.externalId,
      info: {
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        dob: applicant.dateOfBirth,
        country: applicant.country,
        email: applicant.email,
        phone: applicant.phone,
      },
      levelName: this.config.levelName,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: this._authHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SumSub createApplicant failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return data.id as string;
  }

  async uploadDocuments(applicantId: string, documents: KycDocument): Promise<void> {
    // Upload front document
    if (documents.front) {
      await this._uploadDocument(applicantId, documents);
    }
    // Upload back document if present
    if (documents.back) {
      await this._uploadDocument(applicantId, { ...documents, front: documents.back }, "back");
    }
    // Upload selfie
    if (documents.selfie) {
      await this._uploadDocument(applicantId, { ...documents, front: documents.selfie }, "selfie");
    }
    // Upload proof of address
    if (documents.proofOfAddress) {
      await this._uploadDocument(applicantId, { ...documents, front: documents.proofOfAddress }, "additional");
    }
  }

  async getApplicantStatus(applicantId: string): Promise<KycProviderResult> {
    const url = `${this.getBaseUrl()}/applicants/${applicantId}/one`;

    const res = await fetch(url, {
      headers: this._authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`SumSub getApplicantStatus failed (${res.status})`);
    }

    const data = await res.json();
    const reviewStatus = data.reviewStatus as string;

    return {
      providerId: applicantId,
      status: this._mapSumSubStatus(reviewStatus),
      level: data.reviewResult?.levelName ? this._mapLevel(data.reviewResult.levelName) : undefined,
      rejectReason: data.reviewResult?.rejectLabels?.join(", "),
      reviewRequired: reviewStatus === "pending",
      documents: [],
      rawResponse: data,
      timestamp: new Date().toISOString(),
    };
  }

  async getVerificationUrl(applicantId: string): Promise<string> {
    const url = `${this.getBaseUrl()}/applicants/${applicantId}/sdkAccessToken`;

    const res = await fetch(url, {
      method: "POST",
      headers: this._authHeaders(),
      body: JSON.stringify({ ttl: 3600 }),
    });

    if (!res.ok) {
      throw new Error(`SumSub getVerificationUrl failed (${res.status})`);
    }

    const data = await res.json();
    return data.accessToken as string;
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<KycProviderResult> {
    const applicantId = payload.applicantId as string;
    const reviewStatus = payload.reviewStatus as string;

    return {
      providerId: applicantId,
      status: this._mapSumSubStatus(reviewStatus),
      reviewRequired: reviewStatus === "pending",
      documents: [],
      rawResponse: payload,
      timestamp: new Date().toISOString(),
    };
  }

  private async _uploadDocument(
    applicantId: string,
    documents: KycDocument,
    _side: "front" | "back" | "selfie" | "additional" = "front",
  ): Promise<void> {
    const docType = this._mapDocType(documents.type);
    const url = `${this.getBaseUrl()}/applicants/${applicantId}/idDoc?docType=${docType}&idDocType=${docType}`;

    // In production, use FormData for file upload
    // For now, this is a placeholder
    const formData = new FormData();
    formData.append("content", documents.front as unknown as unknown as Blob);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...this._authHeaders(),
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SumSub uploadDocument failed (${res.status}): ${text}`);
    }
  }

  private _mapSumSubStatus(status: string): KycStatus {
    switch (status) {
      case "green":
      case "approved":
        return "verified";
      case "pending":
        return "pending";
      case "red":
      case "rejected":
        return "rejected";
      case "grey":
      case "onHold":
        return "flagged";
      default:
        return "unverified";
    }
  }

  private _mapLevel(levelName: string): KycLevel {
    if (levelName.includes("advanced")) return "advanced";
    if (levelName.includes("intermediate")) return "intermediate";
    return "basic";
  }

  private _mapDocType(type: DocumentType): string {
    switch (type) {
      case "passport": return "PASSPORT";
      case "national_id": return "ID_CARD";
      case "drivers_license": return "DRIVERS";
      case "residence_permit": return "RESIDENCE_PERMIT";
      default: return "ID_CARD";
    }
  }

  private _authHeaders(): Record<string, string> {
    // In production, generate HMAC-SHA256 signature
    // Per SumSub docs: https://docs.sumsub.com/api/#section/Authentication
    return {
      "Content-Type": "application/json",
      "X-App-Token": this.config.apiToken,
    };
  }
}

// ============================================================
// Onfido Provider
// ============================================================

const ONFIDO_API_BASE = "https://api.onfido.com/v3.6";

export interface OnfidoConfig {
  /** Onfido API token */
  apiToken: string;
  /** Onfido region (US, EU, CA) */
  region: "US" | "EU" | "CA";
  /** Workflow ID configured in Onfido dashboard */
  workflowId?: string;
  /** Environment */
  environment: "sandbox" | "production";
}

export class OnfidoProvider implements KycProvider {
  public readonly id = "onfido";
  public readonly name = "Onfido";

  private config: OnfidoConfig;

  constructor(config: OnfidoConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    const regionMap: Record<string, string> = {
      US: "https://api.us.onfido.com/v3.6",
      EU: "https://api.eu.onfido.com/v3.6",
      CA: "https://api.ca.onfido.com/v3.6",
    };
    return regionMap[this.config.region] ?? ONFIDO_API_BASE;
  }

  async createApplicant(applicant: KycApplicant): Promise<string> {
    const url = `${this.getBaseUrl()}/applicants`;

    const body = {
      first_name: applicant.firstName,
      last_name: applicant.lastName,
      dob: applicant.dateOfBirth,
      country: applicant.country,
      email: applicant.email,
      phone_number: applicant.phone,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token token=${this.config.apiToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Onfido createApplicant failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return data.id as string;
  }

  async uploadDocuments(applicantId: string, documents: KycDocument): Promise<void> {
    const url = `${this.getBaseUrl()}/applicants/${applicantId}/documents`;

    // Upload front
    if (documents.front) {
      const formData = new FormData();
      formData.append("type", this._mapOnfidoDocType(documents.type));
      formData.append("file", documents.front as unknown as unknown as Blob);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token token=${this.config.apiToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Onfido uploadDocument failed (${res.status}): ${text}`);
      }
    }
  }

  async getApplicantStatus(applicantId: string): Promise<KycProviderResult> {
    const url = `${this.getBaseUrl()}/applicants/${applicantId}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Token token=${this.config.apiToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Onfido getApplicantStatus failed (${res.status})`);
    }

    const data = await res.json();

    return {
      providerId: applicantId,
      status: "unverified", // Onfido status is derived from checks
      reviewRequired: true,
      documents: [],
      rawResponse: data,
      timestamp: new Date().toISOString(),
    };
  }

  async getVerificationUrl(applicantId: string): Promise<string> {
    if (this.config.workflowId) {
      // Create a workflow run
      const url = `${this.getBaseUrl()}/workflow_runs`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token token=${this.config.apiToken}`,
        },
        body: JSON.stringify({
          workflow_id: this.config.workflowId,
          applicant_id: applicantId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Onfido getVerificationUrl failed (${res.status})`);
      }

      const data = await res.json();
      return data.redirect_url as string;
    }

    // Fallback: SDK token approach
    const url = `${this.getBaseUrl()}/sdk_token`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token token=${this.config.apiToken}`,
      },
      body: JSON.stringify({
        applicant_id: applicantId,
        application_id: "cinacoin-onramp",
        referrer: "https://cinacoin.dev",
      }),
    });

    if (!res.ok) {
      throw new Error(`Onfido SDK token failed (${res.status})`);
    }

    const data = await res.json();
    return data.token as string;
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<KycProviderResult> {
    const action = payload.action as string;

    let status: KycStatus = "pending";
    if (action === "check.completed") {
      const result = (payload.payload as Record<string, unknown>)?.result as string ?? "consider";
      status = result === "clear" ? "verified" : result === "consider" ? "flagged" : "rejected";
    }

    return {
      providerId: payload.resource_id as string,
      status,
      reviewRequired: status === "pending" || status === "flagged",
      documents: [],
      rawResponse: payload,
      timestamp: new Date().toISOString(),
    };
  }

  private _mapOnfidoDocType(type: DocumentType): string {
    switch (type) {
      case "passport": return "passport";
      case "national_id": return "national_identity_card";
      case "drivers_license": return "driving_licence";
      case "residence_permit": return "residence_permit";
      default: return "national_identity_card";
    }
  }
}
