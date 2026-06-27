import { useEffect, useMemo, useState } from 'react';
import { getAdminWaitlist, type WaitlistEntry } from '../../api/admin';

export default function WaitlistPage() {
  const [rows, setRows] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminWaitlist().then(r => setRows(r.data)).finally(() => setLoading(false));
  }, []);

  // Demand by area (drives which city to launch next)
  const byArea = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = (r.area || 'Unknown').trim();
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  if (loading) return <div style={{ padding: 24, color: '#999' }}>Loading…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 820, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>🔔 Waitlist</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
        People asking for LocalAdda in areas you haven’t launched. Launch the areas with the most demand next.
      </p>

      {rows.length === 0 ? (
        <p style={{ color: '#999', fontSize: 14 }}>No signups yet.</p>
      ) : (
        <>
          {/* Demand by area */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 12 }}>Demand by area</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {byArea.map(([area, count]) => (
                <div key={area} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 140, fontSize: 13, fontWeight: 600 }}>{area}</span>
                  <div style={{ flex: 1, background: '#f1f3f6', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / byArea[0][1]) * 100}%`, height: '100%', background: '#e8401c' }} />
                  </div>
                  <span style={{ width: 32, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All signups */}
          <div className="card">
            <h3 style={{ fontWeight: 800, marginBottom: 12 }}>All signups ({rows.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rows.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: '1px solid #f0f0f0', fontSize: 13 }}>
                  <span style={{ flex: 1, fontWeight: 600 }}>{r.contact}</span>
                  <span style={{ width: 150, color: '#777' }}>{r.area || '—'}{r.region ? `, ${r.region}` : ''}</span>
                  <span style={{ width: 90, color: '#aaa', textAlign: 'right' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
