import { useState, useEffect, useCallback } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import '../NatiqDashboard/NatiqDashboard.css';
import './OwnerDashboard.css';

const statCard = (label, value, color) => (
  <div className="cd-stat-card" style={{ padding: '16px', borderRadius: 12, flex: '1 1 180px' }}>
    <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{label}</p>
    <p style={{ fontSize: 24, fontWeight: 700, color }}>{value ?? '-'}</p>
  </div>
);

const sectionTitle = (text) => (
  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0d2137', margin: '20px 0 12px' }}>{text}</h3>
);

export default function CompanyDetail({ companyId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ownerApi.getCompanyDetail(companyId);
      setData(res);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="owner-dashboard-modern" style={{ padding: 24 }}>
        <p>Loading company detail...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="owner-dashboard-modern" style={{ padding: 24 }}>
        <p>Failed to load company detail.</p>
      </div>
    );
  }

  const { company, users, tickets, chatSessions, knowledgeItems, calls, billing, recentEvents } = data;

  return (
    <div className="owner-dashboard-modern">

      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
        cursor: 'pointer', color: '#0d2137', fontSize: 14, fontWeight: 500, marginBottom: 16, padding: 0
      }}>
        <ArrowLeftIcon style={{ width: 16, height: 16 }} /> Back to Dashboard
      </button>

      {/* Company Info */}
      <div className="cd-stat-card" style={{ padding: '20px 24px', borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0d2137', margin: 0 }}>{company.name}</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>@{company.slug} · {company.industry}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: company.isActive ? '#D1FAE5' : '#FEE2E2',
              color: company.isActive ? '#065F46' : '#991B1B',
            }}>
              {company.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        {company.subscription?.planId && (
          <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 13, color: '#374151' }}>
            <span>Plan: <strong>{company.subscription.planId.name || 'N/A'}</strong></span>
            <span>Status: <strong>{company.subscription.status}</strong></span>
            {company.subscription.startDate && <span>Since: <strong>{new Date(company.subscription.startDate).toLocaleDateString()}</strong></span>}
          </div>
        )}
      </div>

      {/* KPI Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {statCard('Total Users', users?.total, '#3B82F6')}
        {statCard('Tickets', tickets?.stats?.total, '#F59E0B')}
        {statCard('Chat Sessions', chatSessions?.stats?.total, '#8B5CF6')}
        {statCard('Knowledge Items', knowledgeItems?.total, '#10B981')}
        {statCard('Calls', calls?.stats?.total, '#EF4444')}
        {statCard('Invoices', billing?.totalInvoices, '#0d2137')}
      </div>

      {/* Billing */}
      {billing && (
        <>
          {sectionTitle('Billing Summary')}
          <div className="cd-stat-card" style={{ padding: 16, borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 32, marginBottom: 12 }}>
              <div><span style={{ fontSize: 13, color: '#6B7280' }}>Total Paid</span><p style={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>${billing.totalPaid?.toLocaleString()}</p></div>
              <div><span style={{ fontSize: 13, color: '#6B7280' }}>Total Pending</span><p style={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}>${billing.totalPending?.toLocaleString()}</p></div>
            </div>
            {billing.invoices?.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>Invoice #</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.invoices.map((inv, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '8px 4px' }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: '8px 4px' }}>${inv.amount}</td>
                      <td style={{ padding: '8px 4px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: inv.status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                          color: inv.status === 'paid' ? '#065F46' : '#92400E',
                        }}>{inv.status}</span>
                      </td>
                      <td style={{ padding: '8px 4px' }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Tickets */}
      {tickets && (
        <>
          {sectionTitle(`Tickets (${tickets.stats?.total || 0})`)}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {statCard('Open', tickets.stats?.opened, '#F59E0B')}
            {statCard('Closed', tickets.stats?.closed, '#10B981')}
            {statCard('Pending', tickets.stats?.pending, '#3B82F6')}
          </div>
          {tickets.list?.length > 0 && (
            <div className="cd-stat-card" style={{ padding: 0, borderRadius: 12, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', background: '#F9FAFB' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Subject</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Priority</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Agent</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.list.map((t) => (
                    <tr key={t._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>#{t.ticketNumber}</td>
                      <td style={{ padding: '10px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.context?.lastUserMessage || t._id}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: t.status === 'closed' || t.status === 'resolved' ? '#D1FAE5' : t.status === 'open' ? '#FEF3C7' : '#DBEAFE',
                          color: t.status === 'closed' || t.status === 'resolved' ? '#065F46' : t.status === 'open' ? '#92400E' : '#1E40AF',
                        }}>{t.status}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{t.priority}</td>
                      <td style={{ padding: '10px 12px' }}>{t.assignedTo?.name || t.assignedTo?.email || '-'}</td>
                      <td style={{ padding: '10px 12px', color: '#6B7280' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Chat Sessions */}
      {chatSessions && (
        <>
          {sectionTitle(`Chat Sessions (${chatSessions.stats?.total || 0})`)}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {statCard('Active', chatSessions.stats?.active, '#8B5CF6')}
            {statCard('Closed', chatSessions.stats?.closed, '#10B981')}
          </div>
          {chatSessions.list?.length > 0 && (
            <div className="cd-stat-card" style={{ padding: 0, borderRadius: 12, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', background: '#F9FAFB' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Session</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Channel</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Agent</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Messages</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {chatSessions.list.map((s) => (
                    <tr key={s._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{s.sessionId?.slice(0, 12)}...</td>
                      <td style={{ padding: '10px 12px' }}>{s.channel}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: s.status === 'active' ? '#D1FAE5' : '#F3F4F6',
                          color: s.status === 'active' ? '#065F46' : '#6B7280',
                        }}>{s.status}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{s.assignedAgent?.name || s.assignedAgent?.email || '-'}</td>
                      <td style={{ padding: '10px 12px' }}>{s.messageCount || s.messages?.length || 0}</td>
                      <td style={{ padding: '10px 12px', color: '#6B7280' }}>{new Date(s.lastActivity).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Calls */}
      {calls && (
        <>
          {sectionTitle(`Calls (${calls.stats?.total || 0})`)}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {statCard('Answered', calls.stats?.answered, '#10B981')}
            {statCard('Missed', calls.stats?.missed, '#EF4444')}
          </div>
          {calls.list?.length > 0 && (
            <div className="cd-stat-card" style={{ padding: 0, borderRadius: 12, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', background: '#F9FAFB' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Call ID</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Agent</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Duration</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.list.map((c) => (
                    <tr key={c._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{c.callId?.slice(0, 12)}...</td>
                      <td style={{ padding: '10px 12px' }}>{c.customerName || c.customerId?.name || c.customerId?.email || '-'}</td>
                      <td style={{ padding: '10px 12px' }}>{c.agentName || c.agentId?.name || c.agentId?.email || '-'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: c.status === 'ended' ? '#D1FAE5' : c.status === 'missed' || c.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                          color: c.status === 'ended' ? '#065F46' : c.status === 'missed' || c.status === 'rejected' ? '#991B1B' : '#92400E',
                        }}>{c.status}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{c.duration ? `${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, '0')}` : '-'}</td>
                      <td style={{ padding: '10px 12px', color: '#6B7280' }}>{new Date(c.startedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Knowledge Items */}
      {knowledgeItems && (
        <>
          {sectionTitle(`Knowledge Items (${knowledgeItems.total || 0})`)}
          {knowledgeItems.list?.length > 0 && (
            <div className="cd-stat-card" style={{ padding: 0, borderRadius: 12, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', background: '#F9FAFB' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Title</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Active</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {knowledgeItems.list.map((k) => (
                    <tr key={k._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{k.title}</td>
                      <td style={{ padding: '10px 12px' }}>{k.type}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: k.isActive ? '#D1FAE5' : '#FEE2E2',
                          color: k.isActive ? '#065F46' : '#991B1B',
                        }}>{k.isActive ? 'Yes' : 'No'}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#6B7280' }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Recent Events */}
      {recentEvents && (
        <>
          {sectionTitle(`Recent Events (${recentEvents.length})`)}
          {recentEvents.length > 0 && (
            <div className="cd-stat-card" style={{ padding: 0, borderRadius: 12, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', background: '#F9FAFB' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Event</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Entity</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Message</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((e, i) => (
                    <tr key={e._id || i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#F3F4F6', color: '#374151' }}>{e.eventType}</span></td>
                      <td style={{ padding: '10px 12px' }}>{e.entityType}</td>
                      <td style={{ padding: '10px 12px', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.metadata?.message || '-'}</td>
                      <td style={{ padding: '10px 12px', color: '#6B7280' }}>{new Date(e.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

    </div>
  );
}
