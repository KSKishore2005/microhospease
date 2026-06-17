import { useState } from 'react';
import { Plus, Trash2, Clock, AlertCircle, Download, Pencil, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { reportsApi } from '../../api/reporting';
import type { ReportResponseDto } from '../../api/reporting';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/formatters';

/** Opens a new browser window with a clean print layout and triggers the
 *  system Print → Save as PDF dialog. Works with no backend dependency. */

function exportReportAsPdf(report: ReportResponseDto) {
  const scopeColor: Record<string, string> = {
    OPERATIONAL: '#1d4ed8', FINANCIAL: '#7c3aed', OCCUPANCY: '#0d9488',
    REVENUE: '#059669',     STAFF: '#6d28d9',     HOUSEKEEPING: '#ea580c',
    SERVICES: '#e11d48',    GENERAL: '#4b5563',
  };
  const color = scopeColor[report.scope] ?? '#1a2744';
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${report.reportType}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111827; background: #fff; padding: 40px; }
    .header { border-bottom: 3px solid ${color}; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 22px; font-weight: 800; color: ${color}; letter-spacing: -0.5px; }
    .brand span { color: #c9a84c; }
    .meta { font-size: 11px; color: #6b7280; text-align: right; }
    h1 { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 6px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: .5px; background: ${color}20; color: ${color}; border: 1px solid ${color}40; margin-bottom: 18px; }
    .info-row { display: flex; gap: 24px; margin-bottom: 20px; font-size: 12px; color: #6b7280; }
    .info-row strong { color: #374151; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: ${color}; margin-bottom: 8px; }
    .content-box { background: #f9fafb; border: 1px solid #e5e7eb; border-left: 4px solid ${color}; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.7; color: #374151; white-space: pre-wrap; }
    .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Hosp<span>Ease</span> Reporting</div>
    <div class="meta">Generated: ${new Date().toLocaleString()}<br/>System Report</div>
  </div>
  <h1>${report.reportType}</h1>
  <div class="badge">${report.scope}</div>
  <div class="info-row">
    <span><strong>Report ID:</strong> ${report.reportId}</span>
    <span><strong>Generated:</strong> ${formatDate(report.generatedAt)}</span>
    ${report.staff ? `<span><strong>By:</strong> ${report.staff.name}</span>` : ''}
  </div>
  <div class="section-title">Report Content</div>
  <div class="content-box">${report.contentSummary || 'No content summary available.'}</div>
  <div class="footer">
    <span>HospEase Hotel Management System</span>
    <span>Confidential — Internal Use Only</span>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

const FILTERS = ['ALL', 'OPERATIONAL', 'FINANCIAL', 'OCCUPANCY', 'REVENUE', 'STAFF', 'HOUSEKEEPING', 'SERVICES', 'GENERAL'] as const;

const scopeColors: Record<string, string> = {
  OPERATIONAL:  'bg-blue-100 text-blue-700',
  FINANCIAL:    'bg-purple-100 text-purple-700',
  OCCUPANCY:    'bg-teal-100 text-teal-700',
  REVENUE:      'bg-emerald-100 text-emerald-700',
  STAFF:        'bg-violet-100 text-violet-700',
  HOUSEKEEPING: 'bg-orange-100 text-orange-700',
  SERVICES:     'bg-rose-100 text-rose-700',
  GENERAL:      'bg-gray-100 text-gray-700',
};

const ALL_SCOPES = ['OPERATIONAL', 'FINANCIAL', 'OCCUPANCY', 'REVENUE', 'STAFF', 'HOUSEKEEPING', 'SERVICES', 'GENERAL'] as const;

export default function ScheduledReports() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ reportType: '', scope: 'OPERATIONAL', contentSummary: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<ReportResponseDto | null>(null);
  const [editForm, setEditForm] = useState({ reportType: '', scope: 'OPERATIONAL', contentSummary: '' });
  const [editError, setEditError] = useState<string | null>(null);

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
    if (!user) {
      setFormError('You must be logged in to generate reports.');
      return;
    }
    if (!form.reportType.trim()) {
      setFormError('Please enter a report name / type.');
      return;
    }
    // user.id may arrive as a number from the backend JWT even though the
    // TypeScript type says string — coerce it safely.
    const staffId = String(user.id ?? '');
    if (!staffId || staffId === 'undefined' || staffId === '0') {
      setFormError('Your account does not have a valid staff ID. Please log out and log back in.');
      return;
    }
    createMutation.mutate({
      reportType: form.reportType.trim(),
      scope: form.scope,
      generatedByStaffId: staffId,
      contentSummary: form.contentSummary.trim(),
    });
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof reportsApi.update>[1] }) =>
      reportsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setEditTarget(null);
      setEditError(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Update failed. Please try again.';
      setEditError(msg);
    },
  });

  function openEdit(report: ReportResponseDto) {
    setEditTarget(report);
    setEditForm({ reportType: report.reportType, scope: report.scope, contentSummary: report.contentSummary });
    setEditError(null);
  }

  function handleUpdate() {
    if (!editTarget) return;
    setEditError(null);
    if (!editForm.reportType.trim()) { setEditError('Report name is required.'); return; }
    updateMutation.mutate({ id: editTarget.reportId, payload: { reportType: editForm.reportType.trim(), scope: editForm.scope, contentSummary: editForm.contentSummary.trim() } });
  }

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger">
        {[
          { label: 'Operational',   count: reports.filter((r) => r.scope === 'OPERATIONAL').length,   bg: 'from-blue-500 to-blue-700' },
          { label: 'Financial',     count: reports.filter((r) => r.scope === 'FINANCIAL').length,     bg: 'from-purple-500 to-purple-700' },
          { label: 'Staff & Services', count: reports.filter((r) => ['STAFF','SERVICES','HOUSEKEEPING'].includes(r.scope)).length, bg: 'from-orange-400 to-orange-600' },
          { label: 'Total Reports', count: reports.length,                                             bg: 'from-navy-600 to-navy-800' },
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
              <button
                onClick={() => exportReportAsPdf(report)}
                title="Export as PDF (browser print)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
              >
                <FileText size={12} /> Export PDF
              </button>
              <Button size="sm" variant="ghost" icon={<Pencil size={13} />} className="text-blue-500"
                onClick={() => openEdit(report)}>Edit</Button>
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

      {/* Edit Report Modal */}
      <Modal open={!!editTarget} onClose={() => { setEditTarget(null); setEditError(null); }}
        title="Edit Report"
        subtitle="Update report type, scope, or content summary"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEditTarget(null); setEditError(null); }}>Cancel</Button>
            <Button onClick={handleUpdate} loading={updateMutation.isPending} disabled={updateMutation.isPending}>
              Save Changes
            </Button>
          </>
        }>
        <div className="space-y-4">
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{editError}</span>
            </div>
          )}
          <div>
            <label className="input-label">Report Name / Type</label>
            <input type="text" value={editForm.reportType}
              onChange={(e) => setEditForm((f) => ({ ...f, reportType: e.target.value }))}
              placeholder="e.g., Weekly Revenue Summary"
              className="input" />
          </div>
          <div>
            <label className="input-label">Scope</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_SCOPES.map((s) => (
                <button key={s} type="button"
                  onClick={() => setEditForm((f) => ({ ...f, scope: s }))}
                  className={`p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                    editForm.scope === s ? 'border-navy-900 bg-navy-50 text-navy-900 shadow-sm' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="input-label">Content Summary</label>
            <textarea value={editForm.contentSummary}
              onChange={(e) => setEditForm((f) => ({ ...f, contentSummary: e.target.value }))}
              rows={3}
              placeholder="Updated content summary"
              className="textarea" />
          </div>
        </div>
      </Modal>

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
              {ALL_SCOPES.map((s) => (
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
