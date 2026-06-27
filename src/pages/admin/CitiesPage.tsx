import { useEffect, useState } from 'react';
import { getAdminCities, createCity, updateCity, deleteCity, type AdminCity } from '../../api/admin';

export default function CitiesPage() {
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const { data } = await getAdminCities();
    setCities(data);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setMsg('City name is required'); return; }
    setBusy(true); setMsg('');
    try {
      await createCity({ name: name.trim(), state: state.trim() || undefined, slug: slug.trim() || undefined });
      setName(''); setState(''); setSlug('');
      await load();
      setMsg('✅ City added');
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.error || 'Could not add city'));
    } finally { setBusy(false); }
  }

  async function togglePublish(c: AdminCity) {
    try { await updateCity(c.id, { published: !c.published }); await load(); }
    catch (err: any) { setMsg('❌ ' + (err.response?.data?.error || 'Update failed')); }
  }

  async function remove(c: AdminCity) {
    if (!confirm(`Delete ${c.name}? This can't be undone.`)) return;
    try { await deleteCity(c.id); await load(); setMsg('✅ Deleted'); }
    catch (err: any) { setMsg('❌ ' + (err.response?.data?.error || 'Delete failed')); }
  }

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>🏙️ Cities</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
        Control rollout — only <strong>published</strong> cities appear on the public site. Add a city,
        set it up, then publish when you’re ready to launch it.
      </p>

      {/* Add form */}
      <form onSubmit={add} className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 14 }}>+ Add city</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label className="label">City name *</label>
            <input className="input" placeholder="Vikarabad" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label className="label">State</label>
            <input className="input" placeholder="Telangana" value={state} onChange={e => setState(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label className="label">Slug (optional)</label>
            <input className="input" placeholder="auto from name" value={slug}
              onChange={e => setSlug(e.target.value)} />
          </div>
        </div>
        {msg && <p style={{ fontSize: 13, marginTop: 10, color: msg.startsWith('✅') ? '#27ae60' : '#e8401c' }}>{msg}</p>}
        <button className="btn-primary" type="submit" disabled={busy} style={{ marginTop: 14 }}>
          {busy ? 'Adding…' : 'Add city'}
        </button>
      </form>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cities.map(c => (
          <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>
                {c.name} {c.published
                  ? <span style={{ fontSize: 11, color: '#27ae60' }}>🟢 live</span>
                  : <span style={{ fontSize: 11, color: '#aaa' }}>⚪ draft</span>}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>{c.state || '—'} · /{c.slug}</div>
            </div>
            <button className="btn-secondary" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => togglePublish(c)}>
              {c.published ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={() => remove(c)} style={{ border: 'none', background: 'transparent', color: '#e8401c', cursor: 'pointer', fontSize: 18 }}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
