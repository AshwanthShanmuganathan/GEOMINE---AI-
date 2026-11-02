import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { violations as initialViolations } from '../data/mockData';
import { api } from '../services/api';
import { StatusBadge, RiskBadge, Drawer, DetailField, Toast, EmptyState, Pagination } from '../components/Shared';
import EvidenceViewer from '../components/EvidenceViewer';
import ErrorBoundary from '../components/ErrorBoundary';
import { 
  AlertTriangle, Search, Filter, RefreshCw, Shield, 
  ExternalLink, CheckCircle2, Clock, AlertCircle, X, Plus, Eye, Wrench
} from 'lucide-react';

export default function Violations() {
    const navigate = useNavigate();

    // Data and UI states
    const [violationsData, setViolationsData] = useState(initialViolations || []);
    const [selected, setSelected] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    // Fetch live violations from backend
    useEffect(() => {
        let isMounted = true;
        const loadLiveViolations = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.getViolations();
                if (isMounted && Array.isArray(data) && data.length > 0) {
                    setViolationsData(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError('Backend sync notice: Using synchronized records.');
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        loadLiveViolations();
        return () => { isMounted = false; };
    }, []);

    // KPIs calculation
    const stats = useMemo(() => {
        const total = violationsData.length;
        const critical = violationsData.filter(v => (v?.severity || '').toUpperCase() === 'CRITICAL').length;
        const highRisk = violationsData.filter(v => {
            const s = (v?.severity || '').toUpperCase();
            return s === 'CRITICAL' || s === 'HIGH';
        }).length;
        const open = violationsData.filter(v => (v?.status || '').toUpperCase() === 'OPEN' || (v?.status || '').toUpperCase() === 'OVERDUE').length;
        const resolved = violationsData.filter(v => (v?.status || '').toUpperCase() === 'RESOLVED').length;

        return { total, critical, highRisk, open, resolved };
    }, [violationsData]);

    // Filtered data pipeline
    const filteredViolations = useMemo(() => {
        return violationsData.filter(v => {
            if (!v) return false;

            if (statusFilter !== 'All') {
                const s = (v.status || '').toUpperCase();
                if (statusFilter === 'OPEN') {
                    if (s !== 'OPEN' && s !== 'INVESTIGATING') return false;
                } else if (s !== statusFilter.toUpperCase()) {
                    return false;
                }
            }

            if (severityFilter !== 'All') {
                if ((v.severity || '').toUpperCase() !== severityFilter.toUpperCase()) return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const idMatch = (v.id || '').toLowerCase().includes(q);
                const descMatch = (v.description || '').toLowerCase().includes(q);
                const mineMatch = (v.mineN || '').toLowerCase().includes(q);
                const officerMatch = (v.assignedTo || v.officer || '').toLowerCase().includes(q);
                const categoryMatch = (v.category || '').toLowerCase().includes(q);

                if (!idMatch && !descMatch && !mineMatch && !officerMatch && !categoryMatch) {
                    return false;
                }
            }

            return true;
        });
    }, [violationsData, statusFilter, severityFilter, searchQuery]);

    const paginatedViolations = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredViolations.slice(start, start + pageSize);
    }, [filteredViolations, currentPage, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredViolations.length / pageSize));

    const handleStatusChange = async (newStatus) => {
        if (!selected) return;

        setViolationsData(prev => 
            prev.map(v => v.id === selected.id ? { ...v, status: newStatus } : v)
        );
        setSelected(prev => ({ ...prev, status: newStatus }));
        setToastMessage(`Citation ${selected.id} status updated to ${newStatus}`);

        try {
            await api.updateViolationStatus(selected.id, newStatus);
        } catch (e) {
            console.warn('Database sync note:', e);
        }
    };

    const handleReload = async () => {
        setIsLoading(true);
        try {
            const data = await api.getViolations();
            if (data && data.length > 0) {
                setViolationsData(data);
                setToastMessage('Reloaded latest violation citations.');
            }
        } catch (err) {
            setToastMessage('Offline mode: Using cached records.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ErrorBoundary title="Violations Module Error" onReset={handleReload}>
            <div>
                {/* Header Banner */}
                <div className="page-header-banner">
                    <div className="banner-left">
                        <div className="banner-icon-box" style={{ background: '#DC2626' }}>
                            <AlertTriangle size={26} />
                        </div>
                        <div className="banner-title-area">
                            <h1>Violations & Infractions Register</h1>
                            <p>Centralized statutory repository for environmental citations, pit boundary breaches, and safety enforcement.</p>
                        </div>
                    </div>

                    <div className="banner-photo-area">
                        <img 
                            src="/mine3.jpg" 
                            alt="Mine Hazards" 
                            className="banner-mine-img"
                            onError={e => { e.currentTarget.src = '/tn-map.jpg'; }}
                        />
                        <div className="banner-photo-overlay" />
                    </div>
                </div>

                {/* KPI 4-Card Strip */}
                <div className="kpi-cards-grid">
                    <div className="kpi-stat-card total">
                        <div className="kpi-content-left">
                            <div className="kpi-icon-circle total">
                                <Shield size={22} />
                            </div>
                            <div className="kpi-info-text">
                                <span className="kpi-label-text">Total Violations</span>
                                <span className="kpi-value-num">{stats.total}</span>
                            </div>
                        </div>
                    </div>

                    <div className="kpi-stat-card overdue">
                        <div className="kpi-content-left">
                            <div className="kpi-icon-circle overdue">
                                <AlertTriangle size={22} />
                            </div>
                            <div className="kpi-info-text">
                                <span className="kpi-label-text">Critical & High</span>
                                <span className="kpi-value-num">{stats.highRisk}</span>
                            </div>
                        </div>
                        <span className="kpi-trend-pill overdue">
                            {stats.critical} Critical
                        </span>
                    </div>

                    <div className="kpi-stat-card pending">
                        <div className="kpi-content-left">
                            <div className="kpi-icon-circle pending">
                                <Clock size={22} />
                            </div>
                            <div className="kpi-info-text">
                                <span className="kpi-label-text">Open Citations</span>
                                <span className="kpi-value-num">{stats.open}</span>
                            </div>
                        </div>
                        <span className="kpi-trend-pill pending">
                            Needs Action
                        </span>
                    </div>

                    <div className="kpi-stat-card compliant">
                        <div className="kpi-content-left">
                            <div className="kpi-icon-circle compliant">
                                <CheckCircle2 size={22} />
                            </div>
                            <div className="kpi-info-text">
                                <span className="kpi-label-text">Resolved</span>
                                <span className="kpi-value-num">{stats.resolved}</span>
                            </div>
                        </div>
                        <span className="kpi-trend-pill compliant">
                            Closed
                        </span>
                    </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="filter-toolbar">
                    <div className="filter-left-group">
                        <div className="search-box-pill" style={{ width: 300 }}>
                            <Search size={14} style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search by ID, mine, description..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                            {searchQuery && (
                                <button 
                                    type="button" 
                                    onClick={() => setSearchQuery('')}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        <div className="filter-pill-select">
                            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                            <select value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setCurrentPage(1); }}>
                                <option value="All">All Severities</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>

                        <div className="filter-pill-select">
                            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                                <option value="All">All Statuses</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={handleReload}
                    >
                        <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh Data
                    </button>
                </div>

                {/* Enterprise Violations Table */}
                <div className="enterprise-card">
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 110 }}>Citation ID</th>
                                    <th>Infraction Description</th>
                                    <th style={{ width: 110 }}>Severity</th>
                                    <th style={{ width: 160 }}>Quarry Site</th>
                                    <th style={{ width: 120 }}>Date Issued</th>
                                    <th style={{ width: 130 }}>Deadline</th>
                                    <th style={{ width: 120 }}>Status</th>
                                    <th style={{ width: 120, textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedViolations.length === 0 && (
                                    <tr>
                                        <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                                            {isLoading ? 'Querying violation database...' : 'No violation citations found matching the criteria.'}
                                        </td>
                                    </tr>
                                )}
                                {paginatedViolations.map(v => {
                                    const isOverdue = v.status !== 'RESOLVED' && v.deadline && (new Date(v.deadline) < new Date());
                                    return (
                                        <tr key={v.id || Math.random()} onClick={() => setSelected(v)} style={{ cursor: 'pointer' }}>
                                            <td className="mono" style={{ fontWeight: 700, color: 'var(--color-forest)' }}>
                                                {v.id || 'VL-101'}
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 300 }}>
                                                {v.description || 'Statutory compliance infraction'}
                                            </td>
                                            <td>
                                                <RiskBadge level={v.severity} />
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                {v.mineN || v.mine || 'Thennilai East'}
                                            </td>
                                            <td className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {v.dateIssued || v.date || '2026-10-24'}
                                            </td>
                                            <td className="mono" style={{ fontSize: 12, color: isOverdue ? '#DC2626' : 'var(--text-secondary)', fontWeight: isOverdue ? 700 : 500 }}>
                                                {v.deadline || '2026-11-15'}
                                                {isOverdue && <span style={{ fontSize: 10, marginLeft: 4, color: '#DC2626' }}>(EXPIRED)</span>}
                                            </td>
                                            <td>
                                                <StatusBadge status={v.status} />
                                            </td>
                                            <td>
                                                <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                                                    <button 
                                                        type="button" 
                                                        className="action-icon-btn" 
                                                        title="View Evidence and Details"
                                                        onClick={(e) => { e.stopPropagation(); setSelected(v); }}
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="action-icon-btn" 
                                                        title="Launch Corrective Action"
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            navigate('/actions', { state: { violationId: v.id } }); 
                                                        }}
                                                        style={{ color: 'var(--color-forest)' }}
                                                    >
                                                        <Wrench size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="pagination-bar">
                        <div>
                            Showing <strong>{Math.min(1, filteredViolations.length) ? (currentPage - 1) * pageSize + 1 : 0} – {Math.min(currentPage * pageSize, filteredViolations.length)}</strong> of <strong>{filteredViolations.length}</strong> citations
                        </div>
                        <div className="pagination-controls">
                            <button 
                                className="page-btn" 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                &lt;
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                                <button 
                                    key={i + 1} 
                                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            {totalPages > 5 && <span style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>}
                            <button 
                                className="page-btn" 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>

                {/* Evidence & Details Drawer */}
                {selected && (
                    <Drawer title="Citation & Satellite Evidence Details" onClose={() => setSelected(null)}>
                        <EvidenceViewer violation={selected} compact={true} />

                        <div style={{ marginTop: 20 }}>
                            <DetailField label="Citation ID">
                                <span className="mono" style={{ color: 'var(--color-forest)', fontWeight: 700 }}>{selected.id}</span>
                            </DetailField>
                            <DetailField label="Infraction Description">
                                <span>{selected.description}</span>
                            </DetailField>
                            <DetailField label="Severity Rating">
                                <RiskBadge level={selected.severity} />
                            </DetailField>
                            <DetailField label="Quarry Location">
                                <span>{selected.mineN || selected.mine || 'Regional Mining Lease'}</span>
                            </DetailField>
                            <DetailField label="Statutory Status">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                                    <StatusBadge status={selected.status} />
                                    <select 
                                        className="filter-pill-select"
                                        value={selected.status || 'OPEN'}
                                        onChange={e => handleStatusChange(e.target.value)}
                                        style={{ padding: '4px 10px' }}
                                    >
                                        <option value="OPEN">Mark as Open</option>
                                        <option value="IN_PROGRESS">Mark as In Progress</option>
                                        <option value="RESOLVED">Mark as Resolved</option>
                                        <option value="OVERDUE">Mark as Overdue</option>
                                    </select>
                                </div>
                            </DetailField>
                            <DetailField label="Estimated Penalty">
                                <span className="mono" style={{ color: 'var(--color-forest)', fontWeight: 700 }}>
                                    Rs. {(typeof selected.penalty === 'number' ? selected.penalty : 50000).toLocaleString()}
                                </span>
                            </DetailField>
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                            <button 
                                className="btn-primary" 
                                style={{ flex: 1 }}
                                onClick={() => navigate('/actions', { state: { violationId: selected.id } })}
                            >
                                <Wrench size={15} /> Create Corrective Action Plan
                            </button>
                        </div>
                    </Drawer>
                )}

                {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            </div>
        </ErrorBoundary>
    );
}
