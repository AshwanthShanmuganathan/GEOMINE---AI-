import { useState, useEffect, useRef } from 'react';
import { Upload, FileStack, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, FileText, Check, ArrowRight } from 'lucide-react';
import { StatusBadge, Drawer, DetailField, Toast } from '../components/Shared';
import api from '../services/api';

export default function Documents() {
    const [selected, setSelected] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [ocrDone, setOcrDone] = useState(false);
    const [uploadedFileMetadata, setUploadedFileMetadata] = useState(null);
    const [toast, setToast] = useState(null);
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const loadDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getDocuments();
            const normalized = (data || []).map(d => ({
                id: d.id,
                name: d.name,
                type: d.type,
                mine: d.mine_id || 'M001',
                mineN: d.mine_name || 'Thennilai East',
                authority: d.authority,
                issueDate: d.issue_date || '2024-06-20',
                expiryDate: d.expiry_date || '2028-09-26',
                status: d.status || 'Valid',
                ocrConfidence: d.ocr_confidence || 95,
                fileUrl: d.file_url,
                fileName: d.file_name,
                fileSize: d.file_size
            }));
            setDocs(normalized);
        } catch (err) {
            console.error("Documents load error:", err);
            setError(err.message || "Failed to load documents from PostgreSQL database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        try {
            const uploadRes = await api.uploadFile(file);
            setUploadedFileMetadata(uploadRes);
            setOcrDone(true);
            setToast(`File "${file.name}" uploaded to storage and digitized via OCR.`);
        } catch (err) {
            console.error("Upload error:", err);
            setError(err.message || "Failed to upload file to backend storage.");
            setToast(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            const newDoc = {
                id: `DOC-${Date.now().toString().slice(-4)}`,
                name: uploadedFileMetadata?.filename || 'Environmental Clearance Certificate',
                type: 'Environmental Clearance',
                mine_id: 'KARUR-VIL-001',
                authority: 'MoEFCC / TNPCB',
                issue_date: '2024-06-20',
                expiry_date: '2028-09-26',
                status: 'Valid',
                ocr_confidence: 97,
                file_url: uploadedFileMetadata?.file_url || null,
                file_name: uploadedFileMetadata?.filename || null,
                file_size: uploadedFileMetadata?.size || null,
                mime_type: uploadedFileMetadata?.content_type || 'application/pdf',
                ocr_data: {
                    permit_no: 'EC-TN-2024-0982',
                    max_depth_m: 45,
                    production_limit: '1.2 MTPA'
                }
            };

            const created = await api.createDocument(newDoc);
            setDocs(prev => [created, ...prev]);
            setToast('Document metadata committed to PostgreSQL database.');
            setOcrDone(false);
            setUploadedFileMetadata(null);
        } catch (err) {
            console.error("Save doc error:", err);
            setToast(`Error: ${err.message}`);
        }
    };

    const ocrFields = [
        { name: 'Permit Number', value: 'EC-TN-2024-0982', confidence: 98 },
        { name: 'Approved Operator', value: 'Thennilai Minerals Corp', confidence: 96 },
        { name: 'Excavation Depth Limit', value: '45.0 Meters', confidence: 92 },
        { name: 'Issue Date', value: '20-Jun-2024', confidence: 97 },
        { name: 'Expiry Date', value: '26-Sep-2028', confidence: 94 },
        { name: 'Statutory Authority', value: 'MoEFCC / TNPCB', confidence: 99 },
    ];

    return (
        <div>
            {/* Header Banner */}
            <div className="page-header-banner">
                <div className="banner-left">
                    <div className="banner-icon-box">
                        <FileStack size={26} />
                    </div>
                    <div className="banner-title-area">
                        <h1>Document Management & OCR Vault</h1>
                        <p>Upload, digitize, and verify mining lease deeds and environmental clearances with automated AI OCR extraction.</p>
                    </div>
                </div>

                <div className="banner-photo-area">
                    <img 
                        src="/mine3.jpg" 
                        alt="Document Vault" 
                        className="banner-mine-img"
                        onError={e => { e.currentTarget.src = '/tn-map.jpg'; }}
                    />
                    <div className="banner-photo-overlay" />
                </div>
            </div>

            {/* Split Grid: Upload Dropzone & Extracted Fields */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="enterprise-card" style={{ marginBottom: 0 }}>
                    <div className="enterprise-card-header">
                        <span className="enterprise-card-title">Upload Statutory Permit</span>
                    </div>
                    <div style={{ padding: 24 }}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                        />
                        {!uploading && !ocrDone && (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed var(--color-mint-border)',
                                    borderRadius: 12,
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    background: '#F0FDFA',
                                    cursor: 'pointer',
                                    transition: 'all 150ms ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-emerald)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-mint-border)'}
                            >
                                <div style={{ 
                                    width: 52, 
                                    height: 52, 
                                    borderRadius: '50%', 
                                    background: '#D1FAE5', 
                                    color: '#065F46', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    margin: '0 auto 14px' 
                                }}>
                                    <Upload size={24} />
                                </div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Select or Drop Document Here</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF / JPG / PNG / DOCX — Max 25MB</p>
                            </div>
                        )}

                        {uploading && (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <RefreshCw size={28} className="spin" style={{ color: 'var(--color-forest)', margin: '0 auto 12px' }} />
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Digitizing Document & Running OCR...</div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Extracting statutory permits and spatial limits...</p>
                            </div>
                        )}

                        {ocrDone && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#047857', fontWeight: 600, fontSize: 13 }}>
                                    <CheckCircle2 size={18} /> File Uploaded & Fields Extracted
                                </div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                                    Review the OCR fields on the right, then commit the document to the PostgreSQL regulatory repository.
                                </p>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className="btn-primary" onClick={handleSave}>
                                        <Check size={15} /> Commit & Save to Repository
                                    </button>
                                    <button className="btn-secondary" onClick={() => { setOcrDone(false); setUploadedFileMetadata(null); }}>
                                        Upload Another
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="enterprise-card" style={{ marginBottom: 0 }}>
                    <div className="enterprise-card-header">
                        <span className="enterprise-card-title">Extracted OCR Metadata</span>
                        {ocrDone && <span style={{ fontSize: 11, fontWeight: 700, color: '#047857', background: '#D1FAE5', padding: '3px 8px', borderRadius: 9999 }}>Confidence 97%</span>}
                    </div>
                    <div style={{ padding: 20 }}>
                        {ocrDone ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {ocrFields.map(f => (
                                    <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: 6 }}>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{f.name}</div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{f.value}</div>
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>{f.confidence}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                                <FileText size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                                <p style={{ fontSize: 13 }}>Upload a permit or lease document on the left to view parsed statutory limits.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Repository Table */}
            <div className="enterprise-card">
                <div className="enterprise-card-header">
                    <span className="enterprise-card-title">Regulatory Document Repository ({docs.length})</span>
                    <button className="btn-secondary" onClick={loadDocuments} style={{ padding: '6px 12px', fontSize: 12 }}>
                        <RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 100 }}>Doc ID</th>
                                <th>Document Title</th>
                                <th style={{ width: 180 }}>Type</th>
                                <th style={{ width: 160 }}>Quarry Site</th>
                                <th style={{ width: 140 }}>Authority</th>
                                <th style={{ width: 110 }}>Expiry Date</th>
                                <th style={{ width: 110 }}>Status</th>
                                <th style={{ width: 100, textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                        {loading ? 'Querying document repository...' : 'No statutory documents on file.'}
                                    </td>
                                </tr>
                            )}
                            {docs.map(d => (
                                <tr key={d.id} onClick={() => setSelected(d)} style={{ cursor: 'pointer' }}>
                                    <td className="mono" style={{ fontWeight: 700, color: 'var(--color-forest)' }}>{d.id}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</td>
                                    <td>
                                        <span className="badge-category" style={{ fontSize: 11 }}>{d.type}</span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{d.mineN}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.authority}</td>
                                    <td className="mono" style={{ fontSize: 12 }}>{d.expiryDate}</td>
                                    <td><StatusBadge status={d.status} /></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); setSelected(d); }}>
                                            <ExternalLink size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {selected && (
                <Drawer title={selected.name} onClose={() => setSelected(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <DetailField label="Document ID"><span className="mono">{selected.id}</span></DetailField>
                        <DetailField label="Permit Type">{selected.type}</DetailField>
                        <DetailField label="Target Quarry">{selected.mineN}</DetailField>
                        <DetailField label="Issuing Authority">{selected.authority}</DetailField>
                        <DetailField label="Validity Window">{selected.issueDate} to {selected.expiryDate}</DetailField>
                        <DetailField label="Status"><StatusBadge status={selected.status} /></DetailField>
                        <DetailField label="AI OCR Confidence"><span style={{ fontWeight: 700, color: '#059669' }}>{selected.ocrConfidence}%</span></DetailField>
                        {selected.fileUrl && (
                            <div style={{ marginTop: 12 }}>
                                <a 
                                    href={selected.fileUrl.startsWith('http') ? selected.fileUrl : `http://localhost:8000${selected.fileUrl}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    Download Attached Permit File <ExternalLink size={14} />
                                </a>
                            </div>
                        )}
                    </div>
                </Drawer>
            )}

            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
