import { useState, useEffect, useCallback } from 'react';
import { ownerApi } from '../../services/ownerApi';
import {
  CheckCircleIcon, XCircleIcon, UsersIcon, ChatBubbleLeftRightIcon,
  PlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import '../NatiqDashboard/NatiqDashboard.css';
import './OwnerDashboard.css';

const intervalLabels = { monthly: 'Monthly', yearly: 'Yearly' };
const EMPTY_PLAN = { name: '', code: '', description: '', price: '', currency: 'USD', interval: 'monthly', isActive: true, sortOrder: 1, features: [], limits: { maxAgents: 1, maxChatsPerDay: 100, maxTicketsPerDay: 50, maxKnowledgeItems: 50, aiEnabled: true, channels: ['web'], storageGb: 2 } };

const CHANNEL_OPTIONS = ['web', 'telegram', 'whatsapp', 'voice'];
const FEATURE_PRESETS = [
  'Up to {{agents}} agents', 'Unlimited agents',
  'Web chat channel', 'Web chat + Telegram + WhatsApp', 'All channels (web, Telegram, WhatsApp, Voice)',
  '{{chats}} chats/day', 'Unlimited chats',
  '{{tickets}} tickets/day', 'Unlimited tickets',
  '{{knowledge}} knowledge items', 'Unlimited knowledge items',
  'AI-powered responses', 'Telegram integration', 'WhatsApp integration', 'Voice calls',
  'CSV exports', 'CSV exports + advanced analytics', 'Priority support', 'Custom branding',
  'Custom AI model tuning', 'Dedicated account manager', '99.9% uptime SLA',
];

function PlanCard({ plan, onSelect, onEdit, onDelete, onToggle }) {
  const limits = plan.limits || {};
  const features = plan.features || [];
  const includedFeatures = features.filter(f => f.included !== false);
  const excludedFeatures = features.filter(f => f.included === false);

  return (
    <div style={{
      background: '#fff', border: `1px solid ${plan.isActive ? '#D0D9E4' : '#FECACA'}`,
      borderRadius: 16, padding: 24, position: 'relative',
      transition: 'transform 0.2s, box-shadow 0.2s',
      opacity: plan.isActive ? 1 : 0.7, display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 34px rgba(4,40,53,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
        {!plan.isActive && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#FEE2E2', color: '#991B1B' }}>Inactive</span>}
        <button onClick={(e) => { e.stopPropagation(); onEdit(plan); }} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: '#475569' }} title="Edit"><PencilSquareIcon width={15} /></button>
        <button onClick={(e) => { e.stopPropagation(); onToggle(plan); }} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: plan.isActive ? '#F59E0B' : '#22C55E' }} title={plan.isActive ? 'Deactivate' : 'Activate'}><XMarkIcon width={15} style={{ transform: plan.isActive ? 'none' : 'rotate(45deg)' }} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(plan); }} style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: '#EF4444' }} title="Delete"><TrashIcon width={15} /></button>
      </div>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#0A1F2B' }}>{plan.name}</h3>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B7280', minHeight: 32 }}>{plan.description || ''}</p>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#0A1F2B' }}>${plan.price}</span>
        <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 4 }}>/ {intervalLabels[plan.interval] || plan.interval}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {limits.maxAgents !== undefined && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: '#EFF6FF', color: '#2563EB' }}>
            <UsersIcon width={14} /> {limits.maxAgents === -1 ? '∞' : limits.maxAgents} agents
          </span>
        )}
        {limits.channels?.length > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: '#F0FDF4', color: '#166534' }}>
            <ChatBubbleLeftRightIcon width={14} /> {limits.channels.join(', ')}
          </span>
        )}
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
        {includedFeatures.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}>
            <CheckCircleIcon width={16} style={{ color: '#22C55E', flexShrink: 0 }} />
            <span>{f.text}</span>
          </div>
        ))}
        {excludedFeatures.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13, color: '#94A3B8' }}>
            <XCircleIcon width={16} style={{ color: '#CBD5E1', flexShrink: 0 }} />
            <span>{f.text}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
        <span>Sort order: {plan.sortOrder ?? '-'}</span>
        <span style={{ textTransform: 'capitalize' }}>{plan.code}</span>
      </div>
    </div>
  );
}

