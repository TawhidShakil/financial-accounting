"use client"

import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export default function Ledger() {
  const location = useLocation()
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [filteredEntries, setFilteredEntries] = useState([])
  const [selectedAccount, setSelectedAccount] = useState("")
  const [accounts, setAccounts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [filteredAccounts, setFilteredAccounts] = useState([])

  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Helper function to get URL search params
  const getSearchParams = () => {
    return new URLSearchParams(location.search)
  }

  useEffect(() => {
    // Read all entries from localStorage
    const savedLedgerEntries = localStorage.getItem("ledgerEntries") || "[]"
    const savedJournalEntries = localStorage.getItem("journalEntries") || "[]"
    const savedReceiptEntries = localStorage.getItem("receiptEntries") || "[]"
    const savedPaymentEntries = localStorage.getItem("paymentEntries") || "[]"

    // Parse the data
    const oldLedgerEntries = JSON.parse(savedLedgerEntries)
    const journalEntries = JSON.parse(savedJournalEntries)
    const receiptEntries = JSON.parse(savedReceiptEntries)
    const paymentEntries = JSON.parse(savedPaymentEntries)

    // Filter out old Receipt and Payment entries from savedLedgerEntries to avoid duplicates
    const filteredLedgerEntries = oldLedgerEntries.filter(
      (entry) => entry.type !== "Receipt" && entry.type !== "Payment",
    )

    const allLedgerEntries = [...filteredLedgerEntries]

    // Process Receipt entries to add particulars
    receiptEntries.forEach((receiptEntry) => {
      // Debit entry (Receipt account) - particulars is the credit account
      allLedgerEntries.push({
        date: receiptEntry.date,
        account: receiptEntry.receipt,
        debit: receiptEntry.amount,
        credit: 0,
        description: receiptEntry.description || "",
        type: "Receipt",
        reference: `Receipt-${receiptEntry.date}-${receiptEntry.receipt}`,
        particulars: receiptEntry.account, // The credit account
      })

      // Credit entry (Account) - particulars is the receipt account
      allLedgerEntries.push({
        date: receiptEntry.date,
        account: receiptEntry.account,
        debit: 0,
        credit: receiptEntry.amount,
        description: receiptEntry.description || "",
        type: "Receipt",
        reference: `Receipt-${receiptEntry.date}-${receiptEntry.account}`,
        particulars: receiptEntry.receipt, // The debit account
      })
    })

    // Process Payment entries to add particulars
    paymentEntries.forEach((paymentEntry) => {
      // Debit entry (Account) - particulars is the payment account
      allLedgerEntries.push({
        date: paymentEntry.date,
        account: paymentEntry.account,
        debit: paymentEntry.amount,
        credit: 0,
        description: paymentEntry.description || "",
        type: "Payment",
        reference: `Payment-${paymentEntry.date}-${paymentEntry.account}`,
        particulars: paymentEntry.payment, // The credit account
      })

      // Credit entry (Payment account) - particulars is the debit account
      allLedgerEntries.push({
        date: paymentEntry.date,
        account: paymentEntry.payment,
        debit: 0,
        credit: paymentEntry.amount,
        description: paymentEntry.description || "",
        type: "Payment",
        reference: `Payment-${paymentEntry.date}-${paymentEntry.payment}`,
        particulars: paymentEntry.account, // The debit account
      })
    })

    // Convert Journal entries from nested structure to Ledger format with particulars
    journalEntries.forEach((journalEntry) => {
      if (journalEntry.entries && Array.isArray(journalEntry.entries)) {
        const debitEntries = journalEntry.entries.filter((entry) => entry.type === "Debit")
        const creditEntries = journalEntry.entries.filter((entry) => entry.type === "Credit")

        // For each debit entry, show all credit accounts as particulars
        debitEntries.forEach((debitEntry) => {
          const creditAccounts = creditEntries.map((ce) => ce.account).join(", ")
          allLedgerEntries.push({
            date: journalEntry.date,
            account: debitEntry.account,
            debit: debitEntry.amount,
            credit: 0,
            description: journalEntry.description || "",
            type: "Journal",
            reference: `Journal-${journalEntry.date}-${debitEntry.account}`,
            particulars: creditAccounts,
          })
        })

        // For each credit entry, show all debit accounts as particulars
        creditEntries.forEach((creditEntry) => {
          const debitAccounts = debitEntries.map((de) => de.account).join(", ")
          allLedgerEntries.push({
            date: journalEntry.date,
            account: creditEntry.account,
            debit: 0,
            credit: creditEntry.amount,
            description: journalEntry.description || "",
            type: "Journal",
            reference: `Journal-${journalEntry.date}-${creditEntry.account}`,
            particulars: debitAccounts,
          })
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

  // Filter accounts based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredAccounts(accounts)
    } else {
      const filtered = accounts.filter((account) => account.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredAccounts(filtered)
    }
    setHighlightedIndex(-1)
  }, [searchTerm, accounts])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter entries by selected account
  useEffect(() => {
    if (selectedAccount) {
      const accountEntries = entries.filter((entry) => entry.account === selectedAccount)
      setFilteredEntries(accountEntries)
    } else {
      setFilteredEntries(entries)
    }
  }, [selectedAccount, entries])

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowSuggestions(true)

    // If exact match found, select it
    const exactMatch = accounts.find((account) => account.toLowerCase() === value.toLowerCase())
    if (exactMatch && exactMatch !== selectedAccount) {
      handleAccountChange(exactMatch)
    } else if (value === "" && selectedAccount) {
      handleAccountChange("")
    }
  }

  // Handle search input focus
  const handleSearchFocus = () => {
    setShowSuggestions(true)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filteredAccounts.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredAccounts.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredAccounts[highlightedIndex]) {
          selectAccount(filteredAccounts[highlightedIndex])
        } else if (filteredAccounts.length === 1) {
          selectAccount(filteredAccounts[0])
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        searchInputRef.current?.blur()
        break
    }
  }

  // Handle account selection from suggestions
  const selectAccount = (accountName) => {
    handleAccountChange(accountName)
    setSearchTerm(accountName)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    searchInputRef.current?.blur()
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm("")
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    handleAccountChange("")
    searchInputRef.current?.focus()
  }

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

        {/* Account Search Filter */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-full max-w-md" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Search & Filter by Account
            </label>

            {/* Search Input */}
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Type to search accounts..."
                autoComplete="off"
              />

              {/* Search Icon */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {searchTerm ? (
                  <button
                    onClick={handleClearSearch}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    title="Clear search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredAccounts.length > 0 ? (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                      {filteredAccounts.length} account{filteredAccounts.length !== 1 ? "s" : ""} found
                    </div>
                    {filteredAccounts.map((account, index) => (
                      <div
                        key={account}
                        onClick={() => selectAccount(account)}
                        className={`px-4 py-2 cursor-pointer transition-colors ${
                          index === highlightedIndex
                            ? "bg-blue-100 text-blue-900"
                            : selectedAccount === account
                              ? "bg-green-50 text-green-800 font-medium"
                              : "hover:bg-gray-100 text-gray-900"
                        }`}
                      >
                        <span
                          dangerouslySetInnerHTML={{
                            __html: searchTerm
                              ? account.replace(
                                  new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
                                  '<mark class="bg-yellow-200 font-medium">$1</mark>',
                                )
                              : account,
                          }}
                        />
                        {selectedAccount === account && <span className="ml-2 text-green-600">✓</span>}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-center">No accounts found for "{searchTerm}"</div>
                )}

                {/* Show All Accounts Option */}
                {searchTerm && (
                  <div className="border-t border-gray-200">
                    <div
                      onClick={() => {
                        setSearchTerm("")
                        handleAccountChange("")
                        setShowSuggestions(false)
                      }}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-blue-600 font-medium text-center"
                    >
                      Show All Accounts
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected Account Info */}
            {selectedAccount && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-sm text-gray-600">Showing:</span>
                <span className="text-sm font-medium text-blue-600">{selectedAccount}</span>
                <button onClick={handleClearSearch} className="text-sm text-red-600 hover:text-red-800 underline">
                  Clear
                </button>
              </div>
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
                    <th className="w-24 px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="w-40 px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="w-24 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit (৳)
                    </th>
                    <th className="w-24 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit (৳)
                    </th>
                    <th className="w-32 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance (৳)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entriesWithBalance.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.date}</td>
                      <td className="w-40 px-4 sm:px-6 py-4 text-sm text-gray-700">
                        <div className="max-w-xs truncate" title={entry.particulars}>
                          {entry.particulars || "-"}
                        </div>
                      </td>
                      <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                        {entry.debit > 0 ? `৳ ${entry.debit.toFixed(2)}` : "-"}
                      </td>
                      <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                        {entry.credit > 0 ? `৳ ${entry.credit.toFixed(2)}` : "-"}
                      </td>
                      <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                        {entry.balance > 0 ? `৳ ${entry.balance.toFixed(2)} ${entry.balanceType}` : "৳ 0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr className="text-sm font-bold">
                    <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-left text-gray-700">
                      Total: {filteredEntries.length}
                    </td>
                    <td className="w-40 px-4 sm:px-6 py-4"></td>
                    <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-right text-gray-700">
                      ৳ {totalDebit.toFixed(2)}
                    </td>
                    <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-right text-gray-700">
                      ৳ {totalCredit.toFixed(2)}
                    </td>
                    <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-right font-bold text-gray-600">
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
                            <th className="w-24 px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="w-40 px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Account
                            </th>
                            <th className="w-24 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Debit (৳)
                            </th>
                            <th className="w-24 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Credit (৳)
                            </th>
                            <th className="w-32 px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Balance (৳)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {accountEntriesWithBalance.map((entry, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {entry.date}
                              </td>
                              <td className="w-40 px-4 sm:px-6 py-4 text-sm text-gray-700">
                                <div className="max-w-xs truncate" title={entry.particulars}>
                                  {entry.particulars || "-"}
                                </div>
                              </td>
                              <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                                {entry.debit > 0 ? `৳ ${entry.debit.toFixed(2)}` : "-"}
                              </td>
                              <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                                {entry.credit > 0 ? `৳ ${entry.credit.toFixed(2)}` : "-"}
                              </td>
                              <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                                {entry.balance > 0 ? `৳ ${entry.balance.toFixed(2)} ${entry.balanceType}` : "৳ 0.00"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                          <tr className="text-sm font-bold">
                            <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-left text-gray-700">
                              Total: {accountEntries.length}
                            </td>
                            <td className="w-40 px-4 sm:px-6 py-4"></td>
                            <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-right text-gray-700">
                              ৳ {accountTotalDebit.toFixed(2)}
                            </td>
                            <td className="w-24 px-4 sm:px-6 py-4 whitespace-nowrap text-right text-gray-700">
                              ৳ {accountTotalCredit.toFixed(2)}
                            </td>
                            <td className="w-32 px-4 sm:px-6 py-4 whitespace-nowrap text-right font-bold text-gray-700">
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
