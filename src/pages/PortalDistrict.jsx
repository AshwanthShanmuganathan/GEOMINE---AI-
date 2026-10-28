import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, AlertCircle } from 'lucide-react';
import { mines as rawMines } from '../data/mockData';

export default function PortalDistrict() {
    const { district } = useParams();
    const navigate = useNavigate();

    // Normalize district string for display
    const districtName = district ? district.charAt(0).toUpperCase() + district.slice(1) : '';

    // Extract relevant mines. If mocked data lacks district mapping, fall back contextually.
    const regionalMines = rawMines.filter(m => {
        if (!m.district) return true; // generic match for demo
        return m.district.toLowerCase() === district.toLowerCase();
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0a0c10', color: '#e8e9ec' }}>

            {/* Top Navbar Workspace */}
            <header style={{ padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button onClick={() => navigate('/portal')} style={{ background: 'none', border: 'none', color: '#a0a3b1', cursor: 'pointer', paddingRight: 16 }}>
                        <ArrowLeft size={18} />
                    </button>
                    <span style={{ fontSize: 13, color: '#636674', textTransform: 'uppercase', letterSpacing: 1 }}>Tamil Nadu</span>
                    <span style={{ fontSize: 13, color: '#636674' }}>/</span>
                    <span style={{ fontSize: 13, color: '#e8e9ec', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{districtName}</span>
                </div>
            </header>

            <div style={{ flex: 1, padding: '48px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>

                <div style={{ marginBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 40 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>{districtName} DISTRICT</h1>
                    <p style={{ fontSize: 15, color: '#a0a3b1', maxWidth: 600 }}>Active Mining Operations & Registered Sites</p>
                </div>

                {regionalMines.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px 0', color: '#636674' }}>
                        <AlertCircle size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                        <p>No active operational data found for this district.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {regionalMines.map((mine) => (
                            <div key={mine.id} onClick={() => navigate(`/portal/${district}/${mine.id}`)}
                                style={{
                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 24,
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(200,149,108,0.05)'; e.currentTarget.style.borderColor = '#c8956c'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                            >
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <Database size={16} color="#c8956c" />
                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{mine.name}</h3>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#a0a3b1', display: 'flex', gap: 24 }}>
                                        <span>Type: {mine.type}</span>
                                        <span>Status: {mine.status}</span>
                                    </div>
                                </div>
                                <div>
                                    <ArrowLeft size={20} style={{ transform: 'rotate(180deg)', color: '#636674' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
