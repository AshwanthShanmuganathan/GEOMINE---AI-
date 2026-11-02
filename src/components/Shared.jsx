import { useState, useEffect, useRef } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

export function useAnimatedCounter(end, duration = 1000, decimals = 0) {
    const [value, setValue] = useState(0);
    const ref = useRef();
    useEffect(() => {
        let start = 0;
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Number((start + (end - start) * eased).toFixed(decimals)));
            if (progress < 1) ref.current = requestAnimationFrame(animate);
        };
        ref.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(ref.current);
    }, [end, duration, decimals]);
    return value;
}

export function GeoMineLogo({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#10B981" fillOpacity="0.2" />
            <path d="M4 25L13 9L20 20L24 13L28 25H4Z" fill="#047857" />
            <path d="M13 9L19 19L16 25H4L13 9Z" fill="#10B981" />
            <path d="M13 9L10 14L13 15.5L16 14L13 9Z" fill="#ECFDF5" />
            <path d="M24 13L22 16.5L24 17.5L26 16L24 13Z" fill="#FFFFFF" />
            <path d="M3 25H29" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function StatusBadge({ status }) {
    if (!status) {
        return (
            <span className="badge-status pending">
                <span className="status-dot" style={{ width: 6, height: 6, background: '#F59E0B' }} />
                Pending
            </span>
        );
    }

    const str = String(status).toUpperCase();
    if (str === 'COMPLIANT' || str === 'RESOLVED' || str === 'ACTIVE' || str === 'VALID' || str === 'PASSED') {
        return (
            <span className="badge-status compliant">
                <span className="status-dot" style={{ width: 6, height: 6, background: '#10B981' }} />
                {str === 'COMPLIANT' ? 'Compliant' : str === 'RESOLVED' ? 'Resolved' : str === 'ACTIVE' ? 'Active' : str}
            </span>
        );
    }

    if (str === 'PENDING' || str === 'IN_PROGRESS' || str === 'UNDER REVIEW' || str === 'REVIEW') {
        return (
            <span className="badge-status pending">
                <span className="status-dot" style={{ width: 6, height: 6, background: '#F59E0B' }} />
                {str === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
            </span>
        );
    }

    // Overdue or Critical
    return (
        <span className="badge-status overdue">
            <span className="status-dot" style={{ width: 6, height: 6, background: '#EF4444' }} />
            {str === 'OVERDUE' ? 'Overdue' : str === 'CRITICAL' ? 'Critical' : str}
        </span>
    );
}

export function RiskBadge({ level }) {
    const lvl = String(level || 'LOW').toUpperCase();
    if (lvl === 'CRITICAL' || lvl === 'HIGH') {
        return <span className="badge-status overdue"><span className="status-dot" style={{ width: 6, height: 6, background: '#EF4444' }} />{lvl}</span>;
    }
    if (lvl === 'MEDIUM') {
        return <span className="badge-status pending"><span className="status-dot" style={{ width: 6, height: 6, background: '#F59E0B' }} />MEDIUM</span>;
    }
    return <span className="badge-status compliant"><span className="status-dot" style={{ width: 6, height: 6, background: '#10B981' }} />LOW</span>;
}

export function RiskGauge({ score, size = 110 }) {
    const numScore = typeof score === 'number' ? score : (parseFloat(score) || 0);
    const color = numScore >= 80 ? '#EF4444' : numScore >= 50 ? '#F59E0B' : '#10B981';
    const level = numScore >= 80 ? 'HIGH' : numScore >= 50 ? 'MEDIUM' : 'LOW';
    const animatedScore = useAnimatedCounter(numScore, 1200);
    const r = (size - 14) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (animatedScore / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
                <circle 
                    cx={size / 2} 
                    cy={size / 2} 
                    r={r} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="8" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={offset} 
                    strokeLinecap="round" 
                    style={{ transition: 'stroke-dashoffset 1.2s ease' }} 
                />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{animatedScore}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>{level}</div>
            </div>
        </div>
    );
}

export function RiskBar({ label, value }) {
    const numVal = typeof value === 'number' ? value : (parseFloat(value) || 0);
    const color = numVal >= 80 ? '#EF4444' : numVal >= 50 ? '#F59E0B' : '#10B981';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ width: 120, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
            <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.max(0, numVal))}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 1s ease' }} />
            </div>
            <span className="mono" style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{numVal}</span>
        </div>
    );
}

