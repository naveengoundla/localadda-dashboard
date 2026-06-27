import { useEffect, useState } from 'react';
import { getMyStore, updateStore } from '../api/store';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', address: '', mapsUrl: '', description: '', latitude: '', longitude: '' });
  const [hours, setHours] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getMyStore().then(r => {
      const s = r.data;
      setForm({
        name: s.name || '', phone: s.phone || '', address: s.address || '',
        mapsUrl: s.mapsUrl || '', description: s.description || '',
        latitude: s.latitude != null ? String(s.latitude) : '',
        longitude: s.longitude != null ? String(s.longitude) : '',
      });
      setHours(s.hours || {});
    });
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) { setMsg('❌ Location not supported on this device'); return; }
    setLocating(true); setMsg('📍 Getting your location…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        setMsg('✅ Location captured — tap Save to apply');
      },
      err => { setLocating(false); setMsg('❌ Could not get location: ' + err.message); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await updateStore({
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        hours,
      });
      setMsg('✅ Contact details saved! Store page updating…');
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.error || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-pad" style={{ padding: 32, maxWidth: 700, margin: '0 auto' }}>
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
          <div style={{ marginBottom: 14 }}>
            <label className="label">Address</label>
            <textarea className="input" rows={2} style={{ resize: 'none' }} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Shop No., Street, Area, City - PIN" />
          </div>

          {/* Shop location — powers "near me" sorting for customers */}
          <div>
            <label className="label">Shop location (for “near me”)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              <button type="button" className="btn-secondary" style={{ fontSize: 13, padding: '8px 14px' }}
                onClick={useMyLocation} disabled={locating}>
                {locating ? '📍 Getting…' : '📍 Use current location'}
              </button>
              <span style={{ fontSize: 12, color: '#aaa' }}>— or enter manually below</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input className="input" placeholder="Latitude (e.g. 17.337)" value={form.latitude}
                onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} inputMode="decimal" />
              <input className="input" placeholder="Longitude (e.g. 77.904)" value={form.longitude}
                onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} inputMode="decimal" />
            </div>
            <div style={{ fontSize: 11.5, color: '#bbb', marginTop: 5 }}>
              Tip: stand inside your shop and tap “Use current location” for the most accurate pin.
            </div>
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
