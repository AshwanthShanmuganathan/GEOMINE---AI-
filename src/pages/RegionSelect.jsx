import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';

const tnDistricts = [
    { name: 'Karur', mines: 4, active: true, compliance: '88%', description: 'Major limestone and localized coal operations.' },
    { name: 'Salem', mines: 6, active: true, compliance: '92%', description: 'Extensive magnesite and bauxite, alongside coal depots.' },
    { name: 'Cuddalore', mines: 8, active: true, compliance: '74%', description: 'Primary lignite reserves encompassing Neyveli Lignite Corporation.' },
    { name: 'Ariyalur', mines: 5, active: true, compliance: '96%', description: 'Cement-grade limestone and fossilized mineral deposits.' },
    { name: 'Tiruchirappalli', mines: 3, active: false, compliance: '-', description: 'No active major coal/lignite operations currently monitored.' },
];

export default function RegionSelect({ setDistrict }) {
    const navigate = useNavigate();
    const searchParams = new useLocation().search;
    const intent = new URLSearchParams(searchParams).get('intent') || 'login';

    const [selected, setSelected] = useState(null);

    const handleContinue = () => {
        if (!selected) return;
        setDistrict(selected.name);
        localStorage.setItem('selectedDistrict', selected.name);
        navigate(`/${intent}`);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0c10', color: '#e8e9ec' }}>

            {/* Map Section (Placeholder style representation) */}
            <div style={{ flex: 1, position: 'relative', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #1c1f28 0%, #0a0c10 100%)', zIndex: 0 }} />

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <MapPin size={64} style={{ color: 'rgba(200,149,108,0.2)', marginBottom: 24, margin: '0 auto' }} />
                    <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Tamil Nadu Sector Map</h2>
                    <p style={{ color: '#636674', fontSize: 13, marginTop: 8 }}>Interactive map integration pending primary source document</p>

                    <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                        {tnDistricts.map(d => (
                            <button key={d.name}
                                onClick={() => setSelected(d)}
                                style={{
                                    background: selected?.name === d.name ? '#c8956c' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${selected?.name === d.name ? '#c8956c' : 'rgba(255,255,255,0.1)'}`,
                                    color: selected?.name === d.name ? '#111' : '#e8e9ec',
                                    padding: '12px 24px', width: 260, borderRadius: 6,
                                    fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease',
                                    opacity: d.active ? 1 : 0.4
                                }}
                                disabled={!d.active}
                            >
                                {d.name.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div style={{ width: 440, padding: '48px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 40 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#c8956c', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>District Selection</div>
                    <h1 style={{ fontSize: 28, fontWeight: 700 }}>Regional Gateway</h1>
                </div>

                {selected ? (
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 16 }}>{selected.name.toUpperCase()}</h2>
                        <p style={{ fontSize: 14, color: '#a0a3b1', lineHeight: 1.6, marginBottom: 32 }}>{selected.description}</p>

                        <div style={{ background: '#13151a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 24, marginBottom: 32 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: '#636674', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Registered Mines</div>
                                    <div style={{ fontSize: 24, fontWeight: 600, color: '#e8e9ec' }}>{selected.mines}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: '#636674', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Avg Compliance</div>
                                    <div style={{ fontSize: 24, fontWeight: 600, color: '#4caf78' }}>{selected.compliance}</div>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleContinue} style={{ width: '100%', background: '#c8956c', border: 'none', padding: '16px', borderRadius: 4, color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            CONTINUE TO {intent.toUpperCase()} <ArrowRight size={16} />
                        </button>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#636674', textAlign: 'center' }}>
                        <MapPin size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p style={{ fontSize: 14, maxWidth: 240 }}>Please select a district from the map to view regional data and proceed.</p>
                    </div>
                )}
            </div>

        </div>
    );
}
