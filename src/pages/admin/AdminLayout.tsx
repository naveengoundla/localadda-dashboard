import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/admin/stores', label: 'All Stores', icon: '🏪' },
];

const STATUS_TABS = [
  { label: 'Pending', status: 'PENDING', color: '#f59e0b' },
  { label: 'Active', status: 'ACTIVE', color: '#10b981' },
  { label: 'Rejected', status: 'REJECTED', color: '#ef4444' },
  { label: 'Suspended', status: 'SUSPENDED', color: '#6b7280' },
];

export { STATUS_TABS };

export default function AdminLayout() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  }

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logo}>Local<span style={{ color: '#f5a623' }}>Adda</span></div>
        <div style={s.badge}>Admin Panel</div>

        <nav style={s.nav}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to} to={to}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={s.footer}>
          <button onClick={logout} style={s.logoutBtn}>Logout</button>
        </div>
      </aside>

      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: 220, background: '#1a1a2e', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' },
  logo: { padding: '24px 20px 4px', fontSize: 22, fontWeight: 900, color: '#e8401c' },
  badge: { padding: '0 20px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' },
  nav: { flex: 1, padding: '12px 0' },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, borderLeft: '3px solid transparent', textDecoration: 'none' },
  navActive: { color: '#fff', background: 'rgba(232,64,28,0.15)', borderLeftColor: '#e8401c' },
  footer: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  logoutBtn: { background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '8px 14px', fontSize: 13, width: '100%', cursor: 'pointer' },
  main: { flex: 1, background: '#f0f2f5', padding: '32px', overflowY: 'auto' },
};
