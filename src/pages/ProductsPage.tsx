import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getMyStore, addItem, updateItem, deleteItem, getItemImagePresign } from '../api/store';
import type { Store, StoreItem } from '../types';

type Form = { name: string; price: string; unit: string; isFeatured: boolean; imageUrl: string };
const EMPTY: Form = { name: '', price: '', unit: '', isFeatured: false, imageUrl: '' };

export default function ProductsPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    getMyStore().then(r => setStore(r.data)).finally(() => setLoading(false));
  }, []);

  function startEdit(item: StoreItem) {
    setEditId(item.id);
    setForm({ name: item.name, price: String(item.price), unit: item.unit || '', isFeatured: item.isFeatured, imageUrl: item.imageUrl || '' });
  }

  function cancelEdit() { setEditId(null); setForm(EMPTY); }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // Need a saved item ID to associate the image — if adding new, save first
    if (!editId) {
      setMsg('⚠️ Save the product first, then add a photo.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    setUploading(true); setMsg('');
    try {
      const { data } = await getItemImagePresign(editId, ext);
      await axios.put(data.uploadUrl, file, {
        headers: { 'Content-Type': file.type, 'Cache-Control': 'public, max-age=31536000' },
      });
      setForm(f => ({ ...f, imageUrl: data.publicUrl }));
      setMsg('✅ Photo uploaded — click Update Product to save.');
    } catch {
      setMsg('❌ Photo upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true); setMsg('');
    try {
      const payload = {
        name: form.name,
        price: parseFloat(form.price),
        unit: form.unit || null,
        isFeatured: form.isFeatured,
        imageUrl: form.imageUrl || null,
      };
      const res = editId
        ? await updateItem(editId, payload)
        : await addItem(payload);
      setStore(prev => {
        if (!prev) return prev;
        const items = editId
          ? prev.items.map(i => i.id === editId ? res.data : i)
          : [...prev.items, res.data];
        return { ...prev, items };
      });
      setMsg(editId ? '✅ Product updated' : '✅ Product added — edit it to add a photo.');
      cancelEdit();
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.error || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteItem(id);
      setStore(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== id) } : prev);
      setMsg('✅ Product deleted');
    } catch { setMsg('❌ Failed to delete'); }
  }

  if (loading) return <div className="page-pad" style={{ padding: 32 }}><p style={{ color: '#999' }}>Loading…</p></div>;

  return (
    <div className="page-pad" style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>📦 Products</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>Add the items you sell with prices. Customers see these on your store page.</p>

      {/* Add / Edit form */}
      <div className="card" style={{ borderColor: editId ? '#e8401c' : undefined }}>
        <h3 style={{ fontWeight: 800, marginBottom: 16 }}>{editId ? '✏️ Edit Product' : '+ Add Product'}</h3>
        <form onSubmit={handleSave}>
          {/* Name / Price / Unit row */}
          <div style={styles.formRow}>
            <div style={{ flex: 2 }}>
              <label className="label">Product Name *</label>
              <input className="input" placeholder="e.g. Fresh Tomatoes" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Price (₹) *</label>
              <input className="input" type="number" placeholder="30" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} min="0" step="0.5" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Unit</label>
              <input className="input" placeholder="per kg / piece" value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>

          {/* Photo upload — only when editing */}
          {editId && (
            <div style={styles.photoRow}>
              <div style={{ flex: 1 }}>
                <label className="label">Product Photo</label>
                {form.imageUrl ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={form.imageUrl} alt="Product" style={styles.photoPreview} />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                      style={styles.removePhotoBtn}
                    >✕</button>
                  </div>
                ) : (
                  <div style={styles.photoPlaceholder} onClick={() => imgRef.current?.click()}>
                    <span style={{ fontSize: 28 }}>📷</span>
                    <span style={{ fontSize: 13, color: '#999' }}>
                      {uploading ? 'Uploading…' : 'Click to upload'}
                    </span>
                  </div>
                )}
                <input
                  ref={imgRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                {!form.imageUrl && !uploading && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginTop: 8, padding: '6px 14px', fontSize: 13 }}
                    onClick={() => imgRef.current?.click()}
                    disabled={uploading}
                  >
                    📤 Upload Photo
                  </button>
                )}
                {form.imageUrl && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginTop: 8, padding: '6px 14px', fontSize: 13, display: 'block' }}
                    onClick={() => imgRef.current?.click()}
                    disabled={uploading}
                  >
                    🔄 Change Photo
                  </button>
                )}
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>JPG, PNG or WebP · Max 5MB</div>
              </div>
            </div>
          )}

          {!editId && (
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
              💡 Save the product first, then edit it to add a photo.
            </p>
          )}

          {/* Featured checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <input type="checkbox" id="featured" checked={form.isFeatured}
              onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />
            <label htmlFor="featured" style={{ fontSize: 14, cursor: 'pointer' }}>Mark as featured (shown first)</label>
          </div>

          {msg && <p style={{ fontSize: 13, color: msg.startsWith('✅') ? '#27ae60' : msg.startsWith('⚠️') ? '#e65c00' : '#e8401c', marginBottom: 12 }}>{msg}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" type="submit" disabled={saving || uploading} style={{ width: 'auto', padding: '10px 24px' }}>
              {saving ? 'Saving…' : editId ? 'Update Product' : 'Add Product'}
            </button>
            {editId && <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* Products list */}
      <div className="card">
        <h3 style={{ fontWeight: 800, marginBottom: 16 }}>
          Your Products <span style={{ color: '#999', fontWeight: 400, fontSize: 14 }}>({store?.items.length || 0})</span>
        </h3>
        {!store?.items.length
          ? <p style={{ color: '#999', fontSize: 14 }}>No products yet — add your first one above.</p>
          : store.items.map(item => (
            <div key={item.id} style={styles.itemRow}>
              {/* Thumbnail */}
              {item.imageUrl
                ? <img src={item.imageUrl} alt={item.name} style={styles.itemThumb} />
                : <div style={styles.itemThumbEmpty}>📦</div>
              }
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700 }}>{item.name}</span>
                {item.isFeatured && <span className="badge badge-orange" style={{ marginLeft: 8 }}>Featured</span>}
                {item.unit && <span style={{ fontSize: 12, color: '#999', marginLeft: 6 }}>/ {item.unit}</span>}
              </div>
              <span style={{ fontWeight: 900, fontSize: 16, color: '#e8401c', marginRight: 16 }}>₹{item.price}</span>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, marginRight: 6 }} onClick={() => startEdit(item)}>✏️ Edit</button>
              <button className="btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleDelete(item.id)}>🗑️</button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  formRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 },
  photoRow: { display: 'flex', gap: 16, marginBottom: 16 },
  photoPreview: { width: 100, height: 100, objectFit: 'cover', borderRadius: 10, border: '1.5px solid #e8e8e8', display: 'block' },
  removePhotoBtn: { position: 'absolute', top: -8, right: -8, background: '#e8401c', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  photoPlaceholder: { width: 100, height: 100, background: '#f5f5f7', borderRadius: 10, border: '2px dashed #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' },
  itemRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f5f5f5' },
  itemThumb: { width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #e8e8e8', flexShrink: 0 },
  itemThumbEmpty: { width: 48, height: 48, background: '#f5f5f7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
};
