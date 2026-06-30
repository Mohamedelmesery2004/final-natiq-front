const BASE_URL = process.env.REACT_APP_API_URL || '';
const API_BASE = `${BASE_URL}/api/v1/owner`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('agent_token'); 
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const handleResponse = async (response) => {
    if (response.status === 401) {
        localStorage.removeItem('agent_token');
        window.location.href = '/'; 
        throw new Error('Unauthorized');
    }
    
    if (response.status === 204) return null;

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || data.error?.message || 'API Error');
    }
    return data.data || data;
};

export const ownerApi = {
    getDashboardSummary: async () => {
        const res = await fetch(`${API_BASE}/dashboard`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getCompanySettings: async () => {
        const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    updateCompanySettings: async (settingsData) => {
        const res = await fetch(`${API_BASE}/settings`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(settingsData)
        });
        return handleResponse(res);
    },

    updateTelegramWebhook: async (webhookUrl) => {
        const res = await fetch(`${API_BASE}/telegram/webhook`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ webhookUrl })
        });
        return handleResponse(res);
    },

    listManagers: async (params = {}) => {
        const q = new URLSearchParams();
        if (params.companyId) q.set('companyId', params.companyId);
        const res = await fetch(`${API_BASE}/managers?${q.toString()}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // ── Companies ──
    listCompanies: async (params = {}) => {
        const q = new URLSearchParams();
        if (params.page) q.set('page', params.page);
        if (params.limit) q.set('limit', params.limit);
        if (params.isActive) q.set('isActive', params.isActive);
        if (params.search) q.set('search', params.search);
        const res = await fetch(`${API_BASE}/companies?${q.toString()}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // ── Owner Platform Dashboard ──
    getOwnerDashboard: async () => {
        const res = await fetch(`${API_BASE}/dashboard/overview`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // ── Subscription Plans ──
    listPlans: async (params = {}) => {
        const q = new URLSearchParams();
        if (params.isActive) q.set('isActive', params.isActive);
        const res = await fetch(`${API_BASE}/plans?${q.toString()}`, { headers: getAuthHeaders() });
        const data = await handleResponse(res);
        return Array.isArray(data) ? data : (data.plans || []);
    },

    getPlan: async (planId) => {
        const res = await fetch(`${API_BASE}/plans/${planId}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    createPlan: async (planData) => {
        const res = await fetch(`${API_BASE}/plans`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(planData)
        });
        return handleResponse(res);
    },

    updatePlan: async (planId, planData) => {
        const res = await fetch(`${API_BASE}/plans/${planId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(planData)
        });
        return handleResponse(res);
    },

    deletePlan: async (planId) => {
        const res = await fetch(`${API_BASE}/plans/${planId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    togglePlanActive: async (planId) => {
        const res = await fetch(`${API_BASE}/plans/${planId}/toggle`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    // ── Company Subscriptions ──
    listSubscriptions: async (params = {}) => {
        const q = new URLSearchParams();
        if (params.status) q.set('status', params.status);
        if (params.planId) q.set('planId', params.planId);
        if (params.search) q.set('search', params.search);
        if (params.page) q.set('page', params.page);
        if (params.limit) q.set('limit', params.limit);
        const res = await fetch(`${API_BASE}/subscriptions?${q.toString()}`, { headers: getAuthHeaders() });
        if (res.status === 401) {
            localStorage.removeItem('agent_token');
            window.location.href = '/';
            throw new Error('Unauthorized');
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || json.error?.message || 'API Error');
        return {
            subscriptions: Array.isArray(json.data) ? json.data : json.subscriptions || [],
            pagination: json.pagination || { total: 0, page: 1, pages: 1 },
        };
    },

    getCompanySubscription: async (companyId) => {
        const res = await fetch(`${API_BASE}/subscriptions/${companyId}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    assignPlanToCompany: async (companyId, data) => {
        const res = await fetch(`${API_BASE}/subscriptions/${companyId}/assign`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    updateCompanySubscription: async (companyId, data) => {
        const res = await fetch(`${API_BASE}/subscriptions/${companyId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    cancelCompanySubscription: async (companyId) => {
        const res = await fetch(`${API_BASE}/subscriptions/${companyId}/cancel`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    // ── Billing & Invoices ──
    updateBillingInfo: async (companyId, billingData) => {
        const res = await fetch(`${API_BASE}/billing/${companyId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(billingData)
        });
        return handleResponse(res);
    },

    listInvoices: async (companyId, params = {}) => {
        const q = new URLSearchParams();
        if (params.page) q.set('page', params.page);
        if (params.limit) q.set('limit', params.limit);
        const res = await fetch(`${API_BASE}/invoices/${companyId}?${q.toString()}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    addInvoice: async (companyId, invoiceData) => {
        const res = await fetch(`${API_BASE}/invoices/${companyId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(invoiceData)
        });
        return handleResponse(res);
    },

    updateInvoice: async (companyId, invoiceId, invoiceData) => {
        const res = await fetch(`${API_BASE}/invoices/${companyId}/${invoiceId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(invoiceData)
        });
        return handleResponse(res);
    },

    // ── Company Detail (full page) ──
    getCompanyDetail: async (companyId) => {
        const res = await fetch(`${API_BASE}/companies/${companyId}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
};
