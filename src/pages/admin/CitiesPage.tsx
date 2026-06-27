import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  getAdminCities, createCity, updateCity, deleteCity, getCityImagePresign,
  type AdminCity,
} from '../../api/admin';
import { compressImage } from '../../lib/compressImage';

export default function CitiesPage() {
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [slug, setSlug] = useState('');
  const [emoji, setEmoji] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
      await createCity({
        name: name.trim(),
        state: state.trim() || undefined,
        slug: slug.trim() || undefined,
        emoji: emoji.trim() || undefined,
      });
      setName(''); setState(''); setSlug(''); setEmoji('');
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

  async function saveEmoji(c: AdminCity, value: string) {
    if ((c.emoji ?? '') === value.trim()) return;
    try { await updateCity(c.id, { emoji: value.trim() }); await load(); }
    catch (err: any) { setMsg('❌ ' + (err.response?.data?.error || 'Update failed')); }
  }

  async function uploadImage(c: AdminCity, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingId(c.id); setMsg('');
    try {
      const { blob, ext, contentType } = await compressImage(file, 1000);
      const { data } = await getCityImagePresign(ext);
      await axios.put(data.uploadUrl, blob, {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000' },
      });
      await updateCity(c.id, { imageUrl: data.publicUrl });
      await load();
      setMsg('✅ Image updated for ' + c.name);
    } catch {
      setMsg('❌ Image upload failed');
    } finally { setUploadingId(null); }
  }

  async function remove(c: AdminCity) {
    if (!confirm(`Delete ${c.name}? This can't be undone.`)) return;
    try { await deleteCity(c.id); await load(); setMsg('✅ Deleted'); }
    catch (err: any) { setMsg('❌ ' + (err.response?.data?.error || 'Delete failed')); }
  }

  return (
    <div style={{ padding: 24, maxWidth: 820, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>🏙️ Cities</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
        Control rollout — only <strong>published</strong> cities appear on the public site. Set an emoji
        or upload an image; the image is used on the home page if present, else the emoji.
      </p>

      {/* Add form */}
      <form onSubmit={add} className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 14 }}>+ Add city</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 70 }}>
            <label className="label">Emoji</label>
            <input className="input" placeholder="🏙️" value={emoji} onChange={e => setEmoji(e.target.value)} />
          </div>
          <div style={{ flex: 2, minWidth: 150 }}>
            <label className="label">City name *</label>
            <input className="input" placeholder="Vikarabad" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label className="label">State</label>
            <input className="input" placeholder="Telangana" value={state} onChange={e => setState(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label className="label">Slug (optional)</label>
            <input className="input" placeholder="auto" value={slug} onChange={e => setSlug(e.target.value)} />
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
            {/* image or emoji preview */}
            <div style={{
              width: 48, height: 48, borderRadius: 10, flexShrink: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 24, overflow: 'hidden',
              background: c.imageUrl ? `url(${c.imageUrl}) center/cover` : '#f1f3f6',
            }}>
              {!c.imageUrl && (c.emoji || '🏙️')}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>
                {c.name} {c.published
                  ? <span style={{ fontSize: 11, color: '#27ae60' }}>🟢 live</span>
                  : <span style={{ fontSize: 11, color: '#aaa' }}>⚪ draft</span>}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>{c.state || '—'} · /{c.slug}</div>
            </div>

            <input
              className="input"
              style={{ width: 56, textAlign: 'center', padding: '6px 4px' }}
              defaultValue={c.emoji ?? ''}
              placeholder="🏙️"
              title="Emoji"
              onBlur={e => saveEmoji(c, e.target.value)}
            />
            <input ref={el => { fileRefs.current[c.id] = el; }} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }} onChange={e => uploadImage(c, e)} />
            <button className="btn-secondary" style={{ fontSize: 12.5, padding: '6px 10px' }}
              onClick={() => fileRefs.current[c.id]?.click()} disabled={uploadingId === c.id}>
              {uploadingId === c.id ? '…' : c.imageUrl ? '🔄 Img' : '📤 Img'}
            </button>
            <button className="btn-secondary" style={{ fontSize: 12.5, padding: '6px 10px' }} onClick={() => togglePublish(c)}>
              {c.published ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={() => remove(c)} style={{ border: 'none', background: 'transparent', color: '#e8401c', cursor: 'pointer', fontSize: 18 }}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
