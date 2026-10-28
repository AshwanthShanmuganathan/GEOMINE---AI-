import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { ArrowLeft, Search, MapPin, HardHat } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import mapData from '../data/map.json';
import api from '../services/api';

function SetupMapBounds({ geoData }) {
    const map = useMap();
    useEffect(() => {
        if (geoData) {
            map.setView([11.1271, 78.6569], 7);
        }
    }, [geoData, map]);
    return null;
}

export default function PortalMap() {
    const navigate = useNavigate();
    const [geoData, setGeoData] = useState(null);
    const [districtsList, setDistrictsList] = useState(mapData.districts || []);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [hoveredDistrict, setHoveredDistrict] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(null);

    useEffect(() => {
        fetch('/tn.geojson')
            .then(res => res.json())
            .then(data => setGeoData(data))
            .catch(err => console.error("Could not load GeoJSON:", err));

        api.getDistricts()
            .then(data => {
                if (data && data.length > 0) setDistrictsList(data);
            })
            .catch(err => console.warn("PortalMap fallback:", err.message));
    }, []);

    // Find district info from map.json by name — uses fuzzy matching for GeoJSON name variants
    const findDistrictInfo = (dName) => {
        if (!dName) return null;
        // Exact match first
        let found = districtsList.find(d => d.name.toLowerCase() === dName.toLowerCase());
        if (found) return found;

        // GeoJSON name variants mapping
        const nameMap = {
            'tiruchchirappalli': 'tiruchirappalli',
            'the nilgiris': 'the nilgiris',
            'nilgiris': 'the nilgiris',
            'viluppuram': 'viluppuram',
            'tirunelveli kattabo': 'tirunelveli'
        };
        const normalised = nameMap[dName.toLowerCase()] || dName.toLowerCase();
        found = districtsList.find(d => d.name.toLowerCase() === normalised);
        if (found) return found;

        // Partial match
        found = districtsList.find(d =>
            d.name.toLowerCase().includes(normalised) || normalised.includes(d.name.toLowerCase())
        );
        return found || null;
    };

    const handleDistrictClick = (districtName, feature, e) => {
        try {
            if (e && e.target && e.target.getBounds) {
                const bounds = e.target.getBounds();
                e.target._map.fitBounds(bounds, { padding: [50, 50], maxZoom: 9 });
            }
        } catch (err) {
            console.error(err);
        }

        const districtInfo = findDistrictInfo(districtName);
        if (districtInfo) {
            setSelectedDistrict(districtInfo);
        } else {
            // District exists on GeoJSON map but not yet in map.json — treat as PENDING
            setSelectedDistrict({
                id: `TN-${districtName.toUpperCase().replace(/\s+/g, '')}`,
                name: districtName,
                state: 'Tamil Nadu',
                totalSourceRecords: 0,
                verifiedLocationCount: 0,
                mapEnabled: false,
                dataStatus: 'PENDING'
            });
        }

        setSelectedLocation(null);
        setSearchQuery('');
    };

    // Tooltip display status — per-district, based on actual data
    const getDistrictDisplayStatus = (districtInfo) => {
        if (!districtInfo) return { label: 'DATA NOT AVAILABLE', color: '#636674' };

        const verifiedCount = mapData.miningLocations.filter(l => l.districtId === districtInfo.id).length;
        const sourceRecords = districtInfo.totalSourceRecords || 0;

        if (verifiedCount > 0) {
            return { label: `${verifiedCount} VERIFIED LOCATIONS`, color: '#4caf78' };
        } else if (sourceRecords > 0) {
            return { label: `${sourceRecords} SOURCE RECORDS`, color: '#c8956c' };
        } else if (districtInfo.dataStatus === 'PENDING') {
            return { label: 'DATA NOT AVAILABLE', color: '#636674' };
        } else {
            return { label: 'DATA NOT AVAILABLE', color: '#636674' };
        }
    };

    const geoStyle = (feature) => {
        const dName = feature.properties.NAME_2 || feature.properties.district;
        const isSelected = selectedDistrict && selectedDistrict.name === dName;
        const isHovered = hoveredDistrict === dName;
        const districtInfo = findDistrictInfo(dName);
        const sourceRecords = districtInfo?.totalSourceRecords || 0;
        const verifiedCount = districtInfo ? mapData.miningLocations.filter(l => l.districtId === districtInfo.id).length : 0;
        const hasData = sourceRecords > 0 || verifiedCount > 0;

        return {
            fillColor: isSelected ? 'rgba(200, 149, 108, 0.4)' : (hasData ? 'rgba(76, 175, 120, 0.15)' : 'rgba(99, 102, 116, 0.05)'),
            weight: isSelected ? 3 : (isHovered ? 2 : 1),
            opacity: 1,
            color: isSelected ? '#c8956c' : (isHovered ? '#fff' : 'rgba(255,255,255,0.4)'),
            fillOpacity: isSelected ? 0.6 : (isHovered ? 0.4 : (hasData ? 0.2 : 0.05))
        };
    };

    const onEachFeature = (feature, layer) => {
        const dName = feature.properties.NAME_2 || feature.properties.district;
        const districtInfo = findDistrictInfo(dName);
        const status = getDistrictDisplayStatus(districtInfo);

        layer.bindTooltip(`
      <div style="font-family: Inter; background: #111318; border: 1px solid #c8956c; padding: 8px 12px; border-radius: 4px; color: #fff;">
        <div style="font-size: 11px; color: #a0a3b1; letter-spacing: 1px; text-transform: uppercase;">District</div>
        <div style="font-size: 15px; font-weight: 700; color: #c8956c; margin-bottom: 2px;">${dName?.toUpperCase()}</div>
        <div style="font-size: 13px; font-weight: 600; color: ${status.color}">${status.label}</div>
      </div>
    `, { direction: 'top', className: 'custom-leaflet-tooltip' });

        layer.on({
            mouseover: () => setHoveredDistrict(dName),
            mouseout: () => setHoveredDistrict(null),
            click: (e) => handleDistrictClick(dName, feature, e)
        });
    };

    // Get locations for the selected district only
    const displayedLocations = useMemo(() => {
        if (!selectedDistrict) return [];
        let filtered = mapData.miningLocations.filter(loc => loc.districtId === selectedDistrict.id);
        if (searchQuery) {
            filtered = filtered.filter(l =>
                l.villageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.id.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filtered;
    }, [selectedDistrict, searchQuery]);

    const handleContinueLogin = () => {
        localStorage.setItem('selectedDistrictId', selectedDistrict.id);
        localStorage.setItem('selectedDistrict', selectedDistrict.name);
        localStorage.setItem('selectedLocationId', selectedLocation.id);
        localStorage.setItem('selectedLocationName', selectedLocation.villageName);
        localStorage.removeItem('selectedMine');
        navigate('/login');
    };

    // Compute verified location count and source records for side panel
    const verifiedLocationCount = selectedDistrict
        ? mapData.miningLocations.filter(l => l.districtId === selectedDistrict.id).length
        : 0;
    const totalSourceRecords = selectedDistrict?.totalSourceRecords || 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0a0c10', color: '#e8e9ec', overflow: 'hidden' }}>

            <header style={{ padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, background: '#0a0c10', flexShrink: 0 }}>
                <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#a0a3b1', cursor: 'pointer', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
                    <ArrowLeft size={16} /> BACK TO HOME
                </button>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.5, color: '#c8956c' }}>TAMIL NADU MINING PORTAL</div>
                <div style={{ width: 120 }}>
                    {selectedDistrict && (
                        <button
                            onClick={() => {
                                setSelectedDistrict(null);
                                setSelectedLocation(null);
                                setSearchQuery('');
                            }}
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, color: '#a0a3b1', padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}>
                            RESET MAP
                        </button>
                    )}
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

                {/* Map Area — NO mining markers, district boundaries only */}
                <div style={{ flex: selectedDistrict ? '0 0 70%' : '1', transition: 'all 0.3s ease', background: '#0f1115', position: 'relative' }}>
                    <MapContainer
                        center={[11.1271, 78.6569]}
                        zoom={7}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={true}
                    >
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution="Tiles &copy; Esri"
                        />

                        {geoData && (
                            <GeoJSON
                                data={geoData}
                                style={geoStyle}
                                onEachFeature={onEachFeature}
                            />
                        )}

                        <SetupMapBounds geoData={geoData} />
                    </MapContainer>

                    <style>{`
             .leaflet-tooltip.custom-leaflet-tooltip {
                background: transparent; border: none; box-shadow: none; padding: 0;
             }
             .leaflet-tooltip.custom-leaflet-tooltip::before { display: none; }
             .leaflet-container { background: #0a0c10; font-family: Inter, sans-serif; }
           `}</style>
                </div>

                {/* Side Panel */}
                {selectedDistrict ? (
                    <div style={{ flex: 1, background: '#111318', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

                        {!selectedLocation ? (
                            <>
                                {/* District Header — fixed, does not scroll */}
                                <div style={{ padding: '32px 32px 24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#c8956c', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>DISTRICT</div>
                                    <h1 style={{ fontSize: 32, fontWeight: 800, textTransform: 'uppercase', marginBottom: 16 }}>{selectedDistrict.name}</h1>

                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: 6, flex: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: 10, color: '#636674', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Source Records</div>
                                            <div style={{ fontSize: 24, fontWeight: 700, color: totalSourceRecords > 0 ? '#4caf78' : '#636674' }}>
                                                {totalSourceRecords > 0 ? totalSourceRecords : '—'}
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: 6, flex: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: 10, color: '#636674', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Verified Locations</div>
                                            <div style={{ fontSize: 24, fontWeight: 700, color: verifiedLocationCount > 0 ? '#c8956c' : '#636674' }}>
                                                {verifiedLocationCount > 0 ? verifiedLocationCount : '—'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Location list section — scrollable */}
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

                                    {/* Search — fixed */}
                                    <div style={{ padding: '16px 32px 0 32px', flexShrink: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e8e9ec' }}>MINING LOCATIONS</h3>
                                        </div>
                                        <div style={{ position: 'relative', marginBottom: 12 }}>
                                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#636674' }} />
                                            <input
                                                type="text"
                                                placeholder="Search locations..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#1c1f28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#e8e9ec', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Scrollable location cards */}
                                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '0 32px 24px 32px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {verifiedLocationCount === 0 ? (
                                                <div style={{ color: '#636674', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                                                    {totalSourceRecords > 0
                                                        ? 'Verified mining-location data pending. Source records indicate mining activity in this district.'
                                                        : 'Data not available for this district.'
                                                    }
                                                </div>
                                            ) : displayedLocations.length === 0 ? (
                                                <div style={{ color: '#636674', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>No locations match your search.</div>
                                            ) : (
                                                displayedLocations.map(loc => (
                                                    <div key={loc.id}
                                                        onClick={() => setSelectedLocation(loc)}
                                                        style={{
                                                            padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6,
                                                            cursor: 'pointer', transition: 'all 0.15s'
                                                        }}
                                                        onMouseOver={e => { e.currentTarget.style.borderColor = '#c8956c'; e.currentTarget.style.background = 'rgba(200,149,108,0.05)'; }}
                                                        onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <MapPin size={14} color="#c8956c" />
                                                            <div style={{ fontSize: 15, fontWeight: 700 }}>{loc.villageName}</div>
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#a0a3b1', marginTop: 4, marginLeft: 24, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                            {loc.status === 'VERIFIED_LOCATION' ? 'Verified Location' : loc.status.replace(/_/g, ' ')}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Specific Location Detail Mode Before Login */}
                                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>

                                    <button onClick={() => setSelectedLocation(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#636674', cursor: 'pointer', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 32 }}>
                                        <ArrowLeft size={14} /> BACK TO LOCATIONS
                                    </button>

                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 32, position: 'relative', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.02, pointerEvents: 'none' }}>
                                            <HardHat size={280} style={{ transform: 'translate(15%, -15%)' }} />
                                        </div>

                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#c8956c', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Mining Location</div>
                                            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 40, lineHeight: 1.1 }}>{selectedLocation.villageName}</h2>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 48, fontSize: 14 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                                                    <span style={{ color: '#a0a3b1' }}>District Jurisdiction</span>
                                                    <span style={{ fontWeight: 600, color: '#fff', textTransform: 'uppercase' }}>{selectedDistrict.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                                                    <span style={{ color: '#a0a3b1' }}>Location ID</span>
                                                    <span style={{ fontWeight: 500, color: '#fff', fontFamily: 'monospace' }}>{selectedLocation.id}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                                                    <span style={{ color: '#a0a3b1' }}>Taluk</span>
                                                    <span style={{ fontWeight: 500, color: '#fff' }}>{selectedLocation.taluk || 'Unspecified'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                                                    <span style={{ color: '#a0a3b1' }}>Status</span>
                                                    <span style={{ fontWeight: 600, color: '#4caf78' }}>
                                                        VERIFIED LOCATION
                                                    </span>
                                                </div>
                                            </div>

                                            <button onClick={handleContinueLogin} style={{ width: '100%', background: '#c8956c', border: 'none', padding: '16px', borderRadius: 4, color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#b07b53'} onMouseOut={e => e.currentTarget.style.background = '#c8956c'}>
                                                CONTINUE TO LOGIN <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                ) : (
                    <div style={{ flex: '0 0 30%', background: '#0a0c10', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#636674' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                            <MapPin size={48} style={{ marginBottom: 16 }} />
                            <div style={{ fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>Select District</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Click on map to view mining data</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
