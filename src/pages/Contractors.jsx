import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/Shared';

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
                type: c.type || 'Logistics & Transport',
                mineN: c.mine_name || 'State Extraction Sites',
                mine_id: c.mine_id,
                safetyScore: c.safety_score ?? 80,
                compliance: c.compliance ?? 80,
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
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>Contractor Management</h1>
                        <p className="subtitle">Track third-party compliance, safety performance, and licensing.</p>
                    </div>
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)' }}>
                            <RefreshCw size={14} className="spin" /> Querying Database...
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
                    <button className="btn btn-sm" onClick={loadContractors}>Retry</button>
                </div>
            )}

            <div className="kpi-strip">
                <div className="kpi-item">
                    <span className="kpi-item-label">Total Contractors</span>
                    <span className="kpi-item-value">{stats.total}</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-item-label">Active</span>
                    <span className="kpi-item-value" style={{ color: 'var(--risk-low)' }}>{stats.active}</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-item-label">Under Review</span>
                    <span className="kpi-item-value" style={{ color: stats.review > 0 ? 'var(--risk-medium)' : 'var(--text-primary)' }}>{stats.review}</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-item-label">Suspended</span>
                    <span className="kpi-item-value" style={{ color: stats.suspended > 0 ? 'var(--risk-high)' : 'var(--text-primary)' }}>{stats.suspended}</span>
                </div>
            </div>

            <div className="panel">
                <div className="panel-header">
                    <span className="panel-title">Contractor Database</span>
                </div>
                <div style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Company Name</th>
                                <th>Service Type</th>
                                <th>Primary Mine</th>
                                <th>Safety Score</th>
                                <th>Compliance</th>
                                <th>License</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contractorsList.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                        {loading ? 'Fetching contractor records from PostgreSQL...' : 'No contractors found.'}
                                    </td>
                                </tr>
                            )}
                            {contractorsList.map(c => (
                                <tr key={c.id}>
                                    <td className="mono">{c.id}</td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</td>
                                    <td>{c.type}</td>
                                    <td>{c.mineN}</td>
                                    <td>
                                        <span className="mono" style={{ color: c.safetyScore >= 80 ? 'var(--risk-low)' : c.safetyScore >= 65 ? 'var(--risk-medium)' : 'var(--risk-high)' }}>
                                            {c.safetyScore}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="mono" style={{ color: c.compliance >= 80 ? 'var(--risk-low)' : c.compliance >= 65 ? 'var(--risk-medium)' : 'var(--risk-high)' }}>
                                            {c.compliance}%
                                        </span>
                                    </td>
                                    <td><span className={`badge ${c.license === 'Valid' ? 'badge-compliant' : 'badge-overdue'}`}>{c.license.toUpperCase()}</span></td>
                                    <td>
                                        <span className={`badge ${c.status === 'Active' ? 'badge-compliant' : c.status === 'Under Review' ? 'badge-pending' : 'badge-overdue'}`}>
                                            {c.status.toUpperCase()}
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
