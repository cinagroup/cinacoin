import Foundation

/// Pure Swift Keccak-256 implementation.
/// Keccak-256 (original) differs from SHA3-256 (FIPS 202) in the padding byte:
/// Keccak uses 0x01, SHA3 uses 0x06.
public struct Keccak256 {

    private static let roundConstants: [UInt64] = [
        0x0000000000000001, 0x0000000000008082, 0x800000000000808A, 0x8000000080008000,
        0x000000000000808B, 0x0000000080000001, 0x8000000080008081, 0x8000000000008009,
        0x000000000000008A, 0x0000000000000088, 0x0000000080008009, 0x000000008000000A,
        0x000000008000808B, 0x800000000000008B, 0x8000000000008089, 0x8000000000008003,
        0x8000000000008002, 0x8000000000000080, 0x000000000000800A, 0x800000008000000A,
        0x8000000080008081, 0x8000000000008080, 0x0000000080000001, 0x8000000080008008
    ]

    private static let rotationOffsets: [[Int]] = [
        [ 0,  1, 62, 28, 27],
        [36, 44,  6, 55, 20],
        [ 3, 10, 43, 25, 39],
        [41, 45, 15, 21,  8],
        [18,  2, 61, 56, 14]
    ]

    /// Compute the Keccak-256 hash of the input data.
    /// - Parameter data: Input bytes.
    /// - Returns: 32-byte hash.
    public static func hash(_ data: Data) -> [UInt8] {
        let rate = 136 // (1600 - 2*256) / 8 = 136 bytes
        let outputLength = 32

        // Multi-rate padding: append 0x01, pad with zeros, set last byte's high bit
        var padded = [UInt8](data)
        padded.append(0x01) // Keccak domain separator (NOT 0x06 as in SHA3)
        while padded.count % rate != 0 {
            padded.append(0x00)
        }
        padded[padded.count - 1] |= 0x80

        // Initialize 5×5 state matrix (25 lanes × 64 bits)
        var state = [UInt64](repeating: 0, count: 25)

        // Absorb phase
        for chunkStart in stride(from: 0, to: padded.count, by: rate) {
            let chunk = Array(padded[chunkStart..<chunkStart + rate])
            for i in 0..<(rate / 8) {
                var lane = UInt64(0)
                for j in 0..<8 {
                    lane |= UInt64(chunk[i * 8 + j]) << UInt64(8 * j)
                }
                state[i] ^= lane
            }
            keccakF1600(&state)
        }

        // Squeeze phase
        var output = [UInt8]()
        output.reserveCapacity(outputLength)
        while output.count < outputLength {
            for i in 0..<(rate / 8) {
                let lane = state[i]
                for j in 0..<8 {
                    if output.count < outputLength {
                        output.append(UInt8((lane >> UInt64(8 * j)) & 0xFF))
                    }
                }
            }
            if output.count < outputLength {
                keccakF1600(&state)
            }
        }

        return output
    }

    // MARK: - Keccak-f[1600] permutation (24 rounds)

    private static func keccakF1600(_ state: inout [UInt64]) {
        for round in 0..<24 {
            // θ (theta) step
            var c = [UInt64](repeating: 0, count: 5)
            for x in 0..<5 {
                c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20]
            }
            var d = [UInt64](repeating: 0, count: 5)
            for x in 0..<5 {
                d[x] = c[(x + 4) % 5] ^ ((c[(x + 1) % 5] << 1) | (c[(x + 1) % 5] >> 63))
            }
            for x in 0..<5 {
                for y in 0..<5 {
                    state[x + 5 * y] ^= d[x]
                }
            }

            // ρ (rho) and π (pi) steps
            var b = [UInt64](repeating: 0, count: 25)
            for x in 0..<5 {
                for y in 0..<5 {
                    let rot = rotationOffsets[x][y]
                    let val = state[x + 5 * y]
                    let rotated = rot == 0 ? val : (val << rot) | (val >> (64 - rot))
                    b[y + 5 * ((2 * x + 3 * y) % 5)] = rotated
                }
            }

            // χ (chi) step
            for x in 0..<5 {
                for y in 0..<5 {
                    state[x + 5 * y] = b[x + 5 * y] ^ ((~b[(x + 1) % 5 + 5 * y]) & b[(x + 2) % 5 + 5 * y])
                }
            }

            // ι (iota) step
            state[0] ^= roundConstants[round]
        }
    }
}
