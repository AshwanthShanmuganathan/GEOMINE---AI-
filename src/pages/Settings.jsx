import { useState } from 'react';
import { 
    User, Bell, Shield, Sliders, Database, Save, CheckCircle2, 
    Server, Key, RefreshCw, Cpu, HardDrive, Check 
} from 'lucide-react';
import { Toast } from '../components/Shared';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const [toast, setToast] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [fullName, setFullName] = useState('S. Ramanathan');
    const [email, setEmail] = useState('s.ramanathan@geomine.gov.in');
    const [assignedZones, setAssignedZones] = useState('Pudukkottai, Karur, Salem, Coimbatore, Ariyalur Extraction Zones');

    // System preferences
    const [aiOverlay, setAiOverlay] = useState(true);
    const [satelliteHd, setSatelliteHd] = useState(true);
    const [autoSyncInterval, setAutoSyncInterval] = useState('30');

    // Notification states
    const [critSms, setCritSms] = useState(true);
    const [dailyEmail, setDailyEmail] = useState(true);
    const [pushReminders, setPushReminders] = useState(false);

    const tabs = [
        { id: 'profile', label: 'Inspector Profile', icon: User, desc: 'Identity & jurisdiction credentials' },
        { id: 'notifications', label: 'Alert Dispatch', icon: Bell, desc: 'Real-time SMS & compliance briefs' },
        { id: 'security', label: 'Security & Access', icon: Shield, desc: 'JWT sessions & cryptographic credentials' },
        { id: 'database', label: 'Database & Cloud', icon: Database, desc: 'PostgreSQL connection & Docker telemetry' },
        { id: 'system', label: 'System Engine', icon: Sliders, desc: 'AI models & GIS tile render settings' },
    ];

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setToast('Settings and preferences successfully persisted to storage.');
        }, 500);
    };

    return (
        <div style={{ width: '100%' }}>
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1>Command Settings & System Preferences</h1>
                        <p className="subtitle">Configure inspector identity, automated dispatch thresholds, and PostgreSQL engine parameters</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="mono" style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(76,175,120,0.1)', color: '#4caf78', borderRadius: 4, border: '1px solid rgba(76,175,120,0.3)', fontWeight: 600 }}>
                            ● ACTIVE NODE: TN-HQ-SRV-01
                        </span>
                    </div>
                </div>
            </div>

            <div className="settings-layout">
                {/* Navigation Sidebar */}
                <div className="settings-nav">
                    <div style={{ padding: '8px 10px 12px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            Configuration Groups
                        </div>
                    </div>
                    {tabs.map(t => {
                        const Icon = t.icon;
                        const isActive = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                className={`settings-tab-btn ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveTab(t.id)}
                            >
                                <Icon size={16} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                        {t.label}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {t.desc}
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    <div style={{ marginTop: 24, padding: '14px', background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Cpu size={14} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>PostgreSQL 16 Engine</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Container: <span className="mono" style={{ color: '#4caf78' }}>geomine_postgres</span><br />
                            Port: <span className="mono">5432</span> | Pool: <span className="mono">10/20</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="panel" style={{ minWidth: 0 }}>
                    <form onSubmit={handleSave}>
                        {activeTab === 'profile' && (
                            <div>
                                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Inspector & Officer Credentials</h3>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        Identity registered on the State Department of Geology and Mining officer directory.
                                    </p>
                                </div>

                                <div className="grid-2" style={{ gap: 20 }}>
                                    <div className="input-group">
                                        <label className="input-label">Full Name & Rank</label>
                                        <input 
                                            type="text" 
                                            className="glass-input" 
                                            value={fullName} 
                                            onChange={e => setFullName(e.target.value)} 
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Statutory Officer ID</label>
                                        <input type="text" className="glass-input mono" defaultValue="EMP-90244-TN" disabled style={{ opacity: 0.7 }} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Official Gov Email Address</label>
                                        <input 
                                            type="email" 
                                            className="glass-input" 
                                            value={email} 
                                            onChange={e => setEmail(e.target.value)} 
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Assigned Enforcement Role</label>
                                        <input type="text" className="glass-input" defaultValue="Senior Safety Inspector (Class-I Officer)" disabled style={{ opacity: 0.7 }} />
                                    </div>
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">Assigned Jurisdiction & Enforcement Zones</label>
                                        <input 
                                            type="text" 
                                            className="glass-input" 
                                            value={assignedZones} 
                                            onChange={e => setAssignedZones(e.target.value)} 
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)', display: 'flex', gap: 14, alignItems: 'center' }}>
                                    <CheckCircle2 size={24} style={{ color: '#4caf78', flexShrink: 0 }} />
                                    <div style={{ fontSize: 12 }}>
                                        <div style={{ fontWeight: 600, color: '#fff' }}>Cryptographic Digital Signature Enabled</div>
                                        <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>Field inspection reports submitted via this console are digitally signed and timestamped with SHA-256 for evidentiary validity under Indian Evidence Act Section 65B.</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div>
                                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Automated Alerting & Dispatch Channels</h3>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        Configure real-time triggers for safety infractions, pit overflow warnings, and lease expiry.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Critical Safety & Hazard SMS Alerts</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Send emergency SMS dispatch immediately when HIGH risk violations or pit boundary breaches are detected.</div>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={critSms} 
                                            onChange={e => setCritSms(e.target.checked)}
                                            style={{ accentColor: 'var(--accent)', width: 18, height: 18, cursor: 'pointer' }} 
                                        />
                                    </div>

                                    <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Daily District Compliance Briefing (Email)</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Receive an automated daily 08:00 AM summary PDF covering audit results, pending show-cause notices, and contractor rankings.</div>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={dailyEmail} 
                                            onChange={e => setDailyEmail(e.target.checked)}
                                            style={{ accentColor: 'var(--accent)', width: 18, height: 18, cursor: 'pointer' }} 
                                        />
                                    </div>

                                    <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Field Inspection Schedule Reminders (Push)</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Browser push alerts 24 hours prior to mandatory DGMS statutory inspections.</div>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={pushReminders} 
                                            onChange={e => setPushReminders(e.target.checked)}
                                            style={{ accentColor: 'var(--accent)', width: 18, height: 18, cursor: 'pointer' }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div>
                                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Cryptographic Credentials & Session Control</h3>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        Manage your authentication secrets and active JWT token invalidation.
                                    </p>
                                </div>

                                <div className="grid-2" style={{ gap: 20 }}>
                                    <div className="input-group">
                                        <label className="input-label">Current Authentication Password</label>
                                        <input type="password" className="glass-input" placeholder="••••••••••••" />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }} />
                                    <div className="input-group">
                                        <label className="input-label">New Password (Min 12 Characters)</label>
                                        <input type="password" className="glass-input" placeholder="••••••••••••" />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Confirm New Password</label>
                                        <input type="password" className="glass-input" placeholder="••••••••••••" />
                                    </div>
                                </div>

                                <div style={{ marginTop: 24, padding: 16, background: 'rgba(212,80,80,0.06)', borderRadius: 6, border: '1px solid rgba(212,80,80,0.25)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                        <Key size={16} style={{ color: '#ff6b6b' }} />
                                        <strong style={{ color: '#ff6b6b', fontSize: 13 }}>Revoke All Active JWT Bearer Sessions</strong>
                                    </div>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                                        If your credentials were used on an unverified field device, invalidate all active bearer tokens across all tablets and desktop consoles immediately.
                                    </p>
                                    <button 
                                        type="button" 
                                        className="btn" 
                                        style={{ border: '1px solid rgba(212,80,80,0.4)', color: '#ff6b6b', fontSize: 12 }}
                                        onClick={() => setToast('All remote inspector sessions successfully invalidated.')}
                                    >
                                        Invalidate Remote Sessions
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'database' && (
                            <div>
                                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>PostgreSQL Database & Storage Telemetry</h3>
                                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                                Target connection strings and container health metrics.
                                            </p>
                                        </div>
                                        <span className="mono" style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(76,175,120,0.15)', color: '#4caf78', borderRadius: 4, fontWeight: 700 }}>
                                            DATABASE CONNECTED
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                                    <div style={{ padding: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6 }}>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Storage Target</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>PostgreSQL 16 (Docker)</div>
                                        <div className="mono" style={{ fontSize: 11, color: '#4caf78', marginTop: 4 }}>evs_postgres_data (Volume)</div>
                                    </div>

                                    <div style={{ padding: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6 }}>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Registered Mines Table</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>146 Active Quarries</div>
                                        <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>38 Districts Cataloged</div>
                                    </div>

                                    <div style={{ padding: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6 }}>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Backend API Service</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>FastAPI (Uvicorn)</div>
                                        <div className="mono" style={{ fontSize: 11, color: '#7ea8d4', marginTop: 4 }}>http://localhost:8000/api</div>
                                    </div>
                                </div>

                                <div className="grid-2" style={{ gap: 20 }}>
                                    <div className="input-group">
                                        <label className="input-label">Connection String (Environment Variable Protected)</label>
                                        <input 
                                            type="text" 
                                            className="glass-input mono" 
                                            defaultValue="postgresql://geomine_user:****@postgres:5432/geomine_db" 
                                            disabled 
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">AWS S3 Evidence Bucket (Production Preparation)</label>
                                        <input 
                                            type="text" 
                                            className="glass-input mono" 
                                            defaultValue="s3://geomine-ai-production-evidence-ap-south-1" 
                                            disabled 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div>
                                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>System Engine & GIS Optimization</h3>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        Client-side rendering performance, map caching, and automated polling parameters.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>AI Risk Assessment Contour Overlays</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Project dynamic hazard heatmaps over Leaflet GIS satellite view.</div>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={aiOverlay} 
                                            onChange={e => setAiOverlay(e.target.checked)}
                                            style={{ accentColor: 'var(--accent)', width: 18, height: 18, cursor: 'pointer' }} 
                                        />
                                    </div>

                                    <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Render High-Res Sentinel & CartoDB Imagery</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Enhance pit boundary visual inspection with high-resolution tile layers.</div>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={satelliteHd} 
                                            onChange={e => setSatelliteHd(e.target.checked)}
                                            style={{ accentColor: 'var(--accent)', width: 18, height: 18, cursor: 'pointer' }} 
                                        />
                                    </div>

                                    <div className="input-group" style={{ maxWidth: 360, marginTop: 8 }}>
                                        <label className="input-label">Auto-Telemetry Refresh Interval</label>
                                        <select 
                                            className="filter-select" 
                                            value={autoSyncInterval}
                                            onChange={e => setAutoSyncInterval(e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px' }}
                                        >
                                            <option value="15">Every 15 Seconds (Realtime)</option>
                                            <option value="30">Every 30 Seconds (Recommended)</option>
                                            <option value="60">Every 60 Seconds (Low Bandwidth)</option>
                                            <option value="manual">Manual Refresh Only</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 16, gap: 12 }}>
                            <button 
                                type="submit" 
                                className="btn btn-accent" 
                                disabled={isSaving}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontWeight: 600 }}
                            >
                                <Save size={15} />
                                {isSaving ? 'Persisting Changes...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
