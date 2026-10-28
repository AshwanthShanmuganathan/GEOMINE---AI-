import mapData from './map.json';

// Helper to get active district and mine context safely from localStorage
export const getActiveContext = () => {
    try {
        const districtId = localStorage.getItem('selectedDistrictId') || 'TN-KARUR';
        const districtObj = mapData.districts.find(d => d.id === districtId || d.name.toLowerCase() === (localStorage.getItem('selectedDistrict') || '').toLowerCase());
        const district = districtObj?.name || localStorage.getItem('selectedDistrict') || 'Karur';
        const resolvedDistrictId = districtObj?.id || districtId;
        const mine = localStorage.getItem('selectedMine') || localStorage.getItem('selectedLocationId') || null;
        let locationName = localStorage.getItem('selectedLocationName') || null;

        if (mine && !locationName) {
            const loc = mapData.miningLocations.find(l => l.id === mine);
            if (loc) locationName = loc.villageName;
        }

        return {
            district,
            districtId: resolvedDistrictId,
            mine,
            mineId: mine,
            locationName: locationName || `${district} Mining Sector`
        };
    } catch (e) {
        return {
            district: 'Karur',
            districtId: 'TN-KARUR',
            mine: null,
            mineId: null,
            locationName: 'Karur Mining Sector'
        };
    }
};

export const setActiveContext = (param1, param2, param3) => {
    let district, districtId, mine, locationName;
    if (typeof param1 === 'object' && param1 !== null) {
        ({ district, districtId, mine, locationName } = param1);
    } else {
        district = param1;
        mine = param2;
        locationName = param3;
    }

    if (district && !districtId) {
        const dObj = mapData.districts.find(d => d.name.toLowerCase() === district.toLowerCase() || d.id === district);
        if (dObj) {
            districtId = dObj.id;
            district = dObj.name;
        }
    } else if (districtId && !district) {
        const dObj = mapData.districts.find(d => d.id === districtId);
        if (dObj) district = dObj.name;
    }

    if (mine && !locationName) {
        const loc = mapData.miningLocations.find(l => l.id === mine);
        if (loc) locationName = loc.villageName;
    }

    if (district) localStorage.setItem('selectedDistrict', district);
    if (districtId) localStorage.setItem('selectedDistrictId', districtId);
    if (mine !== undefined) {
        if (mine) {
            localStorage.setItem('selectedMine', mine);
            localStorage.setItem('selectedLocationId', mine);
        } else {
            localStorage.removeItem('selectedMine');
            localStorage.removeItem('selectedLocationId');
        }
    }
    if (locationName !== undefined) {
        if (locationName) localStorage.setItem('selectedLocationName', locationName);
        else localStorage.removeItem('selectedLocationName');
    }

    // Notify all active listeners of context change
    try {
        window.dispatchEvent(new CustomEvent('evs-context-change', {
            detail: { district, districtId, mine, locationName }
        }));
    } catch (e) {}
};

export const allDistricts = mapData.districts;

const generateId = (prefix, i) => `${prefix}-${String(100 + i).padStart(3, '0')}`;

const categories = ['Safety', 'Environment', 'Labour', 'Equipment', 'Compliance'];
const inspectorNames = ['S. Ramaswamy', 'K. Venkatesh', 'P. Murugan', 'R. Selvam', 'A. Kumar'];
const contractorNames = [
    'Sri Balaji Mining Corp',
    'KR Stone Aggregates',
    'TN Mineral Extractors',
    'Karur Sand & Gravel Ltd',
    'Kaveri River Mining Co',
    'Pugalur Quarry Services',
    'Southern Stone Works',
    'Amaravathi Aggregates',
    'Elite Earth Movers',
    'KRS Mining Solutions',
    'Thennilai Quarries',
    'Vangal Stone Industries',
    'Nanjaikadamban Mining',
    'Athur Minerals Corp',
    'Panjamadevi Sand Works',
    'Sivayam Stone Extractors',
    'Salem Magnesite Extractors',
    'Coimbatore Blue Metal Ltd',
    'Madurai Granite Corporation',
    'Ariyalur Cement Works'
];

