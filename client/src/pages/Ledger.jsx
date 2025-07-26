import { useEffect, useState } from "react";

export default function Ledger() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("journalEntries");
    if (saved) {
      const parsed = JSON.parse(saved);

      // Flatten the nested journal entry structure
      const flatEntries = parsed.flatMap(entry =>
        entry.entries.map(item => ({
          date: entry.date,
          account: item.account,
          type: item.type,
          amount: item.amount
        }))
      );

      setEntries(flatEntries);
    }
  }, []);

  // Group entries by account
  const groupedByAccount = entries.reduce((acc, entry) => {
    if (!acc[entry.account]) acc[entry.account] = [];
    acc[entry.account].push(entry);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Ledger</h2>

      {Object.entries(groupedByAccount).map(([account, records]) => {
        let debitTotal = 0;
        let creditTotal = 0;

        return (
          <div key={account} className="mb-10 bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-gray-00 text-white px-6 py-4">
              <h3 className="text-xl font-semibold text-gray-800">{account}</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((entry, index) => {
                  if (entry.type === "Debit") {
                    debitTotal += entry.amount;
                  } else {
                    creditTotal += entry.amount;
                  }

                  const netBalance = debitTotal - creditTotal;
                  const balanceType = netBalance >= 0 ? "Debit" : "Credit";
                  const balanceDisplay = `৳ ${Math.abs(netBalance)} (${balanceType})`;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-left text-gray-900">{entry.date}</td>
                      <td className="px-4 py-2 text-left">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.type === "Debit"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-left">৳ {entry.amount}</td>
                      <td className="px-4 py-2 text-left font-medium">{balanceDisplay}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
