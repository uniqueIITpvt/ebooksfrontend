'use client';

import React from 'react';
import { API_CONFIG } from '@/config/api';
import { tokenStore } from '@/services/api/tokenStore';

type InvoiceItem = {
  itemName?: string;
  itemType?: string;
  planType?: string | null;
  quantity?: number;
  unitPrice?: number;
  taxAmount?: number;
  lineTotal?: number;
};

export type InvoiceRecord = {
  invoiceNumber?: string;
  invoiceDate?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  seller?: {
    tradeName?: string;
    legalName?: string;
  };
  subtotal?: number;
  discountAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  grandTotal?: number;
  currency?: string;
  payment?: {
    method?: string;
    status?: string;
    razorpayPaymentId?: string;
  };
  items?: InvoiceItem[];
};

export type InvoicePayment = {
  paymentType?: string;
  itemType?: string;
  itemName?: string;
  itemId?: string | null;
  planType?: string | null;
  quantity?: number;
  amount?: number;
  totalAmount?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxAmount?: number;
  currency?: string;
  paymentMethod?: string;
  status?: string;
  paidAt?: string | null;
  customer?: InvoiceRecord['customer'];
  razorpay?: {
    paymentId?: string | null;
    orderId?: string | null;
  };
  paymentDetails?: Record<string, string | number | boolean | null>;
  gateway?: string;
  gatewayEnvironment?: string;
};

interface InvoiceModalProps {
  open: boolean;
  loading?: boolean;
  invoice?: InvoiceRecord | null;
  payment?: InvoicePayment | null;
  paymentId?: string | null;
  onClose: () => void;
}

const formatCurrency = (amount?: number, currency = 'INR') =>
  `${currency} ${Number(amount || 0).toLocaleString('en-IN')}`;

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '-');

const getPlanLabel = (payment?: InvoicePayment | null) =>
  payment?.planType || (payment?.paymentType === 'subscription' ? payment?.itemId || '' : '');

