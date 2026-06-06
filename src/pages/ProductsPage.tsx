import { useEffect, useState } from 'react';
import { getMyStore, addItem, updateItem, deleteItem } from '../api/store';
import type { Store, StoreItem } from '../types';

type Form = { name: string; price: string; unit: string; isFeatured: boolean };
const EMPTY: Form = { name: '', price: '', unit: '', isFeatured: false };

export default function ProductsPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    getMyStore().then(r => setStore(r.data)).finally(() => setLoading(false));
  }, []);

  function startEdit(item: StoreItem) {
    setEditId(item.id);
    setForm({ name: item.name, price: String(item.price), unit: item.unit || '', isFeatured: item.isFeatured });
  }

  function cancelEdit() { setEditId(null); setForm(EMPTY); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true); setMsg('');
    try {
      const payload = { name: form.name, price: parseFloat(form.price), unit: form.unit || null, isFeatured: form.isFeatured };
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
      setMsg(editId ? '✅ Product updated' : '✅ Product added');
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

  if (loading) return <div style={{ padding: 32 }}><p style={{ color: '#999' }}>Loading…</p></div>;

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>📦 Products</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>Add the items you sell with prices. Customers see these on your store page.</p>

      {/* Add / Edit form */}
      <div className="card" style={{ borderColor: editId ? '#e8401c' : undefined }}>
        <h3 style={{ fontWeight: 800, marginBottom: 16 }}>{editId ? '✏️ Edit Product' : '+ Add Product'}</h3>
        <form onSubmit={handleSave}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <input type="checkbox" id="featured" checked={form.isFeatured}
              onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />
            <label htmlFor="featured" style={{ fontSize: 14, cursor: 'pointer' }}>Mark as featured (shown first)</label>
          </div>
          {msg && <p style={{ fontSize: 13, color: msg.startsWith('✅') ? '#27ae60' : '#e8401c', marginBottom: 12 }}>{msg}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" type="submit" disabled={saving} style={{ width: 'auto', padding: '10px 24px' }}>
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
  itemRow: { display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' },
};
