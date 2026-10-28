import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, MapPin, Mail, Hash } from 'lucide-react';

const bgImages = [
    '/mine1.jpg',
    '/mine2.jpg',
    '/mine3.jpg'
];

export default function Signup({ district, mine }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [activeImg, setActiveImg] = useState(0);

    const locName = localStorage.getItem('selectedLocationName');

    useEffect(() => {
        if (!district || !(mine || locName)) {
            navigate('/portal');
        }
    }, [district, mine, locName, navigate]);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveImg(prev => (prev + 1) % bgImages.length);
        }, 4500);
        return () => clearInterval(interval);
    }, []);

    const handleAuth = (e) => {
        e.preventDefault();
        navigate('/login');
    };

    if (!district || !(mine || locName)) return null;

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
            {bgImages.map((img, i) => (
                <div key={i}
                    style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url("${img}")`, backgroundSize: 'cover', backgroundPosition: 'center',
                        opacity: activeImg === i ? 1 : 0, transition: 'opacity 1.5s ease-in-out', zIndex: 0,
                    }}
                />
            ))}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,12,16,0.9), rgba(10,12,16,0.75))', zIndex: 1 }} />

            <div style={{ position: 'relative', zIndex: 2, margin: 'auto', width: '100%', maxWidth: 380 }}>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MapPin size={14} style={{ color: '#c8956c' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#e8e9ec', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                            {district} District
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#a0a3b1' }}>
                            Location: {locName || mine}
                        </span>
                        <span style={{ cursor: 'pointer', fontSize: 10, color: '#636674', marginLeft: 8, textDecoration: 'underline' }} onClick={() => navigate('/portal')}>Change</span>
                    </div>
                </div>

                <div style={{ background: 'rgba(22,25,32,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '40px 32px', color: '#e8e9ec' }}>
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <div style={{ width: 28, height: 28, background: '#c8956c', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#111' }}>G</div>
                            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>GEOMINE AI</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#a0a3b1' }}>Request Access Profile</div>
                    </div>

                    <form onSubmit={handleAuth}>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#636674', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#636674' }} />
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Authorized Name"
                                    style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#1c1f28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#e8e9ec', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#636674', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Employee ID</label>
                            <div style={{ position: 'relative' }}>
                                <Hash size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#636674' }} />
                                <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required placeholder="e.g. TN-5432"
                                    style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#1c1f28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#e8e9ec', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#636674', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#636674' }} />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="gov@tn.gov.in"
                                    style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#1c1f28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#e8e9ec', fontSize: 13, outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#636674', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Secure Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#636674' }} />
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                                    style={{ width: '100%', padding: '10px 36px 10px 36px', background: '#1c1f28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#e8e9ec', fontSize: 13, outline: 'none' }}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#636674', cursor: 'pointer' }}>
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" style={{ width: '100%', padding: '11px', background: '#c8956c', border: 'none', borderRadius: 4, color: '#111318', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 }}>
                            REQUEST ACCESS
                        </button>
                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#636674', fontSize: 12, cursor: 'pointer' }}>Already have account? <span style={{ color: '#c8956c' }}>LOGIN</span></button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
