import { useEffect, useMemo, useState } from 'react';
import { getAdminCategories, updateCategorySchema, updateCategoryLayout, updateCategoryGrouping } from '../../api/admin';
import type { Category, CategoryField } from '../../types';
import AttributeFields from '../../components/AttributeFields';

const TYPES: CategoryField['type'][] = ['text', 'select', 'tags', 'bool'];
const RESERVED = new Set(['name', 'price', 'unit', 'imageurl', 'isfeatured', 'id', 'sortorder', 'attributes', 'store']);

function slugifyKey(label: string): string {
  let k = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^[0-9]+/, '');
  if (!k) k = 'field';
  return k.slice(0, 30);
}

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [slug, setSlug] = useState<string>('');
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [originalKeys, setOriginalKeys] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown>>({});

  useEffect(() => {
    getAdminCategories().then(r => {
      setCats(r.data);
      if (r.data.length) select(r.data[0]);
    }).catch(() => setErr('Could not load categories.'));
  }, []);

  function select(c: Category) {
    setSlug(c.slug);
    const schema = (c.itemSchema || []).map(f => ({ ...f, options: f.options ? [...f.options] : undefined }));
    setFields(schema);
    setOriginalKeys(new Set(schema.map(f => f.key)));
    setPreview({});
    setMsg(''); setErr('');
  }

  const current = cats.find(c => c.slug === slug);

  async function setLayout(next: string) {
    if (!current || current.layout === next) return;
    try {
      const r = await updateCategoryLayout(slug, next);
      setCats(cs => cs.map(c => c.slug === slug ? { ...c, layout: r.data.layout } : c));
      setMsg('✅ Layout updated for ' + (current.name) + ' stores.');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Could not update layout.');
    }
  }

  async function setGrouping(next: string) {
    if (!current) return;
    try {
      const r = await updateCategoryGrouping(slug, next);
      setCats(cs => cs.map(c => c.slug === slug ? { ...c, groupBy: r.data.groupBy } : c));
      setMsg(next ? '✅ Items now group by "' + next + '".' : '✅ Grouping turned off.');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Could not update grouping.');
    }
  }

  function patch(i: number, p: Partial<CategoryField>) {
    setFields(fs => fs.map((f, idx) => {
      if (idx !== i) return f;
      const next = { ...f, ...p };
      // New (unsaved) fields keep key in sync with the label; saved keys are frozen
      if (p.label !== undefined && !originalKeys.has(f.key)) next.key = uniqueKey(slugifyKey(p.label), idx);
      if (p.type !== undefined && p.type !== 'select' && p.type !== 'tags') delete next.options;
      if (p.type !== undefined && (p.type === 'select' || p.type === 'tags') && !next.options) next.options = [];
      return next;
    }));
    setMsg('');
  }

  function uniqueKey(base: string, selfIdx: number): string {
    const taken = new Set(fields.filter((_, i) => i !== selfIdx).map(f => f.key));
    if (!taken.has(base) && !RESERVED.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}_${n}`)) n++;
    return `${base}_${n}`;
  }

  function addField() {
    if (fields.length >= 12) { setErr('Max 12 fields per category.'); return; }
    const key = uniqueKey('field', -1);
    setFields(fs => [...fs, { key, label: '', type: 'text' }]);
  }

  function removeField(i: number) {
    const f = fields[i];
    const warn = originalKeys.has(f.key)
      ? `Remove "${f.label || f.key}"?\n\nExisting item data for this field is kept in the database and will reappear if you re-add the same key — it's just hidden from now on.`
      : `Remove "${f.label || f.key}"?`;
    if (!confirm(warn)) return;
    setFields(fs => fs.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    setFields(fs => { const n = [...fs]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  }

  function clientValidate(): string | null {
    const keys = new Set<string>();
    for (const f of fields) {
      if (!f.label.trim()) return 'Every field needs a label.';
      if (keys.has(f.key)) return `Duplicate key: ${f.key}`;
      keys.add(f.key);
      if ((f.type === 'select' || f.type === 'tags') && (!f.options || f.options.length === 0))
        return `"${f.label}" needs at least one option.`;
    }
    return null;
  }

  async function save() {
    const v = clientValidate();
    if (v) { setErr(v); setMsg(''); return; }
    setSaving(true); setErr(''); setMsg('');
    try {
      const r = await updateCategorySchema(slug, fields);
      setCats(cs => cs.map(c => c.slug === slug ? r.data : c));
      setOriginalKeys(new Set(fields.map(f => f.key)));
      setMsg('✅ Saved. All ' + (current?.name || 'category') + ' stores now use these fields.');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  const dirty = useMemo(() => JSON.stringify(fields) !== JSON.stringify(current?.itemSchema || []), [fields, current]);

  return (
    <div style={{ padding: 28, maxWidth: 920, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>🧩 Category fields</h1>
      <p style={{ color: '#888', fontSize: 13.5, marginBottom: 16 }}>
        Define the item fields shopkeepers fill in for each category. Changes apply to <b>every store</b> in the category.
      </p>

      {/* Safety note */}
      <div style={{ background: '#fff7e6', border: '1px solid #ffe0a3', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: '#8a5a00', marginBottom: 18, lineHeight: 1.6 }}>
        🔒 Safe by design: a field's <b>key is locked once saved</b> (rename the label freely). Removing a field only hides it — item data is preserved and returns if you re-add the key. Invalid schemas are rejected on save.
      </div>

      {/* Category picker */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {cats.map(c => (
          <button key={c.slug} onClick={() => select(c)}
            style={{
              padding: '7px 13px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: c.slug === slug ? '1.5px solid #e8401c' : '1.5px solid #e6e6e6',
              background: c.slug === slug ? '#fff1ec' : '#fff', color: c.slug === slug ? '#e8401c' : '#666',
            }}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {err && <p style={{ color: '#e8401c', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>⚠️ {err}</p>}
      {msg && <p style={{ color: '#1a7a35', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{msg}</p>}

      {/* Layout mode */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>🧱 Store-page layout</div>
        <p style={{ fontSize: 12.5, color: '#999', marginBottom: 12 }}>How items show on a {current?.name || 'category'} store page.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { v: 'list', label: '☰ List', hint: 'price-list rows — grocery, pharmacy, hardware' },
            { v: 'grid', label: '▦ Grid', hint: 'image-forward cards — clothing, optical' },
            { v: 'menu', label: '🍽 Menu', hint: 'grouped by section — restaurants (needs a "course" field)' },
          ].map(opt => {
            const on = (current?.layout || 'list') === opt.v;
            return (
              <button key={opt.v} onClick={() => setLayout(opt.v)} title={opt.hint}
                style={{
                  flex: '1 1 200px', textAlign: 'left', padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  border: on ? '2px solid #17a44b' : '1.5px solid #e6e6e6', background: on ? '#edfbf1' : '#fff',
                }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: on ? '#17a44b' : '#333' }}>{opt.label}{on ? ' ✓' : ''}</div>
                <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>{opt.hint}</div>
              </button>
            );
          })}
        </div>

        {/* Group items by */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 6 }}>Group items into sections</div>
          <select
            value={current?.groupBy || ''}
            onChange={e => setGrouping(e.target.value)}
            style={{ width: '100%', maxWidth: 320, padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e0e0e0', fontSize: 14, background: '#fff' }}
          >
            <option value="">No sections (flat list)</option>
            {(current?.itemSchema || []).map(f => (
              <option key={f.key} value={f.key}>Group by “{f.label}”</option>
            ))}
          </select>
          <p style={{ fontSize: 11.5, color: '#aaa', marginTop: 6 }}>
            Big catalogs read better in sections — e.g. grocery by aisle, restaurant by course. Pick a field above (save the field first if it's new).
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {/* Editor */}
        <div className="card">
          {fields.length === 0 && <p style={{ color: '#aaa', fontSize: 14, marginBottom: 12 }}>No fields yet — add one below.</p>}

          {fields.map((f, i) => {
            const frozen = originalKeys.has(f.key);
            const needsOptions = f.type === 'select' || f.type === 'tags';
            return (
              <div key={i} style={{ border: '1px solid #eee', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: '2 1 180px' }}>
                    <label className="label">Label</label>
                    <input className="input" value={f.label} placeholder="e.g. Frame material"
                      onChange={e => patch(i, { label: e.target.value })} />
                  </div>
                  <div style={{ flex: '1 1 130px' }}>
                    <label className="label">Type</label>
                    <select className="input" value={f.type} onChange={e => patch(i, { type: e.target.value as CategoryField['type'] })}>
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Move up"
                      style={iconBtn}>↑</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === fields.length - 1} title="Move down"
                      style={iconBtn}>↓</button>
                    <button type="button" onClick={() => removeField(i)} title="Remove"
                      style={{ ...iconBtn, color: '#e8401c', borderColor: '#f3c9bd' }}>🗑</button>
                  </div>
                </div>

                {needsOptions && (
                  <div style={{ marginTop: 8 }}>
                    <label className="label">Options (comma separated)</label>
                    <input className="input" value={(f.options || []).join(', ')}
                      placeholder="Metal, Acetate, Rimless"
                      onChange={e => patch(i, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                  </div>
                )}

                <div style={{ marginTop: 6, fontSize: 11, color: '#aaa' }}>
                  key: <code style={{ fontFamily: 'monospace', color: frozen ? '#888' : '#1a7a35' }}>{f.key}</code>
                  {frozen ? ' 🔒 locked' : ' (new — set by label)'}
                </div>
              </div>
            );
          })}

          <button type="button" onClick={addField}
            style={{ marginTop: 4, padding: '9px 16px', borderRadius: 9, border: '1.5px dashed #c9c9c9', background: '#fafafa', color: '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Add field
          </button>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
            <button onClick={save} disabled={saving || !dirty}
              style={{ padding: '10px 22px', borderRadius: 9, border: 'none', cursor: dirty ? 'pointer' : 'default',
                background: dirty ? '#e8401c' : '#ddd', color: '#fff', fontWeight: 800, fontSize: 14 }}>
              {saving ? 'Saving…' : 'Save schema'}
            </button>
            {dirty && <button onClick={() => current && select(current)}
              style={{ padding: '10px 16px', borderRadius: 9, border: '1.5px solid #e0e0e0', background: '#fff', color: '#888', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Discard changes
            </button>}
          </div>
        </div>

        {/* Live preview */}
        <div className="card" style={{ background: '#faf9f6' }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>👀 Live preview</div>
          <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>This is exactly what a {current?.name || ''} shopkeeper sees when adding an item.</p>
          {fields.filter(f => f.label.trim()).length === 0
            ? <p style={{ color: '#bbb', fontSize: 13 }}>Add labelled fields to preview.</p>
            : <AttributeFields schema={fields.filter(f => f.label.trim())} value={preview} onChange={setPreview} />}
        </div>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, border: '1.5px solid #e6e6e6', background: '#fff',
  cursor: 'pointer', fontSize: 14, color: '#666',
};
