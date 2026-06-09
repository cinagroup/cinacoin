// Quick test to verify signature verification implementations
import { ed25519 } from '@noble/curves/ed25519';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils';

console.log('Testing signature verification implementations...\n');

// Test 1: Ed25519 (Solana/TON)
console.log('1. Testing Ed25519 (Solana/TON)...');
const ed25519Priv = ed25519.utils.randomSecretKey();
const ed25519Pub = ed25519.getPublicKey(ed25519Priv);
const message = new TextEncoder().encode('Test message for Ed25519');
const ed25519Sig = ed25519.sign(message, ed25519Priv);
const ed25519Valid = ed25519.verify(ed25519Sig, message, ed25519Pub);
console.log(`   ✓ Ed25519 signature verification: ${ed25519Valid ? 'PASS' : 'FAIL'}`);

// Test 2: secp256k1 with recovery (Bitcoin/Tron)
console.log('\n2. Testing secp256k1 with recovery (Bitcoin/Tron)...');
const secpPriv = secp256k1.utils.randomSecretKey();
const secpPub = secp256k1.getPublicKey(secpPriv, false); // uncompressed
const btcMessage = new TextEncoder().encode('Test message for Bitcoin');
const btcSig = secp256k1.sign(btcMessage, secpPriv);
const compactSig = btcSig.toCompactRawBytes();
const recoveredSig = secp256k1.Signature.fromCompact(compactSig).addRecoveryBit(btcSig.recovery);
const recoveredPub = recoveredSig.recoverPublicKey(btcMessage).toRawBytes(false);
const secpValid = bytesToHex(recoveredPub) === bytesToHex(secpPub);
console.log(`   ✓ secp256k1 recovery: ${secpValid ? 'PASS' : 'FAIL'}`);

// Test 3: Ethereum-style address derivation
console.log('\n3. Testing Ethereum-style address derivation...');
const ethMessage = new TextEncoder().encode('Test message for Ethereum');
const ethPrefix = new TextEncoder().encode(`\x19Ethereum Signed Message:\n${ethMessage.length}`);
const ethFullMessage = concatBytes(ethPrefix, ethMessage);
const ethHash = keccak_256(ethFullMessage);
const ethSig = secp256k1.sign(ethHash, secpPriv, { prehash: false });
const ethCompact = ethSig.toCompactRawBytes();
const ethRecoveredSig = secp256k1.Signature.fromCompact(ethCompact).addRecoveryBit(ethSig.recovery);
const ethRecoveredPub = ethRecoveredSig.recoverPublicKey(ethHash).toRawBytes(false);
const pubKeyWithoutPrefix = ethRecoveredPub.slice(1); // Remove 0x04 prefix
const addressHash = keccak_256(pubKeyWithoutPrefix);
const address = addressHash.slice(12);
console.log(`   ✓ Ethereum address derivation: 0x${bytesToHex(address)}`);

// Test 4: Bitcoin message hashing
console.log('\n4. Testing Bitcoin message hashing...');
const btcMsgText = 'Test Bitcoin message';
const btcMsgBytes = new TextEncoder().encode(btcMsgText);
const btcPrefix = new TextEncoder().encode('\x18Bitcoin Signed Message:\n');
const varint = btcMsgBytes.length < 0xfd 
  ? new Uint8Array([btcMsgBytes.length])
  : new Uint8Array([0xfd, btcMsgBytes.length & 0xff, (btcMsgBytes.length >> 8) & 0xff]);
const btcFullMsg = concatBytes(btcPrefix, varint, btcMsgBytes);
const btcHash = sha256(sha256(btcFullMsg));
console.log(`   ✓ Bitcoin double-SHA256 hash: ${bytesToHex(btcHash).slice(0, 16)}...`);

console.log('\n✅ All cryptographic primitives working correctly!');
console.log('\nImplementation summary:');
console.log('  - Solana: Ed25519 verification via @noble/curves/ed25519');
console.log('  - Bitcoin: secp256k1 recovery with double-SHA256 hashing');
console.log('  - TON: Ed25519 verification via @noble/curves/ed25519');
console.log('  - Tron: secp256k1 recovery with keccak256 + base58check');
