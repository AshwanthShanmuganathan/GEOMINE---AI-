import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Shield, ClipboardCheck, FileText, AlertTriangle, Cpu, 
  Map as MapIcon, FileStack, Users, Settings as SettingsIcon, Menu, 
  Bell, LogOut, CheckSquare, Search, MapPin, Building2, Sun, Moon, ChevronDown, CheckCircle2
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
import { GeoMineLogo } from './components/Shared';
import api, { getConnectionStatus, setDemoMode, isDemoMode } from './services/api';
import { 
  mines, violations, correctiveActions, 
  getActiveContext, setActiveContext, allDistricts, getMinesByDistrict 
} from './data/mockData';

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('userRole'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dbStatus, setDbStatus] = useState(() => getConnectionStatus());
  const [theme, setTheme] = useState(() => localStorage.getItem('geomine_theme') || 'light');
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('geomine_theme', theme);
  }, [theme]);

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
    { section: 'MAIN' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'officer', 'inspector'] },
    { path: '/compliance', icon: CheckSquare, label: 'Compliance Register', roles: ['admin', 'manager', 'officer'] },
    { path: '/inspections', icon: ClipboardCheck, label: 'Inspections', roles: ['admin', 'inspector', 'officer'] },
    { path: '/violations', icon: AlertTriangle, label: 'Violations', roles: ['admin', 'manager', 'officer', 'inspector'], badge: 125 },
    { path: '/actions', icon: Shield, label: 'Corrective Actions', roles: ['admin', 'manager', 'officer'] },
    { path: '/ai-assistant', icon: Cpu, label: 'AI Risk Analysis', roles: ['admin', 'manager'] },
    { section: 'RESOURCES' },
    { path: '/gis-map', icon: MapIcon, label: 'GIS Map', roles: ['admin', 'manager', 'officer', 'inspector'] },
    { path: '/documents', icon: FileStack, label: 'Documents & OCR', roles: ['admin', 'manager', 'officer'] },
    { path: '/reports', icon: FileText, label: 'Reports', roles: ['admin', 'manager', 'officer'] },
    { path: '/contractors', icon: Users, label: 'Contractors', roles: ['admin', 'manager'] },
    { section: 'SYSTEM' },
    { path: '/audit-logs', icon: FileText, label: 'Audit Logs', roles: ['admin'] },
    { path: '/settings', icon: SettingsIcon, label: 'Settings', roles: ['admin', 'manager', 'officer', 'inspector'] },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar (Dark Forest Green with Mountain Crest Logo) */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <GeoMineLogo size={30} />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-title">GeoMine AI</span>
            <span className="sidebar-subtitle">Smart Mining Governance</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.section) return <div key={idx} className="nav-section-title">{item.section}</div>;
            if (item.roles && !item.roles.includes(role)) return null;

            const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');

            return (
              <Link key={item.path} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon"><item.icon size={17} /></div>
                <span className="nav-label">{item.label}</span>
                {item.badge > 0 && !sidebarCollapsed && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Decorative Topographic Waves SVG */}
        <div className="sidebar-waves-bg">
          <svg width="240" height="90" viewBox="0 0 240 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 45C50 20 90 70 140 40C190 10 210 60 240 50" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1.5" />
            <path d="M0 60C60 35 100 85 150 55C200 25 220 75 240 65" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1.5" />
            <path d="M0 75C70 50 110 95 160 70C210 45 230 85 240 80" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Sidebar Footer with Theme Toggle */}
        <div className="sidebar-footer">
          {!sidebarCollapsed ? (
            <div className="theme-toggle-pill">
              <button 
                type="button" 
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
                title="Light Theme"
              >
                <Sun size={13} />
              </button>
              <button 
                type="button" 
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
                title="Dark Theme"
              >
                <Moon size={13} />
              </button>
            </div>
          ) : <div />}

          <button 
            type="button" 
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Topbar (Clean White with Green Accents) */}
        <header className="topbar">
          <div className="topbar-left">
            {/* System Online Badge */}
            <div className="system-badge-pill">
              <span className="status-dot pulsing" />
              <span>System Online</span>
            </div>

            {dbStatus === 'LIVE' && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: 9999 }}>
                ● LIVE DB
              </span>
            )}
            {dbStatus === 'OFFLINE' && (
              <span 
                onClick={handleRetryDb}
                style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', background: '#FEF2F2', border: '1px solid #FECACA', padding: '3px 8px', borderRadius: 9999, cursor: 'pointer' }}
                title="Click to reconnect"
              >
                ● OFFLINE [RETRY]
              </span>
            )}

            <div className="topbar-divider" />

            {/* Interactive District Place Selector */}
            <div className="selector-pill">
              <MapPin size={15} style={{ color: 'var(--color-forest)' }} />
              <select
                value={context.districtId || (allDistricts.find(d => d.name === context.district)?.id) || 'TN-KARUR'}
                onChange={handleDistrictChange}
                title="Select District"
              >
                {allDistricts.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.verifiedLocationCount} Mines)
                  </option>
                ))}
              </select>
            </div>

            {/* Interactive Mine / Site Selector */}
            {districtMines.length > 0 && (
              <div className="selector-pill">
                <Building2 size={15} style={{ color: 'var(--color-forest)' }} />
                <select
                  value={context.mineId || (districtMines[0]?.id) || ''}
                  onChange={handleMineChange}
                  title="Select Target Quarry"
                >
                  {districtMines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="topbar-right">
            {/* Search Input */}
            <div className="search-box-pill">
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search requirements, mines..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Notifications Button */}
            <button className="icon-btn" title="Statutory Notifications">
              <Bell size={16} />
              <span className="notification-dot" />
            </button>

            {/* User Profile Pill */}
            <div className="user-profile-badge" onClick={handleLogout} title="Click to log out">
              <div className="user-avatar-circle">
                {role ? role.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="user-name-text">
                {role === 'admin' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </div>

            {/* Logout shortcut */}
            <button className="icon-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="page-content">
          <ErrorBoundary title="GeoMine Module Error">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard district={context.district} mineId={context.mineId} />} />
              <Route path="/compliance" element={<Compliance district={context.district} />} />
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
