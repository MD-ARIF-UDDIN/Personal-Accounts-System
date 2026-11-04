import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatters';

export interface WalletReportRow {
  walletNumber: string;
  note: string;
  todayTx: number;
  monthlyTx: number;
  commission?: number;
}

export interface WalletReportTotals {
  todayTx: number;
  monthlyTx: number;
  walletCount: number;
  commission?: number;
}

export const exportWalletReportToPDF = ({
  rows,
  totals,
  selectedDate,
  monthLabel,
  commissionRate = 1.2,
}: {
  rows: WalletReportRow[];
  totals: WalletReportTotals;
  selectedDate: string;
  monthLabel: string;
  commissionRate?: number;
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  // Header Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Wallet Transaction Report', 40, 45);

  // Subtitle & Meta
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 62);
  doc.text(`Report Date: ${selectedDate}   |   Month: ${monthLabel}   |   Commission Rate: ${commissionRate}%`, 40, 75);

  // Summary Metrics Box
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(40, 88, 515, 45, 6, 6, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('TODAY TOTAL', 50, 104);
  doc.text('MONTHLY TOTAL', 175, 104);
  doc.text(`COMMISSION (${commissionRate}%)`, 310, 104);
  doc.text('WALLETS', 460, 104);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161); // sky-700
  doc.text(formatCurrency(totals.todayTx), 50, 122);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(formatCurrency(totals.monthlyTx), 175, 122);

  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(formatCurrency(totals.commission || (totals.monthlyTx * commissionRate) / 100), 310, 122);

  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(String(totals.walletCount), 460, 122);

  // Table Body
  const tableData = rows.map((r, idx) => [
    idx + 1,
    r.walletNumber,
    r.note || '—',
    formatCurrency(r.todayTx),
    formatCurrency(r.monthlyTx),
    formatCurrency(r.commission ?? (r.monthlyTx * commissionRate) / 100),
  ]);

  // Grand Total Row
  const totalComm = totals.commission ?? (totals.monthlyTx * commissionRate) / 100;
  const totalRow = [
    '',
    `Total (${rows.length} Wallets)`,
    '',
    formatCurrency(totals.todayTx),
    formatCurrency(totals.monthlyTx),
    formatCurrency(totalComm),
  ];

  autoTable(doc, {
    startY: 145,
    head: [['#', 'Wallet Number', 'Note', 'Today Tx', `Monthly Tx (${monthLabel})`, `Commission (${commissionRate}%)`]],
    body: tableData,
    foot: [totalRow],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    footStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 105, fontStyle: 'bold' },
      2: { cellWidth: 125 },
      3: { cellWidth: 85, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 90, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 85, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 40, right: 40, bottom: 40 },
  });

  doc.save(`Wallet_Report_${selectedDate}.pdf`);
};
