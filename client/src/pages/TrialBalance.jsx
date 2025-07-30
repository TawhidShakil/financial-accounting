import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function TrialBalance() {
  const [trialData, setTrialData] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("journalEntries");
    if (saved) {
      const parsed = JSON.parse(saved);

      const filtered = parsed.filter((entry) => {
        if (!fromDate && !toDate) return true;
        const entryDate = new Date(entry.date);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;

        if (from && entryDate < from) return false;
        if (to && entryDate > to) return false;
        return true;
      });

      const flatEntries = filtered.flatMap((entry) =>
        entry.entries.map((item) => ({
          account: item.account,
          type: item.type,
          amount: parseFloat(item.amount),
        }))
      );

      const accountMap = {};

      flatEntries.forEach(({ account, type, amount }) => {
        if (!accountMap[account]) {
          accountMap[account] = { debit: 0, credit: 0 };
        }
        if (type === "Debit") {
          accountMap[account].debit += amount;
        } else if (type === "Credit") {
          accountMap[account].credit += amount;
        }
      });

      const formatted = Object.entries(accountMap).map(
        ([account, { debit, credit }]) => {
          const balance = debit - credit;
          return {
            account,
            debit: balance > 0 ? balance : 0,
            credit: balance < 0 ? Math.abs(balance) : 0,
          };
        }
      );

      setTrialData(formatted);
    }
  }, [fromDate, toDate]);

  const totalDebit = trialData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = trialData.reduce((sum, item) => sum + item.credit, 0);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Trial Balance", 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [["Account", "Debit (৳)", "Credit (৳)"]],
      body: trialData.map((item) => [
        item.account,
        item.debit !== 0 ? item.debit.toFixed(2) : "-",
        item.credit !== 0 ? item.credit.toFixed(2) : "-",
      ]),
      foot: [["Total", totalDebit.toFixed(2), totalCredit.toFixed(2)]],
    });
    doc.save("trial_balance.pdf");
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Account", "Debit (৳)", "Credit (৳)"],
      ...trialData.map((item) => [
        item.account,
        item.debit !== 0 ? item.debit.toFixed(2) : "-",
        item.credit !== 0 ? item.credit.toFixed(2) : "-",
      ]),
      ["Total", totalDebit.toFixed(2), totalCredit.toFixed(2)],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
    XLSX.writeFile(wb, "trial_balance.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Trial Balance
      </h2>

      <div className="flex justify-between flex-wrap items-end gap-4 mb-10">
        <div className="flex gap-4">
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-1">
              From:
            </label>
            <input
              type="date"
              className="border border-gray-800 rounded px-3 py-1"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-1">
              To:
            </label>
            <input
              type="date"
              className="border border-gray-800 rounded px-3 py-1"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        <div className="relative inline-block text-left">
          <button
            onClick={() => setShowExportMenu((prev) => !prev)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            <span>Export</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3 h-3 fill-white"
              viewBox="0 0 20 20"
            >
              <path d="M5.25 7.5l4.25 4.25 4.25-4.25" />
            </svg>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-30 bg-white border border-gray-200 rounded shadow z-10">
              <button
                onClick={() => {
                  exportToPDF();
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="text-sm">📄 PDF</span>
              </button>
              <button
                onClick={() => {
                  exportToExcel();
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="text-sm">📊 Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Account
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Debit (৳)
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Credit (৳)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trialData.map((item, index) => {
              const name = item.account.toLowerCase();
              const accountType = name.includes("cash") || name.includes("receivable") || name.includes("asset")
                ? "Asset"
                : name.includes("expense")
                ? "Expense"
                : name.includes("payable") || name.includes("liability")
                ? "Liability"
                : name.includes("revenue") || name.includes("income")
                ? "Revenue"
                : name.includes("capital")
                ? "Capital"
                : "Unknown";

              const shouldBeDebit = accountType === "Asset" || accountType === "Expense";
              const shouldBeCredit = accountType === "Liability" || accountType === "Revenue" || accountType === "Capital";
              const isViolation = (shouldBeDebit && item.credit > 0) || (shouldBeCredit && item.debit > 0);
              const rowTextColor = isViolation ? "text-red-500 font-semibold" : "text-gray-700";

              return (
                <tr key={index}>
                  <td className="px-6 py-4 text-left hover:text-gray-900">
                    <Link
                      to={`/ledger/${encodeURIComponent(item.account)}`}
                      className={rowTextColor}
                    >
                      {item.account}
                    </Link>
                  </td>
                  <td className={`px-6 py-4 text-left ${rowTextColor}`}>
                    {item.debit !== 0 ? item.debit.toFixed(2) : "-"}
                  </td>
                  <td className={`px-6 py-4 text-left ${rowTextColor}`}>
                    {item.credit !== 0 ? item.credit.toFixed(2) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td className="px-6 py-3 text-left">Total:</td>
              <td className={`px-6 py-3 text-left ${totalDebit < 0 ? "text-red-500" : "text-gray-900"}`}>
                {totalDebit.toFixed(2)}
              </td>
              <td className={`px-6 py-3 text-left ${totalCredit < 0 ? "text-red-500" : "text-gray-900"}`}>
                {totalCredit.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
