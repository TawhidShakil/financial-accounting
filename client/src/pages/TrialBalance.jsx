import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function TrialBalance() {
  const [trialData, setTrialData] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("journalEntries");
    if (saved) {
      const parsed = JSON.parse(saved);

      // Filter by date if both fromDate and toDate are selected
      const filtered = parsed.filter(entry => {
        if (!fromDate && !toDate) return true;
        const entryDate = new Date(entry.date);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;

        if (from && entryDate < from) return false;
        if (to && entryDate > to) return false;
        return true;
      });

      // Flatten all entries with account, type, amount
      const flatEntries = filtered.flatMap(entry =>
        entry.entries.map(item => ({
          account: item.account,
          type: item.type,
          amount: parseFloat(item.amount),
        }))
      );

      // Group and calculate balance per account
      const accountMap = {};

      flatEntries.forEach(entry => {
        const { account, type, amount } = entry;
        if (!accountMap[account]) {
          accountMap[account] = { debit: 0, credit: 0 };
        }
        if (type === "Debit") {
          accountMap[account].debit += amount;
        } else if (type === "Credit") {
          accountMap[account].credit += amount;
        }
      });

      const formatted = Object.entries(accountMap).map(([account, { debit, credit }]) => {
        const balance = debit - credit;
        return {
          account,
          debit: balance > 0 ? balance : 0,
          credit: balance < 0 ? Math.abs(balance) : 0,
        };
      });

      setTrialData(formatted);
    }
  }, [fromDate, toDate]);

  const totalDebit = trialData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = trialData.reduce((sum, item) => sum + item.credit, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Trial Balance</h2>

      <div className="flex justify-center gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-900 block mb-1">From:</label>
          <input
            type="date"
            className="border border-gray-800 rounded px-3 py-1"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-900 block mb-1">To:</label>
          <input
            type="date"
            className="border border-gray-800 rounded px-3 py-1"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Account</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Debit (৳)</th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">Credit (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trialData.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 text-left text-gray-700 hover:text-gray-900">
                  <Link to={`/ledger/${encodeURIComponent(item.account)}`}>
                    {item.account}
                  </Link>
                </td>

                <td className={`px-6 py-4 text-left ${item.debit < 0 ? "text-red-500" : "text-gray-700"}`}>
                  {item.debit !== 0 ? item.debit.toFixed(2) : "-"}
                </td>
                <td className={`px-6 py-4 text-left ${item.credit < 0 ? "text-red-500" : "text-gray-700"}`}>
                  {item.credit !== 0 ? item.credit.toFixed(2) : "-"}
                </td>

              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td className="px-6 py-3 text-left">Total:</td>
              <td
                className={`px-6 py-3 text-left ${totalDebit < 0 ? "text-red-500" : "text-gray-900"
                  }`}
              >
                {totalDebit.toFixed(2)}
              </td>
              <td
                className={`px-6 py-3 text-left ${totalCredit < 0 ? "text-red-500" : "text-gray-900"
                  }`}
              >
                {totalCredit.toFixed(2)}
              </td>
            </tr>
          </tfoot>

        </table>
      </div>
    </div>
  );
}
