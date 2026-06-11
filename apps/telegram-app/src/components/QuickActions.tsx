import { Send, Download, RefreshCw } from 'lucide-react';

interface QuickActionsProps {
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
  disabled?: boolean;
}

export default function QuickActions({ onSend, onReceive, onSwap, disabled }: QuickActionsProps) {
  return (
    <div className="quick-actions">
      <button className="quick-action-btn" onClick={onSend} disabled={disabled}>
        <span className="quick-action-icon"><Send className="w-5 h-5" /></span>
        <span className="quick-action-label">Send</span>
      </button>
      <button className="quick-action-btn" onClick={onReceive} disabled={disabled}>
        <span className="quick-action-icon"><Download className="w-5 h-5" /></span>
        <span className="quick-action-label">Receive</span>
      </button>
      <button className="quick-action-btn" onClick={onSwap} disabled={disabled}>
        <span className="quick-action-icon"><RefreshCw className="w-5 h-5" /></span>
        <span className="quick-action-label">Swap</span>
      </button>
    </div>
  );
}
