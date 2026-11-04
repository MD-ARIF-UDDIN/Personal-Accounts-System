import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatters';

export interface WalletReportRow {
  walletNumber: string;
  note: string;
  todayTx: number;
  monthlyTx: number;
  todayCommission?: number;
  monthlyCommission?: number;
}

export interface WalletReportTotals {
  todayTx: number;
  monthlyTx: number;
  walletCount: number;
  todayCommission?: number;
  monthlyCommission?: number;
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

  const todayCommTotal = totals.todayCommission ?? (totals.todayTx * commissionRate) / 100;
  const monthlyCommTotal = totals.monthlyCommission ?? (totals.monthlyTx * commissionRate) / 100;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('TODAY TX', 48, 104);
  doc.text(`TODAY COMM (${commissionRate}%)`, 140, 104);
  doc.text('MONTHLY TX', 260, 104);
  doc.text(`MONTHLY COMM (${commissionRate}%)`, 365, 104);
  doc.text('WALLETS', 485, 104);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161); // sky-700
  doc.text(formatCurrency(totals.todayTx), 48, 122);

  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(formatCurrency(todayCommTotal), 140, 122);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(formatCurrency(totals.monthlyTx), 260, 122);

  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(formatCurrency(monthlyCommTotal), 365, 122);

  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(String(totals.walletCount), 485, 122);

  // Table Body
  const tableData = rows.map((r, idx) => {
    const todayComm = r.todayCommission ?? (r.todayTx * commissionRate) / 100;
    const monthlyComm = r.monthlyCommission ?? (r.monthlyTx * commissionRate) / 100;
    return [
      idx + 1,
      r.walletNumber,
      r.note || '—',
      formatCurrency(r.todayTx),
      formatCurrency(todayComm),
      formatCurrency(r.monthlyTx),
      formatCurrency(monthlyComm),
    ];
  });

  // Grand Total Row
  const totalRow = [
    '',
    `Total (${rows.length} Wallets)`,
    '',
    formatCurrency(totals.todayTx),
    formatCurrency(todayCommTotal),
    formatCurrency(totals.monthlyTx),
    formatCurrency(monthlyCommTotal),
  ];

  autoTable(doc, {
    startY: 145,
    head: [
      [
        '#',
        'Wallet Number',
        'Note',
        'Today Tx',
        `Today Comm (${commissionRate}%)`,
        `Monthly Tx (${monthLabel})`,
        `Monthly Comm (${commissionRate}%)`,
      ],
    ],
    body: tableData,
    foot: [totalRow],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    footStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 100, fontStyle: 'bold' },
      2: { cellWidth: 55, fontSize: 7, textColor: [100, 116, 139] },
      3: { cellWidth: 85, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 85, halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] },
      5: { cellWidth: 85, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 85, halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] },
    },
    margin: { left: 40, right: 40, bottom: 40 },
  });

  doc.save(`Wallet_Report_${selectedDate}.pdf`);
};
