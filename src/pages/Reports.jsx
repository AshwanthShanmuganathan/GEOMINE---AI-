import { useState } from 'react';
import { FileText, Download, Eye, BarChart3, RefreshCw, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartData } from '../data/mockData';
import { Toast, StatusBadge } from '../components/Shared';

const initialReports = [
    { id: 'RPT-01', name: 'Monthly Statutory Compliance Report', type: 'Compliance', period: 'October 2026', status: 'Ready', generated: '2026-11-01' },
    { id: 'RPT-02', name: 'DGMS Safety Audit & Inspection Dossier', type: 'Safety', period: 'Q3 2026', status: 'Ready', generated: '2026-10-28' },
    { id: 'RPT-03', name: 'AI Satellite Risk Assessment Report', type: 'Risk', period: 'October 2026', status: 'Ready', generated: '2026-11-01' },
    { id: 'RPT-04', name: 'Pit Depth & Boundary Stability Summary', type: 'Inspection', period: 'October 2026', status: 'Ready', generated: '2026-10-30' },
    { id: 'RPT-05', name: 'Regional Quarry Violation Trend Analysis', type: 'Violation', period: 'H2 2026', status: 'Ready', generated: '2026-10-25' },
    { id: 'RPT-06', name: 'Environmental Silt & Water Runoff Monitoring', type: 'Environment', period: 'October 2026', status: 'Generating', generated: '—' },
    { id: 'RPT-07', name: 'Contractor Safety Rating & License Review', type: 'Contractor', period: 'Q3 2026', status: 'Ready', generated: '2026-10-20' },
];

export default function Reports() {
    const [selected, setSelected] = useState(initialReports[0]);
    const [reports, setReports] = useState(initialReports);
    const [toast, setToast] = useState(null);

    const generateReport = () => {
        setToast('Synthesizing dynamic statutory report...');
        setTimeout(() => {
            setReports([
                { id: `RPT-0${reports.length + 1}`, name: 'Ad-hoc Regional Safety Synthesis', type: 'Custom', period: 'Current', status: 'Ready', generated: new Date().toISOString().split('T')[0] }, 
                ...reports
            ]);
            setToast('Statutory report generated and archived successfully!');
        }, 1200);
    };

    const handleExport = () => {
        if (!selected) return;
        setToast(`Exporting ${selected.name} as certified PDF dossier...`);
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
                        <h1>Statutory Reports & Audits</h1>
                        <p>Generate, review, and export certified regulatory reports formatted for Directorate General of Mines Safety.</p>
                    </div>
                </div>

                <div className="banner-photo-area">
                    <img 
                        src="/mine1.jpg" 
                        alt="Reports Banner" 
                        className="banner-mine-img"
                        onError={e => { e.currentTarget.src = '/tn-map.jpg'; }}
                    />
                    <div className="banner-photo-overlay" />
                </div>
            </div>

            <div className="grid-2">
                {/* Reports List Card */}
                <div className="enterprise-card" style={{ marginBottom: 0 }}>
                    <div className="enterprise-card-header">
                        <span className="enterprise-card-title">Available Dossiers ({reports.length})</span>
                        <button className="btn-primary" onClick={generateReport} style={{ padding: '6px 14px', fontSize: 12 }}>
                            + Generate Report
                        </button>
                    </div>
                    <div style={{ padding: 0 }}>
                        {reports.map(r => (
                            <div 
                                key={r.id} 
                                onClick={() => setSelected(r)}
                                style={{
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 14,
                                    padding: '14px 20px', 
                                    borderBottom: '1px solid var(--color-border-subtle)',
                                    cursor: 'pointer', 
                                    transition: 'background 120ms ease',
                                    background: selected?.id === r.id ? '#F0FDFA' : 'transparent',
                                }}
                                onMouseEnter={e => { if (selected?.id !== r.id) e.currentTarget.style.background = '#F8FAFC'; }}
                                onMouseLeave={e => { if (selected?.id !== r.id) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{ 
                                    width: 36, 
                                    height: 36, 
                                    borderRadius: 8, 
                                    background: selected?.id === r.id ? '#D1FAE5' : '#F1F5F9',
                                    color: selected?.id === r.id ? '#047857' : '#64748B',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <FileText size={18} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {r.type} • Period: {r.period}
                                    </div>
                                </div>
                                <StatusBadge status={r.status === 'Ready' ? 'COMPLIANT' : 'PENDING'} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Report Preview Card */}
                <div className="enterprise-card" style={{ marginBottom: 0 }}>
                    <div className="enterprise-card-header">
                        <span className="enterprise-card-title">{selected ? selected.name : 'Report Telemetry'}</span>
                        {selected && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                                    <Eye size={13} /> View
                                </button>
                                <button className="btn-primary" onClick={handleExport} style={{ padding: '6px 12px', fontSize: 12 }}>
                                    <Download size={13} /> Export PDF
                                </button>
                            </div>
                        )}
                    </div>
                    <div style={{ padding: 24 }}>
                        {selected ? (
                            <div>
                                <div className="grid-3" style={{ marginBottom: 20 }}>
                                    <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Report ID</div>
                                        <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-forest)', marginTop: 4 }}>{selected.id}</div>
                                    </div>
                                    <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Classification</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{selected.type}</div>
                                    </div>
                                    <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Generated On</div>
                                        <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 4 }}>{selected.generated}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 24 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                                        6-Month Regional Compliance Telemetry
                                    </div>
                                    <div style={{ height: 210 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData.riskTrend}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                                <XAxis dataKey="month" fontSize={11} stroke="#94A3B8" tickLine={false} axisLine={false} />
                                                <YAxis fontSize={11} stroke="#94A3B8" tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }} />
                                                <Line type="monotone" dataKey="compliance" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="risk" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                                <BarChart3 size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                <p style={{ fontSize: 13 }}>Select a report to preview its statutory telemetry.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
