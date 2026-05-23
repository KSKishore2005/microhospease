import { useEffect, useState } from 'react';
import { Plus, CalendarDays, Users, Building2, Clock, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { staffApi, shiftsApi } from '../../api/staff';
import { usersApi } from '../../api/users';
import type { ShiftEntity } from '../../api/staff';
import { formatDate } from '../../utils/formatters';

const SHIFT_TYPES = ['MORNING', 'AFTERNOON', 'NIGHT'] as const;

// Each shift maps to a fixed [startHour, endHour) window. NIGHT crosses midnight,
// so end = start of NEXT day at 07:00.
const SHIFT_WINDOW: Record<typeof SHIFT_TYPES[number], { start: string; end: string; crossesMidnight: boolean }> = {
  MORNING:   { start: '07:00', end: '15:00', crossesMidnight: false },
  AFTERNOON: { start: '15:00', end: '23:00', crossesMidnight: false },
  NIGHT:     { start: '23:00', end: '07:00', crossesMidnight: true  },
};

const SHIFT_TIMES_LABEL: Record<string, string> = {
  MORNING:   '07:00 – 15:00',
  AFTERNOON: '15:00 – 23:00',
  NIGHT:     '23:00 – 07:00 (next day)',
};

const SHIFT_COLORS: Record<string, string> = {
  MORNING:   'bg-amber-50 text-amber-800 border-amber-200',
  AFTERNOON: 'bg-blue-50 text-blue-800 border-blue-200',
  NIGHT:     'bg-purple-50 text-purple-800 border-purple-200',
};

const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d.toISOString().split('T')[0];
});

