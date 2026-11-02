import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    LayoutDashboard, MapPin, CheckCircle2, AlertTriangle, ShieldAlert, 
    TrendingUp, ExternalLink, RefreshCw, AlertCircle, Eye, ArrowUpRight 
} from 'lucide-react';
import api from '../services/api';
import { chartData } from '../data/mockData';
import { StatusBadge, RiskBadge } from '../components/Shared';

export default function Dashboard({ district, mineId }) {
    const navigate = useNavigate();
    const [rawMines, setRawMines] = useState([]);
    const [rawViolations, setRawViolations] = useState([]);
    const [rawComplianceItems, setRawComplianceItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [minesData, violationsData, complianceData] = await Promise.all([
                api.getMines(district),
                api.getViolations({ district }),
                api.getComplianceItems({ district })
            ]);

            setRawMines(minesData || []);
            setRawViolations(violationsData || []);
            setRawComplianceItems(complianceData || []);
        } catch (err) {
            console.error("Dashboard data load error:", err);
            setError(err.message || "Failed to load live dashboard data from PostgreSQL backend.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [district]);

    // Normalize mine records for consistent rendering
    const mines = useMemo(() => {
        return rawMines.map(m => ({
            ...m,
            compliance: m.compliance_score ?? m.compliance ?? 80,
            riskLevel: m.risk_level ?? m.riskLevel ?? 'MEDIUM',
            status: m.operational_status ?? m.status ?? 'Active',
            violations: m.open_violations ?? m.violations ?? 0,
            type: m.mine_type ?? m.type ?? 'Quarry',
            lastInspection: m.last_inspection ?? m.lastInspection ?? '—'
        }));
    }, [rawMines]);

    const activeMines = mines.filter(m => m.status === 'Active').length;
    const avgCompliance = mines.length ? Math.round(mines.reduce((sum, m) => sum + (m.compliance || 0), 0) / mines.length) : 0;
    const highRiskMines = mines.filter(m => m.riskLevel === 'HIGH' || m.riskLevel === 'CRITICAL' || (m.risk && m.risk >= 70)).length;
    const openViolations = rawViolations.filter(v => v.status === 'OPEN').length;

    const attentionItems = useMemo(() => {
        const items = [];
        rawComplianceItems.filter(c => c.status === 'OVERDUE').forEach(c => {
            items.push({ severity: 'high', mine: c.mine_name || c.mineN || 'Mining Site', desc: `Overdue: ${c.requirement}`, link: '/compliance' });
        });
        rawViolations.filter(v => v.severity === 'CRITICAL' && v.status !== 'RESOLVED').forEach(v => {
            items.push({ severity: 'high', mine: v.mine_name || v.mineN || 'Mining Site', desc: v.description, link: '/violations' });
        });
        rawViolations.filter(v => v.severity === 'HIGH' && v.status === 'OVERDUE').forEach(v => {
            items.push({ severity: 'medium', mine: v.mine_name || v.mineN || 'Mining Site', desc: `Overdue: ${v.description}`, link: '/violations' });
        });
        return items.slice(0, 6);
    }, [rawComplianceItems, rawViolations]);

    return (
        <div>
            {/* Top Banner with Clean Mine Landscape */}
            <div className="page-header-banner">
                <div className="banner-left">
                    <div className="banner-icon-box">
                        <LayoutDashboard size={26} />
                    </div>
                    <div className="banner-title-area">
                        <h1>{district ? `${district} | ` : ''}Governance Dashboard</h1>
                        <p>Real-time statutory compliance, environmental telemetry, and safety risks across regional mines.</p>
                    </div>
                </div>

                <div className="banner-photo-area">
                    <img 
                        src="/mine2.jpg" 
                        alt="Mining Excavation Overview" 
                        className="banner-mine-img"
                        onError={e => { e.currentTarget.src = '/tn-map.jpg'; }}
                    />
                    <div className="banner-photo-overlay" />
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '12px 18px',
                    marginBottom: 20,
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#B91C1C' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{error}</span>
                    </div>
                    <button className="btn-secondary" onClick={loadDashboardData} style={{ padding: '6px 12px', fontSize: 12 }}>
                        Retry Connection
                    </button>
                </div>
            )}

            {/* KPI 4-Card Grid */}
            <div className="kpi-cards-grid">
                <div className="kpi-stat-card total" onClick={() => navigate('/tamil-nadu-mines')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle total">
                            <MapPin size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">Regional Mines</span>
                            <span className="kpi-value-num">{mines.length}</span>
                        </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0F766E' }}>{district || 'State'}</span>
                </div>

                <div className="kpi-stat-card compliant">
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle compliant">
                            <CheckCircle2 size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">Active Operations</span>
                            <span className="kpi-value-num">{activeMines}</span>
                        </div>
                    </div>
                    <span className="kpi-trend-pill compliant">
                        {mines.length ? Math.round((activeMines / mines.length) * 100) : 100}% Active
                    </span>
                </div>

                <div className="kpi-stat-card pending" onClick={() => navigate('/compliance')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle pending">
                            <TrendingUp size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">Avg Compliance</span>
                            <span className="kpi-value-num">{avgCompliance}%</span>
                        </div>
                    </div>
                    <span className="kpi-trend-pill pending">
                        {avgCompliance >= 80 ? 'Target Met' : 'Needs Review'}
                    </span>
                </div>

                <div className="kpi-stat-card overdue" onClick={() => navigate('/violations')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle overdue">
                            <ShieldAlert size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">High-Risk Watchlist</span>
                            <span className="kpi-value-num">{highRiskMines}</span>
                        </div>
                    </div>
                    <span className="kpi-trend-pill overdue">
                        {openViolations} Open Citations
                    </span>
                </div>
            </div>

            {/* Split Grid: Attention Required & Regional Risk Trend */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Attention Required Card */}
                <div className="enterprise-card" style={{ marginBottom: 0 }}>
                    <div className="enterprise-card-header">
                        <span className="enterprise-card-title">Priority Attention Required</span>
                        <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => navigate('/violations')}>
                            View All <ArrowUpRight size={12} />
                        </button>
                    </div>
                    <div style={{ padding: '6px 0' }}>
                        {attentionItems.length === 0 ? (
                            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                {loading ? 'Syncing statutory records...' : 'No critical compliance alerts for this district.'}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {attentionItems.map((item, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => navigate(item.link)}
                                        style={{
                                            padding: '12px 20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            borderBottom: i === attentionItems.length - 1 ? 'none' : '1px solid var(--color-border-subtle)',
                                            cursor: 'pointer',
                                            transition: 'background 120ms ease'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ 
                                                width: 8, 
                                                height: 8, 
                                                borderRadius: '50%', 
                                                background: item.severity === 'high' ? '#EF4444' : '#F59E0B' 
                                            }} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{item.mine}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
                                            </div>
                                        </div>
                                        <span className={`badge-status ${item.severity === 'high' ? 'overdue' : 'pending'}`}>
                                            {item.severity.toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Regional Risk Trend Card with Recharts */}
                <div className="enterprise-card" style={{ marginBottom: 0 }}>
                    <div className="enterprise-card-header">
                        <span className="enterprise-card-title">Regional Compliance & Risk Trend</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Last 6 Months</span>
                    </div>
                    <div style={{ padding: '20px 24px' }}>
                        <div style={{ height: 210 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.riskTrend}>
                                    <defs>
                                        <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.06)', fontSize: 12 }} />
                                    <Area type="monotone" dataKey="compliance" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#compGrad)" name="Compliance %" />
                                    <Area type="monotone" dataKey="risk" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#riskGrad)" name="Risk Score" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Regional Mine Overview Table */}
            <div className="enterprise-card">
                <div className="enterprise-card-header">
                    <span className="enterprise-card-title">Registered Mines & Quarries ({mines.length})</span>
                    <button className="btn-secondary" onClick={() => navigate('/gis-map')} style={{ padding: '6px 12px', fontSize: 12 }}>
                        View on GIS Map &rarr;
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Quarry Name</th>
                                <th>District</th>
                                <th>Excavation Type</th>
                                <th>Compliance</th>
                                <th>Risk Level</th>
                                <th>Status</th>
                                <th>Violations</th>
                                <th>Last Audit</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mines.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                                        {loading ? 'Connecting to database...' : 'No mines found for this district.'}
                                    </td>
                                </tr>
                            )}
                            {mines.map(m => (
                                <tr key={m.id} onClick={() => navigate(`/mine/${m.id}`)} style={{ cursor: 'pointer' }}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {m.name}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>
                                        {m.district || m.district_id || m.location}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                        {m.type}
                                    </td>
                                    <td>
                                        <span className="mono" style={{ fontWeight: 700, color: m.compliance >= 85 ? '#059669' : m.compliance >= 70 ? '#D97706' : '#DC2626' }}>
                                            {m.compliance}%
                                        </span>
                                    </td>
                                    <td>
                                        <RiskBadge level={m.riskLevel} />
                                    </td>
                                    <td>
                                        <StatusBadge status={m.status} />
                                    </td>
                                    <td className="mono" style={{ fontWeight: 600, color: m.violations > 0 ? '#DC2626' : 'var(--text-muted)' }}>
                                        {m.violations}
                                    </td>
                                    <td className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {m.lastInspection}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-forest)' }}>
                                            Inspect &rarr;
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
