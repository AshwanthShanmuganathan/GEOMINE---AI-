import { useState, useEffect, useMemo } from 'react';
import { 
    FileText, Shield, Search, Calendar, RefreshCw, CheckCircle2, 
    AlertTriangle, User, Filter, ArrowUpDown, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { auditLogs as initialAuditLogs } from '../data/mockData';
import { api } from '../services/api';
import { Pagination } from '../components/Shared';

export default function AuditLogs() {
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [logs, setLogs] = useState(initialAuditLogs || []);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        let isMounted = true;
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const data = await api.getAuditLogs();
                if (isMounted && Array.isArray(data) && data.length > 0) {
                    setLogs(data);
                }
            } catch (e) {
                console.warn('Using local audit logs cache.');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchLogs();
        return () => { isMounted = false; };
    }, []);

    const filtered = useMemo(() => {
        return logs.filter(log => {
            const matchesType = filter === 'All' || (log.type || '').toLowerCase() === filter.toLowerCase();
            const matchesSearch = !searchQuery || 
                (log.action && log.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (log.target && log.target.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (log.user && log.user.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesType && matchesSearch;
        });
    }, [logs, filter, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginatedLogs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Dynamic stats
    const stats = useMemo(() => {
        const total = logs.length;
        const violations = logs.filter(l => (l.type || '').toLowerCase() === 'violation').length;
        const inspections = logs.filter(l => (l.type || '').toLowerCase() === 'inspection').length;
        const compliance = logs.filter(l => (l.type || '').toLowerCase() === 'compliance').length;
        return { total, violations, inspections, compliance };
    }, [logs]);

    const getBadgeClass = (type) => {
        switch ((type || '').toLowerCase()) {
            case 'violation': return 'badge-status-overdue';
            case 'inspection': return 'badge-status-completed';
            case 'action': return 'badge-status-pending';
            case 'compliance': return 'badge-category';
            default: return 'badge-category';
        }
    };

    return (
        <div>
            {/* Header Banner */}
            <div className="page-header-banner">
                <div className="banner-left">
                    <div className="banner-icon-box">
                        <FileText size={26} />
                    </div>
                    <div className="banner-title-area">
                        <h1>System Audit Logs & Governance Trail</h1>
                        <p>Immutable cryptographically verified ledger of all officer actions, automated AI triggers, and compliance modifications.</p>
                    </div>
                </div>

                <div className="banner-photo-area">
                    <img 
                        src="/mine1.jpg" 
                        alt="Audit Trail Overview" 
                        className="banner-mine-img"
                        onError={e => { e.currentTarget.src = '/tn-map.jpg'; }}
                    />
                    <div className="banner-photo-overlay" />
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="kpi-cards-grid">
                <div className="kpi-stat-card card-cyan">
                    <div className="kpi-stat-top">
                        <div className="kpi-icon-circle bg-cyan">
                            <FileText size={20} />
                        </div>
                    </div>
                    <div className="kpi-label">Total Logged Events</div>
                    <div className="kpi-number">{stats.total}</div>
                </div>

                <div className="kpi-stat-card card-green">
                    <div className="kpi-stat-top">
                        <div className="kpi-icon-circle bg-green">
                            <CheckCircle2 size={20} />
                        </div>
                        <div className="kpi-trend-pill trend-up">↑ Live Sync</div>
                    </div>
                    <div className="kpi-label">Field Inspections</div>
                    <div className="kpi-number">{stats.inspections}</div>
                </div>

                <div className="kpi-stat-card card-amber">
                    <div className="kpi-stat-top">
                        <div className="kpi-icon-circle bg-amber">
                            <Shield size={20} />
                        </div>
                        <div className="kpi-trend-pill trend-up">Immutable</div>
                    </div>
                    <div className="kpi-label">Compliance Records</div>
                    <div className="kpi-number">{stats.compliance}</div>
                </div>

                <div className="kpi-stat-card card-red">
                    <div className="kpi-stat-top">
                        <div className="kpi-icon-circle bg-red">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="kpi-trend-pill trend-neutral">Critical</div>
                    </div>
                    <div className="kpi-label">Violation Notices</div>
                    <div className="kpi-number">{stats.violations}</div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="filter-toolbar">
                <div className="filter-group">
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search actions, targets, actors..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="filter-pill-select"
                            style={{ paddingLeft: 34, minWidth: 240 }}
                        />
                    </div>

                    <div className="filter-pill-select">
                        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                        <select 
                            value={filter} 
                            onChange={e => { setFilter(e.target.value); setCurrentPage(1); }}
                            style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', fontSize: 13, color: 'inherit' }}
                        >
                            <option value="All">All Event Types</option>
                            <option value="violation">Violations</option>
                            <option value="inspection">Inspections</option>
                            <option value="action">Corrective Actions</option>
                            <option value="compliance">Compliance</option>
                            <option value="document">Documents</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isLoading && (
                        <span style={{ fontSize: 12, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                            <RefreshCw size={13} className="spin" /> Syncing Postgres Trail...
                        </span>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <div className="enterprise-card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 170 }}>Timestamp</th>
                                <th>Action Performed</th>
                                <th style={{ width: 160 }}>Target ID</th>
                                <th style={{ width: 150 }}>Category</th>
                                <th style={{ width: 180 }}>Authorized Actor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                        No audit entries found matching the filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log, index) => (
                                    <tr key={log.id || index}>
                                        <td className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                            {log.timestamp}
                                        </td>
                                        <td>
                                            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>
                                                {log.action}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="mono" style={{ 
                                                fontSize: 12, 
                                                fontWeight: 600, 
                                                background: '#f1f5f9', 
                                                padding: '3px 8px', 
                                                borderRadius: 6, 
                                                color: 'var(--primary-dark)' 
                                            }}>
                                                {log.target || 'SYS-EVENT'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={getBadgeClass(log.type)}>
                                                ● {log.type ? log.type.toUpperCase() : 'GENERAL'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--primary-dark)' }}>
                                                    {log.user ? log.user.charAt(0).toUpperCase() : 'S'}
                                                </div>
                                                <span>{log.user || 'System Engine'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination-bar">
                    <div className="pagination-info">
                        Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} audit trail records
                    </div>

                    <div className="pagination-controls">
                        <button 
                            className="page-nav-btn" 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(page => (
                            <button
                                key={page}
                                className={`page-number-btn ${page === currentPage ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}

                        <button 
                            className="page-nav-btn" 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
