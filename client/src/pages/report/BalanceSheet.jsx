import { useEffect, useState } from "react";
import DateRangeFilter from "../../components/DateRangeFilter";
import ReportPDFDownloader from "../../components/ReportPDFDownloader";

// Normalize category labels to a canonical set
const normalizeCat = (c) => {
  const v = (c || "").toLowerCase().trim();
  if (!v) return "";
  if (v.startsWith("asset")) return "asset";
  if (v.startsWith("liab")) return "liability";
  if (v.startsWith("equity") || v.startsWith("capital") || v.startsWith("owner")) return "equity";
  if (v.startsWith("rev") || v.includes("revenue") || v.includes("income") || v.includes("sales")) return "revenue";
  if (v.startsWith("exp") || v.includes("expense") || v.includes("rent") || v.includes("salary") || v.includes("utilities")) return "expense";
  return v;
};

export default function BalanceSheet() {
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [equity, setEquity] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [totalEquity, setTotalEquity] = useState(0);
  const [netIncome, setNetIncome] = useState(0);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  function getPeriodLine() {
    if (!fromDate && !toDate) return "As at " + new Date().toISOString().split("T")[0];
    if (fromDate && toDate) return `From ${fromDate} to ${toDate}`;
    if (fromDate) return `From ${fromDate}`;
    if (toDate) return `To ${toDate}`;
    return "";
  }

  const filterAndCalculate = () => {
    const ledgerEntries = JSON.parse(localStorage.getItem("ledgerEntries") || "[]");
    const journalEntries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
    const coa = JSON.parse(localStorage.getItem("chartOfAccounts") || "{}");

    const all = [...ledgerEntries];

    // Flatten journalEntries (old mixed format support)
    journalEntries.forEach((j) => {
      if (Array.isArray(j.entries)) {
        j.entries.forEach((e) => {
          all.push({
            date: j.date,
            account: e.account,
            debit: e.type === "Debit" ? Number(e.amount) : 0,
            credit: e.type === "Credit" ? Number(e.amount) : 0,
            category: e.category || "",
            type: "Journal",
            reference: `Journal-${j.date}-${e.account}`,
          });
        });
      } else {
        // legacy two-line journal
        all.push({
          date: j.date,
          account: j.debitAccount,
          debit: Number(j.amount),
          credit: 0,
          category: j.debitCategory || "",
          type: "Journal",
          reference: `Journal-${j.date}-${j.debitAccount}`,
        });
        all.push({
          date: j.date,
          account: j.creditAccount,
          debit: 0,
          credit: Number(j.amount),
          category: j.creditCategory || "",
          type: "Journal",
          reference: `Journal-${j.date}-${j.creditAccount}`,
        });
      }
    });

    // Date filter
    const filtered = all.filter((x) => {
      if (!x.date) return true;
      if (fromDate && x.date < fromDate) return false;
      if (toDate && x.date > toDate) return false;
      return true;
    });

    // Build account aggregates
    const map = {};
    filtered.forEach((x) => {
      const name = x.account || "Unknown";
      if (!map[name]) {
        map[name] = { name, debit: 0, credit: 0, category: "" };
      }
      map[name].debit += Number(x.debit) || 0;
      map[name].credit += Number(x.credit) || 0;

      // Resolve category priority: COA > ledger.category > name fallback
      let cat =
        normalizeCat(coa[name]?.category) ||
        normalizeCat(x.category) ||
        "";

      if (!cat) {
        const n = (name || "").toLowerCase();
        if (
          n.includes("cash") ||
          n.includes("bank") ||
          n.includes("asset") ||
          n.includes("receivable") ||
          n.includes("inventory") ||
          n.includes("supplies") ||
          n.includes("equipment") ||
          n.includes("land") ||
          n.includes("building")
        ) cat = "asset";
        else if (
          n.includes("liability") ||
          n.includes("payable") ||
          n.includes("loan payable") ||
          (n.includes("loan") && !n.includes("receivable"))
        ) cat = "liability";
        else if (n.includes("capital") || n.includes("equity") || n.includes("owner")) cat = "equity";
        else if (n.includes("revenue") || n.includes("income") || n.includes("sales")) cat = "revenue";
        else if (n.includes("expense") || n.includes("rent") || n.includes("salary") || n.includes("utilities")) cat = "expense";
      }
      map[name].category = normalizeCat(cat || map[name].category);
    });

    // Build statements
    const assetsArr = [];
    const liabilitiesArr = [];
    const equityArr = [];

    let totalRevenue = 0;
    let totalExpense = 0;

    Object.values(map).forEach((acc) => {
      const cat = acc.category;
      const balance = (acc.debit || 0) - (acc.credit || 0); // Dr - Cr

      if (cat === "asset") {
        assetsArr.push({ description: acc.name, amount: Math.abs(balance) });
      } else if (cat === "liability") {
        liabilitiesArr.push({ description: acc.name, amount: Math.abs(-balance) });
      } else if (cat === "equity") {
        equityArr.push({ description: acc.name, amount: Math.abs(-balance) });
      }

      // Net income (Revenue/Expense)
      if (cat === "revenue") {
        totalRevenue += (acc.credit || 0) - (acc.debit || 0);
      } else if (cat === "expense") {
        totalExpense += (acc.debit || 0) - (acc.credit || 0);
      }
    });

    const netInc = totalRevenue - totalExpense;
    setNetIncome(netInc);

    if (netInc !== 0) {
      equityArr.push({
        description: netInc > 0 ? "Add: Current Year Net Income" : "Less: Current Year Net Loss",
        amount: Math.abs(netInc),
      });
    }

    // Totals
    const tAssets = assetsArr.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const tLiab = liabilitiesArr.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const tEquity = equityArr.reduce((s, a) => s + (Number(a.amount) || 0), 0);

    setAssets(assetsArr);
    setLiabilities(liabilitiesArr);
    setEquity(equityArr);
    setTotalAssets(tAssets);
    setTotalLiabilities(tLiab);
    setTotalEquity(tEquity);
  };

  useEffect(() => {
    const h = setInterval(filterAndCalculate, 800);
    return () => clearInterval(h);
  }, [fromDate, toDate]);

  useEffect(() => {
    filterAndCalculate();
  }, []);

  // Table rows for PDF
  const assetRows = assets.map((a) => [a.description, a.amount.toFixed(2)]);
  const liabilityRows = liabilities.map((a) => [a.description, a.amount.toFixed(2)]);
  const equityRows = equity.map((a) => [a.description, a.amount.toFixed(2)]);

  // For footer/status & equity extra row
  const tle = totalLiabilities + totalEquity;
  const balanced = Math.abs(totalAssets - tle) < 0.01;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Balance Sheet</h2>

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

      <ReportPDFDownloader
        companyName="NextFin"
        reportTitle="Balance Sheet"
        reportPeriod={getPeriodLine()}
        columns={["Account", "Amount (৳)"]}
        data={[
          ["ASSETS", ""],
          ...assetRows,
          ["Total Assets", totalAssets.toFixed(2)],
          ["", ""],
          ["LIABILITIES", ""],
          ...liabilityRows,
          ["Total Liabilities", totalLiabilities.toFixed(2)],
          ["", ""],
          ["EQUITY", ""],
          ...equityRows,
          ["Total Equity", totalEquity.toFixed(2)],
          // New combined line inside PDF too
          ["Total Liabilities + Equity", (totalLiabilities + totalEquity).toFixed(2)],
        ]}
        filename="BalanceSheet.pdf"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left nav */}
        <div className="bg-white p-4 rounded shadow md:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Reports</h3>
          <ul className="space-y-2">
            <li>
              <a href="/reports/income-statement" className="text-gray-600 hover:text-blue-600">
                Income Statement
              </a>
            </li>
            <li>
              <span className="block font-medium text-blue-600">Balance Sheet</span>
            </li>
          </ul>
        </div>

        {/* Main tables */}
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
                <tr className="bg-gray-100 font-semibold">
                  <td className="p-2 border-t text-right">Total Liabilities</td>
                  <td className="p-2 border-t text-right">{totalLiabilities.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Equity (with TLE line) */}
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
                <tr className="bg-gray-100 font-semibold">
                  <td className="p-2 border-t text-right">Total Equity</td>
                  <td className="p-2 border-t text-right">{totalEquity.toFixed(2)}</td>
                </tr>
                {/* NEW: Total Liabilities + Equity aligned with Amount column */}
                <tr className="font-semibold">
                  <td className="p-2 border-t text-right">Total Liabilities + Equity</td>
                  <td className="p-2 border-t text-right">{tle.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Status only */}
          <div className="mt-4 bg-white p-4 rounded shadow text-lg font-semibold text-center">
            <span className={balanced ? "text-green-700" : "text-red-600"}>
              {balanced ? "Balanced" : "Not Balanced"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
