import { useState } from 'react';
import { Plus, Trash2, Clock, AlertCircle, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { reportsApi } from '../../api/reporting';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/formatters';

const FILTERS = ['ALL', 'OPERATIONAL', 'FINANCIAL', 'OCCUPANCY', 'REVENUE'] as const;

const scopeColors: Record<string, string> = {
  OPERATIONAL: 'bg-blue-100 text-blue-700',
  FINANCIAL: 'bg-purple-100 text-purple-700',
  OCCUPANCY: 'bg-teal-100 text-teal-700',
  REVENUE: 'bg-emerald-100 text-emerald-700',
};

export default function ScheduledReports() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ reportType: '', scope: 'OPERATIONAL', contentSummary: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: reportsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof reportsApi.create>[0]) => reportsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setShowNew(false);
      setForm({ reportType: '', scope: 'OPERATIONAL', contentSummary: '' });
      setFormError(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Report generation failed. Please check that all backend services are reachable and try again.';
      setFormError(msg);
    },
  });

  function handleCreate() {
    setFormError(null);
    if (!user?.id) {
      setFormError('You must be logged in to generate reports.');
      return;
    }
    if (!form.reportType.trim()) {
      setFormError('Please enter a report name / type.');
      return;
    }
    createMutation.mutate({
      reportType: form.reportType.trim(),
      scope: form.scope,
      // Backend expects @Positive Long; pass the numeric user id, not the string 'system'.
      generatedByStaffId: String(user.id),
      contentSummary: form.contentSummary.trim(),
    });
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  const filtered = filter === 'ALL' ? reports : reports.filter((r) => r.scope === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduled Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Automated report generation and delivery</p>
        </div>
        <Button onClick={() => setShowNew(true)} icon={<Plus size={16} />}>New Report</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 stagger">
        {[
          { label: 'Operational', count: reports.filter((r) => r.scope === 'OPERATIONAL').length, bg: 'from-blue-500 to-blue-700' },
          { label: 'Financial',   count: reports.filter((r) => r.scope === 'FINANCIAL').length,   bg: 'from-purple-500 to-purple-700' },
          { label: 'Total Reports', count: reports.length,                                          bg: 'from-navy-600 to-navy-800' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 animate-fade-in-up">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
              <span className="text-sm font-bold">{s.count}</span>
            </div>
            <p className="text-xs font-semibold text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${filter === f ? 'bg-navy-900 text-white border-navy-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Report cards */}
      <div className="space-y-3">
        {filtered.map((report) => (
          <div key={report.reportId} className="bg-white rounded-xl border shadow-sm p-5 flex flex-wrap items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-navy-100 rounded-xl flex items-center justify-center text-navy-700">
                <Clock size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{report.reportType || 'Report'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scopeColors[report.scope] ?? 'bg-gray-100 text-gray-600'}`}>{report.scope}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{report.contentSummary}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-0.5">
                  <span>Generated: {formatDate(report.generatedAt)}</span>
                  {report.staff && <span>By: {report.staff.name}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {report.reportUri && (
                <button
                  onClick={async () => {
                    try {
                      // reportUri is "/api/reports/{id}/download"; strip the "/api"
                      // because apiClient already has baseURL = "/api".
                      const path = report.reportUri!.replace(/^\/api/, '');
                      const res = await apiClient.get(path, { responseType: 'blob' });
                      const url = URL.createObjectURL(res.data as Blob);
                      window.open(url, '_blank');
                      setTimeout(() => URL.revokeObjectURL(url), 60_000);
                    } catch (e) {
                      alert('Could not download the PDF. Please try again.');
                      console.error(e);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-all"
                >
                  <Download size={12} /> Download PDF
                </button>
              )}
              <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} className="text-rose-500"
                onClick={() => deleteMutation.mutate(report.reportId)}
                disabled={deleteMutation.isPending}>Remove</Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">No reports found.</div>
        )}
      </div>

      <Modal open={showNew} onClose={() => { setShowNew(false); setFormError(null); }}
        title="Generate New Report"
        subtitle="The PDF will be auto-generated and attached"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowNew(false); setFormError(null); }}>Cancel</Button>
            <Button onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!form.reportType.trim() || createMutation.isPending}>
              Generate Report
            </Button>
          </>
        }>
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="input-label">Report Name / Type</label>
            <input type="text" value={form.reportType}
              onChange={(e) => setForm((f) => ({ ...f, reportType: e.target.value }))}
              placeholder="e.g., Weekly Revenue Summary"
              className="input" />
          </div>

          <div>
            <label className="input-label">Scope</label>
            <div className="grid grid-cols-2 gap-2">
              {(['OPERATIONAL', 'FINANCIAL', 'OCCUPANCY', 'REVENUE'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, scope: s }))}
                  className={`p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                    form.scope === s
                      ? 'border-navy-900 bg-navy-50 text-navy-900 shadow-sm'
                      : 'border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">
              Content Summary <span className="text-gray-400 font-normal">(optional — auto-generated if blank)</span>
            </label>
            <textarea
              value={form.contentSummary}
              onChange={(e) => setForm((f) => ({ ...f, contentSummary: e.target.value }))}
              rows={3}
              placeholder="Leave blank and we'll auto-generate based on scope"
              className="textarea"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
            Generated by: <span className="font-semibold text-gray-800">{user?.name ?? 'Unknown'}</span>
            {user?.id && <span className="text-gray-400"> · user #{user.id}</span>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
