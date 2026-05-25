import { useState } from 'react';
import { Plus, Edit, Trash2, Shield, Users, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../utils/statusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { usersApi, type UserResponseDTO } from '../../api/users';
import { useToastStore } from '../../store/toastStore';

const BACKEND_ROLE_LABELS: Record<string, string> = {
  ADMINISTRATOR:              'Administrator',
  MANAGER:                    'Manager',
  FRONT_DESK_STAFF:           'Front Desk Staff',
  HOUSEKEEPING_STAFF:         'Housekeeping Staff',
  RESTAURANT_SERVICE_STAFF:   'Service Staff',
  FINANCE_OFFICER:            'Finance Officer',
  AUDITOR:                    'Auditor',
  GUEST:                      'Guest',
};

const BACKEND_ROLE_COLORS: Record<string, string> = {
  ADMINISTRATOR:              'bg-purple-100 text-purple-700 border-purple-200',
  MANAGER:                    'bg-blue-100 text-blue-700 border-blue-200',
  FRONT_DESK_STAFF:           'bg-emerald-100 text-emerald-700 border-emerald-200',
  HOUSEKEEPING_STAFF:         'bg-amber-100 text-amber-700 border-amber-200',
  RESTAURANT_SERVICE_STAFF:   'bg-orange-100 text-orange-700 border-orange-200',
  FINANCE_OFFICER:            'bg-teal-100 text-teal-700 border-teal-200',
  AUDITOR:                    'bg-indigo-100 text-indigo-700 border-indigo-200',
  GUEST:                      'bg-pink-100 text-pink-700 border-pink-200',
};

const RBAC_MATRIX: Record<string, string[]> = {
  ADMINISTRATOR:              ['All Modules', 'User Management', 'System Config', 'Audit Logs'],
  MANAGER:                    ['Manager Dashboard', 'Staff Scheduling', 'Performance', 'Occupancy Reports', 'Front Desk View', 'Finance View'],
  FRONT_DESK_STAFF:           ['Reservations', 'Check In/Out', 'Guest Communications'],
  HOUSEKEEPING_STAFF:         ['Task Management', 'Room Status Board'],
  RESTAURANT_SERVICE_STAFF:   ['F&B Orders', 'Spa Bookings', 'Service Fulfillment'],
  FINANCE_OFFICER:            ['Invoices', 'Payments', 'Refunds', 'Reconciliation'],
  AUDITOR:                    ['KPI Dashboards', 'Scheduled Reports', 'Compliance Exports'],
  GUEST:                      ['Room Booking', 'Service Requests', 'Invoice View', 'Loyalty Points'],
};

const FALLBACK_ROLES = Object.keys(BACKEND_ROLE_LABELS);

function roleLabel(r: string) { return BACKEND_ROLE_LABELS[r] ?? r.replace(/_/g, ' '); }
function roleColor(r: string) { return BACKEND_ROLE_COLORS[r] ?? 'bg-gray-100 text-gray-600 border-gray-200'; }

export default function UserRoleManagement() {
  const [activeTab, setActiveTab] = useState<'USERS' | 'RBAC'>('USERS');
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponseDTO | null>(null);
  
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '', status: '' });
  
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });
  const { data: backendRoles = FALLBACK_ROLES } = useQuery({
    queryKey: ['user-roles'],
    queryFn: usersApi.getRoles,
    staleTime: Infinity,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof usersApi.create>[0]) => usersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAdd(false);
      setForm({ name: '', email: '', phone: '', password: '', role: '' });
      addToast('User created successfully!', 'success');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      addToast('User updated successfully!', 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast('User deleted successfully!', 'success');
    },
  });

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role', label: 'Role',
      render: (v: unknown) => {
        const role = String(v ?? '');
        return (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleColor(role)}`}>
            {roleLabel(role)}
          </span>
        );
      },
    },
    {
      key: 'status', label: 'Status',
      render: (v: unknown) => v
        ? <Badge variant={statusBadge(String(v))} dot>{String(v)}</Badge>
        : <span className="text-gray-300">—</span>,
    },
    {
      key: 'userId', label: 'Actions',
      render: (_v: unknown, row: Record<string, unknown>) => (
        <div className="flex gap-1">
          <Button size="xs" variant="ghost" icon={<Edit size={12} />}
            onClick={() => {
              const u = row as unknown as UserResponseDTO;
              setEditingUser(u);
              setEditForm({ name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status });
            }}>
            Edit
          </Button>
          <Button size="xs" variant="ghost" icon={<Trash2 size={12} />}
            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            onClick={() => {
              if (window.confirm(`Are you sure you want to remove user "${row['name']}"?`)) {
                deleteMutation.mutate(String(row['userId']));
              }
            }}>
            Remove
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    if (!form.name || !form.email || !form.phone || !form.role || !form.password) return;
    createMutation.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role,
    });
  };

  const handleUpdate = () => {
    if (!editingUser) return;
    updateMutation.mutate({
      id: editingUser.userId,
      payload: {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        status: editForm.status,
      },
    });
  };

  const isFormValid = form.name && form.email && form.phone && form.role && form.password;
  const isEditFormValid = editForm.name && editForm.email && editForm.phone && editForm.role && editForm.status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User & Role Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">RBAC matrix and account administration</p>
        </div>
        <Button onClick={() => setShowAdd(true)} icon={<Plus size={16} />}>Add User</Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users',  value: users.length,                                              bg: 'from-navy-600 to-navy-800',   icon: <Users size={18} /> },
          { label: 'Active',       value: users.filter((u) => String(u.status) === 'ACTIVE').length, bg: 'from-emerald-500 to-teal-600', icon: <CheckCircle2 size={18} /> },
          { label: 'Roles Defined', value: backendRoles.length,                                       bg: 'from-purple-500 to-purple-700', icon: <Shield size={18} /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 animate-fade-in-up">
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

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl w-fit gap-1">
        {(['USERS', 'RBAC'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'USERS' ? 'All Users' : 'Permission Matrix'}
          </button>
        ))}
      </div>

      {activeTab === 'USERS' ? (
        <Card padding={false}>
          <div className="p-6">
            <Table
              columns={columns as Parameters<typeof Table>[0]['columns']}
              data={users as unknown as Record<string, unknown>[]}
              keyField="userId"
              searchable
              searchKeys={['name', 'email', 'role']}
            />
          </div>
        </Card>
      ) : (
        <Card title="Role Permission Matrix" subtitle="What each role can access and manage" icon={<Shield size={15} />}>
          <div className="space-y-2">
            {backendRoles.map((role) => (
              <div key={role}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-50 hover:border-gray-100 hover:bg-gray-50/50 transition-all">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 min-w-[150px] text-center border ${roleColor(role)}`}>
                  {roleLabel(role)}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(RBAC_MATRIX[role] ?? []).map((perm) => (
                    <span key={perm} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-gray-600">
                      <CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0" />
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add User Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New User" subtitle="Create a new staff account" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending} disabled={!isFormValid || createMutation.isPending}>
              Create User
            </Button>
          </>
        }>
        <div className="space-y-4">
          {createMutation.isError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              Failed to create user. Please check the details and try again.
            </div>
          )}
          <div>
            <label className="input-label">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" className="input" />
          </div>
          <div>
            <label className="input-label">Email Address</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@hospease.com" className="input" />
          </div>
          <div>
            <label className="input-label">Phone Number</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1-555-000-0000" className="input" />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" className="input" />
          </div>
          <div>
            <label className="input-label">Role</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="select">
              <option value="" disabled>Select a role…</option>
              {backendRoles.map((r) => (
                <option key={r} value={r}>{roleLabel(r)}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User" subtitle="Update user account details" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={updateMutation.isPending} disabled={!isEditFormValid || updateMutation.isPending}>
              Save Changes
            </Button>
          </>
        }>
        <div className="space-y-4">
          {updateMutation.isError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              Failed to update user. Please try again.
            </div>
          )}
          <div>
            <label className="input-label">Full Name</label>
            <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="input-label">Email Address</label>
            <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="input-label">Phone Number</label>
            <input type="tel" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="input-label">Role</label>
            <select value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))} className="select">
              {backendRoles.map((r) => (
                <option key={r} value={r}>{roleLabel(r)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Status</label>
            <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="select">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
