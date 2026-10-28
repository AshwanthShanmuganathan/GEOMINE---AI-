import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Shield, ClipboardCheck, FileText, AlertTriangle, Cpu, 
  Map as MapIcon, FileStack, Users, Settings as SettingsIcon, Menu, 
  Bell, User, LogOut, CheckSquare, Search, MapPin, Building2 
} from 'lucide-react';

// Public Pages
import Landing from './pages/Landing';
import About from './pages/About';
import Features from './pages/Features';
import TNMines from './pages/TNMines';
import MineOwners from './pages/MineOwners';
import PortalMap from './pages/PortalMap';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Wizard from './pages/Wizard';

// App Pages
import Dashboard from './pages/Dashboard';
import Compliance from './pages/Compliance';
import Violations from './pages/Violations';
import Inspections from './pages/Inspections';
import AIAssistant from './pages/AIAssistant';
import CorrectiveActions from './pages/CorrectiveActions';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import MineDetail from './pages/MineDetail';
import AuditLogs from './pages/AuditLogs';
import Contractors from './pages/Contractors';
import GISMap from './pages/GISMap';
import Settings from './pages/Settings';

import ErrorBoundary from './components/ErrorBoundary';
import api, { getConnectionStatus, setDemoMode, isDemoMode } from './services/api';
import { 
  mines, violations, correctiveActions, 
  getActiveContext, setActiveContext, allDistricts, getMinesByDistrict 
} from './data/mockData';

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('userRole'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dbStatus, setDbStatus] = useState(() => getConnectionStatus());
  const location = useLocation();
  const navigate = useNavigate();

  // Connection & DB status monitoring
  useEffect(() => {
    const handleStatus = (e) => {
      setDbStatus(e.detail);
    };
    window.addEventListener('evs-connection-status', handleStatus);
    api.checkHealth().catch(() => {});
    return () => window.removeEventListener('evs-connection-status', handleStatus);
  }, []);

  const handleRetryDb = async () => {
    try {
      await api.checkHealth();
    } catch (e) {
      console.warn("DB reconnection attempt failed:", e);
    }
  };

  // Selected Place Context
  const [context, setContext] = useState(() => getActiveContext());
  const [districtMines, setDistrictMines] = useState(() => getMinesByDistrict(context.district || context.districtId));

  // Sync place context reactively across the whole app
  useEffect(() => {
    const sync = () => {
      const active = getActiveContext();
      setContext(active);
      setDistrictMines(getMinesByDistrict(active.district || active.districtId));
    };

    window.addEventListener('evs-context-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('evs-context-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Protect internal routes
  useEffect(() => {
    const publicPaths = ['/', '/about', '/features', '/tamil-nadu-mines', '/mine-owners', '/portal', '/login', '/signup'];
    if (!role && !publicPaths.includes(location.pathname)) {
      navigate('/');
    }
  }, [role, navigate, location.pathname]);

  if (!role) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/tamil-nadu-mines" element={<TNMines />} />
        <Route path="/mine-owners" element={<MineOwners />} />
        <Route path="/portal" element={<PortalMap />} />
        <Route path="/login" element={<Login setRole={setRole} district={context.district} mine={context.mineId} />} />
        <Route path="/signup" element={<Signup setRole={setRole} district={context.district} mine={context.mineId} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (location.pathname === '/setup') {
    return <Wizard />;
  }

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    setRole(null);
    navigate('/');
  };

  const handleDistrictChange = (e) => {
    const newDistrictId = e.target.value;
    const distObj = allDistricts.find(d => d.id === newDistrictId || d.name.toLowerCase() === newDistrictId.toLowerCase());
    const distName = distObj?.name || newDistrictId;
    const minesInDist = getMinesByDistrict(distObj?.id || newDistrictId);
    const firstMine = minesInDist[0] || null;

    setActiveContext({
      district: distName,
      districtId: distObj?.id || newDistrictId,
      mine: firstMine ? firstMine.id : null,
      locationName: firstMine ? firstMine.name : `${distName} Sector`
    });
  };

  const handleMineChange = (e) => {
    const mineId = e.target.value;
    const found = districtMines.find(m => m.id === mineId);
    if (found) {
      setActiveContext({
        district: found.district || context.district,
        districtId: found.districtId || context.districtId,
        mine: found.id,
        locationName: found.name
      });
    }
  };

  const activeMineTitle = context.locationName || (districtMines.find(m => m.id === context.mineId)?.name) || `${context.district} Sector`;

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'officer', 'inspector'] },
    { path: '/compliance', icon: CheckSquare, label: 'Compliance Register', roles: ['admin', 'manager', 'officer'] },
    { path: '/inspections', icon: ClipboardCheck, label: 'Inspections', roles: ['admin', 'inspector', 'officer'] },
    { path: '/violations', icon: AlertTriangle, label: 'Violations', roles: ['admin', 'manager', 'officer', 'inspector'], badge: violations.filter(v => (v.status === 'OPEN' || v.status === 'OVERDUE')).length },
    { path: '/actions', icon: Shield, label: 'Corrective Actions', roles: ['admin', 'manager', 'officer'], badge: correctiveActions.filter(c => c.status === 'OVERDUE').length, badgeDanger: true },
    { path: '/ai-assistant', icon: Cpu, label: 'AI Risk Analysis', roles: ['admin', 'manager'] },
    { section: 'Resources' },
    { path: '/gis-map', icon: MapIcon, label: 'GIS Map', roles: ['admin', 'manager', 'officer', 'inspector'] },
    { path: '/documents', icon: FileStack, label: 'Documents & OCR', roles: ['admin', 'manager', 'officer'] },
    { path: '/reports', icon: FileText, label: 'Reports', roles: ['admin', 'manager', 'officer'] },
    { path: '/contractors', icon: Users, label: 'Contractors', roles: ['admin', 'manager'] },
    { section: 'System' },
    { path: '/audit-logs', icon: FileText, label: 'Audit Logs', roles: ['admin'] },
    { path: '/settings', icon: SettingsIcon, label: 'Settings', roles: ['admin', 'manager', 'officer', 'inspector'] },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">G</div>
          <div className="sidebar-title">GeoMine AI</div>
        </div>
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#c8956c', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Active Context</div>
          <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeMineTitle}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {context.district} District • {districtMines.length} Sites
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.section) return <div key={idx} className="nav-section-title">{item.section}</div>;
            if (item.roles && !item.roles.includes(role)) return null;

            const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');

            return (
              <Link key={item.path} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon"><item.icon size={16} /></div>
                <span className="nav-label">{item.label}</span>
                {item.badge > 0 && !sidebarCollapsed && (
                  <span className={`nav-badge ${item.badgeDanger ? '' : 'warning'}`}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <Menu size={18} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {!sidebarCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="system-status">
                  <div className="status-dot" /> SYSTEM ONLINE
                </div>
                {dbStatus === 'LIVE' && (
                  <div className="db-status-pill live" title="Connected to PostgreSQL Database (geominedb)">
                    <div className="status-dot" /> LIVE DB
                  </div>
                )}
                {dbStatus === 'OFFLINE' && (
                  <div 
                    className="db-status-pill offline" 
                    onClick={handleRetryDb}
                    title="Backend unreachable. Click to retry connection"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="status-dot" /> OFFLINE (RETRY)
                  </div>
                )}
                {dbStatus === 'DEMO' && (
                  <div 
                    className="db-status-pill demo" 
                    onClick={() => setDemoMode(false)}
                    title="Running in Demo Data mode. Click to switch to LIVE DB"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="status-dot" /> DEMO DATA
                  </div>
                )}
              </div>
            )}

            {/* Live Interactive District & Mine Place Selector */}
            <div className="place-selector-bar" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                background: 'rgba(200, 149, 108, 0.1)', 
                border: '1px solid rgba(200, 149, 108, 0.25)', 
                padding: '4px 10px', 
                borderRadius: 6 
              }}>
                <MapPin size={13} style={{ color: 'var(--accent)' }} />
                <select
                  value={context.districtId || (allDistricts.find(d => d.name === context.district)?.id) || 'TN-KARUR'}
                  onChange={handleDistrictChange}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  title="Switch District Context"
                >
                  {allDistricts.map(d => (
                    <option key={d.id} value={d.id} style={{ background: '#181b22', color: '#fff' }}>
                      {d.name.toUpperCase()} ({d.verifiedLocationCount} MINES)
                    </option>
                  ))}
                </select>
              </div>

              {districtMines.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  padding: '4px 10px', 
                  borderRadius: 6 
                }}>
                  <Building2 size={13} style={{ color: '#94a3b8' }} />
                  <select
                    value={context.mineId || (districtMines[0]?.id) || ''}
                    onChange={handleMineChange}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#e2e8f0',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      outline: 'none',
                      maxWidth: 240,
                      fontFamily: 'inherit'
                    }}
                    title="Switch Active Mine / Quarry"
                  >
                    {districtMines.map(m => (
                      <option key={m.id} value={m.id} style={{ background: '#181b22', color: '#fff' }}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="topbar-right">
            <span className="topbar-time">{new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <button className="topbar-btn" onClick={() => navigate('/portal')} title="Tamil Nadu Mining GIS Portal">
              <MapIcon size={16} />
            </button>
            <div className="user-avatar" title={`Logged in as ${role}`}>{role.charAt(0).toUpperCase()}</div>
            <button className="topbar-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page Viewport Wrapped in Error Boundary */}
        <main className="page-content">
          <ErrorBoundary title="GeoMine Module Error">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard district={context.district} mineId={context.mineId} />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/inspections" element={<Inspections />} />
              <Route path="/violations" element={<Violations />} />
              <Route path="/actions" element={<CorrectiveActions />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/gis-map" element={<GISMap />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/mine/:id" element={<MineDetail />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/contractors" element={<Contractors />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
