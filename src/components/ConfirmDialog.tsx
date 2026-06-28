type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Styled confirmation modal — replaces native confirm() for destructive actions. */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', busy = false, danger = true, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(17,17,30,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 14, padding: 22, maxWidth: 380, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
      >
        <h3 style={{ fontWeight: 800, fontSize: 17, color: '#1a1a2e', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.55, marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={busy}
            style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid #ddd', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy}
            style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: danger ? '#e8401c' : '#1a1a2e', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
