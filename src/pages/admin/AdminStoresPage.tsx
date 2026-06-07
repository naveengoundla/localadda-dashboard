import React, { useEffect, useState } from 'react';
import { getStores, approveStore, rejectStore, suspendStore, reinstateStore, type AdminStore } from '../../api/admin';

const STATUS_TABS = [
  { label: 'Pending', status: 'PENDING', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Active', status: 'ACTIVE', color: '#10b981', bg: '#ecfdf5' },
  { label: 'Rejected', status: 'REJECTED', color: '#ef4444', bg: '#fef2f2' },
  { label: 'Suspended', status: 'SUSPENDED', color: '#6b7280', bg: '#f9fafb' },
];

export default function AdminStoresPage() {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, [activeTab]);

  async function load() {
    setLoading(true);
    try {
      const res = await getStores(activeTab);
      setStores(res.data);
    } catch {
      showToast('Failed to load stores', false);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function doAction(id: string, action: 'approve' | 'reject' | 'suspend' | 'reinstate') {
    setActionLoading(id + action);
    try {
      if (action === 'approve')   await approveStore(id);
      if (action === 'reject')    await rejectStore(id);
      if (action === 'suspend')   await suspendStore(id);
      if (action === 'reinstate') await reinstateStore(id);
      showToast(`Store ${action}d successfully`, true);
      load(); // refresh list
    } catch (err: any) {
      showToast(err.response?.data?.error || `Failed to ${action} store`, false);
    } finally {
      setActionLoading(null);
    }
  }

  const tab = STATUS_TABS.find(t => t.status === activeTab)!;

  return (
    <div>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Store Moderation</h1>
        <span style={s.count}>{stores.length} store{stores.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Status tabs */}
      <div style={s.tabs}>
        {STATUS_TABS.map(t => (
          <button
            key={t.status}
            onClick={() => setActiveTab(t.status)}
            style={{
              ...s.tab,
              ...(activeTab === t.status ? { ...s.tabActive, color: t.color, borderBottomColor: t.color } : {}),
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block', marginRight: 7 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : stores.length === 0 ? (
        <div style={s.empty}>No {activeTab.toLowerCase()} stores</div>
      ) : (
        <div style={s.grid}>
          {stores.map(store => (
            <StoreCard
              key={store.id}
              store={store}
              tab={tab}
              actionLoading={actionLoading}
              onAction={doAction}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? '#10b981' : '#ef4444' }}>
          {toast.ok ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  );
}

function StoreCard({ store, tab, actionLoading, onAction }: {
  store: AdminStore;
  tab: typeof STATUS_TABS[0];
  actionLoading: string | null;
  onAction: (id: string, action: 'approve' | 'reject' | 'suspend' | 'reinstate') => void;
}) {
  const busy = (a: string) => actionLoading === store.id + a;

  return (
    <div style={s.card}>
      {/* Status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ ...s.badge, color: tab.color, background: tab.bg }}>
          {store.status}
        </span>
        <span style={s.date}>{new Date(store.createdAt).toLocaleDateString('en-IN')}</span>
      </div>

      {/* Store info */}
      <div style={s.storeName}>{store.category?.emoji} {store.name}</div>
      <div style={s.meta}>{store.city?.name}, {store.city?.state}</div>
      <div style={s.meta}>Category: {store.category?.name}</div>
      {store.phone && <div style={s.meta}>📞 {store.phone}</div>}
      {store.address && <div style={{ ...s.meta, marginBottom: 4 }}>📍 {store.address}</div>}
      <div style={s.ownerRow}>Owner phone: <strong>+91 {store.owner?.phone}</strong></div>

      {/* Slug link (if active) */}
      {store.status === 'ACTIVE' && (
        <a
          href={`https://localadda.com/${store.city?.slug}/${store.category?.slug}/${store.slug}`}
          target="_blank"
          rel="noreferrer"
          style={s.link}
        >
          View live page →
        </a>
      )}

      {/* Action buttons */}
      <div style={s.actions}>
        {store.status === 'PENDING' && (
          <>
            <ActionBtn label="Approve" color="#10b981" busy={busy('approve')} onClick={() => onAction(store.id, 'approve')} />
            <ActionBtn label="Reject" color="#ef4444" busy={busy('reject')} onClick={() => onAction(store.id, 'reject')} />
          </>
        )}
        {store.status === 'ACTIVE' && (
          <ActionBtn label="Suspend" color="#6b7280" busy={busy('suspend')} onClick={() => onAction(store.id, 'suspend')} />
        )}
        {(store.status === 'SUSPENDED' || store.status === 'REJECTED') && (
          <ActionBtn label="Reinstate" color="#10b981" busy={busy('reinstate')} onClick={() => onAction(store.id, 'reinstate')} />
        )}
      </div>
    </div>
  );
}

function ActionBtn({ label, color, busy, onClick }: {
  label: string; color: string; busy: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        background: busy ? '#ccc' : color,
        color: '#fff', border: 'none', borderRadius: 7,
        padding: '8px 18px', fontSize: 13, fontWeight: 700,
        cursor: busy ? 'not-allowed' : 'pointer',
      }}
    >
      {busy ? '…' : label}
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  count: { background: '#e8401c', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: 13, fontWeight: 700 },
  tabs: { display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', marginBottom: 24 },
  tab: { padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#6b7280', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', marginBottom: -2 },
  tabActive: { color: '#1a1a2e', borderBottomColor: '#1a1a2e' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  badge: { fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: 0.5, textTransform: 'uppercase' },
  date: { fontSize: 12, color: '#aaa' },
  storeName: { fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 },
  meta: { fontSize: 13, color: '#666', marginBottom: 2 },
  ownerRow: { fontSize: 12, color: '#888', margin: '8px 0 12px', paddingTop: 8, borderTop: '1px solid #f0f0f0' },
  link: { display: 'block', fontSize: 12, color: '#e8401c', textDecoration: 'none', marginBottom: 12 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  empty: { textAlign: 'center', color: '#aaa', padding: '60px 0', fontSize: 15 },
  toast: { position: 'fixed', bottom: 28, right: 28, color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 9999 },
};
