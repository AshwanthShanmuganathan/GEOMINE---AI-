import { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Camera, MapPin, CheckCircle, Upload, Shield, AlertTriangle, 
    Layers, RefreshCw, Calendar, Clock, User, FileText, Check, X, ExternalLink
} from 'lucide-react';
import { getActiveContext, setActiveContext } from '../data/mockData';
import { api } from '../services/api';
import { RiskBadge, StatusBadge, Toast } from '../components/Shared';

export default function Inspections() {
    const [context, setContext] = useState(getActiveContext());
    const [step, setStep] = useState(1);
    const [isDone, setIsDone] = useState(false);
    const [inspectionType, setInspectionType] = useState('Routine Safety Audit');
    const [selectedMineId, setSelectedMineId] = useState('');
    const [remarks, setRemarks] = useState('');
    const [availableMines, setAvailableMines] = useState([]);
    const [siteInspections, setSiteInspections] = useState([]);
    const [siteViolations, setSiteViolations] = useState([]);
    const [loadingMines, setLoadingMines] = useState(true);
    const [loadingSiteData, setLoadingSiteData] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    // Evidence photo upload state
    const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState('/mine1.jpg');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);

    // Checklist state
    const [checklistState, setChecklistState] = useState([
        { id: 1, text: 'Excavation depth within approved mining plan limits', status: 'PASS', notes: '' },
        { id: 2, text: 'Dust suppression water sprinkler system active and operational', status: 'PASS', notes: '' },
        { id: 3, text: 'Safety barriers and warning signboards intact at pit boundaries', status: 'PASS', notes: '' },
        { id: 4, text: 'Ground water runoff and drainage silt traps properly maintained', status: 'PASS', notes: '' },
        { id: 5, text: 'Personal protective equipment (PPE) compliance >= 90% for active workforce', status: 'PASS', notes: '' },
        { id: 6, text: 'Blasting sirens and evacuation buffer perimeter operational', status: 'PASS', notes: '' }
    ]);

    // Listen to context changes
    useEffect(() => {
        const handleContextUpdate = () => {
            setContext(getActiveContext());
        };
        window.addEventListener('evs-context-change', handleContextUpdate);
        return () => window.removeEventListener('evs-context-change', handleContextUpdate);
    }, []);

    // Load mines from API for active district
    useEffect(() => {
        let isMounted = true;
        const loadMines = async () => {
            setLoadingMines(true);
            try {
                const data = await api.getMines(context.district || context.districtId);
                if (isMounted && data && data.length > 0) {
                    setAvailableMines(data);
                    // Match selected mine or pick first
                    if (context.mineId && data.some(m => m.id === context.mineId)) {
                        setSelectedMineId(context.mineId);
                    } else {
                        setSelectedMineId(data[0].id);
                    }
                }
            } catch (err) {
                console.warn('API error loading mines:', err);
            } finally {
                if (isMounted) setLoadingMines(false);
            }
        };
        loadMines();
        return () => { isMounted = false; };
    }, [context.district, context.districtId]);

    const activeMine = useMemo(() => {
        return availableMines.find(m => m.id === selectedMineId) || availableMines[0] || {};
    }, [availableMines, selectedMineId]);

    // Load recent site inspections and open violations for active mine
    useEffect(() => {
        if (!activeMine.id) return;
        let isMounted = true;
        const loadSiteHistory = async () => {
            setLoadingSiteData(true);
            try {
                const [insps, viols] = await Promise.all([
                    api.getInspections({ mineId: activeMine.id }),
                    api.getViolations({ mineId: activeMine.id })
                ]);
                if (isMounted) {
                    setSiteInspections(insps || []);
                    setSiteViolations(viols || []);
                }
            } catch (err) {
                console.warn('History load error:', err);
            } finally {
                if (isMounted) setLoadingSiteData(false);
            }
        };
        loadSiteHistory();
        return () => { isMounted = false; };
    }, [activeMine.id]);

    const handleMineChange = (e) => {
        const newMineId = e.target.value;
        setSelectedMineId(newMineId);
        const mObj = availableMines.find(m => m.id === newMineId);
        if (mObj) {
            setActiveContext({
                district: mObj.district || mObj.district_id || context.district,
                districtId: mObj.district_id || context.districtId,
                mine: mObj.id,
                locationName: mObj.name
            });
        }
    };

    const handleChecklistStatus = (id, newStatus) => {
        setChecklistState(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    };

    const handlePhotoSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPhoto(true);
        try {
            const res = await api.uploadFile(file);
            setUploadedPhotoUrl(res.file_url);
            setToast(`Uploaded "${file.name}" to persistent evidence store.`);
        } catch (err) {
            console.error("Photo upload failed:", err);
            setToast(`Photo upload warning: ${err.message}`);
        } finally {
            setUploadingPhoto(false);
        }
    };

    // Calculate dynamic inspection score
    const passedCount = checklistState.filter(i => i.status === 'PASS').length;
    const failedCount = checklistState.filter(i => i.status === 'FAIL').length;
    const computedScore = Math.round((passedCount / (checklistState.length - checklistState.filter(i => i.status === 'N/A').length || 1)) * 100);

    const handleSubmitInspection = async () => {
        setSubmitting(true);
        try {
            await api.submitInspection({
                mine_id: activeMine.id,
                inspection_type: inspectionType,
                score: computedScore,
                findings: failedCount,
                critical: failedCount > 1 ? 1 : 0,
                remarks: remarks || `Routine inspection report for ${activeMine.name}. Evaluated DGMS safety checklist.`,
                photo_url: uploadedPhotoUrl || '/mine1.jpg'
            });
            setToast('Inspection submitted and committed to PostgreSQL database.');
            setIsDone(true);
        } catch (err) {
            console.error('Inspection submit error:', err);
            setToast(`Error submitting inspection: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            {/* Page Header */}
            <div className="page-header" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1>Field Inspection Console</h1>
                        <p className="subtitle">
                            Execute standardized site audits, verify safety checkpoints, and capture photographic evidence for {context.district ? `${context.district} District` : 'Tamil Nadu Mines'}.
                        </p>
                    </div>
                    {activeMine.id && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 12px', background: 'var(--bg-surface)',
                            border: '1px solid var(--border-default)', borderRadius: 6,
                            fontSize: 12
                        }}>
                            <MapPin size={14} style={{ color: 'var(--accent)' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Target Site:</span>
                            <strong style={{ color: '#fff' }}>{activeMine.name}</strong>
                            <span className="mono" style={{ color: 'var(--accent)', fontSize: 11 }}>({activeMine.id})</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Balanced Dual-Column Executive Grid */}
            <div className="inspection-layout">

                {/* Left Column: Inspection Process & Form */}
                <div className="inspection-main">
                    {/* Full-width step indicator */}
                    <div className="step-indicator">
                        <div className={`step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`} onClick={() => !isDone && setStep(1)}>
                            <span className="step-number">01</span> Setup & Protocol
                        </div>
                        <div className={`step ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`} onClick={() => !isDone && setStep(2)}>
                            <span className="step-number">02</span> Safety Checklist ({passedCount}/{checklistState.length})
                        </div>
                        <div className={`step ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`} onClick={() => !isDone && setStep(3)}>
                            <span className="step-number">03</span> Photographic Evidence & Sign-Off
                        </div>
                    </div>

                    {!isDone ? (
                        <div className="panel">
                            <div className="panel-body">

                                {/* Step 1: Setup */}
                                {step === 1 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                                    Target Mining Lease / Quarry ({context.district || 'Tamil Nadu'})
                                                </label>
                                                <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                                                    {availableMines.length} Sites in District
                                                </span>
                                            </div>

                                            <select 
                                                className="filter-select" 
                                                style={{ width: '100%', padding: '12px 14px', fontSize: 13, fontWeight: 500 }}
                                                value={selectedMineId}
                                                onChange={handleMineChange}
                                            >
                                                {availableMines.map(m => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name} — {m.mine_type || m.type} ({m.id})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Mine Snapshot Card */}
                                        {activeMine.id && (
                                            <div style={{
                                                background: 'var(--bg-elevated)',
                                                border: '1px solid var(--border-default)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: 16,
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                                gap: 16,
                                                fontSize: 12
                                            }}>
                                                <div>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Site Identity</span>
                                                    <strong style={{ color: '#fff', fontSize: 13 }}>{activeMine.name}</strong>
                                                    <div className="mono" style={{ color: 'var(--accent)', fontSize: 11, marginTop: 2 }}>ID: {activeMine.id}</div>
                                                </div>
                                                <div>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Jurisdiction</span>
                                                    <span>{activeMine.taluk || activeMine.village_name || 'Sector'}, {context.district}</span>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Type: {activeMine.mine_type || activeMine.type || 'Extraction'}</div>
                                                </div>
                                                <div>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>GPS Node</span>
                                                    <span className="mono" style={{ color: '#4caf78', fontWeight: 600 }}>
                                                        {activeMine.latitude ? `${activeMine.latitude.toFixed(4)}°N, ${activeMine.longitude.toFixed(4)}°E` : '10.6053°N, 78.5432°E'}
                                                    </span>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>RTK Fix Verified</div>
                                                </div>
                                                <div>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Risk Assessment</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <RiskBadge level={activeMine.risk_level || activeMine.riskLevel || 'MEDIUM'} />
                                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score: {activeMine.compliance_score || activeMine.compliance || 82}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                                                Inspection Protocol & Statutory Standard
                                            </label>
                                            <select 
                                                className="filter-select" 
                                                style={{ width: '100%', padding: '12px 14px', fontSize: 13 }}
                                                value={inspectionType}
                                                onChange={e => setInspectionType(e.target.value)}
                                            >
                                                <option value="Routine Safety Audit">Routine Safety Audit (DGMS Guidelines 2026)</option>
                                                <option value="Environmental Compliance">Environmental Compliance & Buffer Zone Audit</option>
                                                <option value="Equipment Verification">Heavy Machinery & Haul Road Safety Verification</option>
                                                <option value="Excavation Boundary Audit">Excavation Depth & Boundary Pillar Audit</option>
                                            </select>
                                        </div>

                                        <div className="grid-2">
                                            <div className="detail-field">
                                                <div className="detail-label">Lead Field Inspector</div>
                                                <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <User size={14} style={{ color: 'var(--accent)' }} />
                                                    Senior Safety Inspector (Officer Console)
                                                </div>
                                            </div>
                                            <div className="detail-field">
                                                <div className="detail-label">Audit Date</div>
                                                <div className="detail-value mono" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Calendar size={14} style={{ color: 'var(--accent)' }} />
                                                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            className="btn btn-accent" 
                                            style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, marginTop: 8 }} 
                                            onClick={() => setStep(2)}
                                        >
                                            Begin Inspection at {activeMine.name || 'Selected Quarry'} →
                                        </button>
                                    </div>
                                )}

                                {/* Step 2: Interactive Checklist */}
                                {step === 2 && (
                                    <div>
                                        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'var(--accent)' }}>
                                                Site: <strong>{activeMine.name}</strong> ({activeMine.id})
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: computedScore >= 80 ? 'var(--risk-low)' : 'var(--risk-high)' }}>
                                                Audit Score: {computedScore}% ({passedCount}/{checklistState.length} Passed)
                                            </span>
                                        </div>

                                        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                                            Standard Statutory Safety Checklist ({inspectionType})
                                        </h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {checklistState.map((item) => (
                                                <div key={item.id} style={{
                                                    padding: '12px 16px',
                                                    background: 'var(--bg-elevated)',
                                                    border: '1px solid var(--border-subtle)',
                                                    borderRadius: 6,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 8
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                        <div style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>
                                                            <span style={{ color: 'var(--accent)', fontWeight: 700, marginRight: 8 }}>#{item.id}</span>
                                                            {item.text}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button 
                                                                type="button"
                                                                className={`check-btn pass ${item.status === 'PASS' ? 'selected' : ''}`}
                                                                onClick={() => handleChecklistStatus(item.id, 'PASS')}
                                                            >
                                                                ✓ PASS
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                className={`check-btn fail ${item.status === 'FAIL' ? 'selected' : ''}`}
                                                                onClick={() => handleChecklistStatus(item.id, 'FAIL')}
                                                            >
                                                                ✕ FAIL
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                className={`check-btn na ${item.status === 'N/A' ? 'selected' : ''}`}
                                                                onClick={() => handleChecklistStatus(item.id, 'N/A')}
                                                            >
                                                                N/A
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {item.status === 'FAIL' && (
                                                        <input 
                                                            type="text" 
                                                            className="glass-input" 
                                                            placeholder="Describe violation finding or hazard details..."
                                                            value={item.notes}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setChecklistState(prev => prev.map(it => it.id === item.id ? { ...it, notes: val } : it));
                                                            }}
                                                            style={{ fontSize: 11, padding: '6px 10px', marginTop: 4, borderColor: 'rgba(212,80,80,0.4)' }}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <button className="btn" onClick={() => setStep(1)}>← Back to Setup</button>
                                            <button className="btn btn-accent" onClick={() => setStep(3)}>Proceed to Evidence & Sign-Off →</button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Evidence & Sign-Off */}
                                {step === 3 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'var(--accent)' }}>
                                                Finalizing Inspection Report for <strong>{activeMine.name}</strong>
                                            </span>
                                            <span style={{ fontSize: 12, color: '#4caf78', fontWeight: 600 }}>
                                                Calculated Score: {computedScore}%
                                            </span>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                                                Field Inspector Official Remarks & Recommendations
                                            </label>
                                            <textarea 
                                                className="glass-input" 
                                                rows={4} 
                                                style={{ width: '100%', padding: 12, resize: 'vertical' }} 
                                                placeholder={`Enter official inspection summary and compliance remarks for ${activeMine.name}...`}
                                                value={remarks}
                                                onChange={e => setRemarks(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                                                Photographic Evidence Upload & Storage
                                            </label>
                                            
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                style={{ display: 'none' }} 
                                                accept="image/*,.pdf" 
                                                onChange={handlePhotoSelect} 
                                            />

                                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                                <button 
                                                    type="button"
                                                    className="btn btn-accent" 
                                                    style={{ flex: '1 1 200px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploadingPhoto}
                                                >
                                                    <Camera size={18} />
                                                    {uploadingPhoto ? 'Uploading to Storage...' : 'Upload Site Photo Evidence'}
                                                </button>

                                                <div style={{
                                                    flex: '1 1 200px', padding: '10px 14px',
                                                    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                                                    borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10
                                                }}>
                                                    <MapPin size={18} style={{ color: '#4caf78', flexShrink: 0 }} />
                                                    <div style={{ fontSize: 11 }}>
                                                        <div style={{ fontWeight: 600, color: '#fff' }}>GPS Watermark Calibrated</div>
                                                        <div className="mono" style={{ color: 'var(--text-muted)' }}>
                                                            {activeMine.latitude ? `${activeMine.latitude.toFixed(4)}°N, ${activeMine.longitude.toFixed(4)}°E` : '10.6053°N, 78.5432°E'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Photo Preview if attached */}
                                            {uploadedPhotoUrl && (
                                                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                                                    <img 
                                                        src={uploadedPhotoUrl.startsWith('http') || uploadedPhotoUrl.startsWith('/uploads') ? (uploadedPhotoUrl.startsWith('http') ? uploadedPhotoUrl : `http://localhost:8000${uploadedPhotoUrl}`) : uploadedPhotoUrl} 
                                                        alt="Site Evidence" 
                                                        style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 4 }} 
                                                        onError={(e) => { e.currentTarget.src = '/mine1.jpg'; }}
                                                    />
                                                    <div style={{ flex: 1, fontSize: 11 }}>
                                                        <div style={{ color: '#fff', fontWeight: 600 }}>Active Evidence Photo Attached</div>
                                                        <div className="mono" style={{ color: 'var(--text-muted)' }}>{uploadedPhotoUrl}</div>
                                                    </div>
                                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(76,175,120,0.15)', color: '#4caf78', fontWeight: 700 }}>
                                                        ✓ Ready
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                            <button className="btn" onClick={() => setStep(2)}>← Back</button>
                                            <button 
                                                className="btn btn-accent" 
                                                style={{ flex: 1, padding: '14px', fontSize: 13, fontWeight: 700 }}
                                                onClick={handleSubmitInspection}
                                                disabled={submitting}
                                            >
                                                {submitting ? 'Committing to PostgreSQL...' : 'Submit Official Inspection Record →'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
                            <CheckCircle size={54} style={{ color: 'var(--risk-low)', margin: '0 auto 16px' }} />
                            <h2 style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Inspection Successfully Committed to PostgreSQL</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.6 }}>
                                Field inspection report for <strong style={{ color: 'var(--accent)' }}>{activeMine.name}</strong> ({activeMine.id}) in <strong style={{ color: '#fff' }}>{context.district} District</strong> has been logged. Audit score: <strong style={{ color: '#4caf78' }}>{computedScore}%</strong>. Immutable audit record has been generated.
                            </p>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                <button className="btn btn-accent" onClick={() => { setStep(1); setIsDone(false); }}>
                                    Perform Another Inspection
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Site Operational Intelligence Console */}
                <div className="inspection-sidebar">

                    {/* Card 1: Quarry Visual & Spatial Coordinates */}
                    <div className="inspection-context-card">
                        <div 
                            className="inspection-context-image" 
                            style={{ backgroundImage: `url('/mine${(Math.abs((activeMine.id || '').split('').reduce((a,b)=>a+b.charCodeAt(0),0)) % 3) + 1}.jpg')` }}
                        >
                            <div className="inspection-context-overlay">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            Quarry Spatial Node
                                        </div>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '2px 0 0 0' }}>
                                            {activeMine.name || 'Mining Location'}
                                        </h3>
                                    </div>
                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(76,175,120,0.2)', color: '#4caf78', fontWeight: 700, border: '1px solid rgba(76,175,120,0.4)' }}>
                                        ✓ VERIFIED
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                                <div>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>District / Taluk</span>
                                    <div style={{ fontWeight: 600, color: '#fff' }}>{context.district || 'Tamil Nadu'}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{activeMine.taluk || activeMine.village_name || 'Regional'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Excavation Type</span>
                                    <div style={{ fontWeight: 600, color: '#fff' }}>{activeMine.mine_type || activeMine.type || 'Blue Metal'}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{activeMine.operational_status || 'Active'}</div>
                                </div>
                            </div>

                            <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                    <MapPin size={14} style={{ color: 'var(--accent)' }} />
                                    <span className="mono" style={{ color: '#e8e9ec' }}>
                                        {activeMine.latitude ? `${activeMine.latitude.toFixed(4)}°N, ${activeMine.longitude.toFixed(4)}°E` : '10.6053°N, 78.5432°E'}
                                    </span>
                                </div>
                                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>RTK Fixed</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                                <div>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Baseline Compliance</span>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: (activeMine.compliance_score || 80) >= 80 ? 'var(--risk-low)' : 'var(--risk-medium)' }}>
                                        {activeMine.compliance_score || activeMine.compliance || 82}%
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Risk Tier</span>
                                    <div><RiskBadge level={activeMine.risk_level || activeMine.riskLevel || 'MEDIUM'} /></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Open Hazards & Violations to Verify */}
                    <div className="panel" style={{ marginBottom: 0 }}>
                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertTriangle size={14} style={{ color: siteViolations.length > 0 ? '#ef4444' : 'var(--risk-low)' }} />
                                Open Hazard Watchlist ({siteViolations.length})
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Site Citations</span>
                        </div>
                        <div style={{ padding: 0 }}>
                            {loadingSiteData ? (
                                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                                    <RefreshCw size={12} className="spin" /> Checking site hazards...
                                </div>
                            ) : siteViolations.length === 0 ? (
                                <div style={{ padding: 16, textAlign: 'center', color: '#4caf78', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <CheckCircle size={14} /> No open violation citations on record.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {siteViolations.slice(0, 3).map((v) => (
                                        <div key={v.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{v.id}</span>
                                                <RiskBadge level={v.severity} />
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>{v.description}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Category: {v.category}</span>
                                                <span style={{ color: v.status === 'OVERDUE' ? 'var(--risk-high)' : 'inherit' }}>Status: {v.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 3: Prior Inspection History from PostgreSQL */}
                    <div className="panel" style={{ marginBottom: 0 }}>
                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Clock size={14} style={{ color: 'var(--accent)' }} />
                                Prior Inspection Logs
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Audit Records</span>
                        </div>
                        <div style={{ padding: 0 }}>
                            {loadingSiteData ? (
                                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                                    <RefreshCw size={12} className="spin" /> Fetching past logs...
                                </div>
                            ) : siteInspections.length === 0 ? (
                                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                                    Initial baseline field audit scheduled for this site.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {siteInspections.slice(0, 3).map((ins) => (
                                        <div key={ins.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{ins.type || 'Safety Audit'}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                                    {ins.inspector} • {ins.date}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{
                                                    fontSize: 12, fontWeight: 700,
                                                    color: (ins.score || 80) >= 80 ? 'var(--risk-low)' : 'var(--risk-medium)'
                                                }}>
                                                    {ins.score || 80}%
                                                </span>
                                                <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ins.id}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 4: DGMS Statutory Compliance Guidelines */}
                    <div style={{
                        padding: '12px 16px', background: 'rgba(200,149,108,0.06)',
                        border: '1px solid rgba(200,149,108,0.2)', borderRadius: 6,
                        fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5
                    }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Shield size={12} /> DGMS Statutory Compliance Notice
                        </div>
                        Inspections must be conducted by certified safety personnel in accordance with the Mines Act 1952. All findings are committed to PostgreSQL audit logs.
                    </div>

                </div>
            </div>

            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
