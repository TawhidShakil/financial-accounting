import { useEffect, useMemo, useState } from "react";
import DateRangeFilter from "../../components/DateRangeFilter";
import ReportPDFDownloader from "../../components/ReportPDFDownloader";

// Normalize category with account name fallback
const normalizeCat = (c, name = "") => {
  const v = (c || name || "").toLowerCase().trim();
  if (!v) return "";
  if (v.startsWith("asset")) return "asset";
  if (v.startsWith("liab")) return "liability";
  if (v.startsWith("equity") || v.startsWith("capital") || v.includes("owner"))
    return "equity";

  // Expenses
  if (
    v.startsWith("exp") || v.includes("expense") ||
    v.includes("rent") || v.includes("salary") || v.includes("salaries") ||
    v.includes("utilities") || v.includes("advertising") || v.includes("depreciation")
  ) return "expense";

  // Revenues
  if (
    v.startsWith("rev") || v.includes("revenue") ||
    v.includes("income") || v.includes("sales") || v.includes("commission")
  ) return "revenue";

  return v;
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

export default function IncomeStatement() {
  const [revenues, setRevenues] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [netIncome, setNetIncome] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  function getPeriodLine() {
    if (!fromDate && !toDate)
      return "For the year ended " + new Date().getFullYear();
    if (fromDate && toDate) return `From ${fromDate} to ${toDate}`;
    if (fromDate) return `From ${fromDate}`;
    if (toDate) return `To ${toDate}`;
    return "";
  }

  const filterAndCalculate = () => {
    const ledgerEntries   = JSON.parse(localStorage.getItem("ledgerEntries")   || "[]");
    const journalEntries  = JSON.parse(localStorage.getItem("journalEntries")  || "[]");
    const receiptEntries  = JSON.parse(localStorage.getItem("receiptEntries")  || "[]");
    const paymentEntries  = JSON.parse(localStorage.getItem("paymentEntries")  || "[]");
    const coa             = JSON.parse(localStorage.getItem("chartOfAccounts") || "{}");

    // --- Journal entries flatten ---
    const journalLines = [];
    (journalEntries || []).forEach((je) => {
      (je.entries || []).forEach((e) => {
        const name = e.account || "";
        journalLines.push({
          account: name,
          debit: e.type === "Debit" ? Number(e.amount) : 0,
          credit: e.type === "Credit" ? Number(e.amount) : 0,
          category: normalizeCat(e.category || coa[name]?.category || "", name),
          date: je.date || "",
        });
      });
    });

    // --- Ledger entries ---
    const normalizedLedger = (ledgerEntries || []).map((le) => {
      const name = le.account || "";
      return {
        account: name,
        debit: Number(le.debit || 0),
        credit: Number(le.credit || 0),
        category: normalizeCat(le.category || coa[name]?.category || "", name),
        date: le.date || "",
      };
    });

    // --- Receipts (usually credit side is revenue) ---
    const receiptLines = (receiptEntries || []).map((r) => {
      const name = r.account || r.creditAccount || "";
      const date = r.receiptDate || r.date || "";
      const amt = Number(r.amount || 0);
      return {
        account: name,
        debit: 0,
        credit: amt,
        category: normalizeCat(r.category || coa[name]?.category || "", name),
        date,
      };
    });

    // --- Payments (usually debit side is expense) ---
    const paymentLines = (paymentEntries || []).map((p) => {
      const name = p.account || p.debitAccount || "";
      const date = p.paymentDate || p.date || "";
      const amt = Number(p.amount || 0);
      return {
        account: name,
        debit: amt,
        credit: 0,
        category: normalizeCat(p.category || coa[name]?.category || "", name),
        date,
      };
    });

    // Merge all + filter by date
    const all = [
      ...normalizedLedger,
      ...journalLines,
      ...receiptLines,
      ...paymentLines
    ].filter((x) => isWithin(x.date, fromDate, toDate));

    // Aggregate
    const revenueMap = new Map();
    const expenseMap = new Map();

    all.forEach((x) => {
      const name = x.account || "";
      const d = Number(x.debit || 0);
      const c = Number(x.credit || 0);
      if (x.category === "revenue") {
        revenueMap.set(name, (revenueMap.get(name) || 0) + (c - d));
      } else if (x.category === "expense") {
        expenseMap.set(name, (expenseMap.get(name) || 0) + (d - c));
      }
    });

    const revenueList = Array.from(revenueMap.entries())
      .map(([k, v]) => ({ description: k, amount: v }))
      .filter((x) => Math.abs(x.amount) > 1e-9)
      .sort((a, b) => a.description.localeCompare(b.description));

    const expenseList = Array.from(expenseMap.entries())
      .map(([k, v]) => ({ description: k, amount: v }))
      .filter((x) => Math.abs(x.amount) > 1e-9)
      .sort((a, b) => a.description.localeCompare(b.description));

    setRevenues(revenueList);
    setExpenses(expenseList);

    const totalRev = revenueList.reduce((sum, r) => sum + r.amount, 0);
    const totalExp = expenseList.reduce((sum, e) => sum + e.amount, 0);
    setTotalRevenue(totalRev);
    setTotalExpense(totalExp);
    setNetIncome(totalRev - totalExp);
  };

  useEffect(() => {
    filterAndCalculate();
    const onStorage = (e) => {
      if (
        e.key === "ledgerEntries" ||
        e.key === "journalEntries" ||
        e.key === "chartOfAccounts" ||
        e.key === "receiptEntries" ||
        e.key === "paymentEntries"
      ) {
        filterAndCalculate();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    filterAndCalculate();
  }, [fromDate, toDate]);

  const revenueRows = useMemo(
    () => revenues.map((r) => [r.description, r.amount.toFixed(2)]),
    [revenues]
  );
  const expenseRows = useMemo(
    () => expenses.map((e) => [e.description, e.amount.toFixed(2)]),
    [expenses]
  );

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Income Statement
      </h2>

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
        reportTitle="Income Statement"
        reportPeriod={getPeriodLine()}
        columns={["Account", "Amount (৳)"]}
        data={[
          ...revenueRows,
          ["Total Revenue", totalRevenue.toFixed(2)],
          ["", ""],
          ...expenseRows,
          ["Total Expense", totalExpense.toFixed(2)],
        ]}
        totals={[]}
        netIncome={netIncome}
        filename="IncomeStatement.pdf"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded shadow md:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Reports</h3>
          <ul className="space-y-2">
            <li>
              <span className="block font-medium text-blue-600">
                Income Statement
              </span>
            </li>
            <li>
              <a
                href="/reports/balance-sheet"
                className="text-gray-600 hover:text-blue-600"
              >
                Balance Sheet
              </a>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-6">
          {/* Revenue Table */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-semibold mb-3">Revenue</h3>
            <table className="w-full text-left border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border-b">Account</th>
                  <th className="p-2 border-b text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 text-gray-700">{item.description}</td>
                    <td className="p-2 text-right text-gray-700">
                      {item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td className="p-2 border-t text-right">Total Revenue</td>
                  <td className="p-2 border-t text-right">
                    {totalRevenue.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Expense Table */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-semibold mb-3">Expenses</h3>
            <table className="w-full text-left border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border-b">Account</th>
                  <th className="p-2 border-b text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 text-gray-700">{item.description}</td>
                    <td className="p-2 text-right text-gray-700">
                      {item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td className="p-2 border-t text-right">Total Expense</td>
                  <td className="p-2 border-t text-right">
                    {totalExpense.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Income */}
          <div className="text-right mt-8 bg-white p-4 rounded shadow text-lg font-semibold text-gray-800">
            Net {netIncome >= 0 ? "Income" : "Loss"}:{" "}
            <span
              className={netIncome >= 0 ? "text-green-600" : "text-red-600"}
            >
              ৳ {Math.abs(netIncome).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
