import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

export default function TrialBalance() {
  const navigate = useNavigate()
  const [accountBalances, setAccountBalances] = useState([])
  const [totalDebits, setTotalDebits] = useState(0)
  const [totalCredits, setTotalCredits] = useState(0)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Account type classification
  const getAccountType = (accountName) => {
    const account = accountName.toLowerCase()

    // Asset accounts
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
    ) {
      return "asset"
    }

    // Expense accounts
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
    ) {
      return "expense"
    }

    // Liability accounts
    if (
      account.includes("payable") ||
      account.includes("loan") ||
      account.includes("advance from") ||
      account.includes("liability") ||
      account.includes("notes payable")
    ) {
      return "liability"
    }

    // Revenue accounts
    if (
      account.includes("revenue") ||
      account.includes("income") ||
      account.includes("sales") ||
      account.includes("service") ||
      account.includes("commission") ||
      account.includes("dividend income") ||
      account.includes("rent income") ||
      account.includes("interest income")
    ) {
      return "revenue"
    }

    // Capital accounts
    if (account.includes("capital") || account.includes("equity") || account.includes("retained earnings")) {
      return "capital"
    }

    // Default to asset if unknown
    return "asset"
  }

  // Check if balance is abnormal for the account type
  const isAbnormalBalance = (accountName, balanceType) => {
    const accountType = getAccountType(accountName)

    // Asset and Expense should normally be Debit
    if ((accountType === "asset" || accountType === "expense") && balanceType === "Cr") {
      return true
    }

    // Liability, Revenue, and Capital should normally be Credit
    if (
      (accountType === "liability" || accountType === "revenue" || accountType === "capital") &&
      balanceType === "Dr"
    ) {
      return true
    }

    return false
  }

  // Handle account click - navigate to ledger with account parameter
  const handleAccountClick = (accountName) => {
    const encodedAccountName = encodeURIComponent(accountName)
    navigate(`/ledger?account=${encodedAccountName}`)
  }

  useEffect(() => {
    // Read all entries from localStorage
    const savedLedgerEntries = localStorage.getItem("ledgerEntries") || "[]"
    const savedJournalEntries = localStorage.getItem("journalEntries") || "[]"

    const allLedgerEntries = JSON.parse(savedLedgerEntries)
    const journalEntries = JSON.parse(savedJournalEntries)

    // Apply date filtering to journal entries
    const filteredJournalEntries = journalEntries.filter((entry) => {
      if (!fromDate && !toDate) return true
      const entryDate = new Date(entry.date)
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(toDate) : null

      if (from && entryDate < from) return false
      if (to && entryDate > to) return false
      return true
    })

    // Apply date filtering to ledger entries
    const filteredLedgerEntries = allLedgerEntries.filter((entry) => {
      if (!fromDate && !toDate) return true
      const entryDate = new Date(entry.date)
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(toDate) : null

      if (from && entryDate < from) return false
      if (to && entryDate > to) return false
      return true
    })

    // Convert Journal entries from nested structure to Ledger format
    filteredJournalEntries.forEach((journalEntry) => {
      if (journalEntry.entries && Array.isArray(journalEntry.entries)) {
        journalEntry.entries.forEach((item) => {
          filteredLedgerEntries.push({
            date: journalEntry.date,
            account: item.account,
            debit: item.type === "Debit" ? item.amount : 0,
            credit: item.type === "Credit" ? item.amount : 0,
            type: "Journal",
          })
        })
      } else {
        // Handle flat structure if it exists
        filteredLedgerEntries.push({
          date: journalEntry.date,
          account: journalEntry.debitAccount,
          debit: journalEntry.amount,
          credit: 0,
          type: "Journal",
        })

        filteredLedgerEntries.push({
          date: journalEntry.date,
          account: journalEntry.creditAccount,
          debit: 0,
          credit: journalEntry.amount,
          type: "Journal",
        })
      }
    })

    // Group entries by account and calculate balances
    const accountMap = {}

    filteredLedgerEntries.forEach((entry) => {
      if (!accountMap[entry.account]) {
        accountMap[entry.account] = {
          account: entry.account,
          totalDebits: 0,
          totalCredits: 0,
          balance: 0,
          balanceType: "",
        }
      }

      accountMap[entry.account].totalDebits += entry.debit
      accountMap[entry.account].totalCredits += entry.credit
    })

    // Calculate net balances with proper accounting rules
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

        // Add account type and abnormal balance flag
        account.accountType = getAccountType(account.account)
        account.isAbnormal = isAbnormalBalance(account.account, account.balanceType)

        return account
      })
      .filter((account) => account.balance > 0) // Only show accounts with balances

    // Sort accounts alphabetically
    balances.sort((a, b) => a.account.localeCompare(b.account))

    setAccountBalances(balances)

    // Calculate totals for trial balance
    const debitTotal = balances
      .filter((account) => account.balanceType === "Dr")
      .reduce((sum, account) => sum + account.balance, 0)

    const creditTotal = balances
      .filter((account) => account.balanceType === "Cr")
      .reduce((sum, account) => sum + account.balance, 0)

    setTotalDebits(debitTotal)
    setTotalCredits(creditTotal)
  }, [fromDate, toDate])

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Trial Balance", 14, 16)

    if (fromDate || toDate) {
      doc.setFontSize(12)
      doc.text(`Period: ${fromDate || "Beginning"} to ${toDate || "End"}`, 14, 26)
    }

    autoTable(doc, {
      startY: fromDate || toDate ? 30 : 20,
      head: [["Account", "Debit (৳)", "Credit (৳)"]],
      body: accountBalances.map((account) => [
        account.account,
        account.balanceType === "Dr" ? account.balance.toFixed(2) : "-",
        account.balanceType === "Cr" ? account.balance.toFixed(2) : "-",
      ]),
      foot: [["Total", totalDebits.toFixed(2), totalCredits.toFixed(2)]],
    })
    doc.save("trial_balance.pdf")
  }

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    const wsData = [
      ["Account", "Debit (৳)", "Credit (৳)"],
      ...accountBalances.map((account) => [
        account.account,
        account.balanceType === "Dr" ? account.balance.toFixed(2) : "-",
        account.balanceType === "Cr" ? account.balance.toFixed(2) : "-",
      ]),
      ["Total", totalDebits.toFixed(2), totalCredits.toFixed(2)],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Trial Balance")
    XLSX.writeFile(wb, "trial_balance.xlsx")
  }

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Trial Balance</h1>

        {/* Date Filter and Export Controls */}
        <div className="flex justify-between flex-wrap items-end gap-4 mb-6">
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-1">From:</label>
              <input
                type="date"
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-1">To:</label>
              <input
                type="date"
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="relative inline-block text-left">
            <button
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="flex items-center gap-2 bg-ray-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              <span>Export</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-white" viewBox="0 0 20 20">
                <path d="M5.25 7.5l4.25 4.25 4.25-4.25" />
              </svg>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    exportToPDF()
                    setShowExportMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 transition-colors"
                >
                  <span className="text-sm">📄 PDF</span>
                </button>
                <button
                  onClick={() => {
                    exportToExcel()
                    setShowExportMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 transition-colors"
                >
                  <span className="text-sm">📊 Excel</span>
                </button>
              </div>
            )}
          </div>
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
                        className={`px-6 py-4 text-sm font-medium cursor-pointer  ${
                          account.isAbnormal ? "text-red-600 hover:text-red-800" : "text-gray-600 hover:text-gray-800"
                        }`}
                        onClick={() => handleAccountClick(account.account)}
                        title={`Click to view ${account.account} ledger`}
                      >
                        {account.account}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          account.balanceType === "Dr" && account.isAbnormal ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {account.balanceType === "Dr" ? `৳ ${account.balance.toFixed(2)}` : "-"}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          account.balanceType === "Cr" && account.isAbnormal ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {account.balanceType === "Cr" ? `৳ ${account.balance.toFixed(2)}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr className="text-sm font-bold">
                    <td className="px-6 py-4 text-left text-gray-700">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">৳ {totalDebits.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                      ৳ {totalCredits.toFixed(2)}
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
