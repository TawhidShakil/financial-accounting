import { useEffect, useState } from "react";
import DateRangeFilter from "../../components/DateRangeFilter";
import ReportPDFDownloader from "../../components/ReportPDFDownloader";

// =====================
// Helpers
// =====================
const normalizeCat = (c, name = "") => {
  const v = (c || name || "").toLowerCase().trim();
  if (!v) return "";

  // Assets
  if (
    v.startsWith("asset") ||
    v.includes("cash") ||
    v.includes("bank") ||
    v.includes("receivable") ||
    v.includes("note receivable") ||
    v.includes("inventory") ||
    v.includes("stock") ||
    v.includes("supplies") ||
    v.includes("equipment") ||
    v.includes("furniture") ||
    v.includes("vehicle") ||
    v.includes("land") ||
    v.includes("building") ||
    v.includes("prepaid") ||
    v.includes("accumulated depreciation") // contra হলেও শ্রেণী asset
  ) return "asset";

  // Liabilities
  if (
    v.startsWith("liab") ||
    v.includes("payable") ||
    v.includes("loan payable") ||
    v.includes("notes payable") ||
    v.includes("unearned revenue") ||
    v.includes("deferred revenue")
  ) return "liability";

  // Equity
  if (
    v.startsWith("equity") ||
    v.startsWith("capital") ||
    v.includes("owner") ||
    v.includes("retained earnings") ||
    v.includes("drawing") ||
    v.includes("withdraw")
  ) return "equity";

  // Expenses
  if (
    v.startsWith("exp") ||
    v.includes("expense") ||
    v.includes("rent") ||
    v.includes("salary") ||
    v.includes("salaries") ||
    v.includes("utilities") ||
    v.includes("advertising") ||
    v.includes("depreciation") ||
    v.includes("interest expense")
  ) return "expense";

  // Revenues
  if (
    v.startsWith("rev") ||
    v.includes("revenue") ||
    v.includes("income") ||
    v.includes("sales") ||
    v.includes("commission")
  ) return "revenue";

  return v;
};

const isContraAsset = (name = "") => {
  const v = name.toLowerCase();
  return (
    v.includes("accumulated depreciation") ||
    v.includes("allowance for") ||
    v.includes("provision for")
  );
};
const isContraEquity = (name = "") => {
  const v = name.toLowerCase();
  return v.includes("drawing") || v.includes("withdraw");
};

const parseISO = (d) => (d ? new Date(d) : null);
const isWithin = (d, from, to) => {
  if (!d) return true;
  const dt = parseISO(d);
  if (!dt || isNaN(dt)) return true;
  if (from && dt < parseISO(from)) return false;
  if (to && dt > parseISO(to)) return false;
  return true;
};

export default function BalanceSheet() {
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [equity, setEquity] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [totalEquity, setTotalEquity] = useState(0);

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

    // Collect all lines (ledger already has both legs)
    const all = [...ledgerEntries];

    // Flatten journal (supports new/legacy shapes)
    (journalEntries || []).forEach((j) => {
      if (Array.isArray(j.entries)) {
        j.entries.forEach((e) => {
          all.push({
            date: j.date || "",
            account: e.account,
            debit: e.type === "Debit" ? Number(e.amount) : 0,
            credit: e.type === "Credit" ? Number(e.amount) : 0,
            category: e.category || "",
            type: "Journal",
          });
        });
      } else {
        all.push({
          date: j.date || "",
          account: j.debitAccount,
          debit: Number(j.amount) || 0,
          credit: 0,
          category: j.debitCategory || "",
          type: "Journal",
        });
        all.push({
          date: j.date || "",
          account: j.creditAccount,
          debit: 0,
          credit: Number(j.amount) || 0,
          category: j.creditCategory || "",
          type: "Journal",
        });
      }
    });

    // Date filter
    const filtered = all.filter((x) => isWithin(x.date, fromDate, toDate));

    // Aggregate per account
    const accMap = new Map(); // name -> {debit, credit, category}
    filtered.forEach((x) => {
      const name = x.account || "Unknown";
      const curr = accMap.get(name) || { name, debit: 0, credit: 0, category: "" };
      curr.debit += Number(x.debit) || 0;
      curr.credit += Number(x.credit) || 0;

      const resolved =
        normalizeCat(coa[name]?.category, name) ||
        normalizeCat(x.category, name) ||
        normalizeCat("", name); // name heuristics
      curr.category = resolved || curr.category;

      accMap.set(name, curr);
    });

    // Build lists + compute Net Income from rev/exp (for equity section)
    const assetsArr = [];
    const liabilitiesArr = [];
    const equityArr = [];

    let totalRev = 0;
    let totalExp = 0;

    accMap.forEach((acc) => {
      const cat = acc.category;
      const dr = acc.debit || 0;
      const cr = acc.credit || 0;

      if (cat === "asset") {
        let amt = dr - cr;                // Dr − Cr
        if (isContraAsset(acc.name)) amt = -amt;
        if (Math.abs(amt) > 1e-9) assetsArr.push({ description: acc.name, amount: amt });
      } else if (cat === "liability") {
        const amt = cr - dr;              // Cr − Dr
        if (Math.abs(amt) > 1e-9) liabilitiesArr.push({ description: acc.name, amount: amt });
      } else if (cat === "equity") {
        let amt = cr - dr;                // Cr − Dr
        if (isContraEquity(acc.name)) amt = -amt;
        if (Math.abs(amt) > 1e-9) equityArr.push({ description: acc.name, amount: amt });
      } else if (cat === "revenue") {
        totalRev += (cr - dr);            // net credit
      } else if (cat === "expense") {
        totalExp += (dr - cr);            // net debit
      }
    });

    const netInc = totalRev - totalExp;
    if (netInc) {
      equityArr.push({
        description: netInc > 0 ? "Add: Current Year Net Income" : "Less: Current Year Net Loss",
        amount: netInc,
      });
    }

    // Totals
    const tAssets = assetsArr.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const tLiab = liabilitiesArr.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const tEquity = equityArr.reduce((s, a) => s + (Number(a.amount) || 0), 0);

    // Sort (nice UI)
    assetsArr.sort((a, b) => a.description.localeCompare(b.description));
    liabilitiesArr.sort((a, b) => a.description.localeCompare(b.description));
    equityArr.sort((a, b) => a.description.localeCompare(b.description));

    setAssets(assetsArr);
    setLiabilities(liabilitiesArr);
    setEquity(equityArr);
    setTotalAssets(tAssets);
    setTotalLiabilities(tLiab);
    setTotalEquity(tEquity);
  };

  // Recompute on load & when storage data changes
  useEffect(() => {
    filterAndCalculate();
    const onStorage = (e) => {
      if (["ledgerEntries", "journalEntries", "chartOfAccounts"].includes(e.key)) {
        filterAndCalculate();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Recompute on date change
  useEffect(() => {
    filterAndCalculate();
  }, [fromDate, toDate]);

  const assetRows = assets.map((a) => [a.description, a.amount.toFixed(2)]);
  const liabilityRows = liabilities.map((a) => [a.description, a.amount.toFixed(2)]);
  const equityRows = equity.map((a) => [a.description, a.amount.toFixed(2)]);

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
        onClear={() => { setFromDate(""); setToDate(""); }}
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
                <tr className="bg-gray-100 font-semibold">
                  <td className="p-2 border-t text-right">Total Equity</td>
                  <td className="p-2 border-t text-right">{totalEquity.toFixed(2)}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="p-2 border-t text-right">Total Liabilities + Equity</td>
                  <td className="p-2 border-t text-right">{(totalLiabilities + totalEquity).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Status */}
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
