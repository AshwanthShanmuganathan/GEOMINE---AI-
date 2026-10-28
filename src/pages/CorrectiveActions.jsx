import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { StatusBadge, Toast } from '../components/Shared';

export default function CorrectiveActions() {
    const [selected, setSelected] = useState(null);
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const loadActions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getCorrectiveActions();
            const normalized = (data || []).map(a => ({
                id: a.id,
                violation: a.violation_id || a.violation || '—',
                description: a.title || a.description || 'Corrective Measure',
                mineN: a.mine_name || a.mineN || 'Regional Site',
                mine_id: a.mine_id,
                assignedTo: a.assigned_to || a.assignedTo || 'Unassigned',
                deadline: a.deadline || '2026-11-15',
                status: a.status || 'OPEN',
                priority: a.priority || 'HIGH',
                daysRemaining: a.days_remaining ?? a.daysRemaining ?? 12,
                escalation: a.priority === 'CRITICAL' ? 'Corporate' : (a.priority === 'HIGH' ? 'Mine Manager' : 'Officer'),
                notes: a.notes
            }));
            setActions(normalized);
        } catch (err) {
            console.error("Corrective actions load error:", err);
            setError(err.message || "Failed to load corrective actions from PostgreSQL database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadActions();
    }, []);

    const stats = {
        total: actions.length,
        pending: actions.filter(a => a.status === 'PENDING' || a.status === 'OPEN').length,
        inProgress: actions.filter(a => a.status === 'IN_PROGRESS').length,
        overdue: actions.filter(a => a.status === 'OVERDUE').length,
        completed: actions.filter(a => a.status === 'COMPLETED').length,
    };

    const handleUpdate = async (status) => {
        if (!selected) return;
        try {
            const updated = await api.updateActionStatus(selected.id, status);
            setActions(actions.map(a => a.id === selected.id ? { ...a, status: updated.status } : a));
            setSelected({ ...selected, status: updated.status });
            setToast(`Action ${selected.id} status updated to ${updated.status} in PostgreSQL.`);
        } catch (err) {
            console.error("Action status update failed:", err);
            setToast(`Error: ${err.message}`);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>Corrective Action Tracking</h1>
                        <p className="subtitle">Monitor corrective actions with deadlines and escalation</p>
                    </div>
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)' }}>
                            <RefreshCw size={14} className="spin" /> Syncing Live Actions...
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
                    <button className="btn btn-sm" onClick={loadActions}>Retry</button>
                </div>
            )}

            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="kpi-panel"><div className="kpi-label">Total Actions</div><div className="kpi-value accent">{stats.total}</div></div>
                <div className="kpi-panel"><div className="kpi-label">Pending</div><div className="kpi-value risk-medium">{stats.pending}</div></div>
                <div className="kpi-panel"><div className="kpi-label">In Progress</div><div className="kpi-value" style={{ color: '#3498db' }}>{stats.inProgress}</div></div>
                <div className="kpi-panel"><div className="kpi-label">Overdue</div><div className="kpi-value risk-high">{stats.overdue}</div></div>
                <div className="kpi-panel"><div className="kpi-label">Completed</div><div className="kpi-value risk-low">{stats.completed}</div></div>
            </div>

            <div className="panel">
                <div className="panel-body" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead><tr><th>Action ID</th><th>Violation</th><th>Description</th><th>Mine</th><th>Assigned To</th><th>Deadline</th><th>Status</th><th>Days</th><th>Escalation</th></tr></thead>
                        <tbody>
                            {actions.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                        {loading ? 'Fetching corrective action items from database...' : 'No corrective actions logged.'}
                                    </td>
                                </tr>
                            )}
                            {actions.map(a => (
                                <tr key={a.id} onClick={() => setSelected(selected?.id === a.id ? null : a)}>
                                    <td className="mono">{a.id}</td>
                                    <td className="mono">{a.violation}</td>
                                    <td style={{ color: 'var(--text-primary)', maxWidth: 240 }}>{a.description}</td>
                                    <td style={{ fontSize: 11 }}>{a.mineN}</td>
                                    <td>{a.assignedTo}</td>
                                    <td className="mono">{a.deadline}</td>
                                    <td><StatusBadge status={a.status} /></td>
                                    <td>
                                        {a.status === 'COMPLETED' ? (
                                            <span className="mono" style={{ color: 'var(--risk-low)' }}>—</span>
                                        ) : a.daysRemaining < 0 ? (
                                            <span className="mono" style={{ color: 'var(--risk-high)', fontWeight: 600 }}>OVERDUE {Math.abs(a.daysRemaining)}d</span>
                                        ) : a.daysRemaining <= 3 ? (
                                            <span className="mono" style={{ color: 'var(--risk-medium)' }}>{a.daysRemaining}d left</span>
                                        ) : (
                                            <span className="mono">{a.daysRemaining}d left</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="escalation-flow">
                                            <span className={`escalation-node ${a.escalation === 'Officer' || a.escalation === 'Mine Manager' || a.escalation === 'Corporate' ? 'active' : ''}`}>Officer</span>
                                            <span className="escalation-arrow">→</span>
                                            <span className={`escalation-node ${a.escalation === 'Mine Manager' || a.escalation === 'Corporate' ? 'active' : ''}`}>Manager</span>
                                            <span className="escalation-arrow">→</span>
                                            <span className={`escalation-node ${a.escalation === 'Corporate' ? 'active' : ''}`}>Corp</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selected && (
                <div className="panel" style={{ marginTop: 16 }}>
                    <div className="panel-header">
                        <span className="panel-title">{selected.id} — Action Details</span>
                        <button className="panel-action" onClick={() => setSelected(null)}>Close ✕</button>
                    </div>
                    <div className="panel-body">
                        <div className="grid-3">
                            <div className="detail-field"><div className="detail-label">Action ID</div><div className="detail-value mono">{selected.id}</div></div>
                            <div className="detail-field"><div className="detail-label">Violation</div><div className="detail-value mono">{selected.violation}</div></div>
                            <div className="detail-field"><div className="detail-label">Status</div><div className="detail-value"><StatusBadge status={selected.status} /></div></div>
                            <div className="detail-field"><div className="detail-label">Action</div><div className="detail-value">{selected.description}</div></div>
                            <div className="detail-field"><div className="detail-label">Assigned To</div><div className="detail-value">{selected.assignedTo}</div></div>
                            <div className="detail-field"><div className="detail-label">Deadline</div><div className="detail-value mono">{selected.deadline}</div></div>
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <div className="detail-label" style={{ marginBottom: 8 }}>Escalation Chain</div>
                            <div className="escalation-flow">
                                <span className={`escalation-node ${selected.escalation === 'Officer' || selected.escalation === 'Mine Manager' || selected.escalation === 'Corporate' ? 'active' : ''}`}>Responsible Officer</span>
                                <span className="escalation-arrow">→</span>
                                <span className={`escalation-node ${selected.escalation === 'Mine Manager' || selected.escalation === 'Corporate' ? 'active' : ''}`}>Mine Manager</span>
                                <span className="escalation-arrow">→</span>
                                <span className={`escalation-node ${selected.escalation === 'Corporate' ? 'active' : ''}`}>Corporate HQ</span>
                            </div>
                        </div>
                        {selected.status !== 'COMPLETED' && (
                            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                                <button className="btn btn-accent" onClick={() => handleUpdate('IN_PROGRESS')}>Update Progress</button>
                                {selected.status !== 'OVERDUE' && <button className="btn" onClick={() => handleUpdate('COMPLETED')}>Mark Complete</button>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
