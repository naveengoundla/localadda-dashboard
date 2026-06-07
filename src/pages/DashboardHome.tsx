import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyStore } from '../api/store';
import type { Store } from '../types';

export default function DashboardHome() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyStore()
      .then(r => setStore(r.data))
      .catch(() => setError('Could not load store.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.page}><p style={{ color: '#999' }}>Loading…</p></div>;
  if (error || !store) return (
    <div style={styles.page}>
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ fontSize: 18, marginBottom: 16 }}>No store found</p>
        <Link to="/dashboard/register"><button className="btn-primary" style={{ width: 'auto', padding: '12px 32px' }}>Register Your Store →</button></Link>
      </div>
    </div>
  );

  const activeDiscount = store.discounts.find(d => d.isActive);

  return (
    <div style={styles.page}>
      {/* Store status bar */}
      <div style={{ ...styles.previewBar, background: store.status === 'ACTIVE' ? 'linear-gradient(135deg, #0f3460, #1a1a2e)' : store.status === 'PENDING' ? 'linear-gradient(135deg,#92400e,#78350f)' : 'linear-gradient(135deg,#7f1d1d,#450a0a)' }}>
        <div>
          {store.status === 'ACTIVE' ? (
            <>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Your store is live at</span>
              <span style={{ fontSize: 13, color: '#f5a623', fontFamily: 'monospace' }}>
                localadda.com/{store.city.slug}/{store.category.slug}/{store.slug}
              </span>
            </>
          ) : store.status === 'PENDING' ? (
            <>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 2 }}>⏳ Awaiting admin approval</span>
              <span style={{ fontSize: 13, color: '#fcd34d' }}>Your store will go live once approved. You can still add products and photos now.</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 2 }}>🚫 Store {store.status.toLowerCase()}</span>
              <span style={{ fontSize: 13, color: '#fca5a5' }}>Contact support at admin@localadda.com</span>
            </>
          )}
        </div>
        {store.status === 'ACTIVE' && (
          <a href={`https://localadda.com/${store.city.slug}/${store.category.slug}/${store.slug}`} target="_blank" rel="noreferrer">
            <button style={styles.previewBtn}>👁 View Store</button>
          </a>
        )}
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.sub}>{store.name} · {store.city.name}</p>
        </div>
        <Link to="/dashboard/products">
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 22px', fontSize: 14 }}>+ Add Product</button>
        </Link>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { icon: '📦', label: 'Products Listed', value: store.items.length, hint: store.items.length < 5 ? 'Add more to rank higher' : 'Good listing!' },
          { icon: '🎉', label: 'Active Discount', value: activeDiscount ? '1' : '0', hint: activeDiscount ? activeDiscount.valueLabel || 'Active' : 'No discount set' },
          { icon: '🖼️', label: 'Photos', value: (store.galleryUrls?.length || 0) + (store.bannerUrl ? 1 : 0), hint: 'Banner + gallery' },
          { icon: store.status === 'ACTIVE' ? '✅' : '⏳', label: 'Store Status', value: store.status === 'ACTIVE' ? 'Live' : store.status === 'PENDING' ? 'Pending' : store.status, hint: store.status === 'ACTIVE' ? 'Visible to customers' : store.status === 'PENDING' ? 'Awaiting approval' : 'Not visible' },
        ].map(({ icon, label, value, hint }) => (
          <div key={label} className="card" style={styles.statCard}>
            <div style={{ fontSize: 28, float: 'right' }}>{icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 900 }}>{value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{hint}</div>
          </div>
        ))}
      </div>

      {/* Recent items */}
      <div className="card">
        <div style={styles.cardHeader}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>📦 Products</span>
          <Link to="/dashboard/products"><button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>Manage</button></Link>
        </div>
        {store.items.length === 0
          ? <p style={{ color: '#999', fontSize: 14 }}>No products yet. <Link to="/dashboard/products" style={{ color: '#e8401c' }}>Add your first product →</Link></p>
          : store.items.slice(0, 4).map(item => (
            <div key={item.id} style={styles.itemRow}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#e8401c' }}>₹{item.price}</span>
              {item.unit && <span style={{ fontSize: 12, color: '#999' }}>/{item.unit}</span>}
            </div>
          ))
        }
      </div>

      {/* Active discount */}
      {activeDiscount && (
        <div style={styles.discountBanner}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🎉 {activeDiscount.title}</div>
            {activeDiscount.description && <div style={{ fontSize: 13, opacity: 0.85 }}>{activeDiscount.description}</div>}
            {activeDiscount.validUntil && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Valid until: {activeDiscount.validUntil}</div>}
          </div>
          <span style={{ background: 'rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 20, fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>
            {activeDiscount.valueLabel}
          </span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 900, margin: '0 auto' },
  previewBar: { background: 'linear-gradient(135deg, #0f3460, #1a1a2e)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  previewBtn: { background: '#e8401c', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 900 },
  sub: { fontSize: 14, color: '#888', marginTop: 2 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 },
  statCard: { overflow: 'hidden', position: 'relative' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  itemRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
  discountBanner: { background: 'linear-gradient(135deg, #e8401c, #f5a623)', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', gap: 16 },
};