const violationDescriptions = [
    'Unauthorized excavation depth exceeded by 2 meters',
    'Dust suppression system non-operational for 3 consecutive days',
    'Safety barrier missing at excavation boundary',
    'Ground water monitoring report overdue by 45 days',
    'Blasting operations conducted without proper notification',
    'Worker safety gear compliance below 60% during site visit',
    'Unauthorized vehicle access to restricted mining zone',
    'Noise level exceeding permitted threshold of 75 dB',
    'Improper waste disposal affecting nearby water source',
    'Mining beyond permitted boundary markers',
    'Environmental clearance document expired',
    'Fire safety equipment last inspection overdue'
];

const correctiveActionTitles = [
    'Install additional safety barriers at boundary',
    'Repair dust suppression water sprinkler system',
    'Conduct mandatory safety training for all workers',
    'Submit pending ground water monitoring report',
    'Replace expired fire safety equipment',
    'Install noise monitoring sensors at boundary',
    'Deploy CCTV cameras at excavation perimeter',
    'Update environmental clearance documentation'
];

export const complianceItems = [];
export const violations = [];
export const correctiveActions = [];
export const inspections = [];
export const contractors = [];
export const documents = [];
export const auditLogs = [];

let seqVl = 0;
let seqCr = 0;
let seqCa = 0;
let seqIns = 0;

