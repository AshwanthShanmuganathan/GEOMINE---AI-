import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, CheckSquare, Map, BarChart2 } from 'lucide-react';

export default function About() {
    const navigate = useNavigate();

    const valuePoints = [
        {
            num: "01",
            title: "Centralized Governance",
            desc: "A unified platform bringing district authorities, inspectors, and operational data into one cohesive governance dashboard.",
            icon: Shield
        },
        {
            num: "02",
            title: "Compliance & Safety",
            desc: "Continuous tracking of statutory clearances, environmental parameters, and hazard baselines strictly according to regulations.",
            icon: CheckSquare
        },
        {
            num: "03",
            title: "GIS-Based Visibility",
            desc: "Spatial intelligence integrating official mine coordinates and district boundaries for precise geographic monitoring.",
            icon: Map
        },
        {
            num: "04",
            title: "Data-Driven Decisions",
            desc: "Aggregate operational risk and predictive analytics to deploy field resources exactly where critical oversight is needed.",
            icon: BarChart2
        }
    ];

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0a0c10', color: '#e8e9ec' }}>
            {/* Background container properly isolated */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url("/mine1.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                    opacity: 0.8
                }} />
                {/* Gradient overlay that always perfectly covers the entire background */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,12,16,0.95) 0%, rgba(10,12,16,0.85) 50%, rgba(10,12,16,0.98) 100%)' }} />
            </div>

            {/* Content properly spaced and elevated */}
            <div style={{ position: 'relative', zIndex: 1, padding: '48px 24px', maxWidth: 1000, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#a0a3b1', cursor: 'pointer', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 40, width: 'fit-content' }}>
                    <ArrowLeft size={16} /> BACK TO HOME
                </button>

                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 800, marginBottom: 16 }}>ABOUT GEOMINE AI</h1>
                <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 300, color: '#c8956c', marginBottom: 48 }}>
                    AI-powered smart governance and compliance monitoring platform for mining operations.
                </h2>

                <p style={{ fontSize: 16, color: '#a0a3b1', lineHeight: 1.8, maxWidth: 800, marginBottom: 64 }}>
                    Mine governance is essential for ensuring the sustainable, safe, and lawful extraction of resources. GeoMine AI modernizes this process by providing a secure, data-driven digital architecture designed specifically for regional authorities and environmental regulators.
                </p>

                {/* 4 Value Points Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 64 }}>
                    {valuePoints.map((point, idx) => (
                        <div key={idx} style={{
                            padding: '32px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                <point.icon size={20} style={{ color: '#c8956c' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(200, 149, 108, 0.4)', letterSpacing: 1 }}>
                                    {point.num}
                                </span>
                            </div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.5, marginBottom: 12, color: '#e8e9ec' }}>
                                {point.title}
                            </h3>
                            <p style={{ color: '#a0a3b1', fontSize: 14, lineHeight: 1.6 }}>
                                {point.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Termination / CTA */}
                <div style={{ paddingBottom: '32px', marginTop: 'auto' }}>
                    <button onClick={() => navigate('/portal')} style={{
                        background: '#c8956c', border: 'none', padding: '16px 36px',
                        borderRadius: 4, color: '#111', fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', letterSpacing: 0.5, transition: 'all 0.2s',
                        boxShadow: '0 4px 14px rgba(200,149,108,0.2)'
                    }}
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
