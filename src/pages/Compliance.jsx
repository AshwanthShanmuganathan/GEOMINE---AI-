import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, RefreshCw, Check } from 'lucide-react';
import api from '../services/api';
import { StatusBadge, Toast } from '../components/Shared';

export default function Compliance() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const loadCompliance = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getComplianceItems();
            setItems(data || []);
        } catch (err) {
            console.error("Compliance load error:", err);
            setError(err.message || "Failed to load statutory compliance register from database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCompliance();
    }, []);

    const handleToggleStatus = async (item, e) => {
        e.stopPropagation();
        const nextStatus = item.status === 'COMPLIANT' ? 'PENDING' : 'COMPLIANT';
        try {
            const updated = await api.updateComplianceStatus(item.id, nextStatus);
            setItems(items.map(it => it.id === item.id ? { ...it, status: updated.status } : it));
            setToast(`Requirement ${item.id} status updated to ${updated.status} in PostgreSQL.`);
        } catch (err) {
            console.error("Failed to update compliance status:", err);
            setToast(`Error: ${err.message}`);
        }
    };

    const stats = {
        total: items.length,
        compliant: items.filter(c => c.status === 'COMPLIANT').length,
        pending: items.filter(c => c.status === 'PENDING').length,
        overdue: items.filter(c => c.status === 'OVERDUE').length,
    };

    const filtered = items.filter(c => {
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter.toUpperCase();
        const matchesCategory = categoryFilter === 'All' || (c.category || '').toLowerCase() === categoryFilter.toLowerCase();
        return matchesStatus && matchesCategory;
    });

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>Compliance Register</h1>
                        <p className="subtitle">Track statutory requirements, renewals, and ongoing compliance status.</p>
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
                        <AlertTriangle size={18} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{error}</span>
                    </div>
                    <button className="btn btn-sm" onClick={loadCompliance}>Retry Connection</button>
                </div>
            )}

            <div className="kpi-strip">
                <div className="kpi-item">
                    <span className="kpi-item-label">Total Requirements</span>
                    <span className="kpi-item-value">{stats.total}</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-item-label">Compliant</span>
                    <span className="kpi-item-value" style={{ color: 'var(--risk-low)' }}>{stats.compliant}</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-item-label">Pending</span>
                    <span className="kpi-item-value" style={{ color: 'var(--risk-medium)' }}>{stats.pending}</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-item-label">Overdue</span>
                    <span className="kpi-item-value" style={{ color: stats.overdue > 0 ? 'var(--risk-high)' : 'inherit' }}>{stats.overdue}</span>
                </div>
            </div>

            <div className="filters-bar">
                <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Compliant">Compliant</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                </select>
                <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                    <option value="All">All Categories</option>
                    <option value="Safety">Safety</option>
                    <option value="Environment">Environment</option>
                    <option value="Labour">Labour</option>
                </select>
            </div>

            <div className="panel">
                <div style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Req ID</th>
                                <th>Requirement</th>
                                <th>Category</th>
                                <th>Mine</th>
                                <th>Frequency</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Mark Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                        {loading ? 'Fetching statutory compliance items...' : 'No compliance requirements found.'}
                                    </td>
                                </tr>
                            )}
                            {filtered.map(item => (
                                <tr key={item.id} onClick={() => item.mine_id && navigate(`/mine/${item.mine_id}`)}>
                                    <td className="mono">{item.id}</td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: 300 }}>{item.requirement}</td>
                                    <td>{item.category}</td>
                                    <td>{item.mine_name || item.mineN || 'General'}</td>
                                    <td>{item.frequency}</td>
                                    <td className="mono" style={{ color: item.status === 'OVERDUE' ? 'var(--risk-high)' : 'inherit', fontWeight: item.status === 'OVERDUE' ? 600 : 400 }}>{item.due_date || item.dueDate}</td>
                                    <td><StatusBadge status={item.status} /></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="btn btn-sm"
                                            onClick={(e) => handleToggleStatus(item, e)}
                                            style={{
                                                fontSize: 10,
                                                padding: '2px 8px',
                                                background: item.status === 'COMPLIANT' ? 'rgba(212, 168, 75, 0.15)' : 'rgba(76, 175, 120, 0.15)',
                                                color: item.status === 'COMPLIANT' ? 'var(--risk-medium)' : 'var(--risk-low)',
                                                border: `1px solid ${item.status === 'COMPLIANT' ? 'var(--risk-medium)' : 'var(--risk-low)'}`
                                            }}
                                            title="Toggle statutory compliance status"
                                        >
                                            {item.status === 'COMPLIANT' ? 'Set Pending' : 'Mark Compliant'}
                                        </button>
                                    </td>
                                    <td style={{ textAlign: 'right' }}><span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>View Mine &rarr;</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
