import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function useInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  }

  return { canInstall: !!prompt && !installed, install };
}

const NAV = [
  { to: '/dashboard', label: 'Home', icon: '📊', end: true },
  { to: '/dashboard/products', label: 'Products', icon: '📦' },
  { to: '/dashboard/discounts', label: 'Discounts', icon: '🎉' },
  { to: '/dashboard/photos', label: 'Photos', icon: '📸' },
  { to: '/dashboard/contact', label: 'Contact', icon: '📍' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const phone = localStorage.getItem('phone') || '';
  const { canInstall, install } = useInstallPrompt();

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <div className="dashboard-shell" style={styles.shell}>
      {/* Sidebar — hidden on mobile */}
      <aside className="dashboard-sidebar" style={styles.sidebar}>
        <div style={styles.logo}>Local<span style={{ color: '#f5a623' }}>Adda</span></div>

        <nav style={styles.nav}>
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navActive : {}) })}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.footer}>
          <div style={styles.userRow}>
            <div style={styles.avatar}>👤</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Store Owner</div>
              {phone && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>+91 {phone}</div>}
            </div>
          </div>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main" style={styles.main}>
        {/* Install PWA banner — shown only when browser supports it and not yet installed */}
        {canInstall && (
          <div style={styles.installBanner}>
            <span style={{ fontSize: 20 }}>📲</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Install LocalAdda on your phone for quick access</span>
            <button onClick={install} style={styles.installBtn}>Install</button>
            <button onClick={() => {}} style={styles.installDismiss}>✕</button>
          </div>
        )}
        <Outlet />
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="mobile-bottom-nav" style={styles.bottomNav}>
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink
            key={to} to={to} end={end}
            style={({ isActive }) => ({ ...styles.bottomItem, ...(isActive ? styles.bottomItemActive : {}) })}
          >
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ fontSize: 10, marginTop: 2 }}>{label}</span>
          </NavLink>
        ))}
        <button onClick={logout} style={styles.bottomLogout}>
          <span style={{ fontSize: 22 }}>🚪</span>
          <span style={{ fontSize: 10, marginTop: 2 }}>Logout</span>
        </button>
      </nav>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: 240, background: '#1a1a2e', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' },
  logo: { padding: '24px 20px', fontSize: 22, fontWeight: 900, color: '#e8401c', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  nav: { flex: 1, padding: '12px 0' },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, borderLeft: '3px solid transparent', textDecoration: 'none', transition: 'all 0.15s' },
  navActive: { color: '#fff', background: 'rgba(232,64,28,0.15)', borderLeftColor: '#e8401c' },
  footer: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: 10, background: '#e8401c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  logoutBtn: { background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '8px 14px', fontSize: 13, width: '100%' },
  main: { flex: 1, minWidth: 0 },
  installBanner: { display: 'flex', alignItems: 'center', gap: 10, background: '#1a1a2e', color: '#fff', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  installBtn: { background: '#e8401c', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const },
  installDismiss: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 16, padding: '4px 8px' },
  // Bottom nav (shown via CSS media query only)
  bottomNav: { display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a1a2e', borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 100, padding: '6px 0 8px' },
  bottomItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '4px 0' },
  bottomItemActive: { color: '#f5a623' },
  bottomLogout: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', padding: '4px 0', fontSize: 'inherit' },
};
