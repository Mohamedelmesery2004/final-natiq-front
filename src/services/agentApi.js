// Agent API Wrapper
// Uses fetch to communicate with the backend

const BASE_URL = process.env.REACT_APP_API_URL || '';
const API_BASE = `${BASE_URL}/api/v1/agent`;

// Get token from local storage
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
    
    // For 204 No Content
    if (response.status === 204) return null;

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || data.error?.message || 'API Error');
    }
    return data.data || data;
};

export const agentApi = {
    // 1. Auth
    login: async (email, password, companySlug) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, companySlug })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error?.message || 'Login failed');
        // Save the token on success internally
        if (data.data?.token) {
            localStorage.setItem('agent_token', data.data.token);
            localStorage.setItem('agent_user', JSON.stringify(data.data.user));
        }
        return data.data;
    },

    // 2. Profile
    getProfile: async () => {
        const res = await fetch(`${API_BASE}/profile`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // 2b. Update profile (name / phone / avatar). Sends multipart so the
    // backend's upload.single('profileImage') middleware can read the file.
    updateProfile: async ({ name, phone, profileImageFile } = {}) => {
        const token = localStorage.getItem('agent_token');
        const form = new FormData();
        if (name !== undefined) form.append('name', name);
        if (phone !== undefined) form.append('phone', phone);
        if (profileImageFile) form.append('profileImage', profileImageFile);
        const res = await fetch(`${API_BASE}/profile`, {
            method: 'PATCH',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: form,
        });
        const updated = await handleResponse(res);
        // keep the cached agent_user in sync
        try {
            const cached = JSON.parse(localStorage.getItem('agent_user') || '{}');
            localStorage.setItem('agent_user', JSON.stringify({ ...cached, ...updated }));
        } catch { /* ignore */ }
        return updated;
    },

    // 2c. Change password (requires current password).
    changePassword: async ({ currentPassword, password } = {}) => {
        const res = await fetch(`${API_BASE}/profile`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ currentPassword, password }),
        });
        return handleResponse(res);
    },

    // 3. Dashboard
    getDashboardOverview: async (queryParams = '') => {
        const res = await fetch(`${API_BASE}/dashboard/overview${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // 4. Tickets
    getTickets: async (queryParams = '') => { // status=open,in_progress,etc or queue=unassigned
        const res = await fetch(`${API_BASE}/tickets${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getTicket: async (ticketId) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getTicketMessages: async (ticketId) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/messages`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    claimTicket: async (ticketId) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/claim`, { 
            method: 'POST', 
            headers: getAuthHeaders() 
        });
        return handleResponse(res);
    },

    replyToTicket: async (ticketId, content) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/reply`, { 
            method: 'POST', 
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        return handleResponse(res);
    },

    resolveTicket: async (ticketId) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/resolve`, { 
            method: 'POST', 
            headers: getAuthHeaders() 
        });
        return handleResponse(res);
    },

    closeTicket: async (ticketId) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/close`, { 
            method: 'POST', 
            headers: getAuthHeaders() 
        });
        return handleResponse(res);
    },

    // 5. Chat History (if session ID known)
    getChatHistory: async (sessionId, queryParams = '') => {
        const res = await fetch(`${API_BASE}/chat-history/${sessionId}${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // 6. QA Analytics
    getQAAutomatedResults: async (queryParams = '') => {
        const res = await fetch(`${BASE_URL}/api/v1/qa/results${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // 6b. Full agent analytics (KPIs, SLA, trends, insights, skills, goals,
    //     recommendations, activity feed, call insights).
    getFullAnalytics: async (queryParams = '') => {
        const res = await fetch(`${API_BASE}/analytics/full${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // 7. Calls
    saveCall: async (callData) => {
        const res = await fetch(`${BASE_URL}/api/v1/calls`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(callData),
        });
        return handleResponse(res);
    },

    getCallHistory: async (queryParams = '') => {
        const res = await fetch(`${BASE_URL}/api/v1/calls/my-history${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    uploadRecording: async (callId, blob) => {
        const formData = new FormData();
        formData.append('audio', blob, `${callId}.webm`);
        const token = localStorage.getItem('agent_token');
        const res = await fetch(`${BASE_URL}/api/v1/calls/upload-recording/${callId}`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });
        return handleResponse(res);
    },

    // 8. Tasks (Calendar)
    getTasks: async (date) => {
        const query = date ? `?date=${date}` : '';
        const res = await fetch(`${API_BASE}/tasks${query}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    createTask: async (taskData) => {
        const res = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(taskData)
        });
        return handleResponse(res);
    },

    updateTask: async (taskId, taskData) => {
        const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(taskData)
        });
        return handleResponse(res);
    },

    deleteTask: async (taskId) => {
        const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    // 9. Notifications
    getNotifications: async (queryParams = '') => {
        const res = await fetch(`${API_BASE}/notifications${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    markNotificationAsRead: async (notificationId) => {
        const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    markAllNotificationsAsRead: async () => {
        const res = await fetch(`${API_BASE}/notifications/read-all`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    // ── Coaching ──
    startCoaching: async (ticketId) => {
        const res = await fetch(`${BASE_URL}/api/v1/coach/${ticketId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    pollCoachingJob: async (jobId) => {
        const res = await fetch(`${BASE_URL}/api/v1/coach/jobs/${jobId}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    // ── Shared Auth GET ──
    getMe: async () => {
        const res = await fetch(`${BASE_URL}/api/v1/auth/me`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getCompanies: async () => {
        const res = await fetch(`${BASE_URL}/api/v1/auth/companies`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
};
