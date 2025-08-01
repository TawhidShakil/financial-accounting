import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export default function Ledger() {
  const location = useLocation()
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [filteredEntries, setFilteredEntries] = useState([])
  const [selectedAccount, setSelectedAccount] = useState("")
  const [accounts, setAccounts] = useState([])

  // Helper function to get URL search params
  const getSearchParams = () => {
    return new URLSearchParams(location.search)
  }

  useEffect(() => {
    // Read all entries from localStorage
    const savedLedgerEntries = localStorage.getItem("ledgerEntries") || "[]"
    const savedJournalEntries = localStorage.getItem("journalEntries") || "[]"

    const allLedgerEntries = JSON.parse(savedLedgerEntries)
    const journalEntries = JSON.parse(savedJournalEntries)

    // Convert Journal entries from nested structure to Ledger format
    journalEntries.forEach((journalEntry) => {
      if (journalEntry.entries && Array.isArray(journalEntry.entries)) {
        journalEntry.entries.forEach((item) => {
          allLedgerEntries.push({
            date: journalEntry.date,
            account: item.account,
            debit: item.type === "Debit" ? item.amount : 0,
            credit: item.type === "Credit" ? item.amount : 0,
            type: "Journal",
            reference: `Journal-${journalEntry.date}-${item.account}`,
          })
        })
      } else {
        // Handle flat structure if it exists
        allLedgerEntries.push({
          date: journalEntry.date,
          account: journalEntry.debitAccount,
          debit: journalEntry.amount,
          credit: 0,
          type: "Journal",
          reference: `Journal-${journalEntry.date}-${journalEntry.debitAccount}`,
        })

        allLedgerEntries.push({
          date: journalEntry.date,
          account: journalEntry.creditAccount,
          debit: 0,
          credit: journalEntry.amount,
          type: "Journal",
          reference: `Journal-${journalEntry.date}-${journalEntry.creditAccount}`,
        })
      }
    })

    // Sort entries by date and account
    allLedgerEntries.sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.account.localeCompare(b.account)
    })

    setEntries(allLedgerEntries)
    setFilteredEntries(allLedgerEntries)

    // Extract unique accounts for filter dropdown
    const uniqueAccounts = [...new Set(allLedgerEntries.map((entry) => entry.account))].sort()
    setAccounts(uniqueAccounts)

    // Check for URL parameter and set selected account
    const searchParams = getSearchParams()
    const accountParam = searchParams.get("account")
    if (accountParam) {
      const decodedAccount = decodeURIComponent(accountParam)
      // Verify the account exists in our data
      if (uniqueAccounts.includes(decodedAccount)) {
        setSelectedAccount(decodedAccount)
      } else {
        console.warn(`Account "${decodedAccount}" not found in ledger data`)
        // Remove invalid account parameter from URL
        navigate("/ledger", { replace: true })
      }
    }
  }, [location.search, navigate])

  // Filter entries by selected account
  useEffect(() => {
    if (selectedAccount) {
      const accountEntries = entries.filter((entry) => entry.account === selectedAccount)
      setFilteredEntries(accountEntries)
    } else {
      setFilteredEntries(entries)
    }
  }, [selectedAccount, entries])

  // Handle account selection change
  const handleAccountChange = (accountName) => {
    setSelectedAccount(accountName)

    // Update URL parameter
    if (accountName) {
      const encodedAccount = encodeURIComponent(accountName)
      navigate(`/ledger?account=${encodedAccount}`)
    } else {
      navigate("/ledger")
    }
  }

  // Calculate running balance with proper accounting rules
  const entriesWithBalance = filteredEntries.map((entry, index) => {
    const previousEntries = filteredEntries.slice(0, index + 1)
    const totalDebits = previousEntries.reduce((sum, e) => sum + e.debit, 0)
    const totalCredits = previousEntries.reduce((sum, e) => sum + e.credit, 0)

    let balance = 0
    let balanceType = ""

    if (totalDebits > totalCredits) {
      balance = totalDebits - totalCredits
      balanceType = "Dr"
    } else if (totalCredits > totalDebits) {
      balance = totalCredits - totalDebits
      balanceType = "Cr"
    } else {
      balance = 0
      balanceType = ""
    }

    return { ...entry, balance, balanceType }
  })

  const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0)

  // Calculate net balance with proper accounting rules
  let netBalance = 0
  let netBalanceType = ""

  if (totalDebit > totalCredit) {
    netBalance = totalDebit - totalCredit
    netBalanceType = "Dr"
  } else if (totalCredit > totalDebit) {
    netBalance = totalCredit - totalDebit
    netBalanceType = "Cr"
  } else {
    netBalance = 0
    netBalanceType = ""
  }

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this ledger entry?")) {
      const entryToDelete = filteredEntries[index]
      const updatedEntries = entries.filter(
        (entry) =>
          !(
            entry.date === entryToDelete.date &&
            entry.account === entryToDelete.account &&
            entry.debit === entryToDelete.debit &&
            entry.credit === entryToDelete.credit &&
            entry.reference === entryToDelete.reference
          ),
      )

      setEntries(updatedEntries)

      // Only update localStorage for non-Journal entries
      if (entryToDelete.type !== "Journal") {
        const nonJournalEntries = updatedEntries.filter((entry) => entry.type !== "Journal")
        localStorage.setItem("ledgerEntries", JSON.stringify(nonJournalEntries))
      }

      // Update accounts list
      const uniqueAccounts = [...new Set(updatedEntries.map((entry) => entry.account))].sort()
      setAccounts(uniqueAccounts)

      // Reset filter if deleted account was selected and no longer exists
      if (selectedAccount && !uniqueAccounts.includes(selectedAccount)) {
        handleAccountChange("")
      }
    }
  }

  // Group entries by account for display
  const groupedByAccount = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.account]) {
      acc[entry.account] = []
    }
    acc[entry.account].push(entry)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">General Ledger</h1>

        {/* Account Filter */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Account:</label>
            <select
              value={selectedAccount}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>
            {selectedAccount && (
              <button
                onClick={() => handleAccountChange("")}
                className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                title="Clear account filter"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Ledger Display */}
        {Object.keys(groupedByAccount).length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
            <div className="text-lg mb-2">
              {selectedAccount ? `No entries found for "${selectedAccount}".` : "No ledger entries found."}
            </div>
            <div className="text-sm">
              {selectedAccount
                ? "Try selecting a different account."
                : "Create entries using Receipt, Payment, or Journal forms."}
            </div>
          </div>
        ) : selectedAccount ? (
          // Single Account View (when account is selected)
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-gray-200 px-6 py-4 border-b border-gray-300">
              <h3 className="text-xl font-semibold text-gray-800">{selectedAccount}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="w-32 px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="w-32 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit (৳)
                    </th>
                    <th className="w-32 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit (৳)
                    </th>
                    <th className="w-40 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance (৳)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entriesWithBalance.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.date}</td>
                      <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                        {entry.debit > 0 ? `৳ ${entry.debit.toFixed(2)}` : "-"}
                      </td>
                      <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                        {entry.credit > 0 ? `৳ ${entry.credit.toFixed(2)}` : "-"}
                      </td>
                      <td className="w-40 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                        {entry.balance > 0 ? `৳ ${entry.balance.toFixed(2)} ${entry.balanceType}` : "৳ 0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr className="text-sm font-bold">
                    <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-left text-gray-700">
                      Total: {filteredEntries.length}
                    </td>
                    <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-right text-gray-700">
                      ৳ {totalDebit.toFixed(2)}
                    </td>
                    <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-right text-gray-700">
                      ৳ {totalCredit.toFixed(2)}
                    </td>
                    <td className="w-40 px-4 sm:px-6 py-4 whitespace-nowrap text-right font-bold text-gray-600">
                      {netBalance > 0 ? `৳ ${netBalance.toFixed(2)} ${netBalanceType}` : "৳ 0.00"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          // All Accounts Grouped View (default when no account selected)
          <div className="space-y-8">
            {Object.keys(groupedByAccount)
              .sort()
              .map((accountName) => {
                const accountEntries = groupedByAccount[accountName]

                // Calculate running balance for this account
                const accountEntriesWithBalance = accountEntries.map((entry, index) => {
                  const previousEntries = accountEntries.slice(0, index + 1)
                  const totalDebits = previousEntries.reduce((sum, e) => sum + e.debit, 0)
                  const totalCredits = previousEntries.reduce((sum, e) => sum + e.credit, 0)

                  let balance = 0
                  let balanceType = ""

                  if (totalDebits > totalCredits) {
                    balance = totalDebits - totalCredits
                    balanceType = "Dr"
                  } else if (totalCredits > totalDebits) {
                    balance = totalCredits - totalDebits
                    balanceType = "Cr"
                  } else {
                    balance = 0
                    balanceType = ""
                  }

                  return { ...entry, balance, balanceType }
                })

                const accountTotalDebit = accountEntries.reduce((sum, entry) => sum + entry.debit, 0)
                const accountTotalCredit = accountEntries.reduce((sum, entry) => sum + entry.credit, 0)

                // Calculate net balance for this account
                let accountNetBalance = 0
                let accountNetBalanceType = ""

                if (accountTotalDebit > accountTotalCredit) {
                  accountNetBalance = accountTotalDebit - accountTotalCredit
                  accountNetBalanceType = "Dr"
                } else if (accountTotalCredit > accountTotalDebit) {
                  accountNetBalance = accountTotalCredit - accountTotalDebit
                  accountNetBalanceType = "Cr"
                } else {
                  accountNetBalance = 0
                  accountNetBalanceType = ""
                }

                return (
                  <div key={accountName} className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="bg-gray-200 px-6 py-4 border-b border-gray-300">
                      <h3 className="text-xl font-semibold text-gray-800">{accountName}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 table-fixed">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="w-32 px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="w-32 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Debit (৳)
                            </th>
                            <th className="w-32 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Credit (৳)
                            </th>
                            <th className="w-40 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Balance (৳)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {accountEntriesWithBalance.map((entry, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {entry.date}
                              </td>
                              <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                                {entry.debit > 0 ? `৳ ${entry.debit.toFixed(2)}` : "-"}
                              </td>
                              <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                                {entry.credit > 0 ? `৳ ${entry.credit.toFixed(2)}` : "-"}
                              </td>
                              <td className="w-40 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                                {entry.balance > 0 ? `৳ ${entry.balance.toFixed(2)} ${entry.balanceType}` : "৳ 0.00"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                          <tr className="text-sm font-bold">
                            <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-left text-gray-700">
                              Total: {accountEntries.length}
                            </td>
                            <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-right text-gray-700">
                              ৳ {accountTotalDebit.toFixed(2)}
                            </td>
                            <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-right text-gray-700">
                              ৳ {accountTotalCredit.toFixed(2)}
                            </td>
                            <td className="w-40 px-4 sm:px-6 py-4 whitespace-nowrap text-right font-bold text-gray-700">
                              {accountNetBalance > 0
                                ? `৳ ${accountNetBalance.toFixed(2)} ${accountNetBalanceType}`
                                : "৳ 0.00"}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
