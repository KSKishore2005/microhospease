import { useState, useEffect, useRef } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { TrendingUp, Hotel, Star, DollarSign, Plus, Pencil, Trash2, Calculator, AlertCircle } from 'lucide-react';
import { kpisApi } from '../../api/reporting';
import type { KPIResponseDto, KPIRequestDto } from '../../api/reporting';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { useToastStore } from '../../store/toastStore';

const CALCULATION_TYPES = [
  { key: 'occupancy',        label: 'Occupancy Rate',       fn: (id: string) => kpisApi.calculateOccupancy(id) },
  { key: 'revenue',          label: 'Revenue',              fn: (id: string) => kpisApi.calculateRevenue(id) },
  { key: 'collection-rate',  label: 'Payment Collection %', fn: (id: string) => kpisApi.calculateCollectionRate(id) },
] as const;

const EMPTY_FORM: KPIRequestDto = { name: '', definition: '', target: 0, currentValue: 0, reportingPeriod: '' };

export default function KPIs() {
  const addToast = useToastStore((s) => s.addToast);
  const [period, setPeriod] = useState<7 | 14 | 30>(30);

  // ── Create modal ────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<KPIRequestDto>({ ...EMPTY_FORM });
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Edit modal ──────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<KPIResponseDto | null>(null);
  const [editForm, setEditForm]     = useState<KPIRequestDto>({ ...EMPTY_FORM });
  const [editError, setEditError]   = useState<string | null>(null);

  // ── Calculate popover ───────────────────────────────────────────────────
  const [calcTarget, setCalcTarget] = useState<string | null>(null); // kpiId
  const calcRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // Close calculate dropdown when clicking outside
  useEffect(() => {
    if (!calcTarget) return;
    function handler(e: MouseEvent) {
      if (calcRef.current && !calcRef.current.contains(e.target as Node)) {
        setCalcTarget(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [calcTarget]);

  const { data: kpis = [] } = useQuery({ queryKey: ['kpis'], queryFn: kpisApi.getAll });

  // create
  const createMutation = useMutation({
    mutationFn: (payload: KPIRequestDto) => kpisApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      setShowCreate(false);
      setCreateForm({ ...EMPTY_FORM });
      setCreateError(null);
      addToast('KPI created successfully!', 'success');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create KPI.';
      setCreateError(msg);
    },
  });

  // update
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<KPIRequestDto> }) => kpisApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      setEditTarget(null);
      setEditError(null);
      addToast('KPI updated successfully!', 'success');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update KPI.';
      setEditError(msg);
    },
  });

  // delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => kpisApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      addToast('KPI deleted.', 'success');
    },
    onError: () => addToast('Failed to delete KPI.', 'error'),
  });

  // calculate
  const calcMutation = useMutation({
    mutationFn: ({ type, id }: { type: typeof CALCULATION_TYPES[number]['key']; id: string }) => {
      const calc = CALCULATION_TYPES.find((c) => c.key === type)!;
      return calc.fn(id);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<KPIResponseDto[]>(['kpis'], (old = []) =>
        old.map((k) => (k.kpiId === updated.kpiId ? updated : k)),
      );
      setCalcTarget(null);
      addToast(`KPI recalculated — new value: ${updated.currentValue}`, 'success');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503 || status === 502 || !status) {
        addToast('Calculation failed — required backend service (room-service or finance-service) is not reachable.', 'error');
      } else {
        addToast(msg ?? 'Calculation failed. Please try again.', 'error');
      }
      setCalcTarget(null);
    },
  });

  function openEdit(kpi: KPIResponseDto) {
    setEditTarget(kpi);
    setEditForm({ name: kpi.name, definition: kpi.definition, target: kpi.target, currentValue: kpi.currentValue, reportingPeriod: kpi.reportingPeriod });
    setEditError(null);
  }

  function validateForm(f: KPIRequestDto): string | null {
    if (!f.name.trim())            return 'KPI name is required.';
    if (!f.definition.trim())      return 'Definition is required.';
    if (!f.reportingPeriod.trim()) return 'Reporting period is required.';
    if (f.target < 0)              return 'Target must be ≥ 0.';
    return null;
  }

  // ── Chart data ──────────────────────────────────────────────────────────
  const data = kpis.slice(0, period);
  const latest = data[data.length - 1];
  const first  = data[0];

  const avgValue  = data.length > 0 ? Math.round(data.reduce((s, k) => s + k.currentValue, 0) / data.length * 10) / 10 : 0;
  const avgTarget = data.length > 0 ? Math.round(data.reduce((s, k) => s + k.target, 0) / data.length * 10) / 10 : 0;

  const trendData = data.map((k, i) => ({ date: `D${i + 1}`, current: k.currentValue, target: k.target }));

  const radarData = data.length > 0 ? [
    { metric: 'Current vs Target', value: avgTarget > 0 ? Math.round((avgValue / avgTarget) * 100) : 0 },
    { metric: 'KPI Coverage',      value: Math.min(100, kpis.length * 10) },
    { metric: 'Avg Performance',   value: Math.min(100, Math.round(avgValue)) },
    { metric: 'Target Met',        value: data.filter((k) => k.currentValue >= k.target).length > 0 ? Math.round((data.filter((k) => k.currentValue >= k.target).length / data.length) * 100) : 0 },
    { metric: 'F&B Attach',        value: 72 },
    { metric: 'Spa Attach',        value: 48 },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Executive hospitality performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-gray-100 rounded-lg gap-1">
            {([7, 14, 30] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${period === p ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500'}`}>
                {p}D
              </button>
            ))}
          </div>
          <Button onClick={() => { setCreateForm({ ...EMPTY_FORM }); setCreateError(null); setShowCreate(true); }} icon={<Plus size={16} />}>
            Add KPI
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Avg KPI Value" value={formatPercent(avgValue)} icon={<Hotel size={20} />} color="navy"
          trend={latest && first ? { value: Math.round((latest.currentValue - first.currentValue) * 10) / 10, label: 'period change' } : undefined} />
        <StatCard title="Avg Target" value={formatCurrency(avgTarget)} icon={<DollarSign size={20} />} color="gold" />
        <StatCard title="KPIs Tracked" value={kpis.length} icon={<TrendingUp size={20} />} color="emerald" />
        <StatCard title="Targets Met" value={data.filter((k) => k.currentValue >= k.target).length} icon={<Star size={20} />} color="blue" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card title="KPI Trends" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={period === 7 ? 0 : period === 14 ? 1 : 4} />
              <YAxis yAxisId="left"  tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left"  type="monotone" dataKey="current" stroke="#1a2744" strokeWidth={2} dot={false} name="Current Value" />
              <Line yAxisId="right" type="monotone" dataKey="target"  stroke="#c9a84c" strokeWidth={2} dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {radarData.length > 0 && (
          <Card title="Performance Index" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Radar name="Score" dataKey="value" stroke="#1a2744" fill="#1a2744" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* KPI Summary Table — with Edit / Delete / Calculate actions */}
      <Card title="KPI Summary Table" subtitle={`Showing ${data.length} KPIs`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['KPI Name', 'Definition', 'Reporting Period', 'Current Value', 'Target', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((kpi) => {
                const met = kpi.currentValue >= kpi.target;
                return (
                  <tr key={kpi.kpiId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{kpi.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate">{kpi.definition}</td>
                    <td className="px-4 py-3 text-gray-700">{kpi.reportingPeriod}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{kpi.currentValue}</td>
                    <td className="px-4 py-3 text-gray-700">{kpi.target}</td>
                    <td className={`px-4 py-3 font-bold ${met ? 'text-emerald-600' : 'text-rose-500'}`}>{met ? '↑ Met' : '↓ Below'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 relative">
                        {/* Calculate dropdown */}
                        <div className="relative" ref={calcTarget === kpi.kpiId ? calcRef : undefined}>
                          <button
                            onClick={() => setCalcTarget(calcTarget === kpi.kpiId ? null : kpi.kpiId)}
                            title="Recalculate from live data"
                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                            disabled={calcMutation.isPending}
                          >
                            <Calculator size={14} />
                          </button>
                          {calcTarget === kpi.kpiId && (
                            <div className="absolute z-20 right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                              <p className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b">Recalculate from live data</p>
                              {CALCULATION_TYPES.map((ct) => (
                                <button key={ct.key}
                                  onClick={() => calcMutation.mutate({ type: ct.key, id: kpi.kpiId })}
                                  disabled={calcMutation.isPending}
                                  className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                                  {ct.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Edit */}
                        <button onClick={() => openEdit(kpi)} title="Edit KPI"
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        {/* Delete */}
                        <button onClick={() => deleteMutation.mutate(kpi.kpiId)} title="Delete KPI"
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No KPI data available. Click "Add KPI" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Create KPI Modal ─────────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setCreateError(null); }}
        title="Add New KPI"
        subtitle="Define a new key performance indicator"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowCreate(false); setCreateError(null); }}>Cancel</Button>
            <Button onClick={() => {
              const err = validateForm(createForm);
              if (err) { setCreateError(err); return; }
              createMutation.mutate(createForm);
            }} loading={createMutation.isPending} disabled={createMutation.isPending}>
              Create KPI
            </Button>
          </>
        }>
        <KPIForm form={createForm} setForm={setCreateForm} error={createError} />
      </Modal>

      {/* ── Edit KPI Modal ───────────────────────────────────────────────── */}
      <Modal open={!!editTarget} onClose={() => { setEditTarget(null); setEditError(null); }}
        title="Edit KPI"
        subtitle="Update KPI name, definition, target, or period"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEditTarget(null); setEditError(null); }}>Cancel</Button>
            <Button onClick={() => {
              if (!editTarget) return;
              const err = validateForm(editForm);
              if (err) { setEditError(err); return; }
              updateMutation.mutate({ id: editTarget.kpiId, payload: editForm });
            }} loading={updateMutation.isPending} disabled={updateMutation.isPending}>
              Save Changes
            </Button>
          </>
        }>
        <KPIForm form={editForm} setForm={setEditForm} error={editError} />
      </Modal>
    </div>
  );
}

// ── Shared KPI form fields ────────────────────────────────────────────────────
function KPIForm({ form, setForm, error }: {
  form: KPIRequestDto;
  setForm: React.Dispatch<React.SetStateAction<KPIRequestDto>>;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <div>
        <label className="input-label">KPI Name</label>
        <input type="text" value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g., Occupancy Rate" className="input" />
      </div>
      <div>
        <label className="input-label">Definition</label>
        <textarea value={form.definition}
          onChange={(e) => setForm((f) => ({ ...f, definition: e.target.value }))}
          rows={2} placeholder="Describe what this KPI measures" className="textarea" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Target</label>
          <input type="number" min={0} step={0.01} value={form.target}
            onChange={(e) => setForm((f) => ({ ...f, target: parseFloat(e.target.value) || 0 }))}
            className="input" />
        </div>
        <div>
          <label className="input-label">Current Value</label>
          <input type="number" min={0} step={0.01} value={form.currentValue}
            onChange={(e) => setForm((f) => ({ ...f, currentValue: parseFloat(e.target.value) || 0 }))}
            className="input" />
        </div>
      </div>
      <div>
        <label className="input-label">Reporting Period</label>
        <input type="text" value={form.reportingPeriod}
          onChange={(e) => setForm((f) => ({ ...f, reportingPeriod: e.target.value }))}
          placeholder="e.g., Q2 2026, May 2026, Weekly" className="input" />
      </div>
    </div>
  );
}
