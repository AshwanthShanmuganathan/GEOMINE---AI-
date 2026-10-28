import { useState, useEffect } from 'react';
import { auditLogs as initialAuditLogs } from '../data/mockData';
import { api } from '../services/api';

export default function AuditLogs() {
    const [filter, setFilter] = useState('All');
    const [logs, setLogs] = useState(initialAuditLogs || []);
    const [isLoading, setIsLoading] = useState(false);

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

    const filtered = filter === 'All' ? logs : logs.filter(l => (l.type || '').toLowerCase() === filter.toLowerCase());

    return (
        <div>
            <div className="page-header">
                <h1>System Audit Logs</h1>
                <p className="subtitle">Immutable record of all system actions, compliance updates, and violations.</p>
            </div>

            <div className="filters-bar">
                <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="All">All Actions</option>
                    <option value="violation">Violations</option>
                    <option value="inspection">Inspections</option>
                    <option value="action">Corrective Actions</option>
                    <option value="compliance">Compliance</option>
                    <option value="document">Documents</option>
                </select>
                <input type="date" className="filter-input" defaultValue="2026-09-01" />
                <input type="date" className="filter-input" defaultValue="2026-09-30" />
            </div>

            <div className="panel">
                <div style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Action</th>
                                <th>Target ID</th>
                                <th>Type</th>
                                <th>User / System</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((log, index) => (
                                <tr key={log.id || index}>
                                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{log.timestamp}</td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{log.action}</td>
                                    <td className="mono">{log.target}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{log.type}</td>
                                    <td>{log.user}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
