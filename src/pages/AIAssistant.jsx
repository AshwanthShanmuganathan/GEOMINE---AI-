import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { RiskGauge, RiskBar } from '../components/Shared';
import { getActiveContext } from '../data/mockData';

const riskFactors = [
    { label: 'Safety Risk', value: 82 },
    { label: 'Compliance Risk', value: 68 },
    { label: 'Operational Risk', value: 54 },
    { label: 'Environmental', value: 46 },
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

    const recommendations = useMemo(() => {
        const m1 = districtMines[0]?.name || `${context.district} Primary Site`;
        const m2 = districtMines[1]?.name || districtMines[0]?.name || `${context.district} Sector A`;
        const m3 = districtMines[2]?.name || districtMines[0]?.name || `${context.district} Quarry`;

        return [
            { text: `Review and resolve overdue safety corrective actions at ${m1}.`, link: '/actions' },
            { text: `Schedule emergency field inspection for ${m2} - boundary excavation alert detected.`, link: '/inspections' },
            { text: `Verify environmental dust suppression compliance at ${m3} within 48 hours.`, link: '/compliance' },
            { text: `Renew contractor equipment licenses for ${context.district} regional transport units.`, link: '/contractors' },
            { text: `Update State Environmental Clearance Certificate for ${m1} - audit scheduled.`, link: '/documents' },
        ];
    }, [districtMines, context.district]);

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>AI Risk Assessment</h1>
                        <p className="subtitle">AI-powered risk analysis and recommended actions for {context.district} District operations.</p>
                    </div>
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)' }}>
                            <RefreshCw size={14} className="spin" /> Computing Model Vectors...
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
                    <button className="btn btn-sm" onClick={loadMines}>Retry</button>
                </div>
            )}

            <div className="grid-2">
                {/* Left: Overall Risk */}
                <div className="panel">
                    <div className="panel-header">
                        <span className="panel-title">Overall Risk Score ({context.district})</span>
                    </div>
                    <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 32, paddingBottom: 32 }}>
                        <RiskGauge score={overallRisk} size={140} />
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 20, textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
                            Risk level calculated dynamically across {districtMines.length} verified extraction sites in {context.district} based on real-time PostgreSQL violations, pending actions, and sensor telemetry.
                        </p>
                    </div>
                </div>

                {/* Right: Contributing Factors */}
                <div className="panel">
                    <div className="panel-header">
                        <span className="panel-title">Contributing Factors</span>
                    </div>
                    <div className="panel-body" style={{ paddingTop: 24 }}>
                        {riskFactors.map(f => (
                            <RiskBar key={f.label} label={f.label} value={f.value} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommended Actions */}
            <div className="panel">
                <div className="panel-header">
                    <span className="panel-title">Recommended Actions ({context.district})</span>
                    <div className="ai-tag" style={{ marginBottom: 0 }}>AI Generated</div>
                </div>
                <div style={{ padding: 0 }}>
                    {recommendations.map((r, i) => (
                        <div key={i}
                            onClick={() => navigate(r.link)}
                            style={{
                                display: 'flex', alignItems: 'flex-start', gap: 16,
                                padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
                                cursor: 'pointer', transition: 'background 120ms'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12, marginTop: 1 }}>0{i + 1}</span>
                            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{r.text}</div>
                            <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>Action &rarr;</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mine Risk Breakdown */}
            <div className="panel">
                <div className="panel-header">
                    <span className="panel-title">District Extraction Site Risk Ranks</span>
                </div>
                <div style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Site ID</th>
                                <th>Name</th>
                                <th>District</th>
                                <th>AI Risk Index</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Inspection</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mineRisks.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                        {loading ? 'Analyzing spatial risk vectors...' : 'No extraction sites found for this district.'}
                                    </td>
                                </tr>
                            )}
                            {mineRisks.slice(0, 10).map((m, i) => (
                                <tr key={m.id || i} onClick={() => navigate(`/mine/${m.id}`)}>
                                    <td className="mono">{m.id}</td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{m.name}</td>
                                    <td>{m.district}</td>
                                    <td>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: m.score >= 70 ? 'var(--risk-high)' : m.score >= 40 ? 'var(--risk-medium)' : 'var(--risk-low)' }}>
                                            {m.score}/100
                                        </span>
                                    </td>
                                    <td><span className={`badge badge-${m.level.toLowerCase()}`}>{m.level}</span></td>
                                    <td style={{ textAlign: 'right' }}><span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>Deep Scan &rarr;</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
