import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import * as XLSX from "xlsx"
import DateRangeFilter from "../components/DateRangeFilter"
import ReportPDFDownloader from "../components/ReportPDFDownloader"

export default function TrialBalance() {
  const navigate = useNavigate()
  const [accountBalances, setAccountBalances] = useState([])
  const [totalDebits, setTotalDebits] = useState(0)
  const [totalCredits, setTotalCredits] = useState(0)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [showExportMenu, setShowExportMenu] = useState(false) // kept if you still want dropdown; not required

  const getAccountType = (accountName) => {
    const account = accountName.toLowerCase()

    if (
      account.includes("cash") ||
      account.includes("bank") ||
      account.includes("receivable") ||
      account.includes("inventory") ||
      account.includes("equipment") ||
      account.includes("building") ||
      account.includes("land") ||
      account.includes("prepaid") ||
      account.includes("advance to")
    ) return "asset"

    if (
      account.includes("expense") ||
      account.includes("cost") ||
      account.includes("salary") ||
      account.includes("rent") ||
      account.includes("utility") ||
      account.includes("travel") ||
      account.includes("marketing") ||
      account.includes("insurance") ||
      account.includes("maintenance") ||
      account.includes("professional fees") ||
      account.includes("interest expense")
    ) return "expense"

    if (
      account.includes("payable") ||
      account.includes("loan") ||
      account.includes("advance from") ||
      account.includes("liability") ||
      account.includes("notes payable")
    ) return "liability"

    if (
      account.includes("revenue") ||
      account.includes("income") ||
      account.includes("sales") ||
      account.includes("service") ||
      account.includes("commission") ||
      account.includes("dividend income") ||
      account.includes("rent income") ||
      account.includes("interest income")
    ) return "revenue"

    if (account.includes("capital") || account.includes("equity") || account.includes("retained earnings"))
      return "capital"

    return "asset"
  }

  const handleAccountClick = (accountName) => {
    const encodedAccountName = encodeURIComponent(accountName)
    navigate(`/ledger?account=${encodedAccountName}`)
  }

  useEffect(() => {
    const savedLedgerEntries = localStorage.getItem("ledgerEntries") || "[]"
    const savedJournalEntries = localStorage.getItem("journalEntries") || "[]"

    const allLedgerEntries = JSON.parse(savedLedgerEntries)
    const journalEntries = JSON.parse(savedJournalEntries)

    // Filter: journal
    const filteredJournalEntries = journalEntries.filter((entry) => {
      if (!fromDate && !toDate) return true
      const entryDate = new Date(entry.date)
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(toDate) : null
      if (from && entryDate < from) return false
      if (to && entryDate > to) return false
      return true
    })

    // Filter: ledger
    const filteredLedgerEntries = allLedgerEntries.filter((entry) => {
      if (!fromDate && !toDate) return true
      const entryDate = new Date(entry.date)
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(toDate) : null
      if (from && entryDate < from) return false
      if (to && entryDate > to) return false
      return true
    })

    // Normalize journal into ledger-like rows
    filteredJournalEntries.forEach((journalEntry) => {
      if (journalEntry.entries && Array.isArray(journalEntry.entries)) {
        journalEntry.entries.forEach((item) => {
          filteredLedgerEntries.push({
            date: journalEntry.date,
            account: item.account,
            debit: item.type === "Debit" ? Number(item.amount) || 0 : 0,
            credit: item.type === "Credit" ? Number(item.amount) || 0 : 0,
            type: "Journal",
          })
        })
      } else {
        filteredLedgerEntries.push({
          date: journalEntry.date,
          account: journalEntry.debitAccount,
          debit: Number(journalEntry.amount) || 0,
          credit: 0,
          type: "Journal",
        })
        filteredLedgerEntries.push({
          date: journalEntry.date,
          account: journalEntry.creditAccount,
          debit: 0,
          credit: Number(journalEntry.amount) || 0,
          type: "Journal",
        })
      }
    })

    // Group by account
    const accountMap = {}
    filteredLedgerEntries.forEach((entry) => {
      if (!entry.account) return
      if (!accountMap[entry.account]) {
        accountMap[entry.account] = {
          account: entry.account,
          totalDebits: 0,
          totalCredits: 0,
          balance: 0,
          balanceType: "",
        }
      }
      accountMap[entry.account].totalDebits += Number(entry.debit) || 0
      accountMap[entry.account].totalCredits += Number(entry.credit) || 0
    })

    // Compute balances
    const balances = Object.values(accountMap)
      .map((account) => {
        if (account.totalDebits > account.totalCredits) {
          account.balance = account.totalDebits - account.totalCredits
          account.balanceType = "Dr"
        } else if (account.totalCredits > account.totalDebits) {
          account.balance = account.totalCredits - account.totalDebits
          account.balanceType = "Cr"
        } else {
          account.balance = 0
          account.balanceType = ""
        }
        account.accountType = getAccountType(account.account)
        return account
      })
      .filter((account) => account.balance > 0)
      .sort((a, b) => a.account.localeCompare(b.account))

    setAccountBalances(balances)

    const debitTotal = balances
      .filter((a) => a.balanceType === "Dr")
      .reduce((sum, a) => sum + a.balance, 0)

    const creditTotal = balances
      .filter((a) => a.balanceType === "Cr")
      .reduce((sum, a) => sum + a.balance, 0)

    setTotalDebits(debitTotal)
    setTotalCredits(creditTotal)
  }, [fromDate, toDate])

  const fmt = (n) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "-"

  // PDF (via ReportPDFDownloader) – shape props
  const pdfColumns = ["Account", "Debit (৳)", "Credit (৳)"]
  const pdfData = accountBalances.map((a) => [
    a.account,
    a.balanceType === "Dr" ? a.balance.toFixed(2) : "-",
    a.balanceType === "Cr" ? a.balance.toFixed(2) : "-",
  ])
  const pdfTotals = ["Total", totalDebits.toFixed(2), totalCredits.toFixed(2)]
  const reportPeriod =
    fromDate || toDate ? `Period: ${fromDate || "Beginning"} to ${toDate || "End"}` : ""

  // Excel export
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    const wsData = [
      pdfColumns,
      ...pdfData,
      pdfTotals,
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Trial Balance")
    XLSX.writeFile(wb, "trial_balance.xlsx")
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">Trial Balance</h1>

        {/* Date filter using reusable component */}
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onChange={({ from, to }) => {
            setFromDate(from || "")
            setToDate(to || "")
          }}
          onClear={() => {
            setFromDate("")
            setToDate("")
          }}
        />

        {/* Export buttons */}
        <div className="flex justify-end items-center gap-3 mb-6">
          <ReportPDFDownloader
            companyName="NextFin"
            reportTitle="Trial Balance"
            reportPeriod={reportPeriod}
            columns={pdfColumns}
            data={pdfData}
            totals={pdfTotals}
            netIncome={null}
            filename="trial_balance.pdf"
          />
          <button
            onClick={exportToExcel}
            className="p-2 mb-6 bg-green-600 text-white rounded shadow hover:bg-green-700 transition text-sm"
            title="Download as Excel"
          >
            Excel
          </button>
        </div>

        {accountBalances.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
            <div className="text-lg mb-2">No account balances found for the selected period.</div>
            <div className="text-sm">
              Try adjusting the date range or create entries using Receipt, Payment, or Journal forms.
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Debit Balance (৳)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                      Credit Balance (৳)
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {accountBalances.map((account, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td
                        className="px-6 py-4 text-sm font-medium cursor-pointer text-gray-600 hover:text-gray-800"
                        onClick={() => handleAccountClick(account.account)}
                        title={`Click to view ${account.account} ledger`}
                      >
                        {account.account}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {account.balanceType === "Dr" ? `৳ ${account.balance.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {account.balanceType === "Cr" ? `৳ ${account.balance.toFixed(2)}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* double underline only under the amount width */}
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr className="text-sm font-bold">
                    <td className="px-6 py-4 text-left text-gray-700">Total</td>

                    {/* Debit Total */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`inline-block border-b-4 border-double ${totalDebits < 0 ? "border-red-600 text-red-600" : "border-black text-gray-900"
                          }`}
                        style={{ paddingBottom: "2px" }}
                      >
                        ৳ {fmt(totalDebits)}
                      </span>
                    </td>

                    {/* Credit Total */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`inline-block border-b-4 border-double ${totalCredits < 0 ? "border-red-600 text-red-600" : "border-black text-gray-900"
                          }`}
                        style={{ paddingBottom: "2px" }}
                      >
                        ৳ {fmt(totalCredits)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