// Generate rich, consistent data for all verified mining locations in Tamil Nadu
mapData.miningLocations.forEach((loc, index) => {
    const distObj = mapData.districts.find(d => d.id === loc.districtId);
    const districtName = distObj?.name || 'Tamil Nadu';
    const risk = loc.riskLevel || (index % 3 === 0 ? 'HIGH' : 'MEDIUM');
    const comp = loc.compliance || (75 + (index % 20));

    // Compliance items - 2 per location
    complianceItems.push({
        id: generateId('CR', ++seqCr),
        requirement: 'Fire Safety Equipment Inspection',
        category: 'Safety',
        mine: loc.id,
        mineN: loc.villageName,
        districtId: loc.districtId,
        district: districtName,
        frequency: 'Monthly',
        dueDate: '2026-10-15',
        status: risk === 'HIGH' ? 'OVERDUE' : (risk === 'MEDIUM' ? 'PENDING' : 'COMPLIANT')
    });
    complianceItems.push({
        id: generateId('CR', ++seqCr),
        requirement: 'Ground Water Monitoring',
        category: 'Environment',
        mine: loc.id,
        mineN: loc.villageName,
        districtId: loc.districtId,
        district: districtName,
        frequency: 'Quarterly',
        dueDate: '2026-10-22',
        status: 'PENDING'
    });

    // Violations - generated based on risk level
    const violationCount = loc.openViolations || (risk === 'HIGH' ? 2 : risk === 'MEDIUM' ? 1 : 0);
    for (let v = 0; v < violationCount; v++) {
        const idNum = ++seqVl;
        const isPhoto = idNum % 3 === 1;
        const sev = risk === 'HIGH' 
            ? (v === 0 ? 'CRITICAL' : 'HIGH') 
            : (risk === 'MEDIUM' ? (v === 0 ? 'HIGH' : 'MEDIUM') : (idNum % 2 === 0 ? 'MEDIUM' : 'LOW'));
        
        const stat = v === 0 
            ? (idNum % 4 === 0 ? 'OVERDUE' : 'OPEN') 
            : (idNum % 3 === 0 ? 'RESOLVED' : (idNum % 2 === 0 ? 'IN_PROGRESS' : 'OPEN'));

        const assignedOfficer = inspectorNames[idNum % inspectorNames.length];
        const dateStr = `2026-09-${String(10 + (idNum % 18)).padStart(2, '0')}`;
        const deadlineStr = `2026-10-${String(12 + (idNum % 18)).padStart(2, '0')}`;

        violations.push({
            id: generateId('VL', idNum),
            mine: loc.id,
            mineN: loc.villageName,
            districtId: loc.districtId,
            district: districtName,
            category: categories[idNum % categories.length],
            source: isPhoto ? 'INSPECTION' : (idNum % 2 === 0 ? 'AI DETECTION' : 'SATELLITE'),
            description: violationDescriptions[idNum % violationDescriptions.length],
            date: dateStr,
            dateIssued: dateStr,
            deadline: deadlineStr,
            severity: sev,
            status: stat,
            aging: 10 + index + v * 5,
            penalty: 25000 * ((idNum % 5) + 1),
            assignedTo: assignedOfficer,
            officer: assignedOfficer,
            latitude: loc.latitude,
            longitude: loc.longitude,
            evidenceType: isPhoto ? 'inspection_photo' : 'satellite',
            evidenceUrl: isPhoto ? '/mine1.jpg' : '/violation.jpg',
            relatedActionId: generateId('CA', (idNum % 10) + 1)
        });
    }

    // Corrective Actions
    const actionCount = loc.pendingActions || (risk === 'HIGH' ? 2 : risk === 'MEDIUM' ? 1 : 0);
    for (let a = 0; a < actionCount; a++) {
        const idNum = ++seqCa;
        correctiveActions.push({
            id: generateId('CA', idNum),
            mine: loc.id,
            mineN: loc.villageName,
            districtId: loc.districtId,
            district: districtName,
            title: correctiveActionTitles[idNum % correctiveActionTitles.length],
            assignedTo: inspectorNames[idNum % inspectorNames.length],
            deadline: `2026-10-${String(20 + (a % 10)).padStart(2, '0')}`,
            status: a === 0 ? 'OPEN' : 'IN_PROGRESS',
            priority: risk === 'HIGH' ? 'CRITICAL' : 'HIGH',
            relatedViolation: generateId('VL', idNum),
            daysRemaining: 15 - (idNum % 25)
        });
    }

    // Inspections
    inspections.push({
        id: generateId('INS', ++seqIns),
        mine: loc.id,
        mineN: loc.villageName,
        districtId: loc.districtId,
        district: districtName,
        inspector: inspectorNames[index % inspectorNames.length],
        date: loc.lastInspection || '2026-10-01',
        type: categories[(index + 1) % categories.length],
        status: 'COMPLETED',
        findings: violationCount + (index % 3),
        critical: risk === 'HIGH' ? 1 : 0,
        score: comp,
        latitude: loc.latitude,
        longitude: loc.longitude
    });

    // Contractors
    contractors.push({
        id: generateId('CON', index + 1),
        name: contractorNames[index % contractorNames.length],
        mine: loc.id,
        mineN: loc.villageName,
        districtId: loc.districtId,
        district: districtName,
        type: loc.mineType || 'Extraction',
        workers: 15 + (index * 3) % 40,
        license: 'Valid',
        expiry: '2027-01-01',
        safetyScore: Math.max(60, comp - 5 + (index % 10)),
        compliance: comp,
        incidents: risk === 'HIGH' ? 2 : (risk === 'MEDIUM' ? 1 : 0),
        status: loc.operationalStatus || 'Active'
    });

    // Documents
    documents.push({
        id: generateId('DOC', index + 1),
        name: `${loc.villageName} Environmental Clearance`,
        type: 'Certificate',
        mine: loc.id,
        mineN: loc.villageName,
        districtId: loc.districtId,
        district: districtName,
        authority: 'Tamil Nadu State Environmental Board',
        issueDate: '2024-01-01',
        expiryDate: '2028-01-01',
        status: risk === 'HIGH' ? 'Review Required' : 'Valid',
        ocrConfidence: 96
    });

    // Audit logs
    if (index < 12) {
        auditLogs.push({
            id: index + 1,
            action: index % 2 === 0 ? 'Inspection Submitted' : 'Violation Flagged',
            user: inspectorNames[index % inspectorNames.length],
            target: index % 2 === 0 ? generateId('INS', index + 1) : generateId('VL', index + 1),
            timestamp: `2026-10-${String(8 + (index % 20)).padStart(2, '0')} ${10 + (index % 12)}:00:00`,
            type: index % 2 === 0 ? 'inspection' : 'violation'
        });
    }
});

