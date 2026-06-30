const BASE_URL = process.env.REACT_APP_API_URL || '';
const API_BASE = `${BASE_URL}/api/v1/team-leader`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('agent_token'); // Agent and TL share same token storage
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

export const teamLeaderApi = {
    getDashboard: async () => {
        const res = await fetch(`${API_BASE}/dashboard`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getAgents: async () => {
        const res = await fetch(`${API_BASE}/agents`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getAgentPerformance: async (agentId, period = 'week') => {
        const res = await fetch(`${API_BASE}/agents/${agentId}/performance?period=${encodeURIComponent(period)}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getAgentProfile: async (agentId) => {
        const res = await fetch(`${API_BASE}/agents/${agentId}/profile`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    bulkAssignTickets: async (ticketIds, agentId) => {
        const res = await fetch(`${API_BASE}/tickets/assign`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ticketIds, agentId })
        });
        return handleResponse(res);
    },

    getCompanyTickets: async (params = '') => {
        const res = await fetch(`${API_BASE}/tickets${params}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getUnassignedQueue: async (params = '') => {
        const res = await fetch(`${API_BASE}/tickets/queue/unassigned${params}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getTicketMessages: async (ticketId) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/messages`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getCompanyCalls: async (params = '') => {
        const res = await fetch(`${API_BASE}/calls${params}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getQAResults: async (params = '') => {
        const res = await fetch(`${BASE_URL}/api/v1/qa/results${params}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getQADetail: async (id) => {
        const res = await fetch(`${BASE_URL}/api/v1/qa/results/${id}`, { headers: getAuthHeaders() });
        const raw = await handleResponse(res);
        const a = raw?.analysis || {};
        return {
            ...raw,
            scores: {
                professionalism: a.communication_clarity_score ?? null,
                empathy: a.customer_satisfaction === 'high' ? 5 : a.customer_satisfaction === 'medium' ? 3 : 1,
                quality: a.communication_clarity_score ?? null,
            },
            fullAnalysis: {
                quality_assessment: {
                    conversation_quality_score: a.communication_clarity_score ?? null,
                    qa_verdict: a.customer_satisfaction || '—',
                    main_failures: [],
                },
                ticket_summary: {
                    short_summary: a.conversation_summary || a.summary_for_dashboard || '',
                },
                agent_analysis: {
                    agent_professionalism_score: a.communication_clarity_score ?? null,
                    agent_empathy_score: a.customer_satisfaction === 'high' ? 5 : a.customer_satisfaction === 'medium' ? 3 : 1,
                    tone_reasoning: a.agent_behavior || '',
                    overall_tone: a.agent_behavior || '',
                    issues: [],
                },
                resolution_analysis: {
                    resolution_status: a.resolution_status || '—',
                    resolution_reasoning: a.conversation_summary || '',
                    ticket_closed_correctly: a.resolution_status === 'resolved',
                },
            },
            teamLeaderNotes: raw?.teamLeaderNotes || [],
        };
    },

    analyzeTicket: async (ticketId) => {
        const res = await fetch(`${BASE_URL}/api/v1/qa/analyze/${ticketId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },

    patchTicketQANotes: async (ticketId, content) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/qa-notes`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        return handleResponse(res);
    },

    patchAgentSupervisorNotes: async (agentId, content) => {
        const res = await fetch(`${API_BASE}/agents/${agentId}/supervisor-notes`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        return handleResponse(res);
    },

    notifyAgent: async (agentId, notifData) => {
        const res = await fetch(`${API_BASE}/agents/${agentId}/notify`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(notifData)
        });
        return handleResponse(res);
    }
};
