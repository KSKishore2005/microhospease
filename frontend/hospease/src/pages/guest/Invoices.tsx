import { useState } from 'react';
import { FileText, CreditCard, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../utils/statusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { invoicesApi, parseLineItems, type InvoiceResponseDto } from '../../api/invoices';
import { paymentsApi, type PaymentMethod } from '../../api/payments';
import { useEffectiveGuestId } from '../../hooks/useEffectiveGuestId';
import { formatDate, formatCurrency } from '../../utils/formatters';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
  { value: 'DEBIT_CARD',  label: 'Debit Card',  icon: '💳' },
  { value: 'CASH',        label: 'Cash',        icon: '💵' },
];

export default function Invoices() {
  const { effectiveGuestId: guestId } = useEffectiveGuestId();
  const queryClient = useQueryClient();

  const [viewInvoice,   setViewInvoice]   = useState<InvoiceResponseDto | null>(null);
  const [payInvoice,    setPayInvoice]    = useState<InvoiceResponseDto | null>(null);
  const [payMethod,     setPayMethod]     = useState<PaymentMethod>('CREDIT_CARD');
  const [paySuccess,    setPaySuccess]    = useState(false);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', 'guest', guestId],
    queryFn: () => invoicesApi.getByGuest(guestId!),
    enabled: !!guestId,
  });

  const paymentMutation = useMutation({
    mutationFn: ({ invoiceId, amount }: { invoiceId: string; amount: number }) =>
      paymentsApi.create(invoiceId, guestId!, { amount, method: payMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'guest', guestId] });
      setPaySuccess(true);
    },
  });

  const openPayModal = (inv: InvoiceResponseDto) => {
    setPayInvoice(inv);
    setPayMethod('CREDIT_CARD');
    setPaySuccess(false);
    paymentMutation.reset();
  };

  const closePayModal = () => {
    setPayInvoice(null);
    setPaySuccess(false);
  };

  const totalBilled      = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid        = invoices.reduce((s, i) => s + i.amountPaid,  0);
  const totalOutstanding = invoices.reduce((s, i) => s + i.balanceDue,  0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
        <p className="text-sm text-gray-400 mt-0.5">View your billing history and make payments</p>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4 stagger">
        {[
          { label: 'Total Billed', value: formatCurrency(totalBilled), color: 'text-gray-900', bg: 'from-navy-600 to-navy-800' },
          { label: 'Total Paid', value: formatCurrency(totalPaid), color: 'text-emerald-700', bg: 'from-emerald-500 to-teal-600' },
          { label: 'Outstanding', value: formatCurrency(totalOutstanding), color: totalOutstanding > 0 ? 'text-rose-600' : 'text-gray-400', bg: totalOutstanding > 0 ? 'from-rose-500 to-rose-600' : 'from-gray-300 to-gray-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 animate-fade-in-up hover:-translate-y-0.5 transition-transform duration-200">
            <div className={`w-2.5 h-12 rounded-full bg-gradient-to-b ${s.bg} flex-shrink-0`} />
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      {isLoading ? (
        <p className="text-center text-sm text-gray-400 py-10">Loading invoices…</p>
      ) : invoices.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 text-sm py-8">No invoices yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.invoiceId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-navy-100 rounded-xl flex items-center justify-center text-navy-700 shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">#{inv.invoiceId}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Issued: {formatDate(inv.issuedAt)} · Due: {formatDate(inv.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadge(inv.status)}>{inv.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setViewInvoice(inv)}>View</Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-bold text-gray-900">{formatCurrency(inv.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Paid</p>
                  <p className="font-medium text-emerald-700">{formatCurrency(inv.amountPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Balance Due</p>
                  <p className={`font-medium ${inv.balanceDue > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                    {formatCurrency(inv.balanceDue)}
                  </p>
                </div>
              </div>

              {inv.balanceDue > 0 && inv.status !== 'CANCELLED' && (
                <div className="mt-3 p-3 bg-rose-50 rounded-lg flex items-center justify-between gap-3">
                  <span className="text-sm text-rose-700">
                    Balance due: <strong>{formatCurrency(inv.balanceDue)}</strong>
                  </span>
                  <Button size="sm" onClick={() => openPayModal(inv)} icon={<CreditCard size={14} />}>
                    Pay Now
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invoice detail modal */}
      {viewInvoice && (
        <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)}
          title={`Invoice #${viewInvoice.invoiceId}`} size="lg"
          footer={
            <div className="flex justify-between w-full">
              {viewInvoice.balanceDue > 0 && viewInvoice.status !== 'CANCELLED' ? (
                <Button onClick={() => { setViewInvoice(null); openPayModal(viewInvoice); }}
                  icon={<CreditCard size={14} />}>
                  Pay {formatCurrency(viewInvoice.balanceDue)}
                </Button>
              ) : <span />}
              <Button variant="secondary" onClick={() => setViewInvoice(null)}>Close</Button>
            </div>
          }>
          <div className="space-y-4">
            <div className="grid grid-cols-2 text-sm gap-3">
              <div><p className="text-xs text-gray-500">Status</p><Badge variant={statusBadge(viewInvoice.status)}>{viewInvoice.status}</Badge></div>
              <div><p className="text-xs text-gray-500">Currency</p><p className="font-medium mt-0.5">{viewInvoice.currency}</p></div>
              <div><p className="text-xs text-gray-500">Issued</p><p className="font-medium mt-0.5">{formatDate(viewInvoice.issuedAt)}</p></div>
              <div><p className="text-xs text-gray-500">Due Date</p><p className="font-medium mt-0.5">{formatDate(viewInvoice.dueDate)}</p></div>
            </div>

            {/* Line items */}
            {parseLineItems(viewInvoice.lineItemsJson).length > 0 && (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 font-semibold">
                      <th className="px-4 py-2.5 text-left">Description</th>
                      <th className="px-4 py-2.5 text-right">Qty</th>
                      <th className="px-4 py-2.5 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {parseLineItems(viewInvoice.lineItemsJson).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 text-gray-700">{item.description}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals — backward 12% tax */}
            <div className="space-y-1.5 text-sm border-t border-gray-100 pt-4">
              {(() => {
                const subtotal = viewInvoice.totalAmount / 1.12;
                const tax = viewInvoice.totalAmount - subtotal;
                return (
                  <>
                    <div className="flex justify-between text-gray-600"><span>Subtotal (excl. tax)</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Tax (12%)</span><span>{formatCurrency(tax)}</span></div>
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-1.5"><span>Total</span><span>{formatCurrency(viewInvoice.totalAmount)}</span></div>
                    <div className="flex justify-between text-emerald-700"><span>Paid</span><span>−{formatCurrency(viewInvoice.amountPaid)}</span></div>
                    {viewInvoice.balanceDue > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold border-t border-gray-100 pt-1.5"><span>Balance Due</span><span>{formatCurrency(viewInvoice.balanceDue)}</span></div>
                    )}
                    {viewInvoice.balanceDue === 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold border-t border-gray-100 pt-1.5"><span>Fully Paid</span><span>✓</span></div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}

      {/* Payment modal */}
      {payInvoice && (
        <Modal open={!!payInvoice} onClose={closePayModal}
          title={paySuccess ? 'Payment Successful' : 'Make a Payment'} size="md"
          footer={
            paySuccess ? (
              <Button onClick={closePayModal} className="w-full justify-center">Done</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={closePayModal} disabled={paymentMutation.isPending}>Cancel</Button>
                <Button
                  onClick={() => paymentMutation.mutate({ invoiceId: String(payInvoice.invoiceId), amount: payInvoice.balanceDue })}
                  disabled={paymentMutation.isPending}
                  icon={<CreditCard size={14} />}>
                  {paymentMutation.isPending ? 'Processing…' : `Pay ${formatCurrency(payInvoice.balanceDue)}`}
                </Button>
              </>
            )
          }>
          {paySuccess ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle size={48} className="text-emerald-500 mx-auto" />
              <p className="text-lg font-bold text-gray-900">Payment Confirmed</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(payInvoice.balanceDue)} paid via{' '}
                {PAYMENT_METHODS.find((m) => m.value === payMethod)?.label}.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Amount */}
              <div className="p-4 bg-navy-50 rounded-xl border border-navy-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Invoice</span>
                  <span className="font-medium">#{payInvoice.invoiceId}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Amount Due</span>
                  <span className="font-bold text-navy-900 text-lg">{formatCurrency(payInvoice.balanceDue)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(({ value, label, icon }) => (
                    <button key={value} onClick={() => setPayMethod(value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${payMethod === value ? 'border-navy-700 bg-navy-50 text-navy-800 font-medium' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                      <span className="text-base">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMutation.isError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  Payment failed — please try again or choose a different method.
                </p>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