/** Returns "2026-05-20T07:00:00" given a YYYY-MM-DD date and a HH:MM time. */
function buildDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/** Add `days` days to a YYYY-MM-DD date string and return YYYY-MM-DD. */
function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function StaffScheduling() {
  const [view, setView] = useState<'WEEK' | 'DEPT' | 'DIRECTORY'>('WEEK');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    staffId: '',
    shiftDate: DAYS[0],
    shiftType: 'MORNING' as typeof SHIFT_TYPES[number],
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Staff creation states
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'SERVICE_STAFF',
    department: 'Service Staff',
    phone: '',
    email: '',
    status: 'ACTIVE',
  });
  const [staffFormError, setStaffFormError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: staffApi.getAll });
  const { data: shifts = [] } = useQuery({ queryKey: ['shifts'], queryFn: shiftsApi.getAll });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });

  const createShiftMutation = useMutation({
    mutationFn: (payload: Parameters<typeof shiftsApi.create>[0]) => shiftsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowAdd(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Could not save shift. Please try again.';
      setFormError(msg);
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: ({ payload, userId }: { payload: any; userId?: string }) =>
      staffApi.create(payload, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setShowAddStaff(false);
      setStaffForm({
        name: '',
        role: 'SERVICE_STAFF',
        department: 'Service Staff',
        phone: '',
        email: '',
        status: 'ACTIVE',
      });
      setSelectedUserId('');
      setStaffFormError(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Could not create staff member.';
      setStaffFormError(msg);
    },
  });

  const departments = Array.from(new Set(staff.map((s) => s.department).filter(Boolean)));
  const activeStaff = staff.filter((s) => s.status === 'ACTIVE');

  const getStaffShiftForDay = (staffId: string, day: string): ShiftEntity | undefined =>
    shifts.find(
      (s) => String(s.staffId) === String(staffId) && (s.startTime?.startsWith(day) || false),
    );

  function resetForm() {
    setForm({ staffId: '', shiftDate: DAYS[0], shiftType: 'MORNING' });
    setFormError(null);
  }

  function openAddModal(prefill?: { staffId?: string; shiftDate?: string }) {
    setForm({
      staffId: prefill?.staffId ?? '',
      shiftDate: prefill?.shiftDate ?? DAYS[0],
      shiftType: 'MORNING',
    });
    setFormError(null);
    setShowAdd(true);
  }

  function handleSave() {
    setFormError(null);
    if (!form.staffId) {
      setFormError('Please choose a staff member.');
      return;
    }
    if (!form.shiftDate) {
      setFormError('Please choose a date.');
      return;
    }

    const window = SHIFT_WINDOW[form.shiftType];
    const startTime = buildDateTime(form.shiftDate, window.start);
    const endTime = window.crossesMidnight
      ? buildDateTime(addDays(form.shiftDate, 1), window.end)
      : buildDateTime(form.shiftDate, window.end);

    createShiftMutation.mutate({
      staffId: form.staffId,
      shiftType: form.shiftType,
      startTime,
      endTime,
    });
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = users.find((u) => String(u.userId) === String(userId));
    if (selectedUser) {
      let dept = 'Service Staff';
      if (selectedUser.role === 'HOUSEKEEPING' || selectedUser.role === 'HOUSEKEEPING_STAFF') {
        dept = 'Housekeeping';
      } else if (selectedUser.role === 'FRONT_DESK' || selectedUser.role === 'FRONT_DESK_STAFF') {
        dept = 'Front Desk';
      } else if (selectedUser.role === 'FINANCE') {
        dept = 'Finance';
      } else if (selectedUser.role === 'MANAGER') {
        dept = 'Management';
      }
      setStaffForm({
        name: selectedUser.name || '',
        role: selectedUser.role || 'SERVICE_STAFF',
        department: dept,
        phone: selectedUser.phone || '',
        email: selectedUser.email || '',
        status: 'ACTIVE',
      });
    }
  };

  // Re-clear errors when shift type / date changes so the user sees fresh feedback
  useEffect(() => setFormError(null), [form.shiftType, form.shiftDate, form.staffId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Scheduling</h1>
          <p className="text-sm text-gray-400 mt-0.5">Shift planning and role assignments</p>
        </div>
        <div className="flex gap-2">
          <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
            {(['WEEK', 'DEPT', 'DIRECTORY'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  view === v ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {v === 'WEEK' ? <><CalendarDays size={14} /> Weekly View</> : v === 'DEPT' ? <><Building2 size={14} /> By Dept</> : <><Users size={14} /> Directory</>}
              </button>
            ))}
          </div>
          {view === 'DIRECTORY' ? (
            <Button icon={<Plus size={16} />} onClick={() => setShowAddStaff(true)}>Create Staff</Button>
          ) : (
            <Button icon={<Plus size={16} />} onClick={() => openAddModal()}>Add Shift</Button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Staff',       value: activeStaff.length, icon: <Users size={18} />,         bg: 'from-emerald-500 to-teal-600' },
          { label: 'Departments',        value: departments.length, icon: <Building2 size={18} />,     bg: 'from-navy-600 to-navy-800' },
          { label: 'Shifts This Week',   value: shifts.length,      icon: <CalendarDays size={18} />,  bg: 'from-gold-500 to-gold-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {view === 'WEEK' && (
        <Card padding={false}>
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">7-Day Schedule</h3>
            <p className="text-xs text-gray-400 mt-0.5">Click any empty cell to assign a shift</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-44">Staff Member</th>
                  {DAYS.map((d, i) => (
                    <th key={d} className="px-2 py-3 text-center text-xs font-semibold min-w-[110px]">
                      <div className={i === 0 ? 'text-navy-700 font-bold' : 'text-gray-600'}>{formatDate(d, 'EEE')}</div>
                      <div className={`font-normal mt-0.5 ${i === 0 ? 'text-navy-500' : 'text-gray-400'}`}>{formatDate(d, 'MMM d')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeStaff.slice(0, 12).map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-navy-700">{(member.name ?? 'S')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{member.name}</p>
                          <p className="text-gray-400 text-xs">{member.department}</p>
                        </div>
                      </div>
                    </td>
                    {DAYS.map((d) => {
                      const sch = getStaffShiftForDay(member.id, d);
                      return (
                        <td key={d} className="px-2 py-3 text-center">
                          {sch ? (
                            <div className={`text-xs px-2 py-1.5 rounded-lg border font-medium ${SHIFT_COLORS[sch.shiftType ?? ''] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              <div className="font-bold">{sch.shiftType?.slice(0, 3) ?? '—'}</div>
                              <div className="opacity-60 text-xs mt-0.5">
                                {SHIFT_TIMES_LABEL[sch.shiftType ?? '']?.split(' – ')[0] ?? ''}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAddModal({ staffId: member.id, shiftDate: d })}
                              className="w-full h-full min-h-[40px] rounded-lg border-2 border-dashed border-gray-200 text-gray-300 hover:text-navy-700 hover:border-navy-300 hover:bg-navy-50/30 transition-all text-lg font-light"
                              title={`Add shift for ${member.name} on ${formatDate(d, 'MMM d')}`}
                            >
                              +
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {activeStaff.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-sm text-gray-400">No active staff members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {view === 'DEPT' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {departments.map((dept) => {
            const deptStaff = staff.filter((s) => s.department === dept);
            const activeCount = deptStaff.filter((s) => s.status === 'ACTIVE').length;
            return (
              <Card key={dept} title={dept}
                subtitle={`${activeCount} of ${deptStaff.length} active`}
                icon={<Building2 size={15} />}>
                <div className="space-y-2">
                  {deptStaff.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center">
                          <span className="text-xs font-bold text-navy-700">{(s.name ?? 'S')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.role?.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'warning'} dot>{s.status}</Badge>
                    </div>
                  ))}
                  {deptStaff.length === 0 && (
                    <p className="text-sm text-gray-400 py-4 text-center">No staff in this department.</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {view === 'DIRECTORY' && (
        <Card padding={false}>
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Staff Directory</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manage staff profiles and link to registered users</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">User Link</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700 font-bold">
                          {(member.name ?? 'S')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{member.department}</td>
                    <td className="px-6 py-4 text-gray-600">{member.role?.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      <div>{member.email || '—'}</div>
                      <div className="mt-0.5">{member.phone || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {member.userId ? (
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">User #{member.userId}</span>
                      ) : (
                        <span className="text-gray-400 italic">Not Linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={member.status === 'ACTIVE' ? 'success' : 'warning'} dot>
                        {member.status ?? 'ACTIVE'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm text-gray-400">No staff members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Shift Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Shift"
        subtitle="Assign a shift to a staff member" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              disabled={!form.staffId || createShiftMutation.isPending}
              loading={createShiftMutation.isPending}
              onClick={handleSave}>
              Save Shift
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
            <label className="input-label">Staff Member</label>
            <select
              value={form.staffId}
              onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
              className="select">
              <option value="">Select staff member…</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Date</label>
            <select
              value={form.shiftDate}
              onChange={(e) => setForm((f) => ({ ...f, shiftDate: e.target.value }))}
              className="select">
              {DAYS.map((d) => (
                <option key={d} value={d}>{formatDate(d, 'EEE, MMM d')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Shift Type</label>
            <div className="grid grid-cols-3 gap-2">
              {SHIFT_TYPES.map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm((f) => ({ ...f, shiftType: t }))}
                  className={`p-3 rounded-xl border-2 text-xs font-semibold transition-all text-left ${
                    form.shiftType === t
                      ? 'border-navy-900 bg-navy-50 text-navy-900 shadow-sm'
                      : 'border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>{t}</span>
                  </div>
                  <div className="font-normal text-gray-400 mt-1">{SHIFT_TIMES_LABEL[t]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Live preview of what will be saved */}
          <div className="p-3 bg-navy-50/40 rounded-xl border border-navy-100">
            <p className="text-xs font-semibold text-navy-700 uppercase tracking-wide mb-1">Preview</p>
            <p className="text-sm text-gray-700">
              {staff.find((s) => s.id === form.staffId)?.name ?? '— select staff —'}
              {' · '}
              {formatDate(form.shiftDate, 'EEE, MMM d')}
              {' · '}
              <span className="font-medium">{form.shiftType}</span> ({SHIFT_TIMES_LABEL[form.shiftType]})
            </p>
          </div>
        </div>
      </Modal>

      {/* Create Staff Modal */}
      <Modal open={showAddStaff} onClose={() => setShowAddStaff(false)} title="Create New Staff Profile" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddStaff(false)}>Cancel</Button>
            <Button
              disabled={!staffForm.name || createStaffMutation.isPending}
              loading={createStaffMutation.isPending}
              onClick={() => {
                createStaffMutation.mutate({
                  payload: {
                    name: staffForm.name,
                    role: staffForm.role,
                    department: staffForm.department,
                    phone: staffForm.phone || undefined,
                    email: staffForm.email || undefined,
                    status: staffForm.status,
                    hireDate: new Date().toISOString().split('T')[0],
                  },
                  userId: selectedUserId || undefined,
                });
              }}>
              Create Profile
            </Button>
          </>
        }>
        <div className="space-y-4">
          {staffFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{staffFormError}</span>
            </div>
          )}

          <div>
            <label className="input-label">Link to Registered User (Optional)</label>
            <select
              value={selectedUserId}
              onChange={(e) => handleUserSelect(e.target.value)}
              className="select">
              <option value="">— Select User (Auto-fills Profile) —</option>
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.name} ({u.email} · {u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Full Name</label>
            <input
              type="text"
              value={staffForm.name}
              onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. John Doe"
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Department</label>
              <input
                type="text"
                value={staffForm.department}
                onChange={(e) => setStaffForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Housekeeping"
                className="input"
              />
            </div>
            <div>
              <label className="input-label">Role</label>
              <input
                type="text"
                value={staffForm.role}
                onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="e.g. HOUSEKEEPING_STAFF"
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                className="input"
              />
            </div>
            <div>
              <label className="input-label">Phone</label>
              <input
                type="text"
                value={staffForm.phone}
                onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Status</label>
            <select
              value={staffForm.status}
              onChange={(e) => setStaffForm((f) => ({ ...f, status: e.target.value }))}
              className="select">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
