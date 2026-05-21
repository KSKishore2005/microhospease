import { useState } from 'react';
import { Download, FileBadge, Plus, Bell, CheckCircle2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { auditPackagesApi } from '../../api/reporting';
import apiClient from '../../api/client';
import { formatDate } from '../../utils/formatters';
import { useToastStore } from '../../store/toastStore';

interface CalendarItem {
  date: string;
  task: string;
  status: 'UPCOMING' | 'SUBMITTED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

const DEFAULT_CALENDAR_ITEMS: CalendarItem[] = [
  { date: '2026-06-05', task: 'May 2026 Tax Report Due', status: 'UPCOMING', priority: 'HIGH' },
  { date: '2026-07-01', task: 'Q2 2026 Lodging Report Due', status: 'UPCOMING', priority: 'MEDIUM' },
  { date: '2026-06-30', task: 'H1 2026 Financial Audit', status: 'UPCOMING', priority: 'HIGH' },
  { date: '2026-05-05', task: 'April 2026 Tax Report', status: 'SUBMITTED', priority: 'LOW' },
];

// today's date as yyyy-MM-dd for the date input max attribute
const TODAY = new Date().toISOString().split('T')[0];

export default function ComplianceExports() {
  const addToast = useToastStore((s) => s.addToast);
  const [showNew, setShowNew] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ periodStart: '', periodEnd: '', contentsJson: '' });
  const [reminderForm, setReminderForm] = useState<CalendarItem>({ date: '', task: '', status: 'UPCOMING', priority: 'MEDIUM' });

  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>(() => {
    const saved = localStorage.getItem('hospease-compliance-calendar');
    return saved ? JSON.parse(saved) : DEFAULT_CALENDAR_ITEMS;
  });

  const queryClient = useQueryClient();

  async function handleDownloadPackage(packageId: string) {
    try {
      const res = await apiClient.get(`/audit-packages/${packageId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      addToast('Could not download the audit package PDF. Please try again.', 'error');
    }
  }

  const { data: auditPackages = [] } = useQuery({
    queryKey: ['audit-packages'],
    queryFn: auditPackagesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof auditPackagesApi.create>[0]) => auditPackagesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-packages'] });
      setShowNew(false);
      setGenerating(false);
      setFormError(null);
      setForm({ periodStart: '', periodEnd: '', contentsJson: '' });
      addToast('Audit compliance package generated!', 'success');
    },
    onError: (err: unknown) => {
      setGenerating(false);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to generate audit package. Please try again.';
      setFormError(msg);
    },
  });

  const handleGenerate = () => {
    setFormError(null);
    if (!form.periodStart || !form.periodEnd) {
      setFormError('Please select both a start and end date.');
      return;
    }
    if (form.periodEnd > TODAY) {
      setFormError(`Period end date cannot be in the future. Please select a date on or before ${TODAY}.`);
      return;
    }
    if (form.periodEnd <= form.periodStart) {
      setFormError('Period end date must be after the start date.');
      return;
    }
    setGenerating(true);
    createMutation.mutate({
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      contentsJson: form.contentsJson || JSON.stringify({ generated: new Date().toISOString() }),
    });
  };

  const handleAddReminder = () => {
    if (!reminderForm.task || !reminderForm.date) return;
    const updated = [...calendarItems, reminderForm].sort((a, b) => a.date.localeCompare(b.date));
    setCalendarItems(updated);
    localStorage.setItem('hospease-compliance-calendar', JSON.stringify(updated));
    setShowReminderModal(false);
    setReminderForm({ date: '', task: '', status: 'UPCOMING', priority: 'MEDIUM' });
    addToast('Compliance reminder scheduled successfully!', 'success');
  };

  const handleToggleReminder = (index: number) => {
    const updated: CalendarItem[] = calendarItems.map((item, i) => {
      if (i === index) {
        const nextStatus: 'UPCOMING' | 'SUBMITTED' = item.status === 'UPCOMING' ? 'SUBMITTED' : 'UPCOMING';
        return { ...item, status: nextStatus };
      }
      return item;
    });
    setCalendarItems(updated);
    localStorage.setItem('hospease-compliance-calendar', JSON.stringify(updated));
    addToast('Reminder status updated!', 'success');
  };

  const handleDeleteReminder = (index: number) => {
    const updated = calendarItems.filter((_, i) => i !== index);
    setCalendarItems(updated);
    localStorage.setItem('hospease-compliance-calendar', JSON.stringify(updated));
    addToast('Reminder removed.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Exports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Regulatory data exports for tax and lodging authorities</p>
        </div>
        <Button onClick={() => setShowNew(true)} icon={<Plus size={16} />}>New Export</Button>
      </div>

      {/* Info banner */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
        <FileBadge size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Compliance Requirements</p>
          <p className="text-sm text-blue-600 mt-0.5">Monthly tax reports are due by the 5th of each month. Lodging data must be submitted quarterly. Ensure all exports are generated and reviewed before submission.</p>
        </div>
      </div>

      {/* Export cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {auditPackages.map((pkg) => (
          <div key={pkg.packageId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">📦</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">Audit Package</p>
                  <p className="text-xs text-gray-500 font-mono">{String(pkg.packageId).slice(0, 8)}</p>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>Period: {formatDate(pkg.periodStart)} – {formatDate(pkg.periodEnd)}</span>
                </div>
                {pkg.generatedAt && <p className="text-xs text-gray-400 mt-0.5">Generated: {formatDate(pkg.generatedAt)}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              {pkg.packageUri ? (
                <Button size="sm" icon={<Download size={13} />} onClick={() => handleDownloadPackage(pkg.packageId)}>
                  Download Package
                </Button>
              ) : (
                <span className="text-xs text-gray-400 self-center">No download available</span>
              )}
            </div>
          </div>
        ))}
        {auditPackages.length === 0 && (
          <div className="col-span-2 text-center py-10 text-gray-400 text-sm">No audit packages generated yet. Click "New Export" to create one.</div>
        )}
      </div>

      {/* Compliance calendar */}
      <Card title="Compliance Calendar" subtitle="Deadlines, audits, and statutory reporting requirements" icon={<Bell size={15} />}
        action={<Button size="xs" variant="secondary" icon={<Plus size={12} />} onClick={() => setShowReminderModal(true)}>Add Reminder</Button>}>
        <div className="space-y-3">
          {calendarItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded-xl transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-12 text-center ${item.status === 'UPCOMING' ? 'text-navy-700' : 'text-gray-400'}`}>
                  <p className="text-lg font-bold">{new Date(item.date).getDate()}</p>
                  <p className="text-xs font-semibold">{new Date(item.date).toLocaleString('default', { month: 'short' })}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${item.status === 'SUBMITTED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.task}</p>
                  <p className="text-[10px] text-gray-400">Due: {formatDate(item.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusBadge(item.priority)}>{item.priority}</Badge>
                <Badge variant={item.status === 'SUBMITTED' ? 'success' : 'warning'}>{item.status}</Badge>
                <div className="flex items-center gap-1">
                  <Button size="xs" variant="ghost" icon={<CheckCircle2 size={13} />} className={item.status === 'SUBMITTED' ? 'text-emerald-500' : 'text-gray-400'} onClick={() => handleToggleReminder(i)} />
                  <Button size="xs" variant="ghost" icon={<Trash2 size={13} />} className="text-rose-400 hover:text-rose-600" onClick={() => handleDeleteReminder(i)} />
                </div>
              </div>
            </div>
          ))}
          {calendarItems.length === 0 && (
            <div className="text-center py-6 text-sm text-gray-400">No scheduled compliance calendar tasks.</div>
          )}
        </div>
      </Card>

      {/* New compliance export modal */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setFormError(null); }} title="New Compliance Export" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowNew(false); setFormError(null); }}>Cancel</Button>
            <Button onClick={handleGenerate} loading={generating} disabled={!form.periodStart || !form.periodEnd || generating}>
              {generating ? 'Generating...' : 'Generate Export'}
            </Button>
          </>
        }>
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-2">
              <FileBadge size={16} className="flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            ⚠️ Both dates must be in the past. The backend cannot package future data.
          </div>
          <div>
            <label className="input-label">Period Start</label>
            <input type="date" value={form.periodStart} max={TODAY}
              onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
              className="input" />
          </div>
          <div>
            <label className="input-label">Period End <span className="text-gray-400 font-normal">(must be today or earlier)</span></label>
            <input type="date" value={form.periodEnd} max={TODAY}
              onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
              className="input" />
          </div>
          <div>
            <label className="input-label">Contents Description (optional)</label>
            <input type="text" value={form.contentsJson} onChange={(e) => setForm((f) => ({ ...f, contentsJson: e.target.value }))}
              placeholder="e.g., Tax report, lodging data"
              className="input" />
          </div>
        </div>
      </Modal>

      {/* Add Reminder Modal */}
      <Modal open={showReminderModal} onClose={() => setShowReminderModal(false)} title="Add Compliance Reminder" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowReminderModal(false)}>Cancel</Button>
            <Button onClick={handleAddReminder} disabled={!reminderForm.task || !reminderForm.date}>
              Schedule
            </Button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="input-label">Task Name</label>
            <input type="text" value={reminderForm.task} onChange={(e) => setReminderForm((f) => ({ ...f, task: e.target.value }))}
              placeholder="e.g., Q3 Lodging Report Due" className="input" />
          </div>
          <div>
            <label className="input-label">Due Date</label>
            <input type="date" value={reminderForm.date} onChange={(e) => setReminderForm((f) => ({ ...f, date: e.target.value }))}
              className="input" />
          </div>
          <div>
            <label className="input-label">Priority</label>
            <select value={reminderForm.priority} onChange={(e) => setReminderForm((f) => ({ ...f, priority: e.target.value as any }))}
              className="select">
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
