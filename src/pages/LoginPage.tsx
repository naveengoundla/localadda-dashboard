import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp } from '../api/auth';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/dashboard');
  }, [navigate]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true); setError('');
    try {
      await sendOtp(phone);
      setStep('otp');
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await verifyOtp(phone, otpStr);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('ownerId', res.data.ownerId);
      if (res.data.storeId) localStorage.setItem('storeId', res.data.storeId);
      navigate(res.data.isNewOwner ? '/dashboard/register' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpInput(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }

  async function handleResend() {
    setLoading(true); setError('');
    try {
      await sendOtp(phone);
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      otpRefs.current[0]?.focus();
    } catch { setError('Failed to resend. Try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div style={styles.page}>
      {/* Left — form */}
      <div style={styles.left}>
        <div style={styles.card}>
          <div style={styles.logo}>Local<span style={{ color: '#f5a623' }}>Adda</span></div>
          <div style={styles.tagline}>Store Owner Portal</div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp}>
              <h2 style={styles.title}>Welcome back 👋</h2>
              <p style={styles.subtitle}>Enter your phone number to receive an OTP</p>

              <div style={{ marginBottom: 20 }}>
                <label className="label">Mobile Number</label>
                <div style={styles.phoneWrap}>
                  <span style={styles.flag}>🇮🇳 +91</span>
                  <input
                    className="input"
                    style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="error-msg">{error}</p>}
              <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 16 }}>
                {loading ? 'Sending…' : 'Send OTP →'}
              </button>
              <p style={styles.hint}>New store owner? <a href="/dashboard/register" style={{ color: '#e8401c' }}>Register your store</a></p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <h2 style={styles.title}>Enter OTP 🔐</h2>
              <p style={styles.subtitle}>Sent to +91 {phone} · <button type="button" onClick={() => setStep('phone')} style={styles.changeBtn}>Change</button></p>

              <div style={{ marginBottom: 20 }}>
                <label className="label">6-Digit OTP</label>
                <div style={styles.otpRow}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      style={{ ...styles.otpBox, ...(d ? styles.otpBoxFilled : {}) }}
                      value={d}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      inputMode="numeric"
                      maxLength={1}
                    />
                  ))}
                </div>
              </div>

              {error && <p className="error-msg">{error}</p>}
              <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 16 }}>
                {loading ? 'Verifying…' : 'Verify & Login →'}
              </button>
              <p style={{ ...styles.hint, marginTop: 16 }}>
                Didn't receive it?{' '}
                {resendTimer > 0
                  ? <span style={{ color: '#999' }}>Resend in 0:{String(resendTimer).padStart(2, '0')}</span>
                  : <button type="button" onClick={handleResend} style={{ ...styles.changeBtn, fontWeight: 700 }}>Resend OTP</button>
                }
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Right — marketing */}
      <div style={styles.right}>
        <h2 style={styles.heroTitle}>Grow your local<br />business with <em style={{ color: '#f5a623', fontStyle: 'normal' }}>LocalAdda</em></h2>
        <p style={styles.heroSub}>Thousands of customers in your city discover stores like yours every day.</p>
        <ul style={styles.featureList}>
          {[
            ['🏪', 'Your own store page on LocalAdda'],
            ['📦', 'Add unlimited products & prices'],
            ['🎉', 'Post discounts & offers'],
            ['📸', 'Upload store photos & banner'],
            ['📞', 'Customers call you directly'],
            ['🆓', '100% free to list'],
          ].map(([icon, text]) => (
            <li key={text} style={styles.featureItem}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' },
  left: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  card: { background: '#fff', borderRadius: 24, padding: '48px 40px', width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' },
  logo: { fontSize: 26, fontWeight: 900, color: '#e8401c', marginBottom: 4 },
  tagline: { fontSize: 13, color: '#888', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 800, marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 28 },
  hint: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 20 },
  phoneWrap: { display: 'flex', border: '1.5px solid #e8e8e8', borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' },
  flag: { background: '#f5f5f5', padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#555', borderRight: '1.5px solid #e8e8e8', whiteSpace: 'nowrap' },
  otpRow: { display: 'flex', gap: 8 },
  otpBox: { flex: 1, border: '1.5px solid #e8e8e8', borderRadius: 10, textAlign: 'center', fontSize: 22, fontWeight: 800, padding: '14px 0', outline: 'none' },
  otpBoxFilled: { borderColor: '#e8401c', background: '#fff5f3', color: '#e8401c' },
  changeBtn: { background: 'none', border: 'none', color: '#e8401c', cursor: 'pointer', fontSize: 13, padding: 0 },
  right: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px' },
  heroTitle: { fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 16 },
  heroSub: { fontSize: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 380, lineHeight: 1.6, marginBottom: 40 },
  featureList: { listStyle: 'none' },
  featureItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.1)' },
};
