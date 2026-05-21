import { useState } from 'react';
import { Download, Search, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { auditLogsApi } from '../../api/users';
import { auditPackagesApi } from '../../api/reporting';
import apiClient from '../../api/client';
import { formatDateTime, formatDate } from '../../utils/formatters';

export default function AuditPackage() {
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [latestPackageId, setLatestPackageId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  async function handleDownloadPackage(packageId: string) {
    try {
      const res = await apiClient.get(`/audit-packages/${packageId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert('Could not download the audit package PDF. Please try again.');
    }
  }

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: auditLogsApi.getAll,
  });

  const { data: auditPackages = [] } = useQuery({
    queryKey: ['audit-packages'],
    queryFn: auditPackagesApi.getAll,
  });

  const createPackageMutation = useMutation({
    mutationFn: (payload: Parameters<typeof auditPackagesApi.create>[0]) => auditPackagesApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audit-packages'] });
      setGenerating(false);
      setGenerated(true);
      setLatestPackageId(String(data.packageId));
    },
    onError: () => setGenerating(false),
  });

  const resourceTypes = ['ALL', ...Array.from(new Set(auditLogs.map((l) => l.resourceType)))];

  const filtered = auditLogs.filter((log) => {
    const searchOk = !search
      || log.action.toLowerCase().includes(search.toLowerCase())
      || log.userName.toLowerCase().includes(search.toLowerCase())
      || (log.detailsJson ?? '').toLowerCase().includes(search.toLowerCase());
    const resourceOk = resourceFilter === 'ALL' || log.resourceType === resourceFilter;
    return searchOk && resourceOk;
  });

  const handleGenerate = () => {
    setGenerating(true);
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    createPackageMutation.mutate({
      periodStart: thirtyDaysAgo,
      periodEnd: today,
      contentsJson: JSON.stringify({ logs: auditLogs.length, generated: new Date().toISOString() }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Package</h1>
        <p className="text-sm text-gray-400 mt-0.5">System activity logs and compliance snapshot downloads</p>
      </div>

      {/* One-click snapshot */}
      <div className="rounded-xl bg-gradient-to-r from-navy-900 to-navy-700 p-6 flex items-center justify-between flex-wrap gap-4 text-white">
        <div>
          <h2 className="text-lg font-bold">Generate Audit Snapshot</h2>
          <p className="text-navy-300 text-sm mt-1">One-click export of all activity logs, user changes, and system events for compliance review.</p>
        </div>
        {generated ? (
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500 rounded-xl">
              <Shield size={20} />
            </div>
            <div>
              <p className="font-semibold">Snapshot Ready</p>
              {auditPackages.length > 0 && (
                <p className="text-xs text-navy-300 mt-0.5">Period: {formatDate(auditPackages[0].periodStart)} – {formatDate(auditPackages[0].periodEnd)}</p>
              )}
              {latestPackageId && (
                <Button size="sm" variant="gold" icon={<Download size={14} />} className="mt-1"
                  onClick={() => handleDownloadPackage(latestPackageId)}>
                  Download
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="gold" icon={generating ? undefined : <Download size={16} />} loading={generating} onClick={handleGenerate}>
            {generating ? 'Generating...' : 'Generate & Download'}
          </Button>
        )}
      </div>

      {/* Previous packages */}
      {auditPackages.length > 0 && (
        <Card title="Previous Audit Packages">
          <div className="space-y-2">
            {auditPackages.map((pkg) => (
              <div key={pkg.packageId} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">Package {String(pkg.packageId).slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{formatDate(pkg.periodStart)} – {formatDate(pkg.periodEnd)}</p>
                  <p className="text-xs text-gray-400">Generated: {formatDate(pkg.generatedAt)}</p>
                </div>
                {pkg.packageUri && (
                  <Button size="sm" variant="secondary" icon={<Download size={13} />}
                    onClick={() => handleDownloadPackage(String(pkg.packageId))}>
                    Download
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Log viewer */}
      <Card padding={false}>
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..."
              className="input pl-8" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {resourceTypes.map((m) => (
              <button key={m} onClick={() => setResourceFilter(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${resourceFilter === m ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map((log) => (
            <div key={log.auditId} className="flex items-start gap-4 p-4 hover:bg-gray-50/50 transition-colors">
              <div className="w-8 h-8 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield size={14} className="text-navy-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-navy-700 bg-navy-50 px-2 py-0.5 rounded">{log.action}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{log.resourceType}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{log.detailsJson ?? 'No details'}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  <span>👤 {log.userName}</span>
                  {log.resourceId && <span>ID: {log.resourceId}</span>}
                  <span>{formatDateTime(log.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-10 text-gray-400 text-sm">No log entries found.</p>}
        </div>
        <div className="p-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{filtered.length} log entries • Showing all activity</p>
        </div>
      </Card>
    </div>
  );
}