const handlePrintInvoice = () => {
  const invoiceElement = document.querySelector('.invoice-print-area');
  if (!invoiceElement) return;

  const printWindow = window.open('', '_blank', 'width=900,height=1200');
  if (!printWindow) {
    window.print();
    return;
  }

  const headAssets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('');

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Invoice</title>
        ${headAssets}
        <style>
          @page { size: A4 portrait; margin: 0; }
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            overflow: hidden;
            background: white;
          }
          body {
            display: flex;
            align-items: flex-start;
            justify-content: center;
          }
          .invoice-print-area {
            width: 210mm !important;
            height: 297mm !important;
            max-width: none !important;
            max-height: none !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 14mm !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            background: white !important;
            font-size: 10px !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>${invoiceElement.outerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export default function InvoiceModal({ open, loading, invoice, payment, paymentId, onClose }: InvoiceModalProps) {
  const [emailSending, setEmailSending] = React.useState(false);
  const [emailMessage, setEmailMessage] = React.useState<string | null>(null);

  if (!open) return null;

  const currency = invoice?.currency || payment?.currency || 'INR';
  const subtotal = invoice?.subtotal ?? payment?.subtotalAmount ?? payment?.amount ?? 0;
  const discount = invoice?.discountAmount ?? payment?.discountAmount ?? 0;
  const cgst = invoice?.cgstAmount ?? payment?.cgstAmount ?? 0;
  const sgst = invoice?.sgstAmount ?? payment?.sgstAmount ?? 0;
  const igst = invoice?.igstAmount ?? payment?.igstAmount ?? 0;
  const total = invoice?.grandTotal ?? payment?.totalAmount ?? payment?.amount ?? 0;
  const customer = invoice?.customer || payment?.customer || {};
  const paymentMethod = invoice?.payment?.method || String(payment?.paymentDetails?.method || payment?.paymentMethod || '-');
  const paymentStatus = invoice?.payment?.status || payment?.status || '-';
  const razorpayPaymentId = invoice?.payment?.razorpayPaymentId || payment?.razorpay?.paymentId || '';
  const invoiceItems =
    invoice?.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            itemName: payment?.itemName || '-',
            itemType: payment?.itemType || payment?.paymentType || '',
            planType: getPlanLabel(payment),
            quantity: payment?.quantity || 1,
            unitPrice: payment?.subtotalAmount ?? payment?.amount ?? 0,
            taxAmount: payment?.taxAmount || 0,
            lineTotal: payment?.totalAmount ?? payment?.amount ?? 0,
          },
        ];

  const handleEmailInvoice = async () => {
    if (!paymentId || emailSending) return;

    setEmailSending(true);
    setEmailMessage(null);

    try {
      const token = tokenStore.getAccessToken();
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/payments/${paymentId}/invoice/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error?.message || 'Unable to email invoice');
      }

      setEmailMessage('Invoice emailed successfully');
    } catch (error) {
      setEmailMessage(error instanceof Error ? error.message : 'Unable to email invoice');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center overflow-y-auto bg-gray-900/55 px-4 py-10">
      <div className="relative my-auto w-full max-w-4xl">
        <button
          onClick={onClose}
          aria-label="Close invoice"
          className="no-print absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-semibold leading-none text-slate-700 shadow hover:bg-slate-50"
        >
          &times;
        </button>

        {loading ? (
          <div className="flex min-h-[520px] items-center justify-center bg-white shadow-2xl">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          </div>
        ) : (
          <div className="shadow-2xl">
            <div className="invoice-print-area mx-auto max-h-[calc(100vh-80px)] w-full max-w-[780px] overflow-y-auto bg-white px-8 py-7 text-black shadow-sm sm:px-10">
              <div className="mb-7 flex items-start justify-between gap-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-normal">Invoice</h2>
                  <dl className="mt-4 grid grid-cols-[112px_1fr] gap-y-1.5 text-[11px]">
                    <dt className="font-semibold">Invoice number</dt>
                    <dd>{invoice?.invoiceNumber || '-'}</dd>
                    <dt className="font-semibold">Date of issue</dt>
                    <dd>{formatDate(invoice?.invoiceDate || payment?.paidAt)}</dd>
                    {payment?.paidAt && (
                      <>
                        <dt className="font-semibold">Payment date</dt>
                        <dd>{formatDate(payment.paidAt)}</dd>
                      </>
                    )}
                  </dl>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-extrabold leading-none text-[#2563eb]">Unique Books Plus</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                    Research Center
                  </div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-14 text-[11px] leading-5">
                <div>
                  <h3 className="mb-3 font-bold">
                    {invoice?.seller?.tradeName || invoice?.seller?.legalName || 'Unique Books Plus Research Center'}
                  </h3>
                  <p>India</p>
                  <p>support@uniqueiit.com</p>
                </div>

                <div>
                  <h3 className="mb-3 font-bold">Bill to</h3>
                  <p>{customer.name || '-'}</p>
                  <p>{customer.address?.city || ''}</p>
                  <p>{customer.address?.state || customer.address?.country || 'India'}</p>
                  <p>{customer.email || '-'}</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="text-2xl font-extrabold">{formatCurrency(total, currency)} paid</div>
                <span className="mt-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  {paymentStatus === 'completed' || paymentStatus === 'paid' ? 'Payment confirmed' : paymentStatus}
                </span>
              </div>

              <table className="mb-4 w-full table-fixed text-[11px]">
                <thead>
                  <tr className="border-b border-blue-900">
                    <th className="w-1/2 pb-2 text-left font-medium">Description</th>
                    <th className="w-16 pb-2 text-right font-medium">Qty</th>
                    <th className="w-28 pb-2 text-right font-medium">Unit price</th>
                    <th className="w-24 pb-2 text-right font-medium">Tax</th>
                    <th className="w-28 pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, index) => (
                    <tr key={`${item.itemName}-${index}`}>
                      <td className="py-3 align-top">
                        <div className="font-bold">{item.itemName || '-'}</div>
                        <div className="mt-1 text-slate-600">
                          {item.itemType || ''}
                          {item.planType ? ` - ${item.planType}` : ''}
                        </div>
                        {razorpayPaymentId && <div className="mt-1 text-slate-600">Razorpay: {razorpayPaymentId}</div>}
                      </td>
                      <td className="py-3 text-right align-top">{item.quantity || 1}</td>
                      <td className="py-3 text-right align-top">{formatCurrency(item.unitPrice, currency)}</td>
                      <td className="py-3 text-right align-top">
                        {item.taxAmount ? formatCurrency(item.taxAmount, currency) : 'Included'}
                      </td>
                      <td className="py-3 text-right align-top">{formatCurrency(item.lineTotal, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mb-5 rounded-lg border border-blue-200 bg-white/70 p-4 text-[11px]">
                <div className="grid grid-cols-2 gap-x-16 gap-y-5">
                  <div>
                    <h4 className="mb-2 font-bold">Customer</h4>
                    <p>{customer.name || '-'}</p>
                    <p>{customer.email || '-'}</p>
                    <p>{customer.phone || '-'}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-bold">Payment</h4>
                    <p className="capitalize">{paymentMethod}</p>
                    <p>{paymentStatus}</p>
                    <p>{razorpayPaymentId || payment?.razorpay?.orderId || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="ml-auto w-full max-w-sm text-[11px]">
                {[
                  ['Subtotal', formatCurrency(subtotal, currency)],
                  ['Discount', formatCurrency(discount, currency)],
                  ['CGST', formatCurrency(cgst, currency)],
                  ['SGST', formatCurrency(sgst, currency)],
                  ['IGST', formatCurrency(igst, currency)],
                  ['Total', formatCurrency(total, currency)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-blue-200 py-2">
                    <span className={label === 'Total' ? 'font-bold' : ''}>{label}</span>
                    <span className={label === 'Total' ? 'font-bold' : ''}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 text-sm font-extrabold">
                  <span>Amount paid</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
              </div>

              <div className="mt-7 border-t border-blue-200 pt-3 text-[10px] text-blue-700">
                Your payment has been confirmed. Thank you for choosing Unique Books Plus Research Center.
              </div>

              <div className="no-print mt-5 flex flex-col items-end gap-2">
                {emailMessage && (
                  <p className="text-xs font-semibold text-blue-700">{emailMessage}</p>
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    onClick={handlePrintInvoice}
                    className="rounded bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Print / Save as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
