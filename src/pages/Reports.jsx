import { useState } from 'react';
import { FileText, Download, Eye, BarChart3, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartData } from '../data/mockData';
import { Toast } from '../components/Shared';

const initialReports = [
    { id: 'RPT-01', name: 'Monthly Compliance Report', type: 'Compliance', period: 'September 2026', status: 'Ready', generated: '2026-10-01' },
    { id: 'RPT-02', name: 'Safety Performance Report', type: 'Safety', period: 'Q3 2026', status: 'Ready', generated: '2026-10-02' },
    { id: 'RPT-03', name: 'AI Risk Assessment Report', type: 'Risk', period: 'September 2026', status: 'Ready', generated: '2026-10-01' },
    { id: 'RPT-04', name: 'Inspection Summary Report', type: 'Inspection', period: 'September 2026', status: 'Ready', generated: '2026-09-30' },
    { id: 'RPT-05', name: 'Violation Trend Report', type: 'Violation', period: 'H1 2026', status: 'Ready', generated: '2026-09-28' },
    { id: 'RPT-06', name: 'Environmental Monitoring Report', type: 'Environment', period: 'September 2026', status: 'Generating', generated: '—' },
    { id: 'RPT-07', name: 'Contractor Performance Review', type: 'Contractor', period: 'Q3 2026', status: 'Ready', generated: '2026-10-01' },
];

export default function Reports() {
    const [selected, setSelected] = useState(null);
    const [reports, setReports] = useState(initialReports);
    const [toast, setToast] = useState(null);

    const generateReport = () => {
        setToast('Generating new dynamic report...');
        setTimeout(() => {
            setReports([{ id: `RPT-0${reports.length + 1}`, name: 'Ad-hoc Risk Summary', type: 'Custom', period: 'Current', status: 'Ready', generated: new Date().toISOString().split('T')[0] }, ...reports]);
            setToast('Report generated successfully!');
        }, 1500);
    };

    const handleExport = () => {
        if (!selected) return;
        setToast(`Exporting ${selected.name} to PDF...`);
    };

    return (
        <div>
            <div className="page-header">
                <h1>Reports</h1>
                <p className="subtitle">Generate, view and export governance reports</p>
            </div>

            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Report List */}
                <div className="panel">
                    <div className="panel-header">
                        <span className="panel-title">Available Reports</span>
                        <button className="btn btn-accent btn-sm" onClick={generateReport}>+ Generate Report</button>
                    </div>
                    <div style={{ padding: 0 }}>
                        {reports.map(r => (
                            <div key={r.id} onClick={() => setSelected(r)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 16,
                                    padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
                                    cursor: 'pointer', transition: 'background 120ms',
                                    background: selected?.id === r.id ? 'var(--bg-hover)' : 'transparent',
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseOut={e => e.currentTarget.style.background = selected?.id === r.id ? 'var(--bg-hover)' : 'transparent'}
                            >
                                <FileText size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{r.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.period}</div>
                                </div>
                                <span className={`badge ${r.status === 'Ready' ? 'badge-compliant' : 'badge-pending'}`}>{r.status.toUpperCase()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Report Preview */}
                <div className="panel">
                    <div className="panel-header">
                        <span className="panel-title">{selected ? selected.name : 'Report Preview'}</span>
                        {selected && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-sm"><Eye size={12} /> View</button>
                                <button className="btn btn-sm" onClick={handleExport}><Download size={12} /> Export</button>
                            </div>
                        )}
                    </div>
                    <div className="panel-body">
                        {selected ? (
                            <div>
                                <div className="grid-3" style={{ marginBottom: 24 }}>
                                    <div className="detail-field"><div className="detail-label">Report ID</div><div className="detail-value mono">{selected.id}</div></div>
                                    <div className="detail-field"><div className="detail-label">Type</div><div className="detail-value">{selected.type}</div></div>
                                    <div className="detail-field"><div className="detail-label">Generated</div><div className="detail-value mono">{selected.generated}</div></div>
                                </div>
                                {/* Inline chart for this report */}
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Trend</div>
                                    <div style={{ height: 180 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData.riskTrend}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                <XAxis dataKey="month" fontSize={11} stroke="#636674" tickLine={false} axisLine={false} />
                                                <YAxis fontSize={11} stroke="#636674" tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ background: '#1c1f28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 12 }} />
                                                <Line type="monotone" dataKey="compliance" stroke="#4caf78" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="risk" stroke="#d45050" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                                <BarChart3 size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                                <p style={{ fontSize: 13 }}>Select a report to preview</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
