import { useState, useEffect, useMemo } from 'react';
import { Shield, CheckCircle2, Clock, AlertTriangle, RefreshCw, AlertCircle, Eye, Check, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { StatusBadge, Toast, Drawer, Pagination } from '../components/Shared';

export default function CorrectiveActions() {
    const [selected, setSelected] = useState(null);
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    const loadActions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getCorrectiveActions();
            const normalized = (data || []).map(a => ({
                id: a.id,
                violation: a.violation_id || a.violation || 'VL-101',
                description: a.title || a.description || 'Corrective Safety Mitigation Plan',
                mineN: a.mine_name || a.mineN || 'Thennilai East',
                mine_id: a.mine_id,
                assignedTo: a.assigned_to || a.assignedTo || 'Senior Safety Officer',
                deadline: a.deadline || '2026-11-20',
                status: a.status || 'OPEN',
                priority: a.priority || 'HIGH',
                daysRemaining: a.days_remaining ?? a.daysRemaining ?? 14,
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

    const stats = useMemo(() => {
        const total = actions.length;
        const pending = actions.filter(a => a.status === 'PENDING' || a.status === 'OPEN').length;
        const inProgress = actions.filter(a => a.status === 'IN_PROGRESS').length;
        const overdue = actions.filter(a => a.status === 'OVERDUE').length;
        const completed = actions.filter(a => a.status === 'COMPLETED').length;
        return { total, pending, inProgress, overdue, completed };
    }, [actions]);

    const paginatedActions = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return actions.slice(start, start + pageSize);
    }, [actions, currentPage, pageSize]);

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
            {/* Header Banner */}
            <div className="page-header-banner">
                <div className="banner-left">
                    <div className="banner-icon-box">
                        <Shield size={26} />
                    </div>
                    <div className="banner-title-area">
                        <h1>Corrective Action Plans (CAP)</h1>
                        <p>Track mitigation workflows, enforcement deadlines, and managerial escalations for regulatory compliance.</p>
                    </div>
                </div>

                <div className="banner-photo-area">
                    <img 
                        src="/mine2.jpg" 
                        alt="Corrective Planning" 
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
                    <button className="btn-secondary" onClick={loadActions} style={{ padding: '6px 12px', fontSize: 12 }}>
                        Retry
                    </button>
                </div>
            )}

            {/* KPI 4-Card Strip */}
            <div className="kpi-cards-grid">
                <div className="kpi-stat-card total">
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle total">
                            <Shield size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">Total Action Plans</span>
                            <span className="kpi-value-num">{stats.total}</span>
                        </div>
                    </div>
                </div>

                <div className="kpi-stat-card pending">
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle pending">
                            <Clock size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">In Progress / Pending</span>
                            <span className="kpi-value-num">{stats.inProgress + stats.pending}</span>
                        </div>
                    </div>
                    <span className="kpi-trend-pill pending">
                        Active Plans
                    </span>
                </div>

                <div className="kpi-stat-card overdue">
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle overdue">
                            <AlertTriangle size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">Overdue Escalations</span>
                            <span className="kpi-value-num">{stats.overdue}</span>
                        </div>
                    </div>
                    <span className="kpi-trend-pill overdue">
                        {stats.overdue > 0 ? 'Urgent' : 'Clear'}
                    </span>
                </div>

                <div className="kpi-stat-card compliant">
                    <div className="kpi-content-left">
                        <div className="kpi-icon-circle compliant">
                            <CheckCircle2 size={22} />
                        </div>
                        <div className="kpi-info-text">
                            <span className="kpi-label-text">Verified Completed</span>
                            <span className="kpi-value-num">{stats.completed}</span>
                        </div>
                    </div>
                    <span className="kpi-trend-pill compliant">
                        Resolved
                    </span>
                </div>
            </div>

            {/* Enterprise Card & Table */}
            <div className="enterprise-card">
                <div className="enterprise-card-header">
                    <span className="enterprise-card-title">Active Corrective Mitigation Plans</span>
                    <button className="btn-secondary" onClick={loadActions} style={{ padding: '6px 12px', fontSize: 12 }}>
                        <RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 100 }}>Action ID</th>
                                <th style={{ width: 110 }}>Violation</th>
                                <th>Corrective Measure Description</th>
                                <th style={{ width: 150 }}>Quarry Site</th>
                                <th style={{ width: 150 }}>Assigned To</th>
                                <th style={{ width: 120 }}>Deadline</th>
                                <th style={{ width: 120 }}>Status</th>
                                <th style={{ width: 120 }}>Escalation</th>
                                <th style={{ width: 90, textAlign: 'center' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedActions.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                                        {loading ? 'Fetching corrective actions from PostgreSQL...' : 'No corrective actions logged.'}
                                    </td>
                                </tr>
                            )}
                            {paginatedActions.map(a => (
                                <tr key={a.id} onClick={() => setSelected(a)} style={{ cursor: 'pointer' }}>
                                    <td className="mono" style={{ fontWeight: 700, color: 'var(--color-forest)' }}>{a.id}</td>
                                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{a.violation}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.description}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{a.mineN}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{a.assignedTo}</td>
                                    <td className="mono" style={{ fontSize: 12 }}>{a.deadline}</td>
                                    <td><StatusBadge status={a.status} /></td>
                                    <td>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#047857', background: '#ECFDF5', padding: '3px 8px', borderRadius: 9999 }}>
                                            {a.escalation}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); setSelected(a); }}>
                                            <Eye size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination 
                    current={currentPage} 
                    total={actions.length} 
                    pageSize={pageSize} 
                    onPage={setCurrentPage} 
                />
            </div>

            {/* Selected Action Details Modal */}
            {selected && (
                <Drawer title={`Corrective Action ${selected.id}`} onClose={() => setSelected(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mitigation Action</div>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{selected.description}</h4>
                        </div>

                        <div className="grid-2">
                            <div>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Linked Citation:</span>
                                <div className="mono" style={{ fontWeight: 700, color: 'var(--color-forest)', marginTop: 2 }}>{selected.violation}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
                                <div style={{ marginTop: 2 }}><StatusBadge status={selected.status} /></div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Lead:</span>
                                <div style={{ fontWeight: 600, marginTop: 2 }}>{selected.assignedTo}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Resolution Deadline:</span>
                                <div className="mono" style={{ fontWeight: 600, marginTop: 2 }}>{selected.deadline}</div>
                            </div>
                        </div>

                        <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Supervisory Escalation Tier
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600 }}>
                                <span style={{ padding: '3px 8px', borderRadius: 4, background: '#D1FAE5', color: '#047857' }}>Safety Officer</span>
                                <ArrowRight size={12} style={{ color: '#94A3B8' }} />
                                <span style={{ padding: '3px 8px', borderRadius: 4, background: '#ECFDF5', color: '#065F46' }}>Mine Manager</span>
                                <ArrowRight size={12} style={{ color: '#94A3B8' }} />
                                <span style={{ padding: '3px 8px', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>Director General HQ</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                            <button 
                                className="btn-secondary" 
                                style={{ flex: 1 }}
                                onClick={() => handleUpdate('IN_PROGRESS')}
                            >
                                Mark In Progress
                            </button>
                            <button 
                                className="btn-primary" 
                                style={{ flex: 1 }}
                                onClick={() => handleUpdate('COMPLETED')}
                            >
                                <Check size={15} /> Mark Verified Complete
                            </button>
                        </div>
                    </div>
                </Drawer>
            )}

            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
