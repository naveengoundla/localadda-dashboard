import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  getAdminBanners, createBanner, updateBanner, deleteBanner, getBannerPresign,
  getCities, type AdminBanner, type CityOption,
} from '../../api/admin';
import { compressImage } from '../../lib/compressImage';

type Form = {
  cityId: string; title: string; subtitle: string; imageUrl: string;
  linkUrl: string; active: boolean; sortOrder: string; startAt: string; endAt: string;
};
const EMPTY: Form = {
  cityId: '', title: '', subtitle: '', imageUrl: '',
  linkUrl: '', active: true, sortOrder: '0', startAt: '', endAt: '',
};

export default function BannersPage() {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const imgRef = useRef<HTMLInputElement>(null);

  const cityName = (id: string | null) =>
    id ? (cities.find(c => c.id === id)?.name ?? 'Unknown') : 'All cities';

  async function load() {
    const [b, c] = await Promise.all([getAdminBanners(), getCities()]);
    setBanners(b.data);
    setCities(c.data);
  }
  useEffect(() => { load(); }, []);

  function startEdit(b: AdminBanner) {
    setEditId(b.id);
    setForm({
      cityId: b.cityId ?? '',
      title: b.title,
      subtitle: b.subtitle ?? '',
      imageUrl: b.imageUrl ?? '',
      linkUrl: b.linkUrl ?? '',
      active: b.active,
      sortOrder: String(b.sortOrder),
      startAt: b.startAt ? b.startAt.slice(0, 16) : '',
      endAt: b.endAt ? b.endAt.slice(0, 16) : '',
    });
  }
  function cancel() { setEditId(null); setForm(EMPTY); }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true); setMsg('');
    try {
      const { blob, ext, contentType } = await compressImage(file, 1600);
      const { data } = await getBannerPresign(ext);
      await axios.put(data.uploadUrl, blob, {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000' },
      });
      setForm(f => ({ ...f, imageUrl: data.publicUrl }));
      setMsg('✅ Image uploaded');
    } catch {
      setMsg('❌ Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setMsg('Title is required'); return; }
    setSaving(true); setMsg('');
    const payload = {
      cityId: form.cityId || null,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      imageUrl: form.imageUrl || undefined,
      linkUrl: form.linkUrl.trim() || undefined,
      active: form.active,
      sortOrder: Number(form.sortOrder) || 0,
      startAt: form.startAt || null,
      endAt: form.endAt || null,
    };
    try {
      if (editId) await updateBanner(editId, payload);
      else await createBanner(payload);
      await load();
      setMsg(editId ? '✅ Banner updated' : '✅ Banner created');
      cancel();
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.error || 'Save failed'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this banner?')) return;
    try { await deleteBanner(id); await load(); setMsg('✅ Deleted'); }
    catch { setMsg('❌ Delete failed'); }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>🖼️ Homepage Banners</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
        Hero banners shown on city home pages. Leave city as “All cities” for a global banner.
      </p>

      {/* Form */}
      <form onSubmit={save} className="card" style={{ marginBottom: 24, borderColor: editId ? '#e8401c' : undefined }}>
        <h3 style={{ fontWeight: 800, marginBottom: 14 }}>{editId ? '✏️ Edit banner' : '+ New banner'}</h3>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="label">City</label>
            <select className="input" value={form.cityId} onChange={e => setForm(f => ({ ...f, cityId: e.target.value }))}>
              <option value="">All cities (global)</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ width: 110 }}>
            <label className="label">Sort order</label>
            <input className="input" type="number" value={form.sortOrder}
              onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="label">Title *</label>
          <input className="input" placeholder="Vikarabad" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="label">Subtitle</label>
          <input className="input" placeholder="Gateway to Nallamalla" value={form.subtitle}
            onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="label">Link URL (optional)</label>
          <input className="input" placeholder="/vikarabad/grocery" value={form.linkUrl}
            onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="label">Background image</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {form.imageUrl && <img src={form.imageUrl} alt="" style={{ width: 120, height: 56, objectFit: 'cover', borderRadius: 8 }} />}
            <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImageUpload} />
            <button type="button" className="btn-secondary" style={{ fontSize: 13, padding: '6px 14px' }}
              onClick={() => imgRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : form.imageUrl ? '🔄 Change' : '📤 Upload'}
            </button>
            {form.imageUrl && (
              <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                style={{ border: 'none', background: 'transparent', color: '#e8401c', cursor: 'pointer', fontSize: 13 }}>Remove</button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="label">Start (optional)</label>
            <input className="input" type="datetime-local" value={form.startAt}
              onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="label">End (optional)</label>
            <input className="input" type="datetime-local" value={form.endAt}
              onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
          Active
        </label>

        {msg && <p style={{ fontSize: 13, marginBottom: 10, color: msg.startsWith('✅') ? '#27ae60' : '#e8401c' }}>{msg}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : editId ? 'Update banner' : 'Create banner'}
          </button>
          {editId && <button type="button" className="btn-secondary" onClick={cancel}>Cancel</button>}
        </div>
      </form>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {banners.length === 0 && <p style={{ color: '#999', fontSize: 14 }}>No banners yet.</p>}
        {banners.map(b => (
          <div key={b.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12 }}>
            <div style={{ width: 96, height: 54, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
              background: b.imageUrl ? `url(${b.imageUrl}) center/cover` : 'linear-gradient(135deg,#1a1a2e,#0f3460)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{b.title}</div>
              {b.subtitle && <div style={{ fontSize: 12, color: '#777' }}>{b.subtitle}</div>}
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                {cityName(b.cityId)} · order {b.sortOrder} · {b.active ? '🟢 active' : '⚪ inactive'}
                {(b.startAt || b.endAt) && ` · ${b.startAt?.slice(0,10) || '…'} → ${b.endAt?.slice(0,10) || '…'}`}
              </div>
            </div>
            <button className="btn-secondary" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => startEdit(b)}>Edit</button>
            <button onClick={() => remove(b.id)} style={{ border: 'none', background: 'transparent', color: '#e8401c', cursor: 'pointer', fontSize: 18 }}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
