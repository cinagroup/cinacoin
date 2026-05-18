import { useState, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Inline QR code placeholder component
// Renders a simple visual placeholder. Replace with `qrcode.react` in production.
// ---------------------------------------------------------------------------

function QRCodePlaceholder({ data }: { data: string }) {
  // Simple visual grid to simulate a QR code appearance
  const seed = data.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const gridSize = 21;
  const cells: boolean[] = [];

  for (let i = 0; i < gridSize * gridSize; i++) {
    // Deterministic pseudo-random from the data
    const v = ((seed * (i + 1) * 7) % 100);
    // Finder patterns (top-left, top-right, bottom-left)
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    const isFinderTL = row < 7 && col < 7;
    const isFinderTR = row < 7 && col >= gridSize - 7;
    const isFinderBL = row >= gridSize - 7 && col < 7;
    const isFinder = isFinderTL || isFinderTR || isFinderBL;

    if (isFinder) {
      // Draw finder pattern borders
      
      const edge = row === 0 || row === 6 || col === 0 || col === 6 ||
                   (row < 7 && (col >= gridSize - 7) && (col === gridSize - 7 || col === gridSize - 1 || row === 0 || row === 6));
      const inner = row >= 2 && row <= 4 && col >= 2 && col <= 4;
      cells.push(edge || inner);
      continue;
    }
    cells.push(v > 45);
  }

  return (
    <div className="inline-grid bg-white p-2 rounded-xl" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: "200px", height: "200px" }}>
      {cells.map((filled, i) => (
        <div key={i} className={filled ? "bg-black" : "bg-white"} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ReceivePageProps {
  walletAddress?: string;
  /** Override the QR data string */
  qrData?: string;
}

/**
 * Receive page — display a QR code and address for receiving funds.
 *
 * Features:
 * - QR code display
 * - Address copy button
 * - Share link
 */
export function ReceivePage({ walletAddress = "0x0000000000000000000000000000000000000000", qrData }: ReceivePageProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayAddress = walletAddress;
  const displayQrData = qrData ?? displayAddress;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = displayAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [displayAddress]);

  const handleShare = useCallback(() => {
    const shareUrl = `https://example.com/send?to=${encodeURIComponent(displayAddress)}`;
    if (navigator.share) {
      navigator.share({ title: "Send me crypto", text: displayAddress, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  }, [displayAddress]);

  // Truncated address for display
  const shortAddress = `${displayAddress.slice(0, 6)}…${displayAddress.slice(-4)}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] max-w-md mx-auto rounded-2xl bg-white/5 p-8 backdrop-blur">
      <h2 className="text-xl font-bold text-white mb-2">Receive</h2>
      <p className="text-gray-400 text-sm mb-6">
        Share this address or scan the QR code to receive funds
      </p>

      {/* QR Code */}
      <div className="mb-6">
        <QRCodePlaceholder data={displayQrData} />
      </div>

      {/* Address */}
      <div className="w-full bg-black/20 rounded-xl p-3 mb-4">
        <p className="text-gray-400 text-xs mb-1">Your Address</p>
        <code className="text-white text-sm break-all">{shortAddress}</code>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full">
        <button
          onClick={handleCopy}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
            copied
              ? "bg-green-600 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Copy
            </>
          )}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 py-3 rounded-xl font-medium bg-black/20 text-gray-300 hover:bg-black/30 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342A8.889 8.889 0 0119 12a8.889 8.889 0 0110.316-1.342M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Share
        </button>
      </div>
    </div>
  );
}
