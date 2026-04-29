/**
 * Utility to export data to CSV format.
 */
export const exportClientBalancesToCSV = (balances) => {
  if (!balances || balances.length === 0) return;

  const headers = ["Client/Vendor", "Total Billed Amount (INR)", "Amount Paid (INR)", "Balance to Pay (INR)", "Settlement Status"];
  const rows = balances.map(b => [
    b.client,
    b.total_billed.toLocaleString('en-IN'),
    b.total_paid.toLocaleString('en-IN'),
    b.balance.toLocaleString('en-IN'),
    b.status
  ]);

  let csvContent = headers.join(",") + "\n";
  rows.forEach(row => {
    // Escape quotes and wrap in quotes for safety
    csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
  });

  // Add Totals row
  const totals = balances.reduce((acc, b) => ({
    billed: acc.billed + (b.total_billed || 0),
    paid: acc.paid + (b.total_paid || 0),
    balance: acc.balance + (b.balance || 0)
  }), { billed: 0, paid: 0, balance: 0 });

  const totalRow = [
    "TOTAL PORTFOLIO",
    totals.billed.toLocaleString('en-IN'),
    totals.paid.toLocaleString('en-IN'),
    totals.balance.toLocaleString('en-IN'),
    "Final Balance"
  ];
  csvContent += totalRow.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";

  const fileName = `client_settlement_ledger_${new Date().toISOString().split('T')[0]}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
