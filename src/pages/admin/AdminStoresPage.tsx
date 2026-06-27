import React, { useEffect, useState } from 'react';
import { getStores, approveStore, rejectStore, suspendStore, reinstateStore, setStoreLocation, type AdminStore } from '../../api/admin';

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
  const [cityFilter, setCityFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');

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

  // Filter options derived from the loaded stores (current status tab)
  const cityOpts = Array.from(new Map(stores.map(s => [s.city.slug, s.city.name])).entries())
    .sort((a, b) => a[1].localeCompare(b[1]));
  const catOpts = Array.from(new Map(stores.map(s => [s.category.slug, s.category.name])).entries())
    .sort((a, b) => a[1].localeCompare(b[1]));

  const filtered = stores.filter(s =>
    (!cityFilter || s.city.slug === cityFilter) &&
    (!catFilter || s.category.slug === catFilter));

  return (
    <div>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Store Moderation</h1>
        <span style={s.count}>{filtered.length} store{filtered.length !== 1 ? 's' : ''}</span>
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

      {/* City / Category filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0' }}>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={s.filterSelect}>
          <option value="">All cities</option>
          {cityOpts.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={s.filterSelect}>
          <option value="">All categories</option>
          {catOpts.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
        </select>
        {(cityFilter || catFilter) && (
          <button onClick={() => { setCityFilter(''); setCatFilter(''); }} style={s.filterClear}>Clear</button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>No {activeTab.toLowerCase()} stores{(cityFilter || catFilter) ? ' match the filters' : ''}</div>
      ) : (
        <div style={s.grid}>
          {filtered.map(store => (
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
  const [lat, setLat] = useState(store.latitude != null ? String(store.latitude) : '');
  const [lng, setLng] = useState(store.longitude != null ? String(store.longitude) : '');
  const [savingLoc, setSavingLoc] = useState(false);
  const [locMsg, setLocMsg] = useState('');

  async function saveLoc() {
    setSavingLoc(true); setLocMsg('');
    try {
      await setStoreLocation(store.id, lat ? parseFloat(lat) : null, lng ? parseFloat(lng) : null);
      setLocMsg('✅ Saved');
    } catch { setLocMsg('❌ Failed'); }
    finally { setSavingLoc(false); }
  }
  function useHere() {
    if (!navigator.geolocation) { setLocMsg('No location support'); return; }
    setLocMsg('📍 getting…');
    navigator.geolocation.getCurrentPosition(
      p => { setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6)); setLocMsg('📍 captured — tap Save'); },
      e => setLocMsg('❌ ' + e.message),
      { enableHighAccuracy: true, timeout: 10000 });
  }

  const locInput: React.CSSProperties = { width: 92, padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12 };
  const miniBtn: React.CSSProperties = { padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer' };

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

      {/* Location editor */}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
          📍 Location {store.latitude != null ? '· set' : '· not set'}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={locInput} value={lat} onChange={e => setLat(e.target.value)} placeholder="latitude" inputMode="decimal" />
          <input style={locInput} value={lng} onChange={e => setLng(e.target.value)} placeholder="longitude" inputMode="decimal" />
          <button type="button" style={miniBtn} onClick={useHere} title="Use my current location">📍 Here</button>
          <button type="button" style={{ ...miniBtn, background: '#1a1a2e', color: '#fff', border: 'none' }} onClick={saveLoc} disabled={savingLoc}>
            {savingLoc ? '…' : 'Save'}
          </button>
        </div>
        {locMsg && <div style={{ fontSize: 11, marginTop: 5, color: locMsg.startsWith('✅') || locMsg.startsWith('📍') ? '#10b981' : '#ef4444' }}>{locMsg}</div>}
      </div>

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
  filterSelect: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#fff', cursor: 'pointer' },
  filterClear: { padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: '#e8401c', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  toast: { position: 'fixed', bottom: 28, right: 28, color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 9999 },
};