export function KPI({ label, value, type, suffix, onClick }) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    const animated = useAnimatedCounter(isNaN(num) ? 0 : num, 1000, suffix === '%' ? 1 : 0);
    const cls = type === 'danger' ? 'overdue' : type === 'warning' ? 'pending' : type === 'success' ? 'compliant' : 'total';

    return (
        <div className={`kpi-stat-card ${cls}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className="kpi-info-text">
                <span className="kpi-label-text">{label}</span>
                <span className="kpi-value-num">
                    {typeof value === 'number' ? (suffix === '%' ? animated.toFixed(1) : String(animated).padStart(2, '0')) : (value ?? '—')}
                    {suffix && <span style={{ fontSize: 16, marginLeft: 2 }}>{suffix}</span>}
                </span>
            </div>
        </div>
    );
}

export function Drawer({ title, onClose, children }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onClose) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-dialog" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
                    <button className="action-icon-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}

export function Toast({ message, type = 'success', onClose }) {
    useEffect(() => { 
        const t = setTimeout(onClose, 3500); 
        return () => clearTimeout(t); 
    }, [onClose]);

    return (
        <div className="toast-popup">
            {type === 'success' ? <Check size={16} style={{ color: '#34D399' }} /> : type === 'error' ? <X size={16} style={{ color: '#EF4444' }} /> : <AlertTriangle size={16} style={{ color: '#F59E0B' }} />}
            <span>{message}</span>
        </div>
    );
}

export function DetailField({ label, children }) {
    return (
        <div style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{children ?? '—'}</div>
        </div>
    );
}

export function EmptyState({ icon: Icon, message, actionText, onAction }) {
    return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            {Icon && <Icon size={44} style={{ marginBottom: 12, opacity: 0.4, color: 'var(--color-forest)' }} />}
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: actionText ? 16 : 0, color: 'var(--text-secondary)' }}>{message}</p>
            {actionText && onAction && (
                <button type="button" className="btn-primary" onClick={onAction} style={{ marginTop: 12 }}>
                    {actionText}
                </button>
            )}
        </div>
    );
}

export function Pagination({ current, total, pageSize = 10, onPage }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;

    const startIdx = (current - 1) * pageSize + 1;
    const endIdx = Math.min(current * pageSize, total);

    return (
        <div className="pagination-bar">
            <div>
                Showing <strong>{startIdx} – {endIdx}</strong> of <strong>{total}</strong> records
            </div>
            <div className="pagination-controls">
                <button 
                    className="page-btn" 
                    onClick={() => onPage(Math.max(1, current - 1))}
                    disabled={current === 1}
                >
                    &lt;
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                        <button 
                            key={pageNum} 
                            className={`page-btn ${current === pageNum ? 'active' : ''}`}
                            onClick={() => onPage(pageNum)}
                        >
                            {pageNum}
                        </button>
                    );
                })}
                {totalPages > 5 && <span style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>}
                {totalPages > 5 && (
                    <button 
                        className={`page-btn ${current === totalPages ? 'active' : ''}`}
                        onClick={() => onPage(totalPages)}
                    >
                        {totalPages}
                    </button>
                )}
                <button 
                    className="page-btn" 
                    onClick={() => onPage(Math.min(totalPages, current + 1))}
                    disabled={current === totalPages}
                >
                    &gt;
                </button>
            </div>
        </div>
    );
}