// All mines mapped with district metadata
export const mines = mapData.miningLocations.map((l, idx) => {
    const distObj = mapData.districts.find(d => d.id === l.districtId);
    return {
        id: l.id,
        name: l.villageName,
        districtId: l.districtId,
        district: distObj?.name || 'Tamil Nadu',
        location: `${l.taluk || distObj?.name} Taluk`,
        taluk: l.taluk,
        lat: l.latitude,
        lng: l.longitude,
        riskLevel: l.riskLevel || (idx % 3 === 0 ? 'HIGH' : 'MEDIUM'),
        risk: l.riskLevel === 'HIGH' ? 82 : (l.riskLevel === 'MEDIUM' ? 56 : 24),
        compliance: l.compliance || (75 + (idx % 20)),
        status: l.operationalStatus || 'Active',
        type: l.mineType || 'Open Cast Extraction',
        violations: l.openViolations || (idx % 2 === 0 ? 1 : 0),
        lastInspection: l.lastInspection || '2026-10-01',
        aiRiskScore: l.aiRiskScore || (40 + (idx * 7) % 50),
        pendingActions: l.pendingActions || 0
    };
});

// Dynamic helpers to get places and records according to selected place
export const getMinesByDistrict = (districtNameOrId) => {
    if (!districtNameOrId || districtNameOrId === 'All') return mines;
    const norm = String(districtNameOrId).toLowerCase().trim();
    return mines.filter(m => 
        (m.districtId && m.districtId.toLowerCase() === norm) || 
        (m.district && m.district.toLowerCase() === norm)
    );
};

export const getViolationsByDistrict = (districtNameOrId, mineId) => {
    let list = violations;
    if (districtNameOrId && districtNameOrId !== 'All') {
        const norm = String(districtNameOrId).toLowerCase().trim();
        list = list.filter(v => 
            (v.districtId && v.districtId.toLowerCase() === norm) || 
            (v.district && v.district.toLowerCase() === norm)
        );
    }
    if (mineId) {
        list = list.filter(v => v.mine === mineId);
    }
    return list;
};

export const getInspectionsByDistrict = (districtNameOrId, mineId) => {
    let list = inspections;
    if (districtNameOrId && districtNameOrId !== 'All') {
        const norm = String(districtNameOrId).toLowerCase().trim();
        list = list.filter(i => 
            (i.districtId && i.districtId.toLowerCase() === norm) || 
            (i.district && i.district.toLowerCase() === norm)
        );
    }
    if (mineId) {
        list = list.filter(i => i.mine === mineId);
    }
    return list;
};

export const chartData = {
    riskTrend: [
        { month: 'May', risk: 62, compliance: 88 },
        { month: 'Jun', risk: 65, compliance: 86 },
        { month: 'Jul', risk: 70, compliance: 84 },
        { month: 'Aug', risk: 74, compliance: 85 },
        { month: 'Sep', risk: 82, compliance: 87 },
        { month: 'Oct', risk: 80, compliance: 89 },
    ],
    violationsByCategory: [
        { name: 'Safety', value: violations.filter(v => v.category === 'Safety').length || 10, color: '#e74c3c' },
        { name: 'Environment', value: violations.filter(v => v.category === 'Environment').length || 8, color: '#f39c12' },
        { name: 'Equipment', value: violations.filter(v => v.category === 'Equipment').length || 5, color: '#d4880f' },
        { name: 'Labour', value: violations.filter(v => v.category === 'Labour').length || 3, color: '#c9a644' }
    ],
    inspectionsOverTime: [
        { month: 'May', count: 28 },
        { month: 'Jun', count: 24 },
        { month: 'Jul', count: 31 },
        { month: 'Aug', count: 27 },
        { month: 'Sep', count: 24 },
        { month: 'Oct', count: inspections.length },
    ],
    contractorPerformance: contractors.slice(0, 8).map(c => ({
        name: c.name,
        safety: c.safetyScore,
        compliance: c.compliance
    }))
};
