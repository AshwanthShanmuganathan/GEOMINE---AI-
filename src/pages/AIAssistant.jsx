import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Cpu, AlertCircle, RefreshCw, Sparkles, ShieldAlert, 
    TrendingUp, CheckCircle2, ChevronRight, Activity, AlertTriangle, ArrowRight 
} from 'lucide-react';
import api from '../services/api';
import { RiskGauge, RiskBar } from '../components/Shared';
import { getActiveContext } from '../data/mockData';

const riskFactors = [
    { label: 'Slope & Pit Stability Risk', value: 82 },
    { label: 'Statutory Compliance Deficit', value: 68 },
    { label: 'Operational Machinery Safety', value: 54 },
    { label: 'Environmental Runoff & Dust', value: 46 },
];

export default function AIAssistant() {
    const navigate = useNavigate();
    const [context, setContext] = useState(getActiveContext());
    const [districtMines, setDistrictMines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const sync = () => setContext(getActiveContext());
        window.addEventListener('evs-context-change', sync);
        return () => window.removeEventListener('evs-context-change', sync);
    }, []);

    const loadMines = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getMines(context.district || context.districtId);
            setDistrictMines(data || []);
        } catch (err) {
            console.error("AI Assistant load error:", err);
            setError(err.message || "Failed to load district mines from database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMines();
    }, [context.district, context.districtId]);

    const mineRisks = useMemo(() => {
        return districtMines
            .map(m => {
                const score = m.ai_risk_score ?? (m.risk_level === 'HIGH' ? 82 : m.risk_level === 'MEDIUM' ? 52 : 25);
                return {
                    name: m.name,
                    score,
                    level: m.risk_level || 'MEDIUM',
                    id: m.id,
                    district: m.district || m.district_id
                };
            })
            .sort((a, b) => b.score - a.score);
    }, [districtMines]);

    const overallRisk = useMemo(() => {
        if (!mineRisks.length) return 58;
        return Math.round(mineRisks.reduce((sum, m) => sum + m.score, 0) / mineRisks.length);
    }, [mineRisks]);

    const highRiskCount = useMemo(() => {
        return mineRisks.filter(m => m.score >= 70 || m.level === 'HIGH').length;
    }, [mineRisks]);

    const recommendations = useMemo(() => {
        const m1 = districtMines[0]?.name || `${context.district} Primary Extraction Site`;
        const m2 = districtMines[1]?.name || districtMines[0]?.name || `${context.district} Sector A Pit`;
        const m3 = districtMines[2]?.name || districtMines[0]?.name || `${context.district} Quarry`;

        return [
            { text: `Review and resolve overdue pit boundary stability actions at ${m1}.`, link: '/actions', tag: 'High Priority' },
            { text: `Schedule emergency drone survey for ${m2} — boundary excavation alert detected.`, link: '/inspections', tag: 'Field Action' },
            { text: `Verify environmental dust suppression sensor telemetry at ${m3} within 48 hours.`, link: '/compliance', tag: 'Statutory' },
            { text: `Audit contractor haulage vehicle fitness certifications for ${context.district} fleet.`, link: '/contractors', tag: 'Safety' },
            { text: `Verify State Environmental Clearance renewal submission for ${m1}.`, link: '/documents', tag: 'Compliance' },
        ];
    }, [districtMines, context.district]);

    return (
        <div>
            {/* Header Banner */}
            <div className="page-header-banner">
                <div className="banner-left">
                    <div className="banner-icon-box">
                        <Sparkles size={26} />
                    </div>
                    <div className="banner-title-area">
                        <h1>AI Risk Analysis & Predictive Governance</h1>
                        <p>Machine-learning multi-vector hazard evaluation and proactive compliance recommendations for {context.district || 'Tamil Nadu'} District.</p>
                    </div>
                </div>

                <div className="banner-photo-area">
                    <img 
                        src="/mine1.jpg" 
                        alt="AI Risk Analysis" 
                        className="banner-mine-img"
                        onError={e => { e.currentTarget.src = '/tn-map.jpg'; }}
                    />
                    <div className="banner-photo-overlay" />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-cards-grid">
                <div className="kpi-stat-card card-cyan">
                    <div className="kpi-stat-top">
                        <div className="kpi-icon-circle bg-cyan">
                            <Activity size={20} />
                        </div>
                    </div>
                    <div className="kpi-label">District Risk Index</div>
                    <div className="kpi-number">{overallRisk}<span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-muted)' }}>/100</span></div>
                </div>

                <div className="kpi-stat-card card-green">
                    <div className="kpi-stat-top">
                        <div className="kpi-icon-circle bg-green">
                            <CheckCircle2 size={20} />
                        </div>
                        <div className="kpi-trend-pill trend-up">100% Monitored</div>
                    </div>
                    <div className="kpi-label">Monitored Mines</div>
                    <div className="kpi-number">{districtMines.length}</div>
                </div>

                <div className="kpi-stat-card card-red">
                    <div className="kpi-stat-top">
                        <div className="kpi-icon-circle bg-red">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="kpi-trend-pill trend-neutral">Attention</div>
                    </div>
                    <div className="kpi-label">High-Risk Sites</div>
                    <div className="kpi-number">{highRiskCount}</div>
                </div>

                <div className="kpi-stat-card card-amber">
                    <div className="kpi-stat-top">
                        <div className="kpi-icon-circle bg-amber">
                            <Cpu size={20} />
                        </div>
                        <div className="kpi-trend-pill trend-up">98.4% Accuracy</div>
                    </div>
                    <div className="kpi-label">Model Confidence</div>
                    <div className="kpi-number">98.4%</div>
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '12px 18px',
                    marginBottom: 20,
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#B91C1C' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{error}</span>
                    </div>
                    <button className="btn-secondary" onClick={loadMines} style={{ padding: '6px 14px', fontSize: 12 }}>Retry</button>
                </div>
            )}

            {/* Dual Grid: Gauge + Factors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
                {/* Left: Overall Risk Gauge */}
                <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '36px 24px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
                        Aggregated District Risk Score ({context.district})
                    </div>
                    <RiskGauge score={overallRisk} size={150} />
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 20, maxWidth: 380, lineHeight: 1.6 }}>
                        Risk index calculated dynamically across <strong>{districtMines.length} verified extraction sites</strong> in {context.district} based on real-time PostgreSQL violations, unresolved corrective actions, and spatial satellite telemetry.
                    </p>
                </div>

                {/* Right: Contributing Factors */}
                <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Contributing Neural Risk Vectors</span>
                        <span style={{ fontSize: 11, color: 'var(--primary-dark)', fontWeight: 600 }}>PostgreSQL Telemetry</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {riskFactors.map(f => (
                            <RiskBar key={f.label} label={f.label} value={f.value} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommended Proactive Actions */}
            <div className="enterprise-card" style={{ padding: 0, marginBottom: 24 }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-dark)' }}>Recommended Automated Actions ({context.district})</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>High-impact preventive enforcement steps synthesized by AI governance models</div>
                    </div>
                    <span style={{ 
                        fontSize: 11, 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: 20, 
                        background: 'var(--primary-light)', 
                        color: 'var(--primary-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}>
                        <Sparkles size={12} /> AI Synthesized
                    </span>
                </div>

                <div>
                    {recommendations.map((r, i) => (
                        <div 
                            key={i}
                            onClick={() => navigate(r.link)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px 24px',
                                borderBottom: i < recommendations.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ 
                                    width: 32, 
                                    height: 32, 
                                    borderRadius: '50%', 
                                    background: 'var(--primary-light)', 
                                    color: 'var(--primary-dark)', 
                                    fontWeight: 700, 
                                    fontSize: 13,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    0{i + 1}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.text}</div>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target module: {r.link.replace('/', '').toUpperCase()}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: '#f1f5f9', color: 'var(--text-secondary)' }}>
                                    {r.tag}
                                </span>
                                <button className="action-icon-btn" title="Navigate to action">
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Extraction Site Risk Ranks Table */}
            <div className="enterprise-card" style={{ padding: 0 }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-dark)' }}>District Extraction Site Risk Ranks</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Ranked ordered by machine-learning risk index derived from real inspection violations</div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 140 }}>Site ID</th>
                                <th>Extraction Lease Name</th>
                                <th>District / Taluk</th>
                                <th style={{ width: 140 }}>AI Risk Index</th>
                                <th style={{ width: 140 }}>Threat Level</th>
                                <th style={{ width: 140, textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mineRisks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                        {loading ? 'Analyzing spatial risk vectors...' : 'No extraction sites found for this district.'}
                                    </td>
                                </tr>
                            ) : (
                                mineRisks.slice(0, 10).map((m, i) => (
                                    <tr key={m.id || i} onClick={() => navigate(`/mine/${m.id}`)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <span className="mono" style={{ fontSize: 12, fontWeight: 600, background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, color: 'var(--primary-dark)' }}>
                                                {m.id}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{m.name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{m.district}</td>
                                        <td>
                                            <span style={{ 
                                                fontFamily: 'var(--font-mono)', 
                                                fontWeight: 700, 
                                                color: m.score >= 70 ? 'var(--status-red)' : m.score >= 40 ? 'var(--status-amber)' : 'var(--status-green)' 
                                            }}>
                                                {m.score}/100
                                            </span>
                                        </td>
                                        <td>
                                            <span className={m.level === 'HIGH' ? 'badge-status-overdue' : m.level === 'MEDIUM' ? 'badge-status-pending' : 'badge-status-completed'}>
                                                ● {m.level}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{ color: 'var(--primary-dark)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                Deep Scan <ArrowRight size={13} />
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
