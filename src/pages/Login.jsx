import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, MapPin, Layers, ArrowRight } from 'lucide-react';
import { allDistricts, getMinesByDistrict, setActiveContext, getActiveContext } from '../data/mockData';
import { api } from '../services/api';

const bgImages = [
    '/mine1.jpg',
    '/violation.jpg',
    '/compliant.jpg'
];

export default function Login({ setRole, district: propDistrict, mine: propMine }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [activeImg, setActiveImg] = useState(0);

    // Context management
    const currentContext = getActiveContext();
    const [selectedDistrictId, setSelectedDistrictId] = useState(currentContext.districtId || 'TN-KARUR');
    const [selectedMineId, setSelectedMineId] = useState(currentContext.mineId || '');

    // Get mines for selected district
    const districtMines = getMinesByDistrict(selectedDistrictId);

    useEffect(() => {
        if (!selectedMineId || !districtMines.some(m => m.id === selectedMineId)) {
            if (districtMines.length > 0) {
                setSelectedMineId(districtMines[0].id);
            }
        }
    }, [selectedDistrictId, districtMines, selectedMineId]);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveImg(prev => (prev + 1) % bgImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const selectedDistrictObj = allDistricts.find(d => d.id === selectedDistrictId) || allDistricts[0];
    const selectedMineObj = districtMines.find(m => m.id === selectedMineId) || districtMines[0] || {};

    const handleDistrictChange = (e) => {
        const newDistId = e.target.value;
        setSelectedDistrictId(newDistId);
        const minesForNew = getMinesByDistrict(newDistId);
        const firstMine = minesForNew[0] || {};
        setSelectedMineId(firstMine.id || '');
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.login(email, password, selectedDistrictObj.id, selectedMineObj.id);
            const assignedRole = res?.user?.role || (
                email === 'admin@gmail.com' ? 'admin' :
                email === 'manager@gmail.com' ? 'manager' :
                email === 'officer@gmail.com' ? 'officer' : 'inspector'
            );

            // Apply selected place to this login session
            setActiveContext({
                district: selectedDistrictObj.name,
                districtId: selectedDistrictObj.id,
                mine: selectedMineObj.id || null,
                locationName: selectedMineObj.name || null
            });

            localStorage.setItem('userRole', assignedRole);
            setRole(assignedRole);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please use one of the demo accounts below.');
        }
    };

    const demoAccounts = [
        { label: 'ADMIN', role: 'admin', email: 'admin@gmail.com', pass: 'admin123' },
        { label: 'MANAGER', role: 'manager', email: 'manager@gmail.com', pass: 'manager123' },
        { label: 'OFFICER', role: 'officer', email: 'officer@gmail.com', pass: 'officer123' },
        { label: 'INSPECTOR', role: 'inspector', email: 'inspector@gmail.com', pass: 'inspector123' },
    ];

    const fillAndLogin = async (d) => {
        setEmail(d.email);
        setPassword(d.pass);
        setError('');
        
        try {
            await api.login(d.email, d.pass, selectedDistrictObj.id, selectedMineObj.id);
        } catch (e) {}

        // Apply selected place
        setActiveContext({
            district: selectedDistrictObj.name,
            districtId: selectedDistrictObj.id,
            mine: selectedMineObj.id || null,
            locationName: selectedMineObj.name || null
        });

        localStorage.setItem('userRole', d.role);
        setRole(d.role);
        navigate('/dashboard');
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: '#0a0c10'
        }}>
            {/* Background Slideshow */}
            {bgImages.map((src, i) => (
                <div key={src} style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: activeImg === i ? 0.35 : 0,
                    transition: 'opacity 1.5s ease',
                    filter: 'grayscale(30%) brightness(0.6)'
                }} />
            ))}

            <div style={{
                position: 'relative',
                zIndex: 2,
                maxWidth: 460,
                width: '100%',
                margin: '20px',
                background: 'rgba(17, 19, 24, 0.94)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '36px 32px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
                backdropFilter: 'blur(12px)'
            }}>
                {/* Brand Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        background: 'var(--accent)',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: '#111',
                        fontSize: 16
                    }}>
                        G
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: -0.2 }}>GeoMine AI</h2>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Smart Governance & Compliance Monitoring</span>
                    </div>
                </div>

                {/* Place / Mine Context Selector */}
                <div style={{
                    background: 'rgba(200, 149, 108, 0.08)',
                    border: '1px solid rgba(200, 149, 108, 0.25)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 20
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={12} /> Assigned Place & Mine Context
                        </span>
                        <button 
                            type="button" 
                            onClick={() => navigate('/portal')} 
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Open GIS Portal
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                            <label style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>District</label>
                            <select 
                                className="filter-select"
                                value={selectedDistrictId}
                                onChange={handleDistrictChange}
                                style={{ width: '100%', padding: '6px 8px', fontSize: 11 }}
                            >
                                {allDistricts.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} ({d.verifiedLocationCount} mines)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Mine / Site</label>
                            <select 
                                className="filter-select"
                                value={selectedMineId}
                                onChange={e => setSelectedMineId(e.target.value)}
                                style={{ width: '100%', padding: '6px 8px', fontSize: 11 }}
                            >
                                {districtMines.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{ background: 'rgba(212, 80, 80, 0.1)', border: '1px solid var(--risk-high-border)', color: 'var(--risk-high)', fontSize: 12, padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@authority.gov.in"
                                required
                                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '10px 12px 10px 36px', color: '#fff', fontSize: 13, outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '10px 36px 10px 36px', color: '#fff', fontSize: 13, outline: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-accent" style={{ marginTop: 6, padding: '10px' }}>
                        Sign In to {selectedDistrictObj.name} District
                    </button>
                </form>

                {/* Quick Role Access Buttons - Applies to all logins */}
                <div style={{ marginTop: 24, borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 10 }}>
                        One-Click Demo Roles (Applies Assigned Place)
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {demoAccounts.map(d => (
                            <button
                                key={d.label}
                                type="button"
                                onClick={() => fillAndLogin(d)}
                                className="btn btn-sm"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 10px',
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-subtle)',
                                    fontSize: 11
                                }}
                            >
                                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{d.label}</span>
                                <ArrowRight size={12} style={{ opacity: 0.5 }} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
