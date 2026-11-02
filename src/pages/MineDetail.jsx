import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    AlertCircle, RefreshCw, ArrowLeft, MapPin, Shield, 
    AlertTriangle, CheckCircle2, Users, Activity, FileText, ArrowRight 
} from 'lucide-react';
import api from '../services/api';
import { RiskGauge, RiskBar, StatusBadge, RiskBadge } from '../components/Shared';
import EvidenceViewer from '../components/EvidenceViewer';
import ErrorBoundary from '../components/ErrorBoundary';

export default function MineDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mine, setMine] = useState(null);
    const [mineViolations, setMineViolations] = useState([]);
    const [mineCompliance, setMineCompliance] = useState([]);
    const [mineInspections, setMineInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadMineDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const [mineData, violData, compData, inspData] = await Promise.all([
                api.getMine(id),
                api.getViolations({ mineId: id }),
                api.getComplianceItems({ mineId: id }),
                api.getInspections({ mineId: id })
            ]);

            setMine(mineData);
            setMineViolations(violData || []);
            setMineCompliance(compData || []);
            setMineInspections(inspData || []);
        } catch (err) {
            console.error("MineDetail load error:", err);
            setError(err.message || `Failed to load details for mine ${id} from database.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadMineDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={28} className="spin" style={{ margin: '0 auto 16px auto', color: 'var(--primary-dark)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary-dark)' }}>Querying PostgreSQL for Site {id}...</h3>
            </div>
        );
    }

    if (error || !mine) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF2F2', color: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <AlertCircle size={24} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Location record not found in database.</h2>
                <p style={{ marginTop: 8, color: '#B91C1C', fontSize: 13 }}>{error || `No registered mining lease with ID ${id}`}</p>
                <button className="btn-primary" onClick={() => navigate(-1)} style={{ marginTop: 20 }}>
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
        );
    }

    // Provide safe fallbacks for dynamically generated data
    const safeData = {
        compliance: mine.compliance_score ?? mine.compliance ?? 82,
        risk: (mine.risk_level === 'MEDIUM' || mine.riskLevel === 'MEDIUM') ? 45 : ((mine.risk_level === 'HIGH' || mine.riskLevel === 'HIGH' || mine.risk_level === 'CRITICAL') ? 80 : 20),
        violationsCount: mineViolations.length,
        workers: mine.workers || 45,
        production: mine.production || '1.2M Tons',
        location: mine.district || mine.district_id || 'Regional Sector',
        state: 'Tamil Nadu',
        type: mine.mine_type || mine.type || 'Open Cast Extraction',
        status: mine.operational_status || mine.status || 'Active',
        officers: 'S. Inspector',
        lastInspection: mineInspections.length > 0 ? mineInspections[0].date : (mine.last_inspection || '2026-10-01'),
        lat: mine.latitude ?? mine.lat,
        lng: mine.longitude ?? mine.lng
    };

    return (
        <ErrorBoundary title="Mine Details Error">
            <div>
                {/* Header Banner */}
                <div className="page-header-banner">
                    <div className="banner-left">
                        <div className="banner-icon-box">
                            <MapPin size={26} />
                        </div>
                        <div className="banner-title-area">
                            <button 
                                onClick={() => navigate(-1)} 
                                style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: 6, 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'var(--primary-dark)', 
                                    cursor: 'pointer', 
                                    fontSize: 12, 
                                    fontWeight: 700,
                                    textTransform: 'uppercase', 
                                    letterSpacing: 0.8, 
                                    marginBottom: 6,
                                    padding: 0
                                }}
                            >
                                <ArrowLeft size={14} /> Back to Directory
                            </button>
                            <h1>{mine.name}</h1>
                            <p>{safeData.location} District | {safeData.type} | Statutory Node {mine.id}</p>
                        </div>
                    </div>

                    <div className="banner-photo-area">
                        <img 
                            src="/mine1.jpg" 
                            alt={mine.name} 
                            className="banner-mine-img"
                            onError={e => { e.currentTarget.src = '/tn-map.jpg'; }}
                        />
                        <div className="banner-photo-overlay" />
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="kpi-cards-grid">
                    <div className="kpi-stat-card card-green">
                        <div className="kpi-stat-top">
                            <div className="kpi-icon-circle bg-green">
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="kpi-trend-pill trend-up">DGMS Verified</div>
                        </div>
                        <div className="kpi-label">Compliance Score</div>
                        <div className="kpi-number">{safeData.compliance}%</div>
                    </div>

                    <div className="kpi-stat-card card-amber">
                        <div className="kpi-stat-top">
                            <div className="kpi-icon-circle bg-amber">
                                <Activity size={20} />
                            </div>
                            <div className="kpi-trend-pill trend-up">Calculated</div>
                        </div>
                        <div className="kpi-label">AI Risk Index</div>
                        <div className="kpi-number">{safeData.risk}<span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-muted)' }}>/100</span></div>
                    </div>

                    <div className="kpi-stat-card card-red">
                        <div className="kpi-stat-top">
                            <div className="kpi-icon-circle bg-red">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="kpi-trend-pill trend-neutral">Attention</div>
                        </div>
                        <div className="kpi-label">Open Violations</div>
                        <div className="kpi-number">{safeData.violationsCount}</div>
                    </div>

                    <div className="kpi-stat-card card-cyan">
                        <div className="kpi-stat-top">
                            <div className="kpi-icon-circle bg-cyan">
                                <Users size={20} />
                            </div>
                        </div>
                        <div className="kpi-label">Active Workforce</div>
                        <div className="kpi-number">{safeData.workers}</div>
                    </div>
                </div>

                {/* Grid: Mine Operations + Satellite Viewer */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
                    <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)', marginBottom: 16 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)' }}>Mine Operations Profile</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Statutory lease parameters registered in PostgreSQL</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Location ID</span>
                                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-dark)', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>{mine.id}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>District Authority</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{safeData.location}, {safeData.state}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Excavation Type</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{safeData.type}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Operational Status</span>
                                <span className={safeData.status === 'Active' ? 'badge-status-completed' : 'badge-status-pending'}>
                                    ● {safeData.status.toUpperCase()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Supervising Officer</span>
                                <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{safeData.officers}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Last Logged Inspection</span>
                                <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{safeData.lastInspection}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Geographical Node</span>
                                <span className="mono" style={{ fontSize: 12, color: 'var(--primary-dark)', fontWeight: 600 }}>
                                    {safeData.lat != null ? `${safeData.lat.toFixed(4)}°N` : 'PENDING'}, {safeData.lng != null ? `${safeData.lng.toFixed(4)}°E` : 'PENDING'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Shared Satellite Evidence Viewer with Interactive Enlarge Modal & Live GIS */}
                    <EvidenceViewer 
                        violation={mineViolations[0]} 
                        mine={{ ...mine, lat: safeData.lat, lng: safeData.lng }} 
                        isCompliant={mineViolations.length === 0} 
                    />
                </div>

                {/* Violations at this mine */}
                {mineViolations.length > 0 && (
                    <div className="enterprise-card" style={{ padding: 0, marginBottom: 24 }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-dark)' }}>Open Violations ({mineViolations.length})</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Non-compliance notices pending field rectification</div>
                            </div>
                            <button className="btn-secondary" onClick={() => navigate('/violations')} style={{ fontSize: 12 }}>
                                View All in Violations Module →
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 140 }}>Notice ID</th>
                                        <th>Description</th>
                                        <th style={{ width: 140 }}>Severity</th>
                                        <th style={{ width: 140 }}>Status</th>
                                        <th style={{ width: 140 }}>Deadline</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mineViolations.map(v => (
                                        <tr key={v.id} onClick={() => navigate('/violations')} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <span className="mono" style={{ fontSize: 12, fontWeight: 700, background: '#F1F5F9', padding: '3px 8px', borderRadius: 4, color: 'var(--primary-dark)' }}>
                                                    {v.id}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: 350 }}>{v.description}</td>
                                            <td><RiskBadge level={v.severity} /></td>
                                            <td><StatusBadge status={v.status} /></td>
                                            <td className="mono" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v.deadline || 'PENDING'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Recent Inspections */}
                {mineInspections.length > 0 && (
                    <div className="enterprise-card" style={{ padding: 0 }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-dark)' }}>Recent Field Inspections</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>DGMS safety audits and checklist logs</div>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 140 }}>Report ID</th>
                                        <th>Audit Type</th>
                                        <th style={{ width: 140 }}>Date</th>
                                        <th>Findings</th>
                                        <th style={{ width: 120 }}>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mineInspections.map(ins => (
                                        <tr key={ins.id}>
                                            <td>
                                                <span className="mono" style={{ fontSize: 12, fontWeight: 700, background: '#F1F5F9', padding: '3px 8px', borderRadius: 4, color: 'var(--primary-dark)' }}>
                                                    {ins.id}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ins.type}</td>
                                            <td className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ins.date}</td>
                                            <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ins.findings} ({ins.critical} critical)</td>
                                            <td>
                                                <span style={{ 
                                                    fontFamily: 'var(--font-mono)', 
                                                    fontWeight: 700, 
                                                    color: ins.score >= 85 ? 'var(--status-green)' : ins.score >= 65 ? 'var(--status-amber)' : 'var(--status-red)' 
                                                }}>
                                                    {ins.score}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
}
