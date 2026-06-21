import type { CategoryField } from '../types';

type Attrs = Record<string, unknown>;

interface Props {
  schema: CategoryField[];
  value: Attrs;
  onChange: (next: Attrs) => void;
}

/** Renders category-specific item fields (text / select / tags / bool) from the schema. */
export default function AttributeFields({ schema, value, onChange }: Props) {
  if (!schema || schema.length === 0) return null;

  const set = (key: string, v: unknown) => {
    const next = { ...value };
    if (v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0)) {
      delete next[key];
    } else {
      next[key] = v;
    }
    onChange(next);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label className="label" style={{ marginBottom: 8, display: 'block' }}>Details for this item</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {schema.map((f) => {
          if (f.type === 'bool') {
            return (
              <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', padding: '8px 0' }}>
                <input type="checkbox" checked={!!value[f.key]} onChange={(e) => set(f.key, e.target.checked)} />
                {f.label}
              </label>
            );
          }
          if (f.type === 'select') {
            return (
              <div key={f.key} style={{ flex: '1 1 160px', minWidth: 140 }}>
                <label className="label">{f.label}</label>
                <select className="input" value={(value[f.key] as string) || ''} onChange={(e) => set(f.key, e.target.value)}>
                  <option value="">—</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            );
          }
          if (f.type === 'tags') {
            const selected = Array.isArray(value[f.key]) ? (value[f.key] as string[]) : [];
            return (
              <div key={f.key} style={{ flex: '1 1 100%' }}>
                <label className="label">{f.label}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {f.options?.map((o) => {
                    const on = selected.includes(o);
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => set(f.key, on ? selected.filter((s) => s !== o) : [...selected, o])}
                        style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          border: on ? '1.5px solid #17a44b' : '1.5px solid #e0e0e0',
                          background: on ? '#edfbf1' : '#fff', color: on ? '#17a44b' : '#888',
                        }}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
          // text
          return (
            <div key={f.key} style={{ flex: '1 1 160px', minWidth: 140 }}>
              <label className="label">{f.label}</label>
              <input className="input" value={(value[f.key] as string) || ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.label} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
