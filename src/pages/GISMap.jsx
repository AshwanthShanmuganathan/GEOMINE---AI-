import React, { useState, useEffect, useMemo } from 'react';
import { Target, Layers, AlertTriangle, MapPin, Search, Shield, ChevronDown, ChevronRight, X, Clock, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../services/api';

// ─── Fit map to district boundary ───
function RegionalBounds({ geoData }) {
    const map = useMap();
    useEffect(() => {
        if (geoData) {
            const layer = L.geoJSON(geoData);
            if (layer.getBounds().isValid()) {
                map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 12 });
            }
        }
    }, [geoData, map]);
    return null;
}

// ─── Risk color palette ───
const RISK_COLORS = {
    HIGH: '#ef4444',
    MEDIUM: '#f59e0b',
    LOW: '#22c55e',
    CRITICAL: '#dc2626'
};

const STATUS_COLORS = {
    Active: '#22c55e',
    Suspended: '#ef4444',
    'Under Review': '#f59e0b'
};

// ─── Tile layers ───
const TILE_LAYERS = {
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri',
        name: 'Satellite'
    },
    street: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap',
        name: 'Street Map'
    },
    terrain: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri',
        name: 'Terrain'
    }
};

export default function GISMap() {
    // ─── State ───
    const [activeFilters, setActiveFilters] = useState({
        allSites: true,
        activeMines: false,
        verified: false,
        highRisk: false,
        mediumRisk: false,
        lowRisk: false,
        violations: false,
        inspections: false,
        suspended: false
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTile, setActiveTile] = useState('satellite');
    const [showLegend, setShowLegend] = useState(true);
    const [sidebarSection, setSidebarSection] = useState({ plotted: true, pending: true, filters: true });
    const [selectedLocation, setSelectedLocation] = useState(null);

    const [districtsList, setDistrictsList] = useState([]);
    const [dbMines, setDbMines] = useState([]);
    const [dbViolations, setDbViolations] = useState([]);
    const [dbInspections, setDbInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const selectedDistrictId = localStorage.getItem('selectedDistrictId') || 'TN-KARUR';
    const [fullGeoData, setFullGeoData] = useState(null);

    // Fetch GeoJSON boundaries
    useEffect(() => {
        fetch('/tn.geojson')
            .then(res => res.json())
            .then(data => setFullGeoData(data))
            .catch(err => console.error("Missing tn.geojson:", err));
    }, []);

    // Fetch live GIS data from API
    const loadGISData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [distData, minesData, violData, inspData] = await Promise.all([
                api.getDistricts(),
                api.getMines(selectedDistrictId),
                api.getViolations({ district: selectedDistrictId }),
                api.getInspections({ district: selectedDistrictId })
            ]);
            setDistrictsList(distData || []);
            setDbMines(minesData || []);
            setDbViolations(violData || []);
            setDbInspections(inspData || []);
        } catch (err) {
            console.error("GIS live data load error:", err);
            setError(err.message || "Failed to load live GIS map records from PostgreSQL.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGISData();
    }, [selectedDistrictId]);

    const districtInfo = useMemo(() => {
        return districtsList.find(d => d.id === selectedDistrictId || d.name.toLowerCase() === selectedDistrictId.toLowerCase()) || {
            id: selectedDistrictId,
            name: selectedDistrictId.replace('TN-', ''),
            totalSourceRecords: 0
        };
    }, [districtsList, selectedDistrictId]);

    const districtGeoData = useMemo(() => {
        if (!fullGeoData || !districtInfo) return null;
        const features = fullGeoData.features.filter(f => {
            const geoName = (f.properties.NAME_2 || f.properties.district || '').toLowerCase();
            const distName = (districtInfo.name || '').toLowerCase();
            return geoName === distName || geoName.includes(distName) || distName.includes(geoName);
        });
        if (features.length === 0) return null;
        return { ...fullGeoData, features };
    }, [fullGeoData, districtInfo]);

    // Normalize mine locations from database
    const allDistrictLocations = useMemo(() => {
        return dbMines.map(m => ({
            id: m.id,
            districtId: m.district_id,
            villageName: m.village_name || m.name,
            taluk: m.taluk || 'Regional',
            latitude: m.latitude,
            longitude: m.longitude,
            mineType: m.mine_type,
            operationalStatus: m.operational_status || 'Active',
            compliance: m.compliance_score || 80,
            riskLevel: m.risk_level || 'MEDIUM',
            aiRiskScore: m.ai_risk_score || 50,
            openViolations: m.open_violations || 0,
            pendingActions: m.pending_actions || 0,
            lastInspection: m.last_inspection || '—',
            coordinateStatus: (m.latitude && m.longitude) ? 'VERIFIED' : 'PENDING',
            source: 'State Directorate of Geology and Mining'
        }));
    }, [dbMines]);

    // ─── Plotted (have coordinates) ───
    const plottedLocations = useMemo(() => {
        return allDistrictLocations.filter(loc => loc.latitude !== null && loc.longitude !== null && !isNaN(loc.latitude));
    }, [allDistrictLocations]);

    // ─── Pending (no coordinates) ───
    const pendingLocations = useMemo(() => {
        return allDistrictLocations.filter(loc => loc.latitude === null || loc.longitude === null || isNaN(loc.latitude));
    }, [allDistrictLocations]);

    // ─── Filtered locations for display ───
    const filteredLocations = useMemo(() => {
        let locs = [...plottedLocations];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            locs = locs.filter(l =>
                (l.villageName || '').toLowerCase().includes(q) ||
                (l.taluk || '').toLowerCase().includes(q) ||
                (l.id || '').toLowerCase().includes(q) ||
                (l.mineType || '').toLowerCase().includes(q)
            );
        }

        const hasSpecificFilter = Object.entries(activeFilters)
            .filter(([k]) => k !== 'allSites')
            .some(([, v]) => v);

        if (hasSpecificFilter) {
            locs = locs.filter(loc => {
                if (activeFilters.activeMines && loc.operationalStatus === 'Active') return true;
                if (activeFilters.suspended && loc.operationalStatus === 'Suspended') return true;
                if (activeFilters.verified && loc.coordinateStatus === 'VERIFIED') return true;
                if (activeFilters.highRisk && (loc.riskLevel === 'HIGH' || loc.riskLevel === 'CRITICAL')) return true;
                if (activeFilters.mediumRisk && loc.riskLevel === 'MEDIUM') return true;
                if (activeFilters.lowRisk && loc.riskLevel === 'LOW') return true;
                if (activeFilters.violations && (loc.openViolations || 0) > 0) return true;
                if (activeFilters.inspections) return true;
                return false;
            });
        }

        return locs;
    }, [plottedLocations, searchQuery, activeFilters]);

    // ─── Violation locations with coordinates ───
    const violationMarkers = useMemo(() => {
        if (!activeFilters.violations && !activeFilters.allSites) return [];
        return dbViolations.filter(v => v.latitude && v.longitude);
    }, [dbViolations, activeFilters]);

    // ─── Inspection locations with coordinates ───
    const inspectionMarkers = useMemo(() => {
        if (!activeFilters.inspections) return [];
        return dbInspections.filter(i => i.latitude && i.longitude);
    }, [dbInspections, activeFilters]);

    // ─── Stats ───
    const stats = useMemo(() => {
        const high = plottedLocations.filter(l => l.riskLevel === 'HIGH' || l.riskLevel === 'CRITICAL').length;
        const medium = plottedLocations.filter(l => l.riskLevel === 'MEDIUM').length;
        const low = plottedLocations.filter(l => l.riskLevel === 'LOW').length;
        const totalViolations = plottedLocations.reduce((sum, l) => sum + (l.openViolations || 0), 0);
        return { high, medium, low, totalViolations };
    }, [plottedLocations]);

    // ─── Toggle filter ───
    const toggleFilter = (key) => {
        if (key === 'allSites') {
            setActiveFilters(prev => {
                const newAll = !prev.allSites;
                if (newAll) {
                    const reset = {};
                    Object.keys(prev).forEach(k => reset[k] = k === 'allSites' ? true : false);
                    return reset;
                }
                return { ...prev, allSites: false };
            });
        } else {
            setActiveFilters(prev => ({ ...prev, [key]: !prev[key], allSites: false }));
        }
    };

    // ─── GeoJSON boundary style ───
    const geoStyle = () => ({
        fillColor: 'rgba(200, 149, 108, 0.12)',
        weight: 2.5,
        opacity: 1,
        color: '#c8956c',
        fillOpacity: 0.12,
        dashArray: '6, 4'
    });

    // ─── Custom marker icon based on risk level ───
    const getMarkerIcon = (loc) => {
        const risk = loc.riskLevel || 'LOW';
        const color = RISK_COLORS[risk] || '#c8956c';
        const isHigh = risk === 'HIGH' || risk === 'CRITICAL';
        const isSuspended = loc.operationalStatus === 'Suspended';

        const pulseAnim = isHigh ? `
            <div style="
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                width: 28px; height: 28px; border-radius: 50%;
                background: ${color}33; animation: riskPulse 2s ease-in-out infinite;
            "></div>` : '';

        return new L.DivIcon({
            className: 'custom-mine-marker',
            html: `
                <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                    ${pulseAnim}
                    <div style="
                        width: ${isHigh ? 18 : 14}px; height: ${isHigh ? 18 : 14}px;
                        background: ${color}; border-radius: 50%;
                        border: 3px solid ${isSuspended ? '#666' : '#1a1d26'};
                        z-index: 2;
                        box-shadow: 0 0 ${isHigh ? 14 : 8}px ${color}88;
                    "></div>
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
    };

    const toggleSection = (section) => {
        setSidebarSection(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const filterDefs = [
        { key: 'allSites', label: 'All Sites', color: '#c8956c', count: plottedLocations.length },
        { key: 'activeMines', label: 'Active Mines', color: '#22c55e', count: plottedLocations.filter(l => l.operationalStatus === 'Active').length },
        { key: 'highRisk', label: 'High Risk', color: '#ef4444', count: stats.high },
        { key: 'mediumRisk', label: 'Medium Risk', color: '#f59e0b', count: stats.medium },
        { key: 'lowRisk', label: 'Low Risk', color: '#22c55e', count: stats.low },
        { key: 'violations', label: 'Violations', color: '#dc2626', count: stats.totalViolations },
        { key: 'inspections', label: 'Inspections', color: '#3b82f6', count: dbInspections.length },
        { key: 'suspended', label: 'Suspended', color: '#6b7280', count: plottedLocations.filter(l => l.operationalStatus === 'Suspended').length },
    ];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>District Spatial Intelligence</h1>
                        <p className="subtitle">Real-time PostgreSQL geographical overview of {districtInfo ? districtInfo.name : 'Regional'} operational boundaries.</p>
                    </div>
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)' }}>
                            <RefreshCw size={14} className="spin" /> Syncing GIS Spatial Nodes...
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '10px 16px',
                    marginBottom: 12,
                    background: 'rgba(212, 80, 80, 0.12)',
                    border: '1px solid rgba(212, 80, 80, 0.35)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff6b6b', fontSize: 13 }}>
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                    <button className="btn btn-sm" onClick={loadGISData}>Retry</button>
                </div>
            )}

            {/* Stats Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                    { label: 'Plotted Sites', value: plottedLocations.length, color: '#22c55e', icon: <MapPin size={14} /> },
                    { label: 'High Risk', value: stats.high, color: '#ef4444', icon: <AlertTriangle size={14} /> },
                    { label: 'Open Violations', value: stats.totalViolations, color: '#f59e0b', icon: <Shield size={14} /> },
                    { label: 'Pending Coords', value: pendingLocations.length, color: '#6b7280', icon: <Clock size={14} /> },
                ].map((s, i) => (
                    <div key={i} style={{
                        flex: '1 1 140px', padding: '12px 16px',
                        background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 12
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: s.color
                        }}>{s.icon}</div>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
                {/* ─── Map Container ─── */}
                <div style={{ flex: 1, position: 'relative', background: '#0a0c10', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>

                    {districtGeoData ? (
                        <MapContainer
                            center={[10.95, 78.08]}
                            zoom={10}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={true}
                        >
                            <TileLayer
                                url={TILE_LAYERS[activeTile].url}
                                attribution={TILE_LAYERS[activeTile].attribution}
                            />

                            <GeoJSON data={districtGeoData} style={geoStyle} key={JSON.stringify(districtGeoData)} />

                            {/* ─── Mine Markers ─── */}
                            {filteredLocations.map(loc => (
                                <Marker key={loc.id} position={[loc.latitude, loc.longitude]} icon={getMarkerIcon(loc)}>
                                    <Popup maxWidth={340} minWidth={280}>
                                        <div style={{ fontFamily: 'Inter, sans-serif', color: '#1a1d26', padding: '4px 0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div>
                                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{loc.villageName}</div>
                                                    <div style={{ fontSize: 11, color: '#64748b' }}>{loc.taluk} Taluk, {districtInfo?.name} District</div>
                                                </div>
                                                <div style={{
                                                    padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                                                    background: `${RISK_COLORS[loc.riskLevel] || '#f59e0b'}18`,
                                                    color: RISK_COLORS[loc.riskLevel] || '#f59e0b',
                                                    border: `1px solid ${RISK_COLORS[loc.riskLevel] || '#f59e0b'}40`
                                                }}>
                                                    {loc.riskLevel} RISK
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'grid', gridTemplateColumns: '1fr 1fr',
                                                gap: '8px', padding: '10px', borderRadius: 8,
                                                background: '#f8fafc', marginBottom: 10
                                            }}>
                                                <div><span style={{ fontSize: 10, color: '#94a3b8' }}>Mine Type</span><br /><span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{loc.mineType || '—'}</span></div>
                                                <div><span style={{ fontSize: 10, color: '#94a3b8' }}>Status</span><br /><span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLORS[loc.operationalStatus] || '#334155' }}>{loc.operationalStatus || '—'}</span></div>
                                                <div><span style={{ fontSize: 10, color: '#94a3b8' }}>Compliance</span><br /><span style={{ fontSize: 12, fontWeight: 600, color: (loc.compliance || 0) >= 80 ? '#22c55e' : (loc.compliance || 0) >= 60 ? '#f59e0b' : '#ef4444' }}>{loc.compliance || 0}%</span></div>
                                                <div><span style={{ fontSize: 10, color: '#94a3b8' }}>AI Risk Score</span><br /><span style={{ fontSize: 12, fontWeight: 600, color: (loc.aiRiskScore || 0) >= 70 ? '#ef4444' : (loc.aiRiskScore || 0) >= 40 ? '#f59e0b' : '#22c55e' }}>{loc.aiRiskScore || 0}/100</span></div>
                                                <div><span style={{ fontSize: 10, color: '#94a3b8' }}>Open Violations</span><br /><span style={{ fontSize: 12, fontWeight: 600, color: (loc.openViolations || 0) > 0 ? '#ef4444' : '#22c55e' }}>{loc.openViolations || 0}</span></div>
                                                <div><span style={{ fontSize: 10, color: '#94a3b8' }}>Pending Actions</span><br /><span style={{ fontSize: 12, fontWeight: 600, color: (loc.pendingActions || 0) > 0 ? '#f59e0b' : '#22c55e' }}>{loc.pendingActions || 0}</span></div>
                                                <div><span style={{ fontSize: 10, color: '#94a3b8' }}>Last Inspection</span><br /><span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{loc.lastInspection || '—'}</span></div>
                                                <div>
                                                    <span style={{ fontSize: 10, color: '#94a3b8' }}>Coords Status</span><br />
                                                    <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: '#dcfce7', color: '#166534' }}>
                                                        ✓ DB Verified
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8 }}>
                                                📍 {loc.latitude?.toFixed(4)}°N, {loc.longitude?.toFixed(4)}°E (Node {loc.id})
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {/* ─── Violation circle markers ─── */}
                            {activeFilters.violations && violationMarkers.map((v, i) => (
                                <CircleMarker
                                    key={`viol-${v.id}-${i}`}
                                    center={[v.latitude + (i * 0.002), v.longitude + (i * 0.002)]}
                                    radius={6}
                                    pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.8, weight: 2 }}
                                >
                                    <Popup>
                                        <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#111' }}>
                                            <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ {v.category} Violation</div>
                                            <div style={{ color: '#666', fontSize: 11, marginBottom: 4 }}>{v.description}</div>
                                            <div style={{ fontSize: 11 }}>Site: <strong>{v.mine_name || v.mineN}</strong></div>
                                            <div style={{ fontSize: 11 }}>Severity: <strong style={{ color: v.severity === 'CRITICAL' ? '#dc2626' : '#f59e0b' }}>{v.severity}</strong></div>
                                            <div style={{ fontSize: 11 }}>Status: <strong>{v.status}</strong></div>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            ))}

                            {/* ─── Inspection circle markers ─── */}
                            {activeFilters.inspections && inspectionMarkers.map((ins, i) => (
                                <CircleMarker
                                    key={`ins-${ins.id}-${i}`}
                                    center={[ins.latitude - 0.003, ins.longitude - 0.003]}
                                    radius={5}
                                    pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.7, weight: 2 }}
                                >
                                    <Popup>
                                        <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#111' }}>
                                            <div style={{ fontWeight: 700, marginBottom: 4 }}>📋 Inspection Record</div>
                                            <div style={{ fontSize: 11 }}>Site: <strong>{ins.mine_name || ins.mineN}</strong></div>
                                            <div style={{ fontSize: 11 }}>Inspector: <strong>{ins.inspector}</strong></div>
                                            <div style={{ fontSize: 11 }}>Date: <strong>{ins.date}</strong></div>
                                            <div style={{ fontSize: 11 }}>Score: <strong style={{ color: ins.score >= 80 ? '#22c55e' : '#f59e0b' }}>{ins.score}%</strong></div>
                                            <div style={{ fontSize: 11 }}>Findings: <strong>{ins.findings}</strong></div>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            ))}

                            <RegionalBounds geoData={districtGeoData} />
                        </MapContainer>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#636674' }}>
                            {loading ? 'Connecting to PostgreSQL Spatial Coordinates...' : 'Loading Topography...'}
                        </div>
                    )}

                    {/* ─── Map Controls (top-right) ─── */}
                    <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1000 }}>
                        {Object.entries(TILE_LAYERS).map(([key, tile]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTile(key)}
                                style={{
                                    padding: '6px 12px', fontSize: 11, fontWeight: 600,
                                    background: activeTile === key ? 'var(--accent)' : 'rgba(26,29,38,0.9)',
                                    color: activeTile === key ? '#000' : '#ccc',
                                    border: `1px solid ${activeTile === key ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: 6, cursor: 'pointer',
                                    backdropFilter: 'blur(10px)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {tile.name}
                            </button>
                        ))}
                    </div>

                    {/* ─── Legend (bottom-left) ─── */}
                    {showLegend && (
                        <div style={{
                            position: 'absolute', bottom: 32, left: 16, zIndex: 1000,
                            background: 'rgba(20,22,30,0.95)', border: '1px solid var(--border-subtle)',
                            borderRadius: 8, padding: '12px 16px', backdropFilter: 'blur(10px)',
                            minWidth: 180
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legend</span>
                                <button onClick={() => setShowLegend(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)' }}>
                                    <X size={12} />
                                </button>
                            </div>
                            {[
                                { color: '#ef4444', label: 'High Risk Mine', shape: 'circle-lg' },
                                { color: '#f59e0b', label: 'Medium Risk Mine', shape: 'circle' },
                                { color: '#22c55e', label: 'Low Risk Mine', shape: 'circle-sm' },
                                { color: '#c8956c', label: 'District Boundary', shape: 'line' },
                                { color: '#dc2626', label: 'Violation', shape: 'diamond' },
                                { color: '#3b82f6', label: 'Inspection', shape: 'square' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    {item.shape === 'line' ? (
                                        <div style={{ width: 16, height: 0, borderTop: `2px dashed ${item.color}` }}></div>
                                    ) : (
                                        <div style={{
                                            width: item.shape === 'circle-lg' ? 12 : item.shape === 'diamond' ? 10 : item.shape === 'square' ? 10 : 10,
                                            height: item.shape === 'circle-lg' ? 12 : item.shape === 'diamond' ? 10 : item.shape === 'square' ? 10 : 10,
                                            background: item.color,
                                            borderRadius: item.shape === 'square' ? 2 : item.shape === 'diamond' ? 2 : '50%',
                                            transform: item.shape === 'diamond' ? 'rotate(45deg)' : 'none',
                                            boxShadow: `0 0 6px ${item.color}66`,
                                            flexShrink: 0
                                        }}></div>
                                    )}
                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {!showLegend && (
                        <button
                            onClick={() => setShowLegend(true)}
                            style={{
                                position: 'absolute', bottom: 32, left: 16, zIndex: 1000,
                                padding: '8px 12px', fontSize: 11, fontWeight: 600,
                                background: 'rgba(20,22,30,0.9)', color: '#ccc',
                                border: '1px solid var(--border-subtle)', borderRadius: 6,
                                cursor: 'pointer', backdropFilter: 'blur(10px)'
                            }}
                        >
                            <Layers size={14} style={{ marginRight: 4 }} /> Legend
                        </button>
                    )}
                </div>

                {/* ─── Sidebar ─── */}
                <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
                    <div className="panel" style={{ flex: 1, marginBottom: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                        {/* District Scope */}
                        <div className="panel-header"><span className="panel-title">District Scope</span></div>
                        <div className="panel-body" style={{ paddingBottom: 12 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 4 }}>{districtInfo?.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>TN Authorized Geo-Boundary</div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    Verified DB: <strong style={{ color: 'var(--accent)' }}>{allDistrictLocations.length}</strong>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    Plotted: <strong style={{ color: '#22c55e' }}>{plottedLocations.length}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
                                borderRadius: 6, padding: '6px 10px'
                            }}>
                                <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search mine, village, taluk..."
                                    style={{
                                        background: 'none', border: 'none', outline: 'none',
                                        color: 'var(--text-primary)', fontSize: 12, width: '100%',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}>
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filters */}
                        <div
                            className="panel-header"
                            style={{ borderTop: '1px solid var(--border-subtle)', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => toggleSection('filters')}
                        >
                            <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {sidebarSection.filters ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                Map Filters
                            </span>
                        </div>
                        {sidebarSection.filters && (
                            <div className="panel-body" style={{ paddingTop: 4, paddingBottom: 8 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {filterDefs.map(f => (
                                        <label key={f.key} style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            fontSize: 12, color: activeFilters[f.key] ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer', padding: '3px 0',
                                            transition: 'color 0.2s ease'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={activeFilters[f.key] || false}
                                                onChange={() => toggleFilter(f.key)}
                                                style={{ accentColor: f.color, width: 14, height: 14 }}
                                            />
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, flexShrink: 0 }}></div>
                                            <span style={{ flex: 1 }}>{f.label}</span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{f.count}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Plotted Sites */}
                        <div
                            className="panel-header"
                            style={{ borderTop: '1px solid var(--border-subtle)', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => toggleSection('plotted')}
                        >
                            <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {sidebarSection.plotted ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                Plotted Sites ({filteredLocations.length})
                            </span>
                        </div>
                        {sidebarSection.plotted && (
                            <div className="panel-body" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
                                {filteredLocations.length === 0 ? (
                                    <div style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                                        {loading ? 'Querying PostgreSQL coordinates...' : (searchQuery ? 'No sites match your search.' : 'No coordinates available for this filter.')}
                                    </div>
                                ) : (
                                    filteredLocations.map((loc) => (
                                        <div
                                            key={loc.id}
                                            style={{
                                                padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)',
                                                display: 'flex', gap: 10, cursor: 'pointer',
                                                background: selectedLocation === loc.id ? 'rgba(200,149,108,0.08)' : 'transparent',
                                                transition: 'background 0.15s ease'
                                            }}
                                            onClick={() => setSelectedLocation(loc.id === selectedLocation ? null : loc.id)}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,149,108,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = selectedLocation === loc.id ? 'rgba(200,149,108,0.08)' : 'transparent'}
                                        >
                                            <div style={{
                                                width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                                                background: RISK_COLORS[loc.riskLevel] || '#c8956c',
                                                boxShadow: `0 0 6px ${RISK_COLORS[loc.riskLevel] || '#c8956c'}44`
                                            }}></div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.villageName}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    <span>{loc.taluk} Taluk</span>
                                                    <span style={{ color: RISK_COLORS[loc.riskLevel] }}>{loc.riskLevel}</span>
                                                    <span>{loc.compliance || 0}%</span>
                                                </div>
                                            </div>
                                            {(loc.openViolations || 0) > 0 && (
                                                <div style={{
                                                    fontSize: 10, fontWeight: 700, color: '#ef4444',
                                                    background: 'rgba(239,68,68,0.1)', padding: '2px 6px',
                                                    borderRadius: 4, alignSelf: 'center', whiteSpace: 'nowrap'
                                                }}>
                                                    {loc.openViolations}V
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Pending Coordinates */}
                        <div
                            className="panel-header"
                            style={{ borderTop: '1px solid var(--border-subtle)', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => toggleSection('pending')}
                        >
                            <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {sidebarSection.pending ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                Pending Coordinates ({pendingLocations.length})
                            </span>
                        </div>
                        {sidebarSection.pending && (
                            <div className="panel-body" style={{ overflowY: 'auto', padding: 0, maxHeight: 200 }}>
                                {pendingLocations.length === 0 ? (
                                    <div style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>All records spatially mapped in database.</div>
                                ) : (
                                    pendingLocations.map(loc => (
                                        <div key={loc.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
                                            <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{loc.villageName}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{loc.taluk} Taluk</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Node: {loc.id}</div>
                                            </div>
                                            <div style={{
                                                fontSize: 9, fontWeight: 700, color: '#f59e0b',
                                                background: 'rgba(245,158,11,0.1)', padding: '2px 6px',
                                                borderRadius: 3, alignSelf: 'center', whiteSpace: 'nowrap',
                                                textTransform: 'uppercase'
                                            }}>
                                                Pending
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .leaflet-container { background: #0a0c10; font-family: Inter, sans-serif; }
                .leaflet-popup-content-wrapper { border-radius: 10px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; }
                .leaflet-popup-content { margin: 10px 14px !important; }
                .leaflet-popup-tip { background: #fff !important; }
                .custom-mine-marker { background: transparent !important; border: none !important; }
                @keyframes riskPulse {
                    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.7; }
                    50% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
                    100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
