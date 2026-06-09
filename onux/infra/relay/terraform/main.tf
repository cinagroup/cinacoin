# Terraform — Cinacoin WalletConnect Relay Infrastructure
#
# Deploys Cloudflare Workers + D1 + KV for multi-region relay.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

# ─── Variables ─────────────────────────────────────────────

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Workers, D1, KV permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "project_id" {
  description = "WalletConnect Cloud project ID"
  type        = string
  default     = ""
}

variable "regions" {
  description = "Deployment regions"
  type        = list(string)
  default     = ["nam", "eur", "apac"]
}

variable "rate_limit_rpm" {
  description = "Rate limit requests per minute per IP"
  type        = number
  default     = 120
}

# ─── Provider ─────────────────────────────────────────────

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ─── KV Namespace (shared session cache) ──────────────────

resource "cloudflare_workers_kv_namespace" "session_cache" {
  account_id = var.cloudflare_account_id
  title      = "cinacoin-wc-relay-cache"
}

# ─── D1 Database (session state) ──────────────────────────

resource "cloudflare_d1_database" "session_db" {
  account_id = var.cloudflare_account_id
  name       = "cinacoin-wc-relay-db"
}

# ─── Worker Script ────────────────────────────────────────

resource "cloudflare_worker_script" "relay_worker" {
  account_id         = var.cloudflare_account_id
  name               = "cinacoin-wc-relay"
  content            = file("${path.module}/../src/worker.ts")
  compatibility_date = "2024-01-01"

  # Bind KV namespace
  kv_namespace {
    name         = "SESSION_CACHE"
    namespace_id = cloudflare_workers_kv_namespace.session_cache.id
  }

  # Bind D1 database
  d1_database {
    name     = "SESSION_DB"
    database_id = cloudflare_d1_database.session_db.id
  }

  # Bindings for environment
  plain_text_binding {
    name = "RATE_LIMIT_RPM"
    text = tostring(var.rate_limit_rpm)
  }

  plain_text_binding {
    name = "PROJECT_ID"
    text = var.project_id
  }

  plain_text_binding {
    name = "REGION"
    text = var.regions[0]
  }
}

# ─── Multi-region Workers ─────────────────────────────────

resource "cloudflare_worker_script" "relay_worker_eur" {
  count              = contains(var.regions, "eur") ? 1 : 0
  account_id         = var.cloudflare_account_id
  name               = "cinacoin-wc-relay-eu"
  content            = file("${path.module}/../src/worker.ts")
  compatibility_date = "2024-01-01"

  kv_namespace {
    name         = "SESSION_CACHE"
    namespace_id = cloudflare_workers_kv_namespace.session_cache.id
  }

  d1_database {
    name        = "SESSION_DB"
    database_id = cloudflare_d1_database.session_db.id
  }

  plain_text_binding {
    name = "REGION"
    text = "eur"
  }
}

resource "cloudflare_worker_script" "relay_worker_apac" {
  count              = contains(var.regions, "apac") ? 1 : 0
  account_id         = var.cloudflare_account_id
  name               = "cinacoin-wc-relay-ap"
  content            = file("${path.module}/../src/worker.ts")
  compatibility_date = "2024-01-01"

  kv_namespace {
    name         = "SESSION_CACHE"
    namespace_id = cloudflare_workers_kv_namespace.session_cache.id
  }

  d1_database {
    name        = "SESSION_DB"
    database_id = cloudflare_d1_database.session_db.id
  }

  plain_text_binding {
    name = "REGION"
    text = "apac"
  }
}

# ─── Worker Routes (custom domains per region) ───────────

resource "cloudflare_worker_route" "relay_route" {
  zone_id    = var.cloudflare_account_id # Replace with actual zone ID
  pattern    = "relay.cinacoin.com/*"
  script_name = cloudflare_worker_script.relay_worker.name
}

# ─── Outputs ──────────────────────────────────────────────

output "worker_url" {
  description = "Primary relay worker URL"
  value       = "https://${cloudflare_worker_script.relay_worker.name}.${var.cloudflare_account_id}.workers.dev"
}

output "kv_namespace_id" {
  description = "KV namespace ID for session caching"
  value       = cloudflare_workers_kv_namespace.session_cache.id
}

output "d1_database_id" {
  description = "D1 database ID for session state"
  value       = cloudflare_d1_database.session_db.id
}

output "worker_eur_url" {
  description = "EU relay worker URL"
  value       = try("https://${cloudflare_worker_script.relay_worker_eur[0].name}.${var.cloudflare_account_id}.workers.dev", null)
}

output "worker_apac_url" {
  description = "APAC relay worker URL"
  value       = try("https://${cloudflare_worker_script.relay_worker_apac[0].name}.${var.cloudflare_account_id}.workers.dev", null)
}
