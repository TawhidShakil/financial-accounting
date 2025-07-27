import { useEffect, useState } from "react";

export default function TrialBalance() {
  const [allEntries, setAllEntries] = useState([]);
  const [balances, setBalances] = useState([]);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("journalEntries");
    if (saved) {
      const parsed = JSON.parse(saved);

      const flatEntries = parsed.flatMap(entry =>
        entry.entries.map(item => ({
          date: entry.date,
          account: item.account,
          type: item.type,
          amount: parseFloat(item.amount),
        }))
      );

      setAllEntries(flatEntries);
    }
  }, []);

  useEffect(() => {
    const filtered = filterDate
      ? allEntries.filter(entry => entry.date <= filterDate)
      : allEntries;

    const accountMap = {};

    filtered.forEach(({ account, type, amount }) => {
      if (!accountMap[account]) {
        accountMap[account] = { debit: 0, credit: 0 };
      }
      if (type === "Debit") {
        accountMap[account].debit += amount;
      } else {
        accountMap[account].credit += amount;
      }
    });

    const result = Object.entries(accountMap).map(([account, totals]) => ({
      account,
      ...totals,
      balance: totals.debit - totals.credit,
    }));

    setBalances(result);
  }, [allEntries, filterDate]);

  const totalDebit = balances.reduce((sum, acc) => sum + acc.debit, 0);
  const totalCredit = balances.reduce((sum, acc) => sum + acc.credit, 0);

  return (
    <div className="min-h-screen bg-gray-100 px-8 py-10">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Trial Balance</h2>

      {/* Filter by Date */}
      <div className="flex justify-center mb-6">
        <label className="text-gray-700 font-medium mr-2">Filter by Date:</label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border rounded px-3 py-1"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200">
            <tr>
              <th className="w-1/3 px-4 py-2 text-left text-sm font-medium text-gray-700">Account</th>
              <th className="w-1/3 px-4 py-2 text-right text-sm font-medium text-gray-700">Credit (৳)</th>
              <th className="w-1/3 px-4 py-2 text-right text-sm font-medium text-gray-700">Debit (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {balances.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="w-1/3 px-4 py-2 text-gray-800">{item.account}</td>
                
                <td className="w-1/3 px-4 py-2 text-right text-red-700">
                  {item.credit ? item.credit.toFixed(2) : "-"}
                </td>
                <td className="w-1/3 px-4 py-2 text-right text-green-700">
                  {item.debit ? item.debit.toFixed(2) : "-"}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-semibold">
              <td className="px-4 py-2 text-gray-800">Total</td>
              <td className="px-4 py-2 text-right text-green-800">{totalDebit.toFixed(2)}</td>
              <td className="px-4 py-2 text-right text-red-800">{totalCredit.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
