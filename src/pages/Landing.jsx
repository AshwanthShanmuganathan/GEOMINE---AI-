import { useNavigate } from 'react-router-dom';

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0a0c10', color: '#e8e9ec' }}>

            {/* Video Background */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: '#000' }}>
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '100vh',
                        height: '100vw',
                        transform: 'translate(-50%, -50%) rotate(-90deg)',
                        objectFit: 'cover'
                    }}
                >
                    <source src="/bg-video.mp4" type="video/mp4" />
                </video>
                {/* Lighter overlay so video is visible */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,12,16,0.6) 0%, rgba(10,12,16,0.1) 40%, rgba(10,12,16,0.7) 100%)' }} />
            </div>

            {/* Content wrapper */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>

                {/* Top Navbar */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,12,16,0.4)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, background: '#c8956c', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#111' }}>G</div>
                        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1.5, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>GEOMINE AI</span>
                    </div>

                    <nav style={{ display: 'flex', gap: 32, fontSize: 13, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        <span style={{ cursor: 'pointer', color: '#c8956c', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }} onClick={() => navigate('/')}>Home</span>
                        <span style={{ cursor: 'pointer', color: '#e8e9ec', transition: 'color 0.2s', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }} onMouseOver={e => e.target.style.color = '#c8956c'} onMouseOut={e => e.target.style.color = '#e8e9ec'} onClick={() => navigate('/about')}>About</span>
                        <span style={{ cursor: 'pointer', color: '#e8e9ec', transition: 'color 0.2s', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }} onMouseOver={e => e.target.style.color = '#c8956c'} onMouseOut={e => e.target.style.color = '#e8e9ec'} onClick={() => navigate('/features')}>Features</span>
                        <span style={{ cursor: 'pointer', color: '#e8e9ec', transition: 'color 0.2s', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }} onMouseOver={e => e.target.style.color = '#c8956c'} onMouseOut={e => e.target.style.color = '#e8e9ec'} onClick={() => navigate('/tamil-nadu-mines')}>Tamil Nadu Mines</span>
                        <span style={{ cursor: 'pointer', color: '#e8e9ec', transition: 'color 0.2s', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }} onMouseOver={e => e.target.style.color = '#c8956c'} onMouseOut={e => e.target.style.color = '#e8e9ec'} onClick={() => navigate('/mine-owners')}>Mine Owners</span>
                    </nav>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <button onClick={() => navigate('/login')} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.3)', padding: '10px 24px', borderRadius: 4, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5 }}>
                            LOGIN
                        </button>
                        <button onClick={() => navigate('/signup')} style={{ background: '#c8956c', border: 'none', padding: '10px 24px', borderRadius: 4, color: '#111', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 }}>
                            SIGN UP
                        </button>
                    </div>
                </header>

                {/* Hero Section */}
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 48px', maxWidth: 1000, margin: '0 auto', width: '100%', textAlign: 'center' }}>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: -0.5, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                        GEOMINE AI<br />
                        <span style={{ fontSize: '0.65em', color: '#e8e9ec', fontWeight: 700 }}>SMART GOVERNANCE & COMPLIANCE MONITORING</span>
                    </h1>
                    <p style={{ fontSize: 18, color: '#f0f1f5', maxWidth: 750, margin: '0 auto', lineHeight: 1.6, marginBottom: 48, fontWeight: 500, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                        An intelligent digital platform for monitoring mine safety, statutory compliance, inspections, environmental conditions, and operational risks across Tamil Nadu's mining sector.
                    </p>

                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 80 }}>
                        <button onClick={() => navigate('/portal')} style={{ background: '#c8956c', border: 'none', padding: '16px 36px', borderRadius: 4, color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(200,149,108,0.5)' }} onMouseOver={e => e.target.style.transform = 'scale(1.02)'} onMouseOut={e => e.target.style.transform = 'scale(1)'}>
                            ENTER TAMIL NADU PORTAL
                        </button>
                        <button onClick={() => navigate('/features')} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', padding: '16px 36px', borderRadius: 4, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.2s', backdropFilter: 'blur(5px)' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.15)'} onMouseOut={e => e.target.style.background = 'rgba(0,0,0,0.5)'}>
                            EXPLORE FEATURES
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, textAlign: 'left', marginTop: 10 }}>
                        <div style={{ background: 'rgba(10,12,16,0.7)', backdropFilter: 'blur(12px)', padding: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            <h3 style={{ fontSize: 13, color: '#c8956c', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' }}>About GeoMine AI</h3>
                            <p style={{ color: '#e8e9ec', fontSize: 14, lineHeight: 1.7 }}>
                                GeoMine AI helps centralize mining compliance, safety inspections, risk assessment, corrective actions, environmental monitoring, and governance reporting into a single unified dashboard for district authorities.
                            </p>
                        </div>
                        <div style={{ background: 'rgba(10,12,16,0.7)', backdropFilter: 'blur(12px)', padding: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            <h3 style={{ fontSize: 13, color: '#c8956c', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' }}>Tamil Nadu Mining Sector</h3>
                            <p style={{ color: '#e8e9ec', fontSize: 14, lineHeight: 1.7 }}>
                                Introducing digitally monitored, active zones across Tamil Nadu. District-level oversight ensures localized compliance, resource transparency, and proactive environmental protection measures.
                            </p>
                        </div>
                    </div>
                </main>

                <footer style={{ padding: '24px 48px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a0a3b1', background: 'rgba(10,12,16,0.6)', backdropFilter: 'blur(5px)' }}>
                    <div>&copy; 2026 GeoMine AI Systems. Tamil Nadu Mining Sector.</div>
                    <div>Authorized Personnel Only</div>
                </footer>
            </div>
        </div>
    );
}
