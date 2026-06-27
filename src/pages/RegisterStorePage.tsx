import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, getCities, registerStore } from '../api/store';
import type { Category, City } from '../api/store';

export default function RegisterStorePage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    name: '',
    categorySlug: '',
    citySlug: '',
    description: '',
    phone: '',
    address: '',
    mapsUrl: '',
  });

  useEffect(() => {
    Promise.all([getCategories(), getCities()])
      .then(([catRes, cityRes]) => {
        setCategories(catRes.data);
        setCities(cityRes.data);
        // pre-select first options
        if (catRes.data.length > 0) setForm(f => ({ ...f, categorySlug: catRes.data[0].slug }));
        if (cityRes.data.length > 0) setForm(f => ({ ...f, citySlug: cityRes.data[0].slug }));
      })
      .catch(() => setError('Failed to load categories/cities.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Fall back to the first dropdown option if the controlled select never
    // committed a value (it can display the first option while state stays '').
    const citySlug = form.citySlug || cities[0]?.slug || '';
    const categorySlug = form.categorySlug || categories[0]?.slug || '';

    if (!form.name || !categorySlug || !citySlug || !form.phone || !form.address) {
      setError('Please fill in all required fields (name, city, category, phone, address).');
      return;
    }
    if (!agreed) {
      setError('Please accept the Seller Terms to continue.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await registerStore({ ...form, citySlug, categorySlug, termsAccepted: true });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find(c => c.slug === form.categorySlug);

  if (loading) return <div className="page-pad" style={styles.page}><p style={{ color: '#999' }}>Loading…</p></div>;

  return (
    <div className="page-pad" style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Register Your Store</h1>
          <p style={styles.sub}>Fill in your store details to go live on LocalAdda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={styles.sectionTitle}>📍 Basic Info</h2>

          <div style={styles.field}>
            <label style={styles.label}>Store Name *</label>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. Sharma General Store"
              value={form.name}
              onChange={set('name')}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>City *</label>
              <select style={styles.select} value={form.citySlug} onChange={set('citySlug')}>
                {cities.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name}, {c.state}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Category *</label>
              <select style={styles.select} value={form.categorySlug} onChange={set('categorySlug')}>
                {categories.map(c => (
                  <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>
                ))}
              </select>
              {selectedCategory && (
                <div style={{ ...styles.categoryPreview, background: selectedCategory.gradient }}>
                  <span style={{ fontSize: 22 }}>{selectedCategory.emoji}</span>
                  <span style={{ fontWeight: 700 }}>{selectedCategory.name}</span>
                </div>
              )}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              style={{ ...styles.input, height: 80, resize: 'vertical' }}
              placeholder="Briefly describe your store (optional)"
              value={form.description}
              onChange={set('description')}
            />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={styles.sectionTitle}>📞 Contact & Location</h2>

          <div style={styles.field}>
            <label style={styles.label}>Phone Number *</label>
            <input
              style={styles.input}
              type="tel"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={set('phone')}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Address *</label>
            <textarea
              style={{ ...styles.input, height: 70, resize: 'vertical' }}
              placeholder="Shop No., Street, Area, City"
              value={form.address}
              onChange={set('address')}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Google Maps Link <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
            <input
              style={styles.input}
              type="url"
              placeholder="https://maps.google.com/..."
              value={form.mapsUrl}
              onChange={set('mapsUrl')}
            />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, margin: '4px 0 16px', fontSize: 13, lineHeight: 1.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            I agree to the{' '}
            <a href="https://localadda.com/seller-terms" target="_blank" rel="noreferrer" style={{ color: '#e8401c', fontWeight: 600 }}>Seller Terms</a>
            {' '}and confirm I&apos;m responsible for my listings, prices, licenses, and orders.
          </span>
        </label>

        {error && <div style={styles.errorBox}>{error}</div>}

        <button
          type="submit"
          className="btn-primary"
          disabled={submitting || !agreed}
          style={{ width: '100%', padding: '16px', fontSize: 16, fontWeight: 800, opacity: agreed ? 1 : 0.6 }}
        >
          {submitting ? 'Registering…' : '🚀 Register My Store'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 680, margin: '0 auto' },
  header: { marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 900 },
  sub: { fontSize: 14, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 800, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fafafa' },
  select: { width: '100%', padding: '10px 14px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafafa', cursor: 'pointer' },
  categoryPreview: { marginTop: 8, padding: '8px 14px', borderRadius: 8, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
  errorBox: { background: '#fff0ee', border: '1px solid #f5c6c0', color: '#c0392b', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16 },
};
