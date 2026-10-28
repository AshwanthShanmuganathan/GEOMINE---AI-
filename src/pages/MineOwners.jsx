import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';

const mineOwners = [
    {
        id: 1,
        company: "Karur Company",
        image: "/owner1.jpg"
    },
    {
        id: 2,
        company: "Unjapalayam Company",
        image: "/owner2.jpg"
    },
    {
        id: 3,
        company: "Tiruchengode Company",
        image: "/owner3.jpg"
    },
    {
        id: 4,
        company: "Krishnarayapuram Company",
        image: "/owner4.jpg"
    }
];

export default function MineOwners() {
    const navigate = useNavigate();

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0a0c10', color: '#e8e9ec' }}>

            {/* Background container efficiently boundary-sealed to prevent scrolling leak */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url("/mine1.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                    opacity: 0.5
                }} />
                {/* Gradient overlay masking */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,12,16,0.98) 0%, rgba(10,12,16,0.88) 50%, rgba(10,12,16,0.98) 100%)' }} />
            </div>

            {/* Main Content strictly spaced inside the viewport boundary */}
            <div style={{ position: 'relative', zIndex: 1, padding: '48px 24px 64px 24px', maxWidth: 1000, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>

                <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#a0a3b1', cursor: 'pointer', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 40, width: 'fit-content' }}>
                    <ArrowLeft size={16} /> BACK TO HOME
                </button>

                <div style={{ textAlign: 'center', marginBottom: 80 }}>
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 800, marginBottom: 16 }}>MINE OWNERS</h1>
                    <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.25rem)', fontWeight: 400, color: '#a0a3b1', maxWidth: 600, margin: '0 auto' }}>
                        Mining leadership and operational stakeholders across the GeoMine AI network.
                    </h2>
                </div>

                {/* 
                  Profile Grid: 
                  Utilizing auto-fit with minmax(200px) creates a perfect:
                  4 columns on desktop (~1000px container)
                  2 columns on tablet (<~600px container)
                  1 column on narrow mobile (<~450px container)
                */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: 64 }}>
                    {mineOwners.map((owner) => (
                        <div key={owner.id} style={{
                            padding: '32px 16px',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            borderRadius: 12,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.borderColor = 'rgba(200,149,108,0.3)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                e.currentTarget.querySelector('.avatar-container').style.transform = 'scale(1.05)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                                e.currentTarget.querySelector('.avatar-container').style.transform = 'scale(1)';
                            }}
                        >
                            <div className="avatar-container" style={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: 'rgba(200,149,108,0.05)',
                                border: '1px solid rgba(200,149,108,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 24,
                                transition: 'transform 0.3s ease',
                                overflow: 'hidden'
                            }}>
                                {owner.image ? (
                                    <img src={owner.image} alt={owner.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={40} color="rgba(200,149,108,0.5)" />
                                )}
                            </div>

                            {/* Company Name */}
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e8e9ec', letterSpacing: 0.5, margin: 0 }}>
                                {owner.company}
                            </h3>
                        </div>
                    ))}
                </div>

                {/* Additional footer/termination spacing if necessary to ensure it doesn't merge */}
                <div style={{ marginTop: 'auto', paddingBottom: '24px' }}></div>
            </div>
        </div>
    );
}
