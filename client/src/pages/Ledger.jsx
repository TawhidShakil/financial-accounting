"use client"

import { useState, useEffect } from "react"

export default function Ledger() {
  const [entries, setEntries] = useState([])
  const [filteredEntries, setFilteredEntries] = useState([])
  const [selectedAccount, setSelectedAccount] = useState("")
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    // Read ledger entries from localStorage
    const savedEntries = localStorage.getItem("ledgerEntries")
    if (savedEntries) {
      const ledgerEntries = JSON.parse(savedEntries)
      setEntries(ledgerEntries)
      setFilteredEntries(ledgerEntries)

      // Extract unique accounts for filter dropdown
      const uniqueAccounts = [...new Set(ledgerEntries.map((entry) => entry.account))].sort()
      setAccounts(uniqueAccounts)
    }
  }, [])

  // Filter entries by selected account
  useEffect(() => {
    if (selectedAccount) {
      setFilteredEntries(entries.filter((entry) => entry.account === selectedAccount))
    } else {
      setFilteredEntries(entries)
    }
  }, [selectedAccount, entries])

  // Calculate running balance for filtered entries
  const entriesWithBalance = filteredEntries.map((entry, index) => {
    const previousEntries = filteredEntries.slice(0, index + 1)
    const balance = previousEntries.reduce((sum, e) => sum + e.debit - e.credit, 0)
    return { ...entry, balance }
  })

  const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0)
  const netBalance = totalDebit - totalCredit

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
      localStorage.setItem("ledgerEntries", JSON.stringify(updatedEntries))

      // Update accounts list
      const uniqueAccounts = [...new Set(updatedEntries.map((entry) => entry.account))].sort()
      setAccounts(uniqueAccounts)

      // Reset filter if deleted account was selected and no longer exists
      if (selectedAccount && !uniqueAccounts.includes(selectedAccount)) {
        setSelectedAccount("")
      }
    }
  }

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
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
            <div className="text-lg mb-2">
              {selectedAccount ? `No entries found for "${selectedAccount}".` : "No ledger entries found."}
            </div>
            <div className="text-sm">
              {selectedAccount
                ? "Try selecting a different account."
                : "Create entries using Receipt or Payment forms."}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-24 px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="w-40 px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="w-48 px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="w-20 px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="w-24 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="w-24 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="w-24 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entriesWithBalance.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                      <td className="w-40 px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="truncate" title={entry.account}>
                          {entry.account}
                        </div>
                      </td>
                      <td className="w-48 px-4 sm:px-6 py-4 text-sm text-gray-500">
                        <div className="truncate" title={entry.description}>
                          {entry.description || "-"}
                        </div>
                      </td>
                      <td className="w-20 px-4 sm:px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.type === "Receipt"
                              ? "bg-green-100 text-green-800"
                              : entry.type === "Payment"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {entry.debit > 0 ? `৳ ${entry.debit.toFixed(2)}` : "-"}
                      </td>
                      <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {entry.credit > 0 ? `৳ ${entry.credit.toFixed(2)}` : "-"}
                      </td>
                      <td
                        className={`w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                          entry.balance >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ৳ {entry.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Summary Footer - PART OF THE SAME TABLE */}
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr className="text-sm font-bold">
                    <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-left text-gray-700">
                      Total: {filteredEntries.length}
                    </td>
                    <td className="w-40 px-4 sm:px-6 py-4"></td>
                    <td className="w-48 px-4 sm:px-6 py-4"></td>
                    <td className="w-20 px-4 sm:px-6 py-4"></td>
                    <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-right text-gray-700">
                      ৳ {totalDebit.toFixed(2)}
                    </td>
                    <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-right text-gray-700">
                      ৳ {totalCredit.toFixed(2)}
                    </td>
                    <td
                      className={`w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-right font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      ৳ {netBalance.toFixed(2)}
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
