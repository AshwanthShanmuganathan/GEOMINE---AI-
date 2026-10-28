import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { violations as initialViolations } from '../data/mockData';
import { api } from '../services/api';
import { StatusBadge, RiskBadge, Drawer, DetailField, Toast, EmptyState } from '../components/Shared';
import EvidenceViewer from '../components/EvidenceViewer';
import ErrorBoundary from '../components/ErrorBoundary';
import { 
  AlertTriangle, Search, Filter, RefreshCw, Shield, 
  ExternalLink, CheckCircle, Clock, AlertCircle, X, ChevronRight 
} from 'lucide-react';

export default function Violations() {
    const navigate = useNavigate();

    // Data and UI states
    const [violationsData, setViolationsData] = useState(initialViolations || []);
    const [selected, setSelected] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    // Fetch live violations from PostgreSQL backend with resilient fallback
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
                    setError('Backend sync warning: Using local cache.');
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

            // Status filter
            if (statusFilter !== 'All') {
                const s = (v.status || '').toUpperCase();
                if (statusFilter === 'OPEN') {
                    if (s !== 'OPEN' && s !== 'INVESTIGATING') return false;
                } else if (s !== statusFilter.toUpperCase()) {
                    return false;
                }
            }

            // Severity filter
            if (severityFilter !== 'All') {
                if ((v.severity || '').toUpperCase() !== severityFilter.toUpperCase()) return false;
            }

            // Search query filter (search across id, description, mine name, and assigned officer)
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

    // Handle status change in Drawer details and sync to database
    const handleStatusChange = async (newStatus) => {
        if (!selected) return;

        const oldStatus = selected.status;
        setViolationsData(prev => 
            prev.map(v => v.id === selected.id ? { ...v, status: newStatus } : v)
        );
        setSelected(prev => ({ ...prev, status: newStatus }));
        setToastMessage(`Citation ${selected.id} status updated to ${newStatus}`);

        try {
            await api.updateViolationStatus(selected.id, newStatus);
        } catch (e) {
            console.warn('Database sync offline, state maintained in session.');
        }
    };

    // Retry / Reload handler fetching latest state from database
    const handleReload = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getViolations();
            if (Array.isArray(data) && data.length > 0) {
                setViolationsData(data);
            }
            setToastMessage('Live database records synchronized successfully.');
        } catch (e) {
            setViolationsData(initialViolations || []);
            setToastMessage('Refreshed from local cache.');
        } finally {
            setIsLoading(false);
        }
    };

    const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'All' || severityFilter !== 'All';

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('All');
        setSeverityFilter('All');
    };

    return (
        <ErrorBoundary title="Violations Module Error" onReset={handleReload}>
            <div>
                {/* Page Header */}
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1>Violations</h1>
                        <p className="subtitle">Centralized tracker for all legal, environmental, and safety citations across mines.</p>
                    </div>
                    <button 
                        type="button" 
                        className="btn btn-sm" 
                        onClick={handleReload}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <RefreshCw size={13} className={isLoading ? 'spin' : ''} /> Refresh Data
                    </button>
                </div>

                {/* KPI Strip: Total, Critical, High-risk, Open, Resolved */}
                <div className="kpi-strip">
                    <div className="kpi-item">
                        <span className="kpi-item-label">Total Violations</span>
                        <span className="kpi-item-value">{stats.total}</span>
                    </div>
                    <div className="kpi-item">
                        <span className="kpi-item-label">Critical Violations</span>
                        <span className="kpi-item-value" style={{ color: stats.critical > 0 ? 'var(--risk-high)' : 'inherit' }}>
                            {stats.critical}
                        </span>
                    </div>
                    <div className="kpi-item">
                        <span className="kpi-item-label">High-Risk Violations</span>
                        <span className="kpi-item-value" style={{ color: stats.highRisk > 0 ? 'var(--risk-high)' : 'inherit' }}>
                            {stats.highRisk}
                        </span>
                    </div>
                    <div className="kpi-item">
                        <span className="kpi-item-label">Open Violations</span>
                        <span className="kpi-item-value" style={{ color: 'var(--risk-medium)' }}>
                            {stats.open}
                        </span>
                    </div>
                    <div className="kpi-item">
                        <span className="kpi-item-label">Resolved Violations</span>
                        <span className="kpi-item-value" style={{ color: 'var(--risk-low)' }}>
                            {stats.resolved}
                        </span>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="filters-bar" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {/* Search Field */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 12px',
                        flex: '1 1 280px',
                        maxWidth: 420
                    }}>
                        <Search size={14} style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by ID, mine, description, officer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                                width: '100%',
                                outline: 'none'
                            }}
                        />
                        {searchQuery && (
                            <button 
                                type="button" 
                                onClick={() => setSearchQuery('')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Severity Filter */}
                    <select 
                        className="filter-select" 
                        value={severityFilter} 
                        onChange={e => setSeverityFilter(e.target.value)}
                        style={{ minWidth: 140 }}
                    >
                        <option value="All">All Severities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>

                    {/* Status Filter */}
                    <select 
                        className="filter-select" 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ minWidth: 140 }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="OVERDUE">Overdue</option>
                    </select>

                    {/* Reset Filters */}
                    {hasActiveFilters && (
                        <button 
                            type="button" 
                            className="btn btn-sm" 
                            onClick={clearFilters}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            <X size={12} /> Clear Filters
                        </button>
                    )}

                    <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Showing {filteredViolations.length} of {violationsData.length} citations
                    </div>
                </div>

                {/* API / Fetch Failure Error State */}
                {error && (
                    <div style={{
                        padding: 24,
                        background: 'rgba(212, 80, 80, 0.1)',
                        border: '1px solid var(--risk-high-border)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <AlertTriangle size={24} color="var(--risk-high)" />
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>Failed to load violations</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{error}</div>
                            </div>
                        </div>
                        <button type="button" className="btn btn-sm btn-accent" onClick={handleReload}>
                            <RefreshCw size={12} /> Retry
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className="panel" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <RefreshCw size={24} className="spin" style={{ marginBottom: 12, color: 'var(--accent)' }} />
                        <div style={{ fontSize: 13 }}>Loading violation citation records...</div>
                    </div>
                ) : filteredViolations.length === 0 ? (
                    /* Empty State */
                    <div className="panel">
                        <EmptyState 
                            icon={AlertTriangle} 
                            message={hasActiveFilters ? "No violations match the selected filters." : "No violations recorded in the active operational sector."}
                            actionText={hasActiveFilters ? "Reset All Filters" : "Refresh Dataset"}
                            onAction={hasActiveFilters ? clearFilters : handleReload}
                        />
                    </div>
                ) : (
                    /* Violations Table */
                    <div className="panel">
                        <div style={{ padding: 0, overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Citation ID</th>
                                        <th>Description</th>
                                        <th>Severity</th>
                                        <th>Mine / Site</th>
                                        <th>Source</th>
                                        <th>Date Issued</th>
                                        <th>Deadline</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredViolations.map(v => {
                                        const isOverdue = v.status !== 'RESOLVED' && v.deadline && (new Date(v.deadline) < new Date());
                                        return (
                                            <tr key={v.id || Math.random()} onClick={() => setSelected(v)}>
                                                <td className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                                                    {v.id || 'VL-UNKNOWN'}
                                                </td>
                                                <td style={{ color: 'var(--text-primary)', maxWidth: 280 }} title={v.description}>
                                                    {v.description || 'No description provided'}
                                                </td>
                                                <td>
                                                    <RiskBadge level={v.severity} />
                                                </td>
                                                <td style={{ fontWeight: 500 }}>
                                                    {v.mineN || v.mine || 'Unknown Site'}
                                                </td>
                                                <td>
                                                    <span style={{ 
                                                        fontSize: 10, 
                                                        fontWeight: 600, 
                                                        color: v.source === 'AI DETECTION' ? 'var(--accent)' : 'var(--text-secondary)',
                                                        background: 'rgba(255,255,255,0.04)',
                                                        padding: '2px 6px',
                                                        borderRadius: 3,
                                                        border: '1px solid var(--border-subtle)'
                                                    }}>
                                                        {v.source || 'AI DETECTION'}
                                                    </span>
                                                </td>
                                                <td className="mono">
                                                    {v.dateIssued || v.date || '—'}
                                                </td>
                                                <td className="mono" style={{ color: isOverdue ? 'var(--risk-high)' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                                                    {v.deadline || '—'}
                                                    {isOverdue && <span style={{ fontSize: 9, marginLeft: 4, color: 'var(--risk-high)' }}>(EXPIRED)</span>}
                                                </td>
                                                <td>
                                                    <StatusBadge status={v.status} />
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button 
                                                        type="button"
                                                        className="btn btn-sm" 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            navigate('/actions', { state: { violationId: v.id } }); 
                                                        }}
                                                        style={{ whiteSpace: 'nowrap' }}
                                                    >
                                                        Fix Action
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* VIOLATION DETAILS DRAWER WITH SATELLITE EVIDENCE VIEWER */}
                {selected && (
                    <Drawer title="Citation & Evidence Details" onClose={() => setSelected(null)}>
                        {/* Evidence Viewer with live satellite map & enlarge modal */}
                        <EvidenceViewer 
                            violation={selected} 
                            compact={true} 
                        />

                        {/* Citation Details Fields */}
                        <div style={{ marginTop: 16 }}>
                            <DetailField label="Citation ID">
                                <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{selected.id || 'N/A'}</span>
                            </DetailField>
                            <DetailField label="Description">
                                <span style={{ color: 'var(--text-primary)' }}>{selected.description || 'N/A'}</span>
                            </DetailField>
                            <DetailField label="Severity">
                                <RiskBadge level={selected.severity} />
                            </DetailField>
                            <DetailField label="Mine / Sector">
                                <span>{selected.mineN || selected.mine || 'N/A'}</span>
                            </DetailField>
                            <DetailField label="Detection Source">
                                <span className="mono">{selected.source || 'AI DETECTION'}</span>
                            </DetailField>
                            <DetailField label="Citation Category">
                                <span>{selected.category || 'Compliance'}</span>
                            </DetailField>
                            <DetailField label="Current Status">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <StatusBadge status={selected.status} />
                                    <select 
                                        className="filter-select"
                                        value={selected.status || 'OPEN'}
                                        onChange={e => handleStatusChange(e.target.value)}
                                        style={{ padding: '3px 8px', fontSize: 11 }}
                                    >
                                        <option value="OPEN">Mark as Open</option>
                                        <option value="IN_PROGRESS">Mark as In Progress</option>
                                        <option value="RESOLVED">Mark as Resolved</option>
                                        <option value="OVERDUE">Mark as Overdue</option>
                                    </select>
                                </div>
                            </DetailField>
                            <DetailField label="Penalty Amount">
                                <span className="mono" style={{ color: 'var(--accent)' }}>
                                    Rs. {(typeof selected.penalty === 'number' ? selected.penalty : (parseFloat(selected.penalty) || 0)).toLocaleString()}
                                </span>
                            </DetailField>
                            <DetailField label="Issued On">
                                <span className="mono">{selected.dateIssued || selected.date || 'N/A'}</span>
                            </DetailField>
                            <DetailField label="Compliance Deadline">
                                <span className="mono" style={{ color: selected.deadline && new Date(selected.deadline) < new Date() ? 'var(--risk-high)' : 'inherit' }}>
                                    {selected.deadline || 'N/A'}
                                </span>
                            </DetailField>
                            <DetailField label="Supervising Officer">
                                <span>{selected.assignedTo || selected.officer || 'S. Inspector'}</span>
                            </DetailField>
                            <DetailField label="Geographical Node">
                                <span className="mono">
                                    {selected.latitude != null && selected.longitude != null 
                                        ? `${selected.latitude.toFixed(4)}°N, ${selected.longitude.toFixed(4)}°E` 
                                        : 'PENDING CALIBRATION'}
                                </span>
                            </DetailField>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button 
                                type="button"
                                className="btn btn-accent" 
                                onClick={() => {
                                    if (selected.mine) navigate(`/mine/${selected.mine}`);
                                }}
                            >
                                Go To Mine Profile
                            </button>
                            <button 
                                type="button"
                                className="btn" 
                                onClick={() => navigate('/actions', { state: { violationId: selected.id } })}
                            >
                                Open Corrective Action Workflow
                            </button>
                        </div>
                    </Drawer>
                )}

                {/* Toast Notification */}
                {toastMessage && (
                    <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
                )}
            </div>
        </ErrorBoundary>
    );
}
