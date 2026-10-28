import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { chartData } from '../data/mockData';

export default function Dashboard({ district }) {
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
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>{district ? `${district.toUpperCase()} | ` : ''}Governance Dashboard</h1>
                        <p className="subtitle">Real-time compliance, safety and risk status across monitored regional mines.</p>
                    </div>
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)' }}>
                            <RefreshCw size={14} className="spin" /> Syncing Live DB...
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: 20,
                    background: 'rgba(212, 80, 80, 0.12)',
                    border: '1px solid rgba(212, 80, 80, 0.35)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ff6b6b' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{error}</span>
                    </div>
                    <button 
                        className="btn btn-sm" 
                        onClick={loadDashboardData}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        Retry Connection
                    </button>
                </div>
            )}

            {/* KPI Strip - compact, unified */}
            <div className="kpi-strip">
                <div className="kpi-item">
                    <span className="kpi-item-label">Regional Mines</span>
                    <span className="kpi-item-value">{mines.length}</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-item-label">Active Operations</span>
                    <span className="kpi-item-value" style={{ color: 'var(--risk-low)' }}>{activeMines}</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-item-label">Avg Compliance</span>
                    <span className="kpi-item-value" style={{ color: avgCompliance >= 80 ? 'var(--risk-low)' : 'var(--risk-medium)' }}>{avgCompliance}%</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-item-label">High-Risk Watchlist</span>
                    <span className="kpi-item-value" style={{ color: highRiskMines > 0 ? 'var(--risk-high)' : 'var(--text-primary)' }}>{highRiskMines}</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-item-label">Open Violations</span>
                    <span className="kpi-item-value" style={{ color: 'var(--risk-medium)' }}>{openViolations}</span>
                </div>
            </div>

            <div className="grid-2">
                <div className="panel">
                    <div className="panel-header">
                        <span className="panel-title">Attention Required</span>
                        <button className="panel-action" onClick={() => navigate('/violations')}>View all &rarr;</button>
                    </div>
                    <div style={{ padding: 0 }}>
                        <ul className="attention-list">
                            {attentionItems.length === 0 && (
                                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {loading ? 'Checking statutory records...' : 'No critical alerts for this district.'}
                                </div>
                            )}
                            {attentionItems.map((item, i) => (
                                <li key={i} className="attention-item" onClick={() => navigate(item.link)}>
                                    <div className={`attention-severity ${item.severity}`} />
                                    <div className="attention-body">
                                        <div className="attention-mine">{item.mine}</div>
                                        <div className="attention-desc">{item.desc}</div>
                                    </div>
                                    <span className={`attention-badge badge badge-${item.severity === 'high' ? 'high' : 'medium'}`}>
                                        {item.severity.toUpperCase()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="panel">
                    <div className="panel-header">
                        <span className="panel-title">Regional Risk Trend</span>
                    </div>
                    <div className="panel-body">
                        <div style={{ height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.riskTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="month" stroke="#636674" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#636674" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: '#1c1f28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 12 }} />
                                    <Area type="monotone" dataKey="compliance" stroke="#4caf78" fill="rgba(76,175,120,0.08)" strokeWidth={2} name="Compliance %" />
                                    <Area type="monotone" dataKey="risk" stroke="#d45050" fill="rgba(212,80,80,0.08)" strokeWidth={2} name="Risk Score" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel">
                <div className="panel-header">
                    <span className="panel-title">District Mine Overview</span>
                </div>
                <div style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Mine</th>
                                <th>District</th>
                                <th>Type</th>
                                <th>Compliance</th>
                                <th>Risk</th>
                                <th>Status</th>
                                <th>Violations</th>
                                <th>Last Inspection</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mines.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                        {loading ? 'Loading verified mines from database...' : 'No mines registered for this district.'}
                                    </td>
                                </tr>
                            )}
                            {mines.map(m => (
                                <tr key={m.id} onClick={() => navigate(`/mine/${m.id}`)}>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{m.name}</td>
                                    <td>{m.district || m.district_id || m.location}</td>
                                    <td>{m.type}</td>
                                    <td>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12, color: m.compliance >= 85 ? 'var(--risk-low)' : m.compliance >= 70 ? 'var(--risk-medium)' : 'var(--risk-high)' }}>
                                            {m.compliance}%
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${(m.riskLevel || 'medium').toLowerCase()}`}>{m.riskLevel}</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${m.status === 'Active' ? 'badge-compliant' : 'badge-pending'}`}>{m.status.toUpperCase()}</span>
                                    </td>
                                    <td className="mono">{m.violations}</td>
                                    <td className="mono">{m.lastInspection}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
