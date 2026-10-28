import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, HardHat, TrendingUp, AlertTriangle } from 'lucide-react';
import { mines as rawMines } from '../data/mockData';

export default function PortalMineDetail() {
    const { district, mine } = useParams();
    const navigate = useNavigate();

    const districtName = district ? district.charAt(0).toUpperCase() + district.slice(1) : '';
    const mineData = rawMines.find(m => m.id === mine);

    if (!mineData) {
        return <div style={{ color: '#fff', padding: 48 }}>Mine profile not found. Return to map.</div>;
    }

    const handleContinueLogin = () => {
        localStorage.setItem('selectedDistrict', districtName);
        localStorage.setItem('selectedMine', mine);
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0a0c10', color: '#e8e9ec' }}>

            {/* Top Navbar */}
            <header style={{ padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button onClick={() => navigate(`/portal/${district}`)} style={{ background: 'none', border: 'none', color: '#a0a3b1', cursor: 'pointer', paddingRight: 16 }}>
                        <ArrowLeft size={18} />
                    </button>
                    <span style={{ fontSize: 13, color: '#636674', textTransform: 'uppercase', letterSpacing: 1 }}>Tamil Nadu</span>
                    <span style={{ fontSize: 13, color: '#636674' }}>/</span>
                    <span style={{ fontSize: 13, color: '#636674', textTransform: 'uppercase', letterSpacing: 1 }}>{districtName}</span>
                    <span style={{ fontSize: 13, color: '#636674' }}>/</span>
                    <span style={{ fontSize: 13, color: '#e8e9ec', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{mineData.name}</span>
                </div>
            </header>

            <div style={{ flex: 1, padding: '64px 48px', maxWidth: 800, margin: '0 auto', width: '100%' }}>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 48, position: 'relative', overflow: 'hidden' }}>

                    <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.03, pointerEvents: 'none' }}>
                        <HardHat size={320} style={{ transform: 'translate(20%, -20%)' }} />
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#c8956c', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Selected Operation</div>
                        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 40, letterSpacing: -0.5 }}>{mineData.name}</h1>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 48, fontSize: 14 }}>
                            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
                                <span style={{ width: 140, color: '#a0a3b1' }}>District Location</span>
                                <span style={{ fontWeight: 500, color: '#fff' }}>{districtName}</span>
                            </div>
                            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
                                <span style={{ width: 140, color: '#a0a3b1' }}>Registered ID</span>
                                <span style={{ fontWeight: 500, color: '#fff', fontFamily: 'monospace' }}>{mineData.id}</span>
                            </div>
                            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
                                <span style={{ width: 140, color: '#a0a3b1' }}>Operation Type</span>
                                <span style={{ fontWeight: 500, color: '#fff' }}>{mineData.type}</span>
                            </div>
                            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
                                <span style={{ width: 140, color: '#a0a3b1' }}>Status</span>
                                <span style={{ fontWeight: 600, color: mineData.status === 'Active' ? '#4caf78' : '#d45050' }}>{mineData.status.toUpperCase()}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16 }}>
                            <button onClick={handleContinueLogin} style={{ background: '#c8956c', border: 'none', padding: '16px 36px', borderRadius: 4, color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 12 }}>
                                CONTINUE TO LOGIN <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
