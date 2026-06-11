import { Send, Download, RefreshCw } from 'lucide-react';

interface QuickActionsProps {
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
  disabled?: boolean;
}

export default function QuickActions({ onSend, onReceive, onSwap, disabled }: QuickActionsProps) {
  return (
    <div className="quick-actions" role="group" aria-label="Quick actions">
      <button className="quick-action-btn" onClick={onSend} disabled={disabled} aria-label="Send tokens">
        <span className="quick-action-icon" aria-hidden="true"><Send className="w-5 h-5" /></span>
        <span className="quick-action-label">Send.</span>
      </button>
      <button className="quick-action-btn" onClick={onReceive} disabled={disabled} aria-label="Receive tokens">
        <span className="quick-action-icon" aria-hidden="true"><Download className="w-5 h-5" /></span>
        <span className="quick-action-label">Receive.</span>
      </button>
      <button className="quick-action-btn" onClick={onSwap} disabled={disabled} aria-label="Swap tokens">
        <span className="quick-action-icon" aria-hidden="true"><RefreshCw className="w-5 h-5" /></span>
        <span className="quick-action-label">Swap.</span>
      </button>
    </div>
  );
}
