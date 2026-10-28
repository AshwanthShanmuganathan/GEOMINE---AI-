import { useState, useEffect, useRef } from 'react';

export function useAnimatedCounter(end, duration = 1200, decimals = 0) {
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

export function RiskBadge({ level }) {
    const lvl = String(level || 'LOW').toUpperCase();
    const cls = lvl === 'CRITICAL' ? 'badge-critical' : lvl === 'HIGH' ? 'badge-high' : lvl === 'MEDIUM' ? 'badge-medium' : 'badge-low';
    return <span className={`badge ${cls}`}>{lvl}</span>;
}

export function StatusBadge({ status }) {
    if (!status) return <span className="badge badge-pending">PENDING</span>;
    const str = String(status);
    const s = str.toLowerCase().replace(/[_ ]/g, '-');
    return <span className={`badge badge-${s}`}>{str.replace(/_/g, ' ')}</span>;
}

export function RiskGauge({ score, size = 120 }) {
    const numScore = typeof score === 'number' ? score : (parseFloat(score) || 0);
    const level = numScore >= 80 ? 'HIGH' : numScore >= 50 ? 'MEDIUM' : 'LOW';
    const color = numScore >= 80 ? 'var(--risk-high)' : numScore >= 50 ? 'var(--risk-medium)' : 'var(--risk-low)';
    const animatedScore = useAnimatedCounter(numScore, 1500);
    const r = (size - 12) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (animatedScore / 100) * circumference;
    return (
        <div className="risk-gauge" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="6" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
            </svg>
            <div style={{ textAlign: 'center' }}>
                <span className="risk-gauge-value" style={{ color }}>{animatedScore}</span>
                <span className="risk-gauge-label" style={{ color, fontSize: 10 }}>/ 100<br />{level}</span>
            </div>
        </div>
    );
}

export function RiskBar({ label, value }) {
    const numVal = typeof value === 'number' ? value : (parseFloat(value) || 0);
    const color = numVal >= 80 ? 'var(--risk-high)' : numVal >= 50 ? 'var(--risk-medium)' : 'var(--risk-low)';
    return (
        <div className="risk-bar-item">
            <span className="risk-bar-label">{label}</span>
            <div className="risk-bar-track">
                <div className="risk-bar-fill" style={{ width: `${Math.min(100, Math.max(0, numVal))}%`, background: color }} />
            </div>
            <span className="risk-bar-value">{numVal}</span>
        </div>
    );
}

export function KPI({ label, value, type, suffix, onClick }) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    const animated = useAnimatedCounter(isNaN(num) ? 0 : num, 1000, suffix === '%' ? 1 : 0);
    const cls = type === 'danger' ? 'risk-high' : type === 'warning' ? 'risk-medium' : type === 'success' ? 'risk-low' : type === 'accent' ? 'accent' : '';
    return (
        <div className="kpi-panel" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className="kpi-label">{label}</div>
            <div className={`kpi-value ${cls}`}>
                {typeof value === 'number' ? (suffix === '%' ? animated.toFixed(1) : String(animated).padStart(2, '0')) : (value ?? '—')}
                {suffix && <span style={{ fontSize: 14, marginLeft: 2 }}>{suffix}</span>}
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
        <>
            <div className="drawer-overlay" onClick={onClose} />
            <div className="drawer">
                <div className="drawer-header">
                    <h3 style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{title}</h3>
                    <button className="drawer-close" onClick={onClose} aria-label="Close drawer">✕</button>
                </div>
                <div className="drawer-body">{children}</div>
            </div>
        </>
    );
}

export function Toast({ message, type = 'success', onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div className={`toast ${type}`}>{type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠'} {message}</div>;
}

export function DetailField({ label, children }) {
    return (
        <div className="detail-field">
            <div className="detail-label">{label}</div>
            <div className="detail-value">{children ?? '—'}</div>
        </div>
    );
}

export function EmptyState({ icon: Icon, message, actionText, onAction }) {
    return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            {Icon && <Icon size={40} style={{ marginBottom: 12, opacity: 0.3 }} />}
            <p style={{ fontSize: 13, marginBottom: actionText ? 16 : 0 }}>{message}</p>
            {actionText && onAction && (
                <button type="button" className="btn btn-sm btn-accent" onClick={onAction}>
                    {actionText}
                </button>
            )}
        </div>
    );
}

export function Pagination({ current, total, onPage }) {
    const pages = Math.ceil(total / 10);
    if (pages <= 1) return null;
    return (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', padding: '12px 0', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8, fontFamily: 'var(--font-mono)' }}>
                {(current - 1) * 10 + 1}–{Math.min(current * 10, total)} of {total}
            </span>
            {Array.from({ length: pages }, (_, i) => (
                <button key={i} className={`btn btn-sm ${current === i + 1 ? 'btn-accent' : ''}`} onClick={() => onPage(i + 1)}>{i + 1}</button>
            ))}
        </div>
    );
}
