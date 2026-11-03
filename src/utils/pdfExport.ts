import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatters';

export interface WalletReportRow {
  walletNumber: string;
  note: string;
  todayTx: number;
  monthlyTx: number;
}

export interface WalletReportTotals {
  todayTx: number;
  monthlyTx: number;
  walletCount: number;
}

export const exportWalletReportToPDF = ({
  rows,
  totals,
  selectedDate,
  monthLabel,
}: {
  rows: WalletReportRow[];
  totals: WalletReportTotals;
  selectedDate: string;
  monthLabel: string;
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
  doc.text('Wallet Transaction Report', 40, 48);

  // Subtitle & Meta
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 66);
  doc.text(`Report Date: ${selectedDate}   |   Month: ${monthLabel}`, 40, 80);

  // Summary Metrics Box
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(40, 95, 515, 45, 6, 6, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('TODAY TOTAL', 55, 112);
  doc.text('MONTHLY TOTAL', 225, 112);
  doc.text('TOTAL WALLETS', 410, 112);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161); // sky-700
  doc.text(formatCurrency(totals.todayTx), 55, 130);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(formatCurrency(totals.monthlyTx), 225, 130);

  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(String(totals.walletCount), 410, 130);

  // Table Body
  const tableData = rows.map((r, idx) => [
    idx + 1,
    r.walletNumber,
    r.note || '—',
    formatCurrency(r.todayTx),
    formatCurrency(r.monthlyTx),
  ]);

  // Grand Total Row
  const totalRow = [
    '',
    `Total (${rows.length} Wallets)`,
    '',
    formatCurrency(totals.todayTx),
    formatCurrency(totals.monthlyTx),
  ];

  autoTable(doc, {
    startY: 155,
    head: [['#', 'Wallet Number', 'Note', 'Today Transaction', `Monthly Transaction (${monthLabel})`]],
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
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 120, fontStyle: 'bold' },
      2: { cellWidth: 145 },
      3: { cellWidth: 110, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 110, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 40, right: 40, bottom: 40 },
  });

  doc.save(`Wallet_Report_${selectedDate}.pdf`);
};

