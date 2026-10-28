import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, ClipboardCheck, Cpu, AlertTriangle, FileStack, Map, BarChart2 } from 'lucide-react';

export default function Features() {
    const navigate = useNavigate();

    const features = [
        { num: '01', icon: Target, title: 'Compliance Monitoring', desc: 'Real-time tracking of statutory renewals, environmental clearances, and operational licenses.' },
        { num: '02', icon: ClipboardCheck, title: 'Digital Inspections', desc: 'Paperless field reporting framework with integrated photographic evidence attachment.' },
        { num: '03', icon: Cpu, title: 'AI Risk Assessment', desc: 'Predictive hazard evaluation mapping risk across individual mine operations dynamically.' },
        { num: '04', icon: AlertTriangle, title: 'Corrective Action', desc: 'Closed-loop tracking identifying citations and strictly validating their resolution.' },
        { num: '05', icon: FileStack, title: 'Document & OCR', desc: 'Intelligent document extraction validating official communications and certificates.' },
        { num: '06', icon: Map, title: 'GIS Mine Mapping', desc: 'Interactive spatial orientation of all active lease boundaries and verified perimeters.' },
        { num: '07', icon: BarChart2, title: 'Governance Analytics', desc: 'High-level aggregation displaying regional compliance health and enforcement trends.' }
    ];

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0a0c10', color: '#e8e9ec' }}>

            {/* Background container properly isolated */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url("/mine2.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                    opacity: 0.7
                }} />
                {/* Overlay to ensure readability and section masking */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,12,16,0.95) 0%, rgba(10,12,16,0.85) 50%, rgba(10,12,16,0.98) 100%)' }} />
            </div>

            {/* Content strictly contained with proper bottom margin so 7th card doesn't bleed */}
            <div style={{ position: 'relative', zIndex: 1, padding: '48px 24px 64px 24px', maxWidth: 1200, margin: '0 auto', width: '100%', flex: 1 }}>

                <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#a0a3b1', cursor: 'pointer', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 40, width: 'fit-content' }}>
                    <ArrowLeft size={16} /> BACK TO HOME
                </button>

                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 800, marginBottom: 8 }}>PLATFORM CORE FEATURES</h1>
                <p style={{ fontSize: 16, color: '#a0a3b1', marginBottom: 64, maxWidth: 600, lineHeight: 1.6 }}>
                    Comprehensive toolsets engineered to streamline regulatory oversight, enforce environmental standards, and centralize operational intelligence.
                </p>

                {/* 
                    Responsive Grid: 
                    minmax(300px, 1fr) gives ~3 cols on desktop (> 900px), 
                    2 cols on tablet (~ 600-900px), 1 col on mobile (< 600px). 
                */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: 64 }}>
                    {features.map((f, idx) => (
                        <div key={idx} style={{
                            padding: '32px 24px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.25s ease',
                            cursor: 'default'
                        }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.borderColor = 'rgba(200,149,108,0.3)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(200,149,108,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <f.icon size={20} style={{ color: '#c8956c' }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>{f.num}</span>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e8e9ec' }}>{f.title}</h3>
                            <p style={{ color: '#a0a3b1', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 48, display: 'flex', justifyContent: 'flex-start' }}>
                    <button onClick={() => navigate('/portal')} style={{ background: '#c8956c', border: 'none', padding: '16px 36px', borderRadius: 4, color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, transition: 'transform 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        ENTER TAMIL NADU PORTAL
                    </button>
                </div>
            </div>
        </div>
    );
}
