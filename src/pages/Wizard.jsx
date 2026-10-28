import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Shield, ClipboardCheck, Leaf, ArrowRight } from 'lucide-react';

const modules = [
    { icon: LayoutDashboard, title: 'Governance Dashboard', desc: 'High-level overview of mine performance, compliance, and risk across all operations.', path: '/', accent: '#c8956c' },
    { icon: Shield, title: 'Compliance Monitoring', desc: 'Track regulatory requirements, deadlines, and compliance status.', path: '/compliance', accent: '#4caf78' },
    { icon: ClipboardCheck, title: 'Safety & Inspections', desc: 'Conduct field inspections, manage safety checklists, and track findings.', path: '/inspections', accent: '#7ea8d4' },
    { icon: Leaf, title: 'Environmental Monitoring', desc: 'Air quality, water discharge, dust levels, and noise compliance.', path: '/gis-map', accent: '#d4a84b' },
];

export default function Wizard() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', padding: '60px 32px',
            background: 'var(--bg-primary)', color: 'var(--text-primary)',
        }}>
            <div style={{ maxWidth: 1040, width: '100%' }}>
                <div style={{ marginBottom: 48 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 28, height: 28, background: '#c8956c', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#111' }}>G</div>
                        <span style={{ fontSize: 18, fontWeight: 600 }}>GeoMine AI</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Select a module to continue</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {modules.map(m => (
                        <div key={m.path} onClick={() => navigate(m.path)}
                            style={{
                                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                borderRadius: 6, padding: 28, cursor: 'pointer',
                                transition: 'all 200ms ease', position: 'relative',
                            }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(200,149,108,0.2)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
                        >
                            <m.icon size={20} style={{ color: m.accent, marginBottom: 16 }} />
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{m.title}</h3>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{m.desc}</p>
                            <ArrowRight size={14} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
