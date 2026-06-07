import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../api/admin';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(email, password);
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/stores');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>Local<span style={{ color: '#e8401c' }}>Adda</span></div>
        <div style={s.subtitle}>Admin Panel</div>

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Email</label>
          <input
            style={s.input}
            type="email"
            placeholder="admin@localadda.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && <div style={s.error}>{error}</div>}

          <button style={s.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#fff', borderRadius: 16, padding: '40px 36px', width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' },
  logo: { fontSize: 26, fontWeight: 900, color: '#1a1a2e', textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#888', fontSize: 14, marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { fontSize: 13, fontWeight: 600, color: '#444' },
  input: { border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none' },
  error: { background: '#fff0f0', color: '#e8401c', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  btn: { background: '#e8401c', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
};
