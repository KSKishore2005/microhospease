import { useState } from 'react';
import { Edit, Save, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { roomsApi } from '../../api/rooms';
import type { RoomResponseDto } from '../../api/rooms';
import { formatCurrency } from '../../utils/formatters';

const FACILITIES = [
  { name: 'Main Restaurant', hours: '06:30–23:00', status: 'OPEN' },
  { name: 'Spa & Wellness Center', hours: '08:00–21:00', status: 'OPEN' },
  { name: 'Fitness Center', hours: '05:00–23:00', status: 'OPEN' },
  { name: 'Swimming Pool', hours: '07:00–21:00', status: 'OPEN' },
  { name: 'Bar & Lounge', hours: '12:00–02:00', status: 'OPEN' },
  { name: 'Business Center', hours: '07:00–22:00', status: 'OPEN' },
  { name: 'Conference Rooms', hours: '08:00–20:00', status: 'CLOSED' },
];

export default function PropertyConfiguration() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ number: '', type: 'SINGLE' as 'SINGLE' | 'DOUBLE' | 'SUITE' | 'DELUXE', capacity: 2, ratePerNight: 150 });

  const queryClient = useQueryClient();

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof roomsApi.update>[1] }) => roomsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setEditingId(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof roomsApi.create>[0]) => roomsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setShowAdd(false);
    },
  });

  // Group rooms by type
  const roomTypes = ['SINGLE', 'DOUBLE', 'SUITE', 'DELUXE'];
  const roomTypeGroups = roomTypes.map((type) => {
    const typeRooms = rooms.filter((r) => r.type === type);
    const avgRate = typeRooms.length > 0
      ? Math.round(typeRooms.reduce((s, r) => s + r.ratePerNight, 0) / typeRooms.length)
      : 0;
    return { type, rooms: typeRooms, count: typeRooms.length, avgRate };
  }).filter((g) => g.count > 0);

  const startEdit = (room: RoomResponseDto) => {
    setEditingId(room.roomId);
    setEditRate(room.ratePerNight);
  };

  const saveEdit = (roomId: string) => {
    updateMutation.mutate({ id: roomId, payload: { ratePerNight: editRate } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Configuration</h1>
          <p className="text-sm text-gray-400 mt-0.5">Room types, pricing tiers, and facility management</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowAdd(true)}>Add Room</Button>
      </div>

      {/* Hotel Info */}
      <Card title="Hotel Information">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ['Hotel Name', 'HospEase Grand Hotel'],
            ['Category', '5-Star Luxury'],
            ['Total Rooms', rooms.length],
            ['Location', 'Downtown, Premium District'],
            ['Check-in Time', '15:00'],
            ['Check-out Time', '12:00'],
          ].map(([l, v]) => (
            <div key={String(l)} className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">{l}</p>
              <p className="font-semibold text-gray-900 mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Room type configs */}
      <Card title="Room Type & Pricing Configuration">
        <div className="space-y-4">
          {roomTypeGroups.map((group) => (
            <div key={group.type} className="p-5 border border-gray-100 rounded-xl hover:border-gray-200 transition-all">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{group.type}</h3>
                    <Badge variant="default">{group.count} rooms</Badge>
                  </div>
                  <p className="text-sm text-gray-500">Avg capacity: {Math.round(group.rooms.reduce((s, r) => s + r.capacity, 0) / group.count)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-navy-800">{formatCurrency(group.avgRate)}<span className="text-xs text-gray-400 font-normal">/night avg</span></p>
                </div>
              </div>

              {/* Individual rooms */}
              <div className="mt-4 space-y-2">
                {group.rooms.slice(0, 5).map((room) => (
                  <div key={room.roomId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Room {room.number}</p>
                      <p className="text-xs text-gray-500">Capacity: {room.capacity} • Status: {room.status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === room.roomId ? (
                        <>
                          <input type="number" value={editRate} onChange={(e) => setEditRate(Number(e.target.value))}
                            className="w-24 px-2 py-1 text-sm border border-navy-300 rounded-lg focus:outline-none text-right" />
                          <Button size="sm" icon={<Save size={13} />} onClick={() => saveEdit(room.roomId)}
                            disabled={updateMutation.isPending}>Save</Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-navy-800">{formatCurrency(room.ratePerNight)}</p>
                          <Button size="sm" variant="ghost" icon={<Edit size={13} />} onClick={() => startEdit(room)}>Edit</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {group.rooms.length > 5 && (
                  <p className="text-xs text-gray-400 text-center">+{group.rooms.length - 5} more rooms</p>
                )}
              </div>
            </div>
          ))}
          {roomTypeGroups.length === 0 && <p className="text-sm text-gray-400">No rooms configured.</p>}
        </div>
      </Card>

      {/* Facility hours */}
      <Card title="Facility Hours & Status">
        <div className="grid sm:grid-cols-2 gap-3">
          {FACILITIES.map((f) => (
            <div key={f.name} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
              <div>
                <p className="font-medium text-gray-900 text-sm">{f.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.hours}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${f.status === 'OPEN' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <span className={`text-xs font-medium ${f.status === 'OPEN' ? 'text-emerald-600' : 'text-gray-500'}`}>{f.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Room Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Room" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ number: form.number, type: form.type, capacity: form.capacity, ratePerNight: form.ratePerNight, status: 'AVAILABLE' })}
              disabled={!form.number || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Room'}
            </Button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="input-label">Room Number</label>
            <input value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} placeholder="e.g., 301"
              className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
                className="select">
                {['SINGLE', 'DOUBLE', 'SUITE', 'DELUXE'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Capacity</label>
              <input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                className="input" />
            </div>
          </div>
          <div>
            <label className="input-label">Rate Per Night ($)</label>
            <input type="number" value={form.ratePerNight} onChange={(e) => setForm((f) => ({ ...f, ratePerNight: Number(e.target.value) }))}
              className="input" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
