import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function TNMines() {
    const navigate = useNavigate();
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDistricts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getDistricts();
            setDistricts(data || []);
        } catch (err) {
            console.error("TNMines load error:", err);
            setError(err.message || "Failed to load district data from PostgreSQL.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDistricts();
    }, []);

    // Calculate dynamic metrics from PostgreSQL districts
    const totalDistricts = districts.length;
    const activeDistricts = districts.filter(d => (d.verified_location_count || d.verifiedLocationCount || 0) > 0).length;
    const totalVerifiedLocations = districts.reduce((acc, d) => acc + (d.verified_location_count || d.verifiedLocationCount || 0), 0);

    const displayDistricts = [...districts].sort((a, b) => 
        (b.verified_location_count || b.verifiedLocationCount || 0) - (a.verified_location_count || a.verifiedLocationCount || 0)
    );

    const getStatusStyle = (count) => {
        if (count > 0) return { color: '#4caf78', label: 'AVAILABLE', icon: CheckCircle2 };
        return { color: '#636674', label: 'PENDING', icon: AlertCircle };
    };

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0a0c10', color: '#e8e9ec' }}>

            {/* Background container properly isolated */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url("/mine3.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                    opacity: 0.6
                }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,12,16,0.98) 0%, rgba(10,12,16,0.85) 100%)' }} />
            </div>

            {/* Content properly bounded inside a flex container */}
            <div style={{ position: 'relative', zIndex: 1, padding: '48px 24px 64px 24px', maxWidth: 1000, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>

                <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#a0a3b1', cursor: 'pointer', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 40, width: 'fit-content' }}>
                    <ArrowLeft size={16} /> BACK TO HOME
                </button>

                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 48, marginBottom: 48 }}>
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 800, marginBottom: 16 }}>TAMIL NADU MINES</h1>
                    <p style={{ fontSize: 16, color: '#a0a3b1', lineHeight: 1.7, maxWidth: 800 }}>
                        Mining intelligence across districts and locations backed by real-time PostgreSQL database records. Spatial mapping of state geographic data, environmental assessments, and compliance monitoring translated into actionable metrics for strict digital oversight.
                    </p>
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, color: 'var(--accent)', fontSize: 13 }}>
                            <RefreshCw size={14} className="spin" /> Syncing Live District Database...
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        marginBottom: 24,
                        background: 'rgba(212, 80, 80, 0.12)',
                        border: '1px solid rgba(212, 80, 80, 0.35)',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff6b6b' }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                        <button className="btn btn-sm" onClick={loadDistricts}>Retry</button>
                    </div>
                )}

                {/* Top Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 64 }}>
                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: '#636674', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Districts in Database</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{totalDistricts} <span style={{ fontSize: 14, color: '#636674', fontWeight: 500 }}>Total</span></div>
                    </div>
                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: '#636674', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Active Spatial Districts</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: '#c8956c' }}>{activeDistricts}</div>
                    </div>
                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: '#636674', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Verified GIS Locations</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: '#4caf78' }}>{totalVerifiedLocations.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: '#636674', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Database Engine</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#4caf78', marginTop: 12 }}>PostgreSQL Connected</div>
                    </div>
                </div>

                {/* Regional Mining Distribution Table */}
                <h3 style={{ fontSize: 13, color: '#c8956c', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24 }}>Regional Mining Distribution</h3>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, overflow: 'hidden', marginBottom: 64 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: '#636674', textTransform: 'uppercase', letterSpacing: 1 }}>
                        <div>District</div>
                        <div>Headquarters</div>
                        <div>Verified Locations</div>
                        <div>Data Status</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {displayDistricts.length > 0 ? displayDistricts.map((d, index) => {
                            const verifiedCount = d.verified_location_count || d.verifiedLocationCount || 0;
                            const status = getStatusStyle(verifiedCount);
                            const StatusIcon = status.icon;

                            return (
                                <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '16px 24px', borderBottom: index < displayDistricts.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', fontSize: 14, color: '#e8e9ec', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 600 }}>{d.name.toUpperCase()}</div>
                                    <div style={{ color: '#a0a3b1' }}>{d.headquarters || '—'}</div>
                                    <div style={{ color: verifiedCount > 0 ? '#4caf78' : '#636674', fontWeight: 600 }}>{verifiedCount > 0 ? verifiedCount : '—'}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: status.color, fontSize: 12, fontWeight: 700 }}>
                                        <StatusIcon size={14} /> {status.label}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#636674', fontSize: 14 }}>
                                {loading ? 'Fetching district list from PostgreSQL...' : 'No regional data available.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Data Source Overview */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, padding: '24px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, marginBottom: 64 }}>
                    <div>
                        <div style={{ fontSize: 10, color: '#636674', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>District Boundary Source</div>
                        <div style={{ fontSize: 13, color: '#a0a3b1' }}>TNGIS Master Repository</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 10, color: '#636674', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>State Coverage</div>
                        <div style={{ fontSize: 13, color: '#a0a3b1' }}>{totalDistricts} Districts Mapped</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 10, color: '#636674', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>GIS Locations</div>
                        <div style={{ fontSize: 13, color: '#a0a3b1' }}>{totalVerifiedLocations} Verified Coordinates</div>
                    </div>
                </div>

                {/* CTA */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-start' }}>
                    <button onClick={() => navigate('/portal')} style={{ background: '#c8956c', border: 'none', padding: '16px 36px', borderRadius: 4, color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(200,149,108,0.2)' }}
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
