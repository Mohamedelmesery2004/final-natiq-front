import { useState, useEffect, useCallback } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import '../NatiqDashboard/NatiqDashboard.css';
import './OwnerDashboard.css';

const SUB_STATUS_COLORS = {
  active: '#22C55E',
  trialing: '#3B82F6',
  past_due: '#F59E0B',
  canceled: '#EF4444',
  expired: '#94A3B8',
};

const STATUS_OPTIONS = ['all', 'active', 'trialing', 'past_due', 'canceled', 'expired'];

export default function SubscriptionsView({ onSelectCompany }) {
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (planFilter) params.planId = planFilter;
      const res = await ownerApi.listSubscriptions(params);
      const items = Array.isArray(res) ? res : (res.subscriptions || []);
      setSubs(items);
      setTotalPages(res?.pagination?.pages || 1);
      setTotal(res?.pagination?.total || items.length);
    } catch {
      setSubs([]);
    }
    setLoading(false);
  }, [page, search, statusFilter, planFilter]);

  const loadPlans = useCallback(async () => {
    try {
      const data = await ownerApi.listPlans({ isActive: 'true' });
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      setPlans([]);
    }
  }, []);

  useEffect(() => { load(); loadPlans(); }, [load, loadPlans]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleStatus = (e) => { setStatusFilter(e.target.value); setPage(1); };
  const handlePlan = (e) => { setPlanFilter(e.target.value); setPage(1); };

  const getPlanName = (sub) => {
    if (sub.planName) return sub.planName;
    if (sub.subscription?.planId?.name) return sub.subscription.planId.name;
    if (sub.planId?.name) return sub.planId.name;
    return 'N/A';
  };

  const getStatus = (sub) => {
    return sub.status || sub.subscription?.status || 'none';
  };

  return (
    <div className="owner-dashboard-modern">
      <div className="owner-hero" style={{ background: 'linear-gradient(125deg, #042835 0%, #0a4a62 55%, #0d5c7a 100%)' }}>
        <div>
          <h2>Subscriptions</h2>
          <p>{total} total subscriptions</p>
        </div>
      </div>

      <div className="owner-managers-toolbar">
        <div className="owner-search">
          <MagnifyingGlassIcon width={18} />
          <input value={search} onChange={handleSearch} placeholder="Search by company name..." />
        </div>
        <select value={statusFilter} onChange={handleStatus}>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={planFilter} onChange={handlePlan}>
          <option value="">All Plans</option>
          {plans.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="owner-table-card">
        <table className="owner-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Auto Renew</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="owner-empty-row">Loading...</td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan="6" className="owner-empty-row">No subscriptions found.</td></tr>
            ) : (
              subs.map((sub) => {
                const status = getStatus(sub);
                const color = SUB_STATUS_COLORS[status] || '#94A3B8';
                const s = sub.subscription || sub;
                return (
                  <tr key={sub._id || sub.companyId?._id} onClick={() => onSelectCompany?.(sub.companyId?._id || sub._id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#042835', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CAF301' }}>
                          <BuildingOfficeIcon width={16} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{sub.companyId?.name || sub.companyName || sub.name || '-'}</span>
                      </div>
                    </td>
                    <td>{getPlanName(sub)}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: '100px', fontSize: 11, fontWeight: 700, background: `${color}15`, color }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
                        {status}
                      </span>
                    </td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{s.startDate ? new Date(s.startDate).toLocaleDateString() : '-'}</td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{s.endDate ? new Date(s.endDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: '100px', fontSize: 11, fontWeight: 700, background: s.autoRenew ? '#DCFCE7' : '#F1F5F9', color: s.autoRenew ? '#166534' : '#6B7280' }}>
                        {s.autoRenew ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '12px 0' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', border: '1px solid #D0D9E4', borderRadius: 8, background: '#fff', cursor: 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>
            <ChevronLeftIcon width={14} /> Prev
          </button>
          <span style={{ fontSize: 13, color: '#64748B' }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', border: '1px solid #D0D9E4', borderRadius: 8, background: '#fff', cursor: 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>
            Next <ChevronRightIcon width={14} />
          </button>
        </div>
      )}
    </div>
  );
}