function PlanFormModal({ plan, onClose, onSave }) {
  const isEdit = !!plan?._id;
  const [form, setForm] = useState({ ...EMPTY_PLAN, ...plan, price: plan?.price ?? '' });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const handleLimitChange = (field, value) => setForm(prev => ({ ...prev, limits: { ...prev.limits, [field]: value } }));
  const toggleChannel = (ch) => {
    const chs = form.limits.channels || [];
    handleLimitChange('channels', chs.includes(ch) ? chs.filter(c => c !== ch) : [...chs, ch]);
  };
  const addFeature = (text) => {
    setForm(prev => ({ ...prev, features: [...(prev.features || []), { text, included: true }] }));
  };
  const removeFeature = (idx) => {
    setForm(prev => ({ ...prev, features: (prev.features || []).filter((_, i) => i !== idx) }));
  };
  const toggleFeatureIncluded = (idx) => {
    setForm(prev => ({
      ...prev,
      features: (prev.features || []).map((f, i) => i === idx ? { ...f, included: !f.included } : f),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      sortOrder: Number(form.sortOrder),
    };
    await onSave(payload);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto', padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0A1F2B' }}>{isEdit ? 'Edit Plan' : 'Create Plan'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><XMarkIcon width={24} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Plan Name *</label>
              <input required value={form.name} onChange={e => handleChange('name', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Code (slug) *</label>
              <input required value={form.code} onChange={e => handleChange('code', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14 }} placeholder="starter" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Description</label>
              <input value={form.description} onChange={e => handleChange('description', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Price *</label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={e => handleChange('price', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Interval</label>
              <select value={form.interval} onChange={e => handleChange('interval', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14 }}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Currency</label>
              <select value={form.currency} onChange={e => handleChange('currency', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14 }}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Sort Order</label>
              <input type="number" min="0" value={form.sortOrder} onChange={e => handleChange('sortOrder', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 28 }}>
                <input type="checkbox" id="planActive" checked={form.isActive} onChange={e => handleChange('isActive', e.target.checked)} />
                <label htmlFor="planActive" style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Active</label>
              </div>
            </div>
          </div>

          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#0A1F2B' }}>Limits</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { key: 'maxAgents', label: 'Max Agents' },
              { key: 'maxChatsPerDay', label: 'Chats / Day' },
              { key: 'maxTicketsPerDay', label: 'Tickets / Day' },
              { key: 'maxKnowledgeItems', label: 'Knowledge Items' },
              { key: 'storageGb', label: 'Storage (GB)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 2 }}>{label}</label>
                <input type="number" min="-1" value={form.limits[key] ?? ''} onChange={e => handleLimitChange(key, Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 2 }}>AI Enabled</label>
              <input type="checkbox" checked={form.limits.aiEnabled} onChange={e => handleLimitChange('aiEnabled', e.target.checked)} style={{ marginTop: 8 }} />
            </div>
          </div>

          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#0A1F2B' }}>Channels</h4>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {CHANNEL_OPTIONS.map(ch => (
              <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={(form.limits.channels || []).includes(ch)} onChange={() => toggleChannel(ch)} />
                {ch.charAt(0).toUpperCase() + ch.slice(1)}
              </label>
            ))}
          </div>

          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#0A1F2B' }}>Features</h4>
          <div style={{ marginBottom: 16 }}>
            <select style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, width: '100%', marginBottom: 8 }} onChange={e => { if (e.target.value) { addFeature(e.target.value); e.target.value = ''; } }} value="">
              <option value="">+ Add from preset...</option>
              {FEATURE_PRESETS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 24 }}>
            {(form.features || []).map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '6px 10px', background: '#F8FAFC', borderRadius: 8 }}>
                <input type="checkbox" checked={f.included} onChange={() => toggleFeatureIncluded(i)} title={f.included ? 'Exclude' : 'Include'} />
                <span style={{ flex: 1, fontSize: 13, color: f.included ? '#374151' : '#94A3B8', textDecoration: f.included ? 'none' : 'line-through' }}>{f.text}</span>
                <button type="button" onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13 }}>Remove</button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: 20 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #D1D5DB', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
            <button type="submit" style={{ padding: '10px 24px', border: 'none', borderRadius: 10, background: '#0A1F2B', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              {isEdit ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlansView({ onViewCompany, onNavigate }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (!showInactive) params.isActive = 'true';
      const data = await ownerApi.listPlans(params);
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      setPlans([]);
    }
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await ownerApi.createPlan(payload);
      await load();
    } catch (err) {
      alert(err.message || 'Failed to create plan');
    }
    setSaving(false);
  };

  const handleEdit = async (payload) => {
    setSaving(true);
    try {
      await ownerApi.updatePlan(payload._id, payload);
      await load();
    } catch (err) {
      alert(err.message || 'Failed to update plan');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await ownerApi.deletePlan(deleteTarget._id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      alert(err.message || 'Failed to delete plan');
    }
    setSaving(false);
  };

  const handleToggle = async (plan) => {
    try {
      await ownerApi.togglePlanActive(plan._id);
      await load();
    } catch (err) {
      alert(err.message || 'Failed to toggle plan');
    }
  };

  if (loading) return <div className="owner-loader">Loading plans...</div>;

  return (
    <div className="owner-dashboard-modern">
      <div className="owner-hero" style={{ background: 'linear-gradient(125deg, #042835 0%, #0a4a62 55%, #0d5c7a 100%)' }}>
        <div>
          <h2>Subscription Plans</h2>
          <p>{plans.length} plans configured</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 13, zIndex: 1 }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
            Show inactive
          </label>
          <button className="owner-ghost-btn" onClick={load}><ArrowPathIcon width={18} /> Refresh</button>
          <button className="owner-ghost-btn" onClick={() => setModal({})} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            <PlusIcon width={18} /> New Plan
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {plans.length === 0 ? (
          <p style={{ color: '#64748B', gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>No plans found. Create your first plan.</p>
        ) : (
          plans.map((plan) => (
            <PlanCard key={plan._id} plan={plan} onSelect={() => {}}
              onEdit={() => setModal(plan)}
              onDelete={() => setDeleteTarget(plan)}
              onToggle={handleToggle} />
          ))
        )}
      </div>

      {modal && (
        <PlanFormModal
          plan={modal._id ? modal : null}
          onClose={() => setModal(null)}
          onSave={modal._id ? handleEdit : handleCreate}
        />
      )}

      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDeleteTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#0A1F2B' }}>Delete Plan</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748B' }}>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '10px 20px', border: '1px solid #D1D5DB', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={handleDelete} disabled={saving} style={{ padding: '10px 24px', border: 'none', borderRadius: 10, background: '#EF4444', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
