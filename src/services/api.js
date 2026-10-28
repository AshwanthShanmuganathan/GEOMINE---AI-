// Centralized GeoMine AI API Client
// Direct integration with FastAPI & PostgreSQL backend.
// Replaces silent mock fallbacks with explicit live vs offline indicators.
import { 
    allDistricts as mockDistricts, 
    mines as mockMines, 
    violations as mockViolations,
    inspections as mockInspections,
    correctiveActions as mockActions,
    complianceItems as mockCompliance,
    documents as mockDocuments,
    contractors as mockContractors,
    auditLogs as mockAuditLogs,
    getMinesByDistrict as mockGetMinesByDistrict,
    getViolationsByDistrict as mockGetViolationsByDistrict,
    getInspectionsByDistrict as mockGetInspectionsByDistrict
} from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Connection status: 'LIVE' | 'OFFLINE' | 'DEMO'
let currentConnectionStatus = 'LIVE';

export const isDemoMode = () => {
    return localStorage.getItem('geomine_demo_mode') === 'true';
};

export const setDemoMode = (enabled) => {
    localStorage.setItem('geomine_demo_mode', enabled ? 'true' : 'false');
    currentConnectionStatus = enabled ? 'DEMO' : 'LIVE';
    broadcastStatus(currentConnectionStatus);
};

export const getConnectionStatus = () => {
    if (isDemoMode()) return 'DEMO';
    return currentConnectionStatus;
};

const broadcastStatus = (status) => {
    currentConnectionStatus = status;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('evs-connection-status', { detail: status }));
    }
};

const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Safe request wrapper with strict non-silent error propagation
async function request(endpoint, options = {}, mockFallbackFn = null) {
    // If explicitly in Demo Mode, return mock data
    if (isDemoMode()) {
        broadcastStatus('DEMO');
        if (mockFallbackFn) return mockFallbackFn();
        return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                ...getHeaders(),
                ...(options.headers || {})
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            const errText = await res.text().catch(() => res.statusText);
            throw new Error(`API error ${res.status}: ${errText}`);
        }

        const data = await res.json();
        broadcastStatus('LIVE');
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        broadcastStatus('OFFLINE');
        console.warn(`[GeoMine API Offline] Request to ${endpoint} failed:`, err.message);
        throw err;
    }
}

