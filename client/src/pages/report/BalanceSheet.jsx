import { useEffect, useState } from "react";
import DateRangeFilter from "../../components/DateRangeFilter";
import ReportPDFDownloader from "../../components/ReportPDFDownloader";

export default function BalanceSheet() {
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [equity, setEquity] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [totalEquity, setTotalEquity] = useState(0);
  const [netIncome, setNetIncome] = useState(0);

  // Date filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // For PDF: format date period line
  function getPeriodLine() {
    if (!fromDate && !toDate) return "As at " + new Date().toISOString().split("T")[0];
    if (fromDate && toDate) return `From ${fromDate} to ${toDate}`;
    if (fromDate) return `From ${fromDate}`;
    if (toDate) return `To ${toDate}`;
    return "";
  }

  // Calculate everything!
  const filterAndCalculate = () => {
    const ledgerEntries = JSON.parse(localStorage.getItem("ledgerEntries")) || [];
    const journalEntries = JSON.parse(localStorage.getItem("journalEntries")) || [];
    const allEntries = [...ledgerEntries];

    // Flatten journal entries (for extra accounts, category, date)
    journalEntries.forEach((entry) => {
      if (Array.isArray(entry.entries)) {
        entry.entries.forEach((e) => {
          allEntries.push({
            account: e.account,
            debit: e.type === "Debit" ? parseFloat(e.amount) : 0,
            credit: e.type === "Credit" ? parseFloat(e.amount) : 0,
            category: e.category || "", // <-- Must be set at input, fallback handled below
            date: entry.date || "",
          });
        });
      }
    });

    // Filter by date range if selected
    const filteredEntries = allEntries.filter(entry => {
      if (!entry.date) return true;
      if (fromDate && entry.date < fromDate) return false;
      if (toDate && entry.date > toDate) return false;
      return true;
    });

    // Map accounts and sum balances
    const accountMap = {};
    filteredEntries.forEach((entry) => {
      const acc = entry.account || "Unknown";
      let cat = (entry.category || "").toLowerCase();
      const name = (entry.account || "").toLowerCase();
      if (!accountMap[acc]) {
        accountMap[acc] = { name: acc, debit: 0, credit: 0, category: cat };
      }
      accountMap[acc].debit += entry.debit ? parseFloat(entry.debit) : 0;
      accountMap[acc].credit += entry.credit ? parseFloat(entry.credit) : 0;

      // Update category if not set but present here
      if (!accountMap[acc].category && cat) accountMap[acc].category = cat;

      // -------- Fallback: detect by account name if category is missing ---------
      if (!cat || cat === "") {
        if (
          name.includes("cash") ||
          name.includes("bank") ||
          name.includes("asset") ||
          name.includes("receivable") ||
          name.includes("inventory")
        ) {
          accountMap[acc].category = "asset";
        } else if (
          name.includes("liability") ||
          name.includes("payable") ||
          name.includes("loan payable") ||
          (name.includes("loan") && !name.includes("receivable"))
        ) {
          accountMap[acc].category = "liability";
        } else if (
          name.includes("capital") ||
          name.includes("equity") ||
          name.includes("owner")
        ) {
          accountMap[acc].category = "equity";
        } else if (
          name.includes("revenue") ||
          name.includes("income") ||
          name.includes("sales")
        ) {
          accountMap[acc].category = "revenue";
        } else if (
          name.includes("expense") ||
          name.includes("salary") ||
          name.includes("rent")
        ) {
          accountMap[acc].category = "expense";
        }
      }
    });

    // Group by category & Calculate Net Income for Equity
    const assetsArr = [];
    const liabilitiesArr = [];
    const equityArr = [];

    let totalRevenue = 0;
    let totalExpense = 0;

    Object.values(accountMap).forEach(acc => {
      const cat = acc.category;
      const balance = acc.debit - acc.credit;

      // Asset: Debit - Credit, others: absolute value for UI
      if (cat === "asset") {
        assetsArr.push({ description: acc.name, amount: Math.abs(balance) });
      } else if (cat === "liability") {
        liabilitiesArr.push({ description: acc.name, amount: Math.abs(balance) });
      } else if (cat === "capital" || cat === "equity" || cat === "owner's equity") {
        equityArr.push({ description: acc.name, amount: Math.abs(balance) });
      }

      // For net income calc
      if (cat === "revenue") {
        totalRevenue += acc.credit - acc.debit;
      }
      if (cat === "expense") {
        totalExpense += acc.debit - acc.credit;
      }
    });

    const netInc = totalRevenue - totalExpense;
    setNetIncome(netInc);

    // Add Net Income to Equity
    if (netInc !== 0) {
      equityArr.push({
        description: netInc > 0 ? "Add: Net Income" : "Less: Net Loss",
        amount: Math.abs(netInc)
      });
    }

    setAssets(assetsArr);
    setLiabilities(liabilitiesArr);
    setEquity(equityArr);
    setTotalAssets(assetsArr.reduce((sum, a) => sum + a.amount, 0));
    setTotalLiabilities(liabilitiesArr.reduce((sum, a) => sum + a.amount, 0));
    setTotalEquity(equityArr.reduce((sum, a) => sum + a.amount, 0));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      filterAndCalculate();
    }, 1000);
    return () => clearInterval(interval);
  }, [fromDate, toDate]);

  useEffect(() => { filterAndCalculate(); }, []);

  // For PDF
  const assetRows = assets.map(a => [a.description, a.amount.toFixed(2)]);
  const liabilityRows = liabilities.map(a => [a.description, a.amount.toFixed(2)]);
  const equityRows = equity.map(a => [a.description, a.amount.toFixed(2)]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Balance Sheet</h2>

      {/* Date Filter */}
      <DateRangeFilter
        fromDate={fromDate}
        toDate={toDate}
        onChange={({ from, to }) => {
          setFromDate(from);
          setToDate(to);
        }}
        onClear={() => {
          setFromDate("");
          setToDate("");
        }}
      />

      {/* PDF Download */}
      <ReportPDFDownloader
        companyName="NextFin"
        reportTitle="Balance Sheet"
        reportPeriod={getPeriodLine()}
        columns={["Account", "Amount (৳)"]}
        data={[
          // Assets
          ["ASSETS", ""],
          ...assetRows,
          ["Total Assets", totalAssets.toFixed(2)],
          ["", ""],
          // Liabilities
          ["LIABILITIES", ""],
          ...liabilityRows,
          ["Total Liabilities", totalLiabilities.toFixed(2)],
          ["", ""],
          // Equity
          ["EQUITY", ""],
          ...equityRows,
          ["Total Equity", totalEquity.toFixed(2)],
        ]}
        filename="BalanceSheet.pdf"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded shadow md:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Reports</h3>
          <ul className="space-y-2">
            <li>
              <a href="/reports/income-statement" className="text-gray-600 hover:text-blue-600">Income Statement</a>
            </li>
            <li>
              <span className="block font-medium text-blue-600">Balance Sheet</span>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-6">
          {/* Assets */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-semibold mb-3">Assets</h3>
            <table className="w-full text-left border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border-b">Account</th>
                  <th className="p-2 border-b text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 text-gray-700">{item.description}</td>
                    <td className="p-2 text-right text-gray-700">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
                {/* Total Assets Row */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="p-2 border-t text-right">Total Assets</td>
                  <td className="p-2 border-t text-right">{totalAssets.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Liabilities */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-semibold mb-3">Liabilities</h3>
            <table className="w-full text-left border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border-b">Account</th>
                  <th className="p-2 border-b text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody>
                {liabilities.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 text-gray-700">{item.description}</td>
                    <td className="p-2 text-right text-gray-700">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
                {/* Total Liabilities Row */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="p-2 border-t text-right">Total Liabilities</td>
                  <td className="p-2 border-t text-right">{totalLiabilities.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Equity */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-semibold mb-3">Equity</h3>
            <table className="w-full text-left border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border-b">Account</th>
                  <th className="p-2 border-b text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody>
                {equity.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 text-gray-700">{item.description}</td>
                    <td className="p-2 text-right text-gray-700">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
                {/* Total Equity Row */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="p-2 border-t text-right">Total Equity</td>
                  <td className="p-2 border-t text-right">{totalEquity.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Liabilities + Equity */}
          <div className="text-right mt-8 bg-white p-4 rounded shadow text-lg font-semibold text-gray-800">
            Total Liabilities + Equity:{" "}
            <span className="text-blue-700">
              ৳ {(totalLiabilities + totalEquity).toFixed(2)}
            </span>
            <span className="ml-6">
              <span className={
                totalAssets === (totalLiabilities + totalEquity)
                  ? "text-green-700"
                  : "text-red-600"
              }>
                {totalAssets === (totalLiabilities + totalEquity)
                  ? " (Balanced)"
                  : " (Not Balanced)"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}