import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', end: true },
  { to: '/dashboard/products', label: 'Products', icon: '📦' },
  { to: '/dashboard/discounts', label: 'Discounts', icon: '🎉' },
  { to: '/dashboard/photos', label: 'Photos', icon: '📸' },
  { to: '/dashboard/contact', label: 'Contact & Hours', icon: '📍' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const phone = localStorage.getItem('phone') || '';

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
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
      <main style={styles.main}>
        <Outlet />
      </main>
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
};
