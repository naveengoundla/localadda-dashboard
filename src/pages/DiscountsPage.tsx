import { useEffect, useState } from 'react';
import { getMyStore, setDiscount, removeDiscount } from '../api/store';
import type { StoreDiscount } from '../types';

type Form = { title: string; description: string; valueLabel: string; validFrom: string; validUntil: string };
const EMPTY: Form = { title: '', description: '', valueLabel: '', validFrom: '', validUntil: '' };

export default function DiscountsPage() {
  const [active, setActive] = useState<StoreDiscount | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getMyStore().then(r => {
      const d = r.data.discounts.find(d => d.isActive);
      setActive(d || null);
      if (d) setForm({ title: d.title, description: d.description || '', valueLabel: d.valueLabel || '', validFrom: d.validFrom || '', validUntil: d.validUntil || '' });
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true); setMsg('');
    try {
      const res = await setDiscount({ title: form.title, description: form.description || null, valueLabel: form.valueLabel || null, validFrom: form.validFrom || null, validUntil: form.validUntil || null });
      setActive(res.data);
      setEditing(false);
      setMsg('✅ Discount saved! Your store page is updating…');
    } catch (err: any) { setMsg('❌ ' + (err.response?.data?.error || 'Failed')); }
    finally { setSaving(false); }
  }

  async function handleRemove() {
    if (!confirm('Remove the active discount?')) return;
    try {
      await removeDiscount();
      setActive(null);
      setForm(EMPTY);
      setMsg('✅ Discount removed');
    } catch { setMsg('❌ Failed to remove'); }
  }

  return (
    <div className="page-pad" style={{ padding: 32, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>🎉 Discounts</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>Only one active discount at a time. It shows as a badge on your store listing.</p>

      {/* Active discount display */}
      {active && !editing && (
        <div style={{ background: 'linear-gradient(135deg, #e8401c, #f5a623)', borderRadius: 16, padding: '24px 28px', color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>ACTIVE DISCOUNT</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{active.title}</div>
            {active.description && <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>{active.description}</div>}
            {active.validUntil && <div style={{ fontSize: 12, opacity: 0.7 }}>Valid until: {active.validUntil}</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {active.valueLabel && <div style={{ background: 'rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 20, fontWeight: 800, fontSize: 16, marginBottom: 10 }}>{active.valueLabel}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditing(true)} style={{ background: '#fff', color: '#e8401c', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>Edit</button>
              <button onClick={handleRemove} style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {(!active || editing) && (
        <div className="card">
          <h3 style={{ fontWeight: 800, marginBottom: 16 }}>{active ? 'Edit Discount' : 'Create Discount'}</h3>
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Title *</label>
              <input className="input" placeholder="e.g. Weekend Special — 20% Off on All Pulses" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="label">Discount Label</label>
                <input className="input" placeholder="e.g. 20% OFF / Buy 1 Get 1" value={form.valueLabel} onChange={e => setForm(f => ({ ...f, valueLabel: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="e.g. On purchases above ₹500" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Valid From</label>
                <input className="input" type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
              </div>
              <div>
                <label className="label">Valid Until</label>
                <input className="input" type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
              </div>
            </div>
            {msg && <p style={{ fontSize: 13, color: msg.startsWith('✅') ? '#27ae60' : '#e8401c', marginBottom: 12 }}>{msg}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" type="submit" disabled={saving} style={{ width: 'auto', padding: '10px 24px' }}>{saving ? 'Saving…' : 'Save Discount'}</button>
              {editing && <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>}
            </div>
          </form>
        </div>
      )}
      {msg && !editing && <p style={{ fontSize: 13, color: msg.startsWith('✅') ? '#27ae60' : '#e8401c', marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