export const api = {
    // Health & Connection
    async checkHealth() {
        if (isDemoMode()) {
            broadcastStatus('DEMO');
            return { status: 'demo', database: 'mock' };
        }
        try {
            const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
                const data = await res.json();
                broadcastStatus('LIVE');
                return data;
            }
            throw new Error(`Health status ${res.status}`);
        } catch (e) {
            broadcastStatus('OFFLINE');
            throw e;
        }
    },

    getConnectionStatus,
    setDemoMode,
    isDemoMode,

    // File Upload (Storage Provider)
    async uploadFile(file) {
        if (isDemoMode()) {
            return {
                file_url: URL.createObjectURL(file),
                filename: file.name,
                original_name: file.name,
                size: file.size,
                content_type: file.type,
                storage: 'demo'
            };
        }

        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('authToken');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const res = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => res.statusText);
                throw new Error(`Upload failed ${res.status}: ${errText}`);
            }

            const data = await res.json();
            broadcastStatus('LIVE');
            return data;
        } catch (err) {
            broadcastStatus('OFFLINE');
            throw err;
        }
    },

    // Auth
    async login(email, password, districtId = null, mineId = null) {
        if (isDemoMode()) {
            return {
                access_token: 'demo-local-jwt-token',
                user: {
                    email,
                    role: email.includes('admin') ? 'admin' : (email.includes('manager') ? 'manager' : (email.includes('officer') ? 'officer' : 'inspector')),
                    full_name: 'Demo Mode Operator'
                }
            };
        }
        const data = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, district_id: districtId, mine_id: mineId })
        });
        if (data?.access_token) {
            localStorage.setItem('authToken', data.access_token);
        }
        return data;
    },

    // Districts
    async getDistricts() {
        return request('/districts', {}, () => mockDistricts);
    },

    // Mines
    async getMines(district = null) {
        const query = district && district !== 'All' ? `?district=${encodeURIComponent(district)}` : '';
        return request(`/mines${query}`, {}, () => mockGetMinesByDistrict(district));
    },

    async getMine(id) {
        return request(`/mines/${id}`, {}, () => mockMines.find(m => m.id === id) || null);
    },

    async createMine(mineData) {
        return request('/mines', {
            method: 'POST',
            body: JSON.stringify(mineData)
        });
    },

    // Violations
    async getViolations(params = {}) {
        const q = new URLSearchParams();
        if (params.district && params.district !== 'All') q.set('district', params.district);
        if (params.mineId && params.mineId !== 'All') q.set('mine_id', params.mineId);
        if (params.severity && params.severity !== 'All') q.set('severity', params.severity);
        if (params.status && params.status !== 'All') q.set('status', params.status);
        if (params.search) q.set('search', params.search);

        const qs = q.toString() ? `?${q.toString()}` : '';
        return request(`/violations${qs}`, {}, () => {
            let list = mockViolations;
            if (params.district && params.district !== 'All') {
                list = mockGetViolationsByDistrict(params.district, params.mineId);
            }
            if (params.severity && params.severity !== 'All') {
                list = list.filter(v => v.severity === params.severity.toUpperCase());
            }
            if (params.status && params.status !== 'All') {
                list = list.filter(v => v.status === params.status.toUpperCase());
            }
            if (params.search) {
                const s = params.search.toLowerCase();
                list = list.filter(v => (v.description || '').toLowerCase().includes(s) || (v.id || '').toLowerCase().includes(s));
            }
            return list;
        });
    },

    async getViolation(id) {
        return request(`/violations/${id}`, {}, () => mockViolations.find(v => v.id === id) || null);
    },

    async updateViolationStatus(id, newStatus) {
        return request(`/violations/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        }, () => {
            const found = mockViolations.find(v => v.id === id);
            if (found) found.status = newStatus;
            return found || { id, status: newStatus };
        });
    },

    async createViolation(payload) {
        return request('/violations', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    // Inspections
    async getInspections(params = {}) {
        const q = new URLSearchParams();
        if (params.district && params.district !== 'All') q.set('district', params.district);
        if (params.mineId && params.mineId !== 'All') q.set('mine_id', params.mineId);
        const qs = q.toString() ? `?${q.toString()}` : '';

        return request(`/inspections${qs}`, {}, () => mockGetInspectionsByDistrict(params.district, params.mineId));
    },

    async submitInspection(payload) {
        return request('/inspections', {
            method: 'POST',
            body: JSON.stringify(payload)
        }, () => {
            const newIns = {
                id: `INS-${100 + mockInspections.length + 1}`,
                mine: payload.mine_id,
                mineN: payload.mine_name || 'Active Quarry',
                inspector: 'Senior Safety Inspector',
                date: new Date().toISOString().split('T')[0],
                type: payload.inspection_type,
                status: 'COMPLETED',
                score: payload.score || 85,
                findings: payload.findings || 0,
                critical: payload.critical || 0
            };
            mockInspections.unshift(newIns);
            return newIns;
        });
    },

    // Corrective Actions
    async getCorrectiveActions(params = {}) {
        const q = new URLSearchParams();
        if (params.district && params.district !== 'All') q.set('district', params.district);
        if (params.mineId && params.mineId !== 'All') q.set('mine_id', params.mineId);
        if (params.status && params.status !== 'All') q.set('status', params.status);
        const qs = q.toString() ? `?${q.toString()}` : '';

        return request(`/actions${qs}`, {}, () => mockActions);
    },

    async updateActionStatus(id, newStatus) {
        return request(`/actions/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        }, () => {
            const found = mockActions.find(a => a.id === id);
            if (found) found.status = newStatus;
            return found || { id, status: newStatus };
        });
    },

    async createCorrectiveAction(payload) {
        return request('/actions', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    // Compliance
    async getComplianceItems(params = {}) {
        const q = new URLSearchParams();
        if (params.district && params.district !== 'All') q.set('district', params.district);
        if (params.mineId && params.mineId !== 'All') q.set('mine_id', params.mineId);
        if (params.status && params.status !== 'All') q.set('status', params.status);
        const qs = q.toString() ? `?${q.toString()}` : '';

        return request(`/compliance${qs}`, {}, () => mockCompliance);
    },

    async updateComplianceStatus(id, newStatus) {
        return request(`/compliance/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        }, () => {
            const found = mockCompliance.find(c => c.id === id);
            if (found) found.status = newStatus;
            return found || { id, status: newStatus };
        });
    },

    async createComplianceItem(payload) {
        return request('/compliance', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    // Documents
    async getDocuments(district = null, mineId = null) {
        const q = new URLSearchParams();
        if (district && district !== 'All') q.set('district', district);
        if (mineId && mineId !== 'All') q.set('mine_id', mineId);
        const qs = q.toString() ? `?${q.toString()}` : '';
        return request(`/documents${qs}`, {}, () => mockDocuments);
    },

    async createDocument(docData) {
        return request('/documents', {
            method: 'POST',
            body: JSON.stringify(docData)
        }, () => {
            const newDoc = { id: `DOC-${100 + mockDocuments.length + 1}`, ...docData };
            mockDocuments.unshift(newDoc);
            return newDoc;
        });
    },

    // Contractors
    async getContractors(district = null, mineId = null) {
        const q = new URLSearchParams();
        if (district && district !== 'All') q.set('district', district);
        if (mineId && mineId !== 'All') q.set('mine_id', mineId);
        const qs = q.toString() ? `?${q.toString()}` : '';
        return request(`/contractors${qs}`, {}, () => mockContractors);
    },

    async createContractor(payload) {
        return request('/contractors', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    // Audit Logs
    async getAuditLogs() {
        return request('/audit-logs', {}, () => mockAuditLogs);
    }
};

export default api;
