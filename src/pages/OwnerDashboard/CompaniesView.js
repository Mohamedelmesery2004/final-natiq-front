import { useState, useEffect, useCallback } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { MagnifyingGlassIcon, BuildingOfficeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import '../NatiqDashboard/NatiqDashboard.css';
import './OwnerDashboard.css';

const SUB_STATUS_COLORS = {
  active: '#22C55E',
  trialing: '#3B82F6',
  past_due: '#F59E0B',
  canceled: '#EF4444',
  expired: '#94A3B8',
};

export default function CompaniesView({ onSelectCompany }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (filter !== 'all') params.isActive = filter;
      const res = await ownerApi.listCompanies(params);
      const items = Array.isArray(res) ? res : res?.companies || res?.items || [];
      setCompanies(items);
      setTotalPages(res?.pagination?.pages || res?.pages || 1);
      setTotal(res?.pagination?.total || res?.total || items.length);
    } catch {
      setCompanies([]);
    }
    setLoading(false);
  }, [page, search, filter]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilter = (e) => {
    setFilter(e.target.value);
    setPage(1);
  };

  return (
    <div className="owner-dashboard-modern">
      <div className="owner-hero" style={{ background: 'linear-gradient(125deg, #042835 0%, #0a4a62 55%, #0d5c7a 100%)' }}>
        <div>
          <h2>All Companies</h2>
          <p>{total} companies across the platform</p>
        </div>
      </div>

      <div className="owner-managers-toolbar">
        <div className="owner-search">
          <MagnifyingGlassIcon width={18} />
          <input value={search} onChange={handleSearch} placeholder="Search by name or slug..." />
        </div>
        <select value={filter} onChange={handleFilter}>
          <option value="all">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="owner-table-card">
        <table className="owner-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Industry</th>
              <th>Plan</th>
              <th>Subscription</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="owner-empty-row">Loading...</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan="6" className="owner-empty-row">No companies found.</td></tr>
            ) : (
              companies.map((c) => {
                const sub = c.subscription || {};
                const planName = sub.planId?.name || c.planName || 'N/A';
                const subStatus = sub.status || 'none';
                const color = SUB_STATUS_COLORS[subStatus] || '#94A3B8';
                return (
                  <tr key={c._id} onClick={() => onSelectCompany?.(c._id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#042835', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CAF301' }}>
                          <BuildingOfficeIcon width={16} />
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, display: 'block' }}>{c.name}</span>
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>@{c.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{c.industry || '-'}</td>
                    <td>{planName}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: '100px', fontSize: 11, fontWeight: 700, background: `${color}15`, color }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
                        {subStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '100px', fontSize: 11, fontWeight: 700, background: c.isActive ? '#DCFCE7' : '#FEE2E2', color: c.isActive ? '#166534' : '#991B1B' }}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
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
