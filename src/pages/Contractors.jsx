import { useState, useEffect } from 'react';
import { Users, CheckCircle2, Clock, AlertTriangle, RefreshCw, AlertCircle, Shield } from 'lucide-react';
import api from '../services/api';
import { StatusBadge, RiskBadge, Toast } from '../components/Shared';

export default function Contractors() {
    const [contractorsList, setContractorsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadContractors = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getContractors();
            const normalized = (data || []).map(c => ({
                id: c.id,
                name: c.name,
                type: c.type || 'Logistics & Haulage',
                mineN: c.mine_name || 'Thennilai East',
                mine_id: c.mine_id,
                safetyScore: c.safety_score ?? 82,
                compliance: c.compliance ?? 85,
                license: c.license || 'Valid',
                status: c.status || 'Active'
            }));
            setContractorsList(normalized);
        } catch (err) {
            console.error("Contractors load error:", err);
            setError(err.message || "Failed to load contractors from PostgreSQL database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContractors();
    }, []);

    const stats = {
        total: contractorsList.length,
        active: contractorsList.filter(c => c.status === 'Active').length,
        review: contractorsList.filter(c => c.status === 'Under Review').length,
        suspended: contractorsList.filter(c => c.status === 'Suspended').length,
    };

    return (
        <div>
            {/* Header Banner */}
            <div className="page-header-banner">
                <div className="banner-left">
                    <div className="banner-icon-box">
                        <Users size={26} />
                    </div>
                    <div className="banner-title-area">
                        <h1>Contractor Management & Safety Scorecard</h1>
                        <p>Track third-party mining operators, statutory haulage licenses, and heavy machinery safety ratings.</p>
                    </div>
                </div>

                <div className="banner-photo-area">
                    <img 
                        src="/mine2.jpg" 
                        alt="Contractors Banner" 
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
                    <button className="btn-secondary" onClick={loadContractors} style={{ padding: '6px 12px', fontSize: 12 }}>Retry</button>
                </div>
            )}

            {/* KPI Cards Grid */}
            <div className="kpi-cards-grid">
                <div className="kpi-stat-card total">
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle total">
                            <Users size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">Registered Contractors</span>
                            <span className="kpi-value-num">{stats.total}</span>
                        </div>
                    </div>
                </div>

                <div className="kpi-stat-card compliant">
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle compliant">
                            <CheckCircle2 size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">Active Licenses</span>
                            <span className="kpi-value-num">{stats.active}</span>
                        </div>
                    </div>
                    <span className="kpi-trend-pill compliant">Certified</span>
                </div>

                <div className="kpi-stat-card pending">
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle pending">
                            <Clock size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">Under Review</span>
                            <span className="kpi-value-num">{stats.review}</span>
                        </div>
                    </div>
                    <span className="kpi-trend-pill pending">Pending Audit</span>
                </div>

                <div className="kpi-stat-card overdue">
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle overdue">
                            <AlertTriangle size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">Suspended Operations</span>
                            <span className="kpi-value-num">{stats.suspended}</span>
                        </div>
                    </div>
                    <span className="kpi-trend-pill overdue">Blacklisted</span>
                </div>
            </div>

            {/* Enterprise Table Card */}
            <div className="enterprise-card">
                <div className="enterprise-card-header">
                    <span className="enterprise-card-title">Contractor Registry</span>
                    <button className="btn-secondary" onClick={loadContractors} style={{ padding: '6px 12px', fontSize: 12 }}>
                        <RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 100 }}>Contractor ID</th>
                                <th>Agency / Firm Name</th>
                                <th style={{ width: 170 }}>Service Type</th>
                                <th style={{ width: 160 }}>Assigned Quarry</th>
                                <th style={{ width: 120 }}>Safety Rating</th>
                                <th style={{ width: 120 }}>Compliance</th>
                                <th style={{ width: 120 }}>DGMS License</th>
                                <th style={{ width: 120 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contractorsList.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                                        {loading ? 'Querying contractor database...' : 'No contractors registered.'}
                                    </td>
                                </tr>
                            )}
                            {contractorsList.map(c => (
                                <tr key={c.id}>
                                    <td className="mono" style={{ fontWeight: 700, color: 'var(--color-forest)' }}>{c.id}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{c.type}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{c.mineN}</td>
                                    <td>
                                        <span className="mono" style={{ fontWeight: 700, color: c.safetyScore >= 80 ? '#059669' : '#D97706' }}>
                                            {c.safetyScore} / 100
                                        </span>
                                    </td>
                                    <td>
                                        <span className="mono" style={{ fontWeight: 700, color: c.compliance >= 80 ? '#059669' : '#D97706' }}>
                                            {c.compliance}%
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge-status ${c.license === 'Valid' ? 'compliant' : 'overdue'}`}>
                                            {c.license}
                                        </span>
                                    </td>
                                    <td>
                                        <StatusBadge status={c.status} />
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
