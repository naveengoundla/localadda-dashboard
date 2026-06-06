import { useEffect, useState } from 'react';
import { getMyStore, updateStore } from '../api/store';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', address: '', mapsUrl: '', description: '' });
  const [hours, setHours] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getMyStore().then(r => {
      const s = r.data;
      setForm({ name: s.name || '', phone: s.phone || '', address: s.address || '', mapsUrl: s.mapsUrl || '', description: s.description || '' });
      setHours(s.hours || {});
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await updateStore({ ...form, hours });
      setMsg('✅ Contact details saved! Store page updating…');
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.error || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>📍 Contact & Hours</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>This info shows on your store page so customers can reach you.</p>

      <form onSubmit={handleSave}>
        <div className="card">
          <h3 style={{ fontWeight: 800, marginBottom: 16 }}>Store Details</h3>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Store Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Description</label>
            <textarea className="input" rows={3} style={{ resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell customers what you sell…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" placeholder="9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} inputMode="numeric" />
            </div>
            <div>
              <label className="label">Google Maps URL</label>
              <input className="input" placeholder="https://maps.google.com/..." value={form.mapsUrl} onChange={e => setForm(f => ({ ...f, mapsUrl: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} style={{ resize: 'none' }} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Shop No., Street, Area, City - PIN" />
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 800, marginBottom: 4 }}>Store Hours</h3>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Leave blank if closed that day</p>
          {DAYS.map(day => (
            <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ width: 90, fontSize: 13, fontWeight: 600, textTransform: 'capitalize', color: '#555' }}>{day}</span>
              <input className="input" style={{ flex: 1 }} placeholder="e.g. 9am – 9pm" value={hours[day] || ''}
                onChange={e => setHours(h => ({ ...h, [day]: e.target.value }))} />
            </div>
          ))}
        </div>

        {msg && <p style={{ fontSize: 13, color: msg.startsWith('✅') ? '#27ae60' : '#e8401c', marginBottom: 12 }}>{msg}</p>}
        <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 4 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
