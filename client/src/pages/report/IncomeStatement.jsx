import { useEffect, useState } from "react";
import DateRangeFilter from "../../components/DateRangeFilter";
import ReportPDFDownloader from "../../components/ReportPDFDownloader";

export default function IncomeStatement() {
    const [revenues, setRevenues] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [netIncome, setNetIncome] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);

    // Date filter state
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // For PDF: format date period line
    function getPeriodLine() {
        if (!fromDate && !toDate) return "For the year ended " + new Date().getFullYear();
        if (fromDate && toDate) return `From ${fromDate} to ${toDate}`;
        if (fromDate) return `From ${fromDate}`;
        if (toDate) return `To ${toDate}`;
        return "";
    }

    // Filter logic
    const filterAndCalculate = () => {
        const ledgerEntries = JSON.parse(localStorage.getItem("ledgerEntries")) || [];
        const journalEntries = JSON.parse(localStorage.getItem("journalEntries")) || [];

        const allEntries = [...ledgerEntries];

        // Flatten journal entries
        journalEntries.forEach((entry) => {
            if (Array.isArray(entry.entries)) {
                entry.entries.forEach((e) => {
                    const name = (e.account || '').toLowerCase();
                    let category = e.category || "";
                    if (!category) {
                        if (
                            entry.source === "receipt" &&
                            (name.includes("client") || name.includes("mr.") || name.includes("income") || name.includes("sales"))
                        ) {
                            category = "revenue";
                        } else if (
                            entry.source === "payment" &&
                            (name.includes("rent") || name.includes("salary") || name.includes("expense") || name.includes("bill") || name.includes("stationary"))
                        ) {
                            category = "expense";
                        }
                    }
                    allEntries.push({
                        account: e.account,
                        debit: e.type === "Debit" ? parseFloat(e.amount) : 0,
                        credit: e.type === "Credit" ? parseFloat(e.amount) : 0,
                        category: category,
                        date: entry.date || "",
                    });
                });
            }
        });

        // Filter by date range if dates selected
        const filteredEntries = allEntries.filter(entry => {
            if (!entry.date) return true;
            if (fromDate && entry.date < fromDate) return false;
            if (toDate && entry.date > toDate) return false;
            return true;
        });

        const revenueAccounts = {};
        const expenseAccounts = {};

        filteredEntries.forEach((entry) => {
            const name = entry.account?.toLowerCase() || "";
            const amount =
                typeof entry.amount === "number"
                    ? entry.amount
                    : entry.debit
                        ? parseFloat(entry.debit)
                        : entry.credit
                            ? parseFloat(entry.credit)
                            : 0;
            const category = (entry.category || "").toLowerCase();
            if (
                category === "revenue" ||
                name.includes("revenue") ||
                name.includes("income") ||
                name.includes("sales")
            ) {
                revenueAccounts[entry.account] = (revenueAccounts[entry.account] || 0) + amount;
            } else if (
                category === "expense" ||
                name.includes("expense") ||
                name.includes("salary") ||
                name.includes("rent") ||
                name.includes("utility")
            ) {
                expenseAccounts[entry.account] = (expenseAccounts[entry.account] || 0) + amount;
            }
        });

        const revenueList = Object.entries(revenueAccounts).map(([k, v]) => ({ description: k, amount: v }));
        const expenseList = Object.entries(expenseAccounts).map(([k, v]) => ({ description: k, amount: v }));

        setRevenues(revenueList);
        setExpenses(expenseList);

        const totalRev = revenueList.reduce((sum, r) => sum + r.amount, 0);
        const totalExp = expenseList.reduce((sum, e) => sum + e.amount, 0);
        setNetIncome(totalRev - totalExp);
        setTotalRevenue(totalRev);
        setTotalExpense(totalExp);
    };

    // Auto refresh every 1s if date filter changes
    useEffect(() => {
        const interval = setInterval(() => {
            filterAndCalculate();
        }, 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line
    }, [fromDate, toDate]);

    // Run once on mount
    useEffect(() => { filterAndCalculate(); }, []);

    // Combine all rows for PDF
    const revenueRows = revenues.map(r => [r.description, r.amount.toFixed(2)]);
    const expenseRows = expenses.map(e => [e.description, e.amount.toFixed(2)]);

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Income Statement</h2>

            {/* Use reusable date filter */}
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

            {/* Download PDF button */}
            <ReportPDFDownloader
                companyName="NextFin"
                reportTitle="Income Statement"
                reportPeriod={getPeriodLine()}
                columns={["Account", "Amount (৳)"]}
                // merging revenue, total, then expense, total (with empty row in between)
                data={[
                    ...revenueRows,
                    ["Total Revenue", totalRevenue.toFixed(2)],
                    ["", ""], // Empty row between
                    ...expenseRows,
                    ["Total Expense", totalExpense.toFixed(2)]
                ]}
                totals={[]} // not using foot for now
                netIncome={netIncome}
                filename="IncomeStatement.pdf"
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-4 rounded shadow md:col-span-1">
                    <h3 className="text-lg font-semibold mb-4">Reports</h3>
                    <ul className="space-y-2">
                        <li>
                            <span className="block font-medium text-blue-600">Income Statement</span>
                        </li>
                        <li>
                            <a href="/reports/balance-sheet" className="text-gray-600 hover:text-blue-600">Balance Sheet</a>
                        </li>
                    </ul>
                </div>

                <div className="md:col-span-3 space-y-6">
                    {/* Revenue */}
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
                                        <td className="p-2 text-right text-gray-700">{item.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {/* Total Revenue Row */}
                                <tr className="bg-gray-100 font-semibold">
                                    <td className="p-2 border-t text-right">Total Revenue</td>
                                    <td className="p-2 border-t text-right">{totalRevenue.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Expenses */}
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
                                        <td className="p-2 text-right text-gray-700">{item.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {/* Total Expense Row */}
                                <tr className="bg-gray-100 font-semibold">
                                    <td className="p-2 border-t text-right">Total Expense</td>
                                    <td className="p-2 border-t text-right">{totalExpense.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="text-right mt-8 bg-white p-4 rounded shadow text-lg font-semibold text-gray-800">
                        Net {netIncome >= 0 ? "Income" : "Loss"}:{" "}
                        <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                            ৳ {Math.abs(netIncome).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
