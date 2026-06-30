import { useState, useEffect, useCallback } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import '../NatiqDashboard/NatiqDashboard.css';
import './OwnerDashboard.css';

const INVOICE_STATUS_COLORS = {
  paid: '#22C55E',
  pending: '#F59E0B',
  overdue: '#EF4444',
  refunded: '#8B5CF6',
  canceled: '#94A3B8',
};

export default function InvoicesView({ companyId, companyName, onBack }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await ownerApi.listInvoices(companyId, { page, limit });
      const items = Array.isArray(data) ? data : data?.invoices || data?.items || [];
      setInvoices(items);
      setTotalPages(data?.pagination?.pages || data?.pages || 1);
      setTotal(data?.pagination?.total || data?.total || items.length);
    } catch {
      setInvoices([]);
    }
    setLoading(false);
  }, [companyId, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="owner-dashboard-modern">
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
        cursor: 'pointer', color: '#0d2137', fontSize: 14, fontWeight: 500, marginBottom: 12, padding: 0
      }}>
        <ArrowLeftIcon style={{ width: 16, height: 16 }} /> Back
      </button>

      <div className="owner-hero" style={{ background: 'linear-gradient(125deg, #042835 0%, #0a4a62 55%, #0d5c7a 100%)' }}>
        <div>
          <h2>Invoices</h2>
          <p>{companyName ? `${companyName} — ` : ''}{total} invoice{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="owner-table-card">
        <table className="owner-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Amount</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Period</th>
              <th>Paid At</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="owner-empty-row">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan="7" className="owner-empty-row">No invoices found.</td></tr>
            ) : (
              invoices.map((inv, i) => {
                const color = INVOICE_STATUS_COLORS[inv.status] || '#94A3B8';
                return (
                  <tr key={inv._id || i}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNumber || `#${i + 1}`}</td>
                    <td style={{ fontWeight: 700, color: '#0A1F2B' }}>${(inv.amount || 0).toLocaleString()}</td>
                    <td>{inv.planName || '-'}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: '100px', fontSize: 11, fontWeight: 700, background: `${color}15`, color }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#6B7280' }}>
                      {inv.periodStart ? new Date(inv.periodStart).toLocaleDateString() : '-'} – {inv.periodEnd ? new Date(inv.periodEnd).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ fontSize: 13, color: '#6B7280' }}>{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : '-'}</td>
                    <td style={{ fontSize: 13, color: '#6B7280' }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
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
