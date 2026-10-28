import { useState, useEffect, useCallback } from 'react';
import { 
  Maximize2, X, AlertTriangle, RefreshCw, Target, 
  MapPin, Camera, Eye, EyeOff, Layers, ExternalLink, 
  ShieldCheck, Loader2, Image as ImageIcon 
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom lightweight SVG marker for Leaflet to prevent broken marker asset paths
const pinIcon = L.divIcon({
  className: 'evidence-map-pin',
  html: `<div style="
    width: 22px; 
    height: 22px; 
    background: #d45050; 
    border: 2px solid #fff; 
    border-radius: 50%; 
    box-shadow: 0 0 8px rgba(212,80,80,0.8); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: #fff; 
    font-size: 11px; 
    font-weight: 700;
  ">!</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const compliantPinIcon = L.divIcon({
  className: 'evidence-map-pin-compliant',
  html: `<div style="
    width: 22px; 
    height: 22px; 
    background: #4caf78; 
    border: 2px solid #fff; 
    border-radius: 50%; 
    box-shadow: 0 0 8px rgba(76,175,120,0.8); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: #fff; 
    font-size: 11px; 
    font-weight: 700;
  ">✓</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const SATELLITE_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export default function EvidenceViewer({ 
  violation, 
  mine, 
  isCompliant = false, 
  title, 
  compact = false 
}) {
  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'gis'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  // Determine evidence source type
  const isInspectionPhoto = violation?.source === 'INSPECTION' || violation?.evidenceType === 'inspection_photo';
  const isSatelliteEvidence = !isCompliant && !isInspectionPhoto;

  // Resolve image URL
  const rawUrl = isCompliant 
    ? '/compliant.jpg' 
    : (violation?.evidenceUrl || (isInspectionPhoto ? '/mine1.jpg' : '/violation.jpg'));

  const imageUrl = retryNonce > 0 ? `${rawUrl}?retry=${retryNonce}` : rawUrl;

  // Determine geographic coordinates
  const lat = violation?.latitude || mine?.lat;
  const lng = violation?.longitude || mine?.lng;
  const hasCoordinates = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

  // Reset loading & error state when URL changes
  useEffect(() => {
    setImgLoading(true);
    setImgError(false);
  }, [imageUrl]);

  // Handle ESC key to close modal
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isModalOpen) {
      setIsModalOpen(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, handleKeyDown]);

  const handleRetry = (e) => {
    e?.stopPropagation();
    setImgLoading(true);
    setImgError(false);
    setRetryNonce(prev => prev + 1);
  };

  const headerTitle = title || (isCompliant 
    ? 'COMPLIANT: Verified Perimeter Monitoring' 
    : isInspectionPhoto 
      ? `FIELD INSPECTION EVIDENCE: ${violation?.category || 'Site'} Photographic Record` 
      : `SATELLITE EVIDENCE: ${violation?.description ? violation.description.split(' ').slice(0, 4).join(' ') : 'Unauthorized Excavation'} Exceedance`);

  return (
    <div className="panel" style={{ 
      border: isCompliant ? '1px solid rgba(76, 175, 120, 0.4)' : '1px solid rgba(212, 80, 80, 0.4)',
      overflow: 'hidden',
      marginBottom: compact ? 0 : 20
    }}>
      {/* Evidence Panel Header */}
      <div className="panel-header" style={{ 
        background: isCompliant ? 'rgba(76, 175, 120, 0.1)' : 'rgba(212, 80, 80, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: '10px 16px'
      }}>
        <span className="panel-title" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          fontSize: 12,
          fontWeight: 700,
          color: isCompliant ? '#4caf78' : '#d45050',
          letterSpacing: 0.5
        }}>
          {isCompliant ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
          {headerTitle}
        </span>

        {/* Tab switchers: Evidence Capture vs Live Satellite GIS */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'evidence' ? 'btn-accent' : ''}`}
            onClick={() => setActiveTab('evidence')}
            style={{ 
              fontSize: 10, 
              padding: '4px 8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4 
            }}
          >
            {isInspectionPhoto ? <Camera size={12} /> : <Target size={12} />}
            {isInspectionPhoto ? 'Inspection Photo' : 'Evidence Capture'}
          </button>

          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'gis' ? 'btn-accent' : ''}`}
            onClick={() => setActiveTab('gis')}
            style={{ 
              fontSize: 10, 
              padding: '4px 8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4 
            }}
            title={hasCoordinates ? 'View live GIS satellite tile layer' : 'Coordinates unavailable'}
          >
            <Layers size={12} /> Live Satellite GIS
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="panel-body" style={{ 
        padding: 0, 
        position: 'relative', 
        height: compact ? 220 : 280, 
        background: '#0c0e12', 
        overflow: 'hidden' 
      }}>

        {/* TAB 1: Evidence Capture Image */}
        {activeTab === 'evidence' && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            
            {/* Loading Indicator */}
            {imgLoading && !imgError && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(12, 14, 18, 0.95)',
                color: 'var(--accent)',
                zIndex: 3
              }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                <span style={{ fontSize: 11, letterSpacing: 0.5, color: 'var(--text-muted)' }}>
                  Loading {isInspectionPhoto ? 'field photograph' : 'satellite evidence'}...
                </span>
              </div>
            )}

            {/* Error Fallback with Retry */}
            {imgError && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                textAlign: 'center',
                background: 'rgba(21, 24, 30, 0.98)',
                zIndex: 4
              }}>
                <AlertTriangle size={32} color="var(--risk-high)" style={{ marginBottom: 10 }} />
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  Evidence image could not be loaded
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 12, maxWidth: 360 }}>
                  The image at <code style={{ color: 'var(--accent)', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: 3 }}>{rawUrl}</code> is unavailable or unreachable.
                </div>
                <button 
                  type="button" 
                  className="btn btn-sm btn-accent" 
                  onClick={handleRetry}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={12} /> Retry Loading Image
                </button>
              </div>
            )}

            {/* Evidence Image */}
            <img
              src={imageUrl}
              alt={headerTitle}
              onLoad={() => {
                setImgLoading(false);
                setImgError(false);
              }}
              onError={() => {
                setImgLoading(false);
                setImgError(true);
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imgLoading ? 0 : 0.88,
                transition: 'opacity 0.3s ease',
                display: imgError ? 'none' : 'block'
              }}
            />

            {/* AI Overlay / Evidence Reticle (When not compliant and overlay is enabled) */}
            {!isCompliant && !imgError && !imgLoading && showOverlay && (
              <>
                {isSatelliteEvidence ? (
                  // Satellite Exceedance AI Bounding Box
                  <div style={{
                    position: 'absolute',
                    top: '22%',
                    left: '28%',
                    width: '44%',
                    height: '46%',
                    border: '2px solid #d45050',
                    background: 'rgba(212, 80, 80, 0.12)',
                    boxShadow: '0 0 12px rgba(212, 80, 80, 0.3)',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: -24,
                      left: -2,
                      background: '#d45050',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 8px',
                      letterSpacing: 0.5,
                      borderTopRightRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Target size={11} /> 
                      {violation?.description ? violation.description.split(' ').slice(0, 3).join(' ').toUpperCase() : 'AI ANOMALY'} - EXCEEDANCE
                    </div>
                    {/* Reticle brackets */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderTop: '2px solid #fff', borderLeft: '2px solid #fff' }} />
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderTop: '2px solid #fff', borderRight: '2px solid #fff' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: 8, height: 8, borderBottom: '2px solid #fff', borderLeft: '2px solid #fff' }} />
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderBottom: '2px solid #fff', borderRight: '2px solid #fff' }} />
                  </div>
                ) : (
                  // Inspection Photo Tag
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(15, 17, 21, 0.85)',
                    border: '1px solid rgba(200, 149, 108, 0.4)',
                    padding: '4px 10px',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--accent)'
                  }}>
                    <Camera size={12} /> FIELD PHOTOGRAPHIC EVIDENCE • {violation?.assignedTo || violation?.officer || 'Inspector'}
                  </div>
                )}
              </>
            )}

            {/* Compliant Boundary Box */}
            {isCompliant && !imgError && !imgLoading && showOverlay && (
              <div style={{
                position: 'absolute',
                top: '12%',
                left: '12%',
                width: '76%',
                height: '76%',
                border: '1px dashed #4caf78',
                background: 'rgba(76, 175, 120, 0.05)',
                pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'absolute',
                  top: -22,
                  right: -1,
                  background: '#4caf78',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  letterSpacing: 0.5,
                  borderTopLeftRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  BOUNDARY LIMIT SECURE
                </div>
              </div>
            )}

            {/* Bottom Controls Bar */}
            {!imgError && !imgLoading && (
              <div style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                right: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 2
              }}>
                {/* Coordinates or Source Label */}
                <span style={{
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  padding: '3px 8px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: '#e8e9ec'
                }}>
                  {hasCoordinates ? `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E` : (isInspectionPhoto ? 'FIELD CAPTURE' : 'ORBITAL RESOLUTION: 0.5m')}
                </span>

                <div style={{ display: 'flex', gap: 6 }}>
                  {/* Overlay toggle */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowOverlay(!showOverlay); }}
                    className="btn btn-sm"
                    style={{
                      background: 'rgba(0,0,0,0.7)',
                      color: '#e8e9ec',
                      border: '1px solid rgba(255,255,255,0.15)',
                      padding: '4px 8px',
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title={showOverlay ? 'Hide AI overlays' : 'Show AI overlays'}
                  >
                    {showOverlay ? <EyeOff size={11} /> : <Eye size={11} />}
                    {showOverlay ? 'Hide Overlay' : 'Show Overlay'}
                  </button>

                  {/* Enlarge Evidence Button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                    className="btn btn-sm"
                    style={{
                      background: isCompliant ? '#4caf78' : '#d45050',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 10px',
                      fontSize: 10,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                      cursor: 'pointer'
                    }}
                  >
                    <Maximize2 size={12} /> ENLARGE EVIDENCE
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Live GIS Satellite Map */}
        {activeTab === 'gis' && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {hasCoordinates ? (
              <MapContainer 
                center={[lat, lng]} 
                zoom={14} 
                scrollWheelZoom={false}
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer url={SATELLITE_TILE_URL} />
                <Marker position={[lat, lng]} icon={isCompliant ? compliantPinIcon : pinIcon}>
                  <Popup>
                    <div style={{ fontSize: 12, color: '#111' }}>
                      <strong>{mine?.name || violation?.mineN || 'Mining Site'}</strong><br />
                      {violation?.description || (isCompliant ? 'Compliant operations' : 'Active Citation')}
                    </div>
                  </Popup>
                </Marker>
                <Circle 
                  center={[lat, lng]} 
                  radius={isCompliant ? 350 : 500} 
                  pathOptions={{ 
                    color: isCompliant ? '#4caf78' : '#d45050', 
                    fillColor: isCompliant ? '#4caf78' : '#d45050', 
                    fillOpacity: 0.15,
                    dashArray: isCompliant ? undefined : '4, 4'
                  }} 
                />
              </MapContainer>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: 24,
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <MapPin size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Geographic Coordinates Unavailable
                </div>
                <p style={{ fontSize: 11, maxWidth: 320 }}>
                  This violation or mine does not have verified GPS coordinates registered. Live GIS satellite map is disabled.
                </p>
              </div>
            )}

            {/* Overlay badge on GIS map */}
            {hasCoordinates && (
              <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: 'rgba(15, 17, 21, 0.85)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: '#fff',
                zIndex: 1000,
                pointerEvents: 'none'
              }}>
                ESRI World_Imagery • {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
              </div>
            )}
          </div>
        )}
      </div>

      {/* ENLARGE EVIDENCE MODAL */}
      {isModalOpen && (
        <div 
          className="evidence-modal-backdrop" 
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 7, 10, 0.92)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          <div 
            className="evidence-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '92vw',
              maxHeight: '92vh',
              width: 1040,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ 
                  color: isCompliant ? '#4caf78' : '#d45050',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {isCompliant ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                </span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {headerTitle}
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12, marginTop: 2 }}>
                    {violation?.id && <span className="mono" style={{ color: 'var(--accent)' }}>ID: {violation.id}</span>}
                    {(violation?.mineN || mine?.name) && <span>Site: {violation?.mineN || mine?.name}</span>}
                    {hasCoordinates && <span className="mono">GPS: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Overlay toggle in modal */}
                {!isCompliant && (
                  <button
                    type="button"
                    onClick={() => setShowOverlay(!showOverlay)}
                    className="btn btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {showOverlay ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showOverlay ? 'Hide AI Overlay' : 'Show AI Overlay'}
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-sm"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    padding: '6px 10px',
                    cursor: 'pointer'
                  }}
                  title="Close (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body - Complete Image with aspect ratio preserved (object-fit: contain) */}
            <div style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#07090d',
              padding: 24,
              overflow: 'hidden',
              minHeight: 460
            }}>
              <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '72vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={imageUrl}
                  alt={headerTitle}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '72vh',
                    objectFit: 'contain',
                    borderRadius: 4,
                    display: 'block'
                  }}
                />

                {/* Scaled AI overlay on modal */}
                {!isCompliant && showOverlay && isSatelliteEvidence && (
                  <div style={{
                    position: 'absolute',
                    top: '22%',
                    left: '28%',
                    width: '44%',
                    height: '46%',
                    border: '2px solid #d45050',
                    background: 'rgba(212, 80, 80, 0.15)',
                    boxShadow: '0 0 16px rgba(212, 80, 80, 0.4)',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: -26,
                      left: -2,
                      background: '#d45050',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      letterSpacing: 0.5,
                      borderTopRightRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Target size={12} /> {violation?.description ? violation.description.split(' ').slice(0, 3).join(' ').toUpperCase() : 'AI ANOMALY'} - EXCEEDANCE TARGET
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
              fontSize: 11,
              color: 'var(--text-muted)'
            }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <span>Type: <strong style={{ color: 'var(--text-secondary)' }}>{isCompliant ? 'Compliant Baseline' : (isInspectionPhoto ? 'Inspection Photo' : 'Satellite Imagery (RGB 0.5m)')}</strong></span>
                <span>Algorithm: <strong style={{ color: 'var(--text-secondary)' }}>YOLOv11-MineBoundary-v4</strong></span>
                <span>Confidence: <strong style={{ color: 'var(--risk-low)' }}>94.8%</strong></span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span className="mono">Updated: 2026-10-27</span>
                <button 
                  type="button"
                  className="btn btn-sm btn-accent" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

