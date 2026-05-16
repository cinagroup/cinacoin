//! JSON-RPC server for the bundler.
//!
//! Implements the ERC-4337 bundler API:
//! - eth_sendUserOperation
//! - eth_estimateUserOperationGas
//! - eth_getUserOperationByHash
//! - eth_getUserOperationReceipt
//! - eth_supportedEntryPoints

use crate::bundler::Bundler;
use crate::types::{UserOpReceipt, UserOpStatus, UserOperation};
use alloy_primitives::{B256, U256};
use axum::{
    extract::State,
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;
use tracing::info;

/// JSON-RPC request envelope.
#[derive(Debug, Deserialize)]
pub struct RpcRequest {
    pub jsonrpc: String,
    pub id: Option<Value>,
    pub method: String,
    pub params: Option<Vec<Value>>,
}

/// JSON-RPC response envelope.
#[derive(Debug, Serialize)]
pub struct RpcResponse {
    pub jsonrpc: String,
    pub id: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<RpcError>,
}

#[derive(Debug, Serialize)]
pub struct RpcError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
}

/// App state shared across handlers.
pub struct AppState {
    pub bundler: Bundler,
}

/// Parameters for eth_sendUserOperation.
#[derive(Debug, Deserialize)]
pub struct SendUserOpParams {
    #[serde(flatten)]
    pub user_op: UserOperation,
    pub entry_point: Option<String>,
}

/// Parameters for eth_estimateUserOperationGas.
#[derive(Debug, Deserialize)]
pub struct EstimateGasParams {
    #[serde(flatten)]
    pub user_op: UserOperation,
    pub entry_point: Option<String>,
}

/// Start the JSON-RPC HTTP server.
pub async fn serve(addr: String, bundler: Bundler) -> Result<(), std::io::Error> {
    let state = Arc::new(AppState { bundler });

    let app = Router::new()
        .route("/", post(handle_rpc))
        .with_state(state);

    info!(addr = %addr, "Starting bundler RPC server");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await
}

/// Handle incoming JSON-RPC requests.
async fn handle_rpc(
    State(state): State<Arc<AppState>>,
    Json(request): Json<RpcRequest>,
) -> Json<RpcResponse> {
    let result = match request.method.as_str() {
        "eth_sendUserOperation" => rpc_send_user_op(&state, request.params).await,
        "eth_estimateUserOperationGas" => rpc_estimate_gas(&state, request.params).await,
        "eth_getUserOperationByHash" => rpc_get_user_op_by_hash(&state, request.params).await,
        "eth_getUserOperationReceipt" => rpc_get_receipt(&state, request.params).await,
        "eth_supportedEntryPoints" => rpc_supported_entry_points(&state),
        "web3_clientVersion" => rpc_client_version(),
        _ => {
            return Json(RpcResponse {
                jsonrpc: "2.0".into(),
                id: request.id,
                result: None,
                error: Some(RpcError {
                    code: -32601,
                    message: "Method not found".into(),
                    data: None,
                }),
            });
        }
    };

    match result {
        Ok(value) => Json(RpcResponse {
            jsonrpc: "2.0".into(),
            id: request.id,
            result: Some(value),
            error: None,
        }),
        Err(e) => Json(RpcResponse {
            jsonrpc: "2.0".into(),
            id: request.id,
            result: None,
            error: Some(RpcError {
                code: -32603,
                message: e.to_string(),
                data: None,
            }),
        }),
    }
}

async fn rpc_send_user_op(
    state: &AppState,
    params: Option<Vec<Value>>,
) -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
    let params = params.ok_or("missing params")?;
    let user_op: UserOperation = serde_json::from_value(params[0].clone())?;

    let hash = state
        .bundler
        .submit_user_op(user_op)
        .await
        .map_err(|e| format!("failed to submit: {e}"))?;

    Ok(serde_json::to_value(format!("{hash:#x}"))?)
}

async fn rpc_estimate_gas(
    state: &AppState,
    params: Option<Vec<Value>>,
) -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
    let params = params.ok_or("missing params")?;
    let user_op: UserOperation = serde_json::from_value(params[0].clone())?;

    let estimation = state
        .bundler
        .estimate_gas(&user_op)
        .await
        .map_err(|e| format!("failed to estimate: {e}"))?;

    Ok(serde_json::to_value(estimation)?)
}

async fn rpc_get_user_op_by_hash(
    state: &AppState,
    params: Option<Vec<Value>>,
) -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
    let params = params.ok_or("missing params")?;
    let hash_str = params[0].as_str().ok_or("invalid hash parameter")?;
    let hash: B256 = hash_str.parse().map_err(|_| "invalid hash")?;

    match state.bundler.mempool.get(&hash).await {
        Some(tracked) => Ok(serde_json::to_value(tracked.user_op)?),
        None => Ok(Value::Null),
    }
}

async fn rpc_get_receipt(
    state: &AppState,
    params: Option<Vec<Value>>,
) -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
    let params = params.ok_or("missing params")?;
    let hash_str = params[0].as_str().ok_or("invalid hash parameter")?;
    let hash: B256 = hash_str.parse().map_err(|_| "invalid hash")?;

    match state.bundler.mempool.get(&hash).await {
        Some(tracked) => {
            let receipt = UserOpReceipt {
                user_op_hash: tracked.hash,
                sender: tracked.user_op.sender,
                nonce: tracked.user_op.nonce,
                actual_gas_cost: U256::ZERO, // Would be filled from chain data
                actual_gas_used: U256::ZERO,
                success: tracked.status == UserOpStatus::Included,
                logs: vec![],
                receipt: serde_json::Value::Null,
            };
            Ok(serde_json::to_value(receipt)?)
        }
        None => Ok(Value::Null),
    }
}

fn rpc_supported_entry_points(state: &AppState) -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
    let eps: Vec<String> = state
        .bundler
        .supported_entry_points()
        .into_iter()
        .map(|addr| format!("{addr:#x}"))
        .collect();
    Ok(serde_json::to_value(eps)?)
}

fn rpc_client_version() -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
    Ok(serde_json::to_value("onchainux-bundler/0.1.0")?)
}

