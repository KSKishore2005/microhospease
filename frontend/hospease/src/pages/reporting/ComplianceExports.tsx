import { useState } from 'react';
import { Download, FileBadge, Plus, Bell, CheckCircle2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { auditPackagesApi } from '../../api/reporting';
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

export default function ComplianceExports() {
  const addToast = useToastStore((s) => s.addToast);
  const [showNew, setShowNew] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ periodStart: '', periodEnd: '', contentsJson: '' });
  const [reminderForm, setReminderForm] = useState<CalendarItem>({ date: '', task: '', status: 'UPCOMING', priority: 'MEDIUM' });

  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>(() => {
    const saved = localStorage.getItem('hospease-compliance-calendar');
    return saved ? JSON.parse(saved) : DEFAULT_CALENDAR_ITEMS;
  });

  const queryClient = useQueryClient();

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
      setForm({ periodStart: '', periodEnd: '', contentsJson: '' });
      addToast('Audit compliance package generated!', 'success');
    },
    onError: () => {
      setGenerating(false);
      addToast('Failed to generate audit package.', 'error');
    },
  });

  const handleGenerate = () => {
    if (!form.periodStart || !form.periodEnd) return;
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
                <Button size="sm" icon={<Download size={13} />}>
                  <a href={pkg.packageUri} target="_blank" rel="noopener noreferrer">Download Package</a>
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
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Compliance Export" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={!form.periodStart || !form.periodEnd || generating}>
              {generating ? 'Generating...' : 'Generate Export'}
            </Button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="input-label">Period Start</label>
            <input type="date" value={form.periodStart} onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
              className="input" />
          </div>
          <div>
            <label className="input-label">Period End</label>
            <input type="date" value={form.periodEnd} onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
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
