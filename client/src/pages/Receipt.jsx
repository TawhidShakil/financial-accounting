import { useState, useEffect } from "react"
import ReceiptForm from "../components/ReceiptForm"
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline"

const defaultReceiptHierarchy = {
  Cash: [],
  Bank: ["Trust Bank", "NRBC Bank"],
}

const defaultCreditAccountOptions = [
  "Service Revenue",
  "Sales Revenue",
  "Miscellaneous Income",
  "Interest Income",
  "Rent Income",
  "Commission Income",
  "Dividend Income",
  "Other Income",
  "Accounts Receivable",
  "Notes Receivable",
  "Advance from Customer",
  "Loan Receivable",
]

export default function Receipt() {
  const [entries, setEntries] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [creditAccountOptions, setCreditAccountOptions] = useState(defaultCreditAccountOptions)
  const [receiptHierarchy, setReceiptHierarchy] = useState(defaultReceiptHierarchy)

  useEffect(() => {
    console.log("Receipt: Component mounted, loading data from localStorage...")

    const savedEntries = localStorage.getItem("receiptEntries")
    const savedCreditAccounts = localStorage.getItem("receiptCreditAccountOptions")
    const savedHierarchy = localStorage.getItem("receiptHierarchy")
    const savedLedgerEntries = localStorage.getItem("ledgerEntries")

    console.log("Receipt: Raw localStorage data:", {
      savedEntries,
      savedCreditAccounts,
      savedHierarchy,
      savedLedgerEntries,
    })

    let receiptEntries = []

    // First, load existing receipt entries
    if (savedEntries && savedEntries !== "undefined" && savedEntries !== "null" && savedEntries !== "[]") {
      try {
        const parsedEntries = JSON.parse(savedEntries)
        console.log("Receipt: Successfully parsed existing entries:", parsedEntries)
        if (Array.isArray(parsedEntries)) {
          receiptEntries = parsedEntries
        }
      } catch (error) {
        console.error("Receipt: Error parsing savedEntries:", error)
      }
    }

    // Then, check for old ledger entries that need to be migrated
    if (savedLedgerEntries && savedLedgerEntries !== "undefined" && savedLedgerEntries !== "null") {
      try {
        const ledgerEntries = JSON.parse(savedLedgerEntries)
        console.log("Receipt: Found ledger entries:", ledgerEntries)

        // Find Receipt-type entries and convert them back to receipt format
        const receiptLedgerEntries = ledgerEntries.filter((entry) => entry.type === "Receipt")
        console.log("Receipt: Found receipt ledger entries:", receiptLedgerEntries)

        // Group by reference to reconstruct original receipt entries
        const receiptGroups = {}
        receiptLedgerEntries.forEach((entry) => {
          if (!receiptGroups[entry.reference]) {
            receiptGroups[entry.reference] = []
          }
          receiptGroups[entry.reference].push(entry)
        })

        console.log("Receipt: Grouped receipt entries:", receiptGroups)

        // Convert back to receipt format
        const migratedReceipts = Object.values(receiptGroups)
          .map((group) => {
            // Find debit and credit entries
            const debitEntry = group.find((e) => e.debit > 0)
            const creditEntry = group.find((e) => e.credit > 0)

            if (debitEntry && creditEntry) {
              return {
                date: debitEntry.date,
                receipt: debitEntry.account, // The account that was debited (receipt account)
                account: creditEntry.account, // The account that was credited
                amount: debitEntry.debit,
                description: debitEntry.description || "",
              }
            }
            return null
          })
          .filter(Boolean)

        console.log("Receipt: Migrated receipts from ledger:", migratedReceipts)

        // Merge with existing entries, avoiding duplicates
        const existingReferences = new Set()
        receiptEntries.forEach((entry) => {
          // Create a reference-like key for existing entries
          const refKey = `${entry.date}-${entry.receipt}-${entry.account}-${entry.amount}`
          existingReferences.add(refKey)
        })

        const newMigratedReceipts = migratedReceipts.filter((receipt) => {
          const refKey = `${receipt.date}-${receipt.receipt}-${receipt.account}-${receipt.amount}`
          return !existingReferences.has(refKey)
        })

        console.log("Receipt: New migrated receipts (avoiding duplicates):", newMigratedReceipts)

        receiptEntries = [...receiptEntries, ...newMigratedReceipts]

        // Save the merged data back to localStorage
        if (newMigratedReceipts.length > 0) {
          localStorage.setItem("receiptEntries", JSON.stringify(receiptEntries))
          console.log("Receipt: Saved migrated data to receiptEntries")
        }
      } catch (error) {
        console.error("Receipt: Error processing ledger entries:", error)
      }
    }

    // Sort entries by date (newest first)
    receiptEntries.sort((a, b) => new Date(b.date) - new Date(a.date))

    setEntries(receiptEntries)
    console.log("Receipt: Final entries set:", receiptEntries)

    // Load other settings
    if (savedCreditAccounts && savedCreditAccounts !== "undefined") {
      try {
        setCreditAccountOptions(JSON.parse(savedCreditAccounts))
      } catch (error) {
        console.error("Receipt: Error parsing credit accounts:", error)
      }
    }

    if (savedHierarchy && savedHierarchy !== "undefined") {
      try {
        setReceiptHierarchy(JSON.parse(savedHierarchy))
      } catch (error) {
        console.error("Receipt: Error parsing hierarchy:", error)
      }
    }
  }, [])

  useEffect(() => {
    console.log("Receipt: Save useEffect triggered, entries:", entries)

    // Only save if we have entries
    if (entries.length > 0) {
      localStorage.setItem("receiptEntries", JSON.stringify(entries))
      console.log("Receipt: Saved entries to localStorage:", JSON.stringify(entries))
    } else {
      // Check if localStorage has data that we shouldn't overwrite
      const existing = localStorage.getItem("receiptEntries")
      if (existing && existing !== "[]" && existing !== "null") {
        console.log("Receipt: Not overwriting existing localStorage data with empty array")
      } else {
        localStorage.setItem("receiptEntries", JSON.stringify(entries))
        console.log("Receipt: Saved empty array to localStorage")
      }
    }

    localStorage.setItem("receiptCreditAccountOptions", JSON.stringify(creditAccountOptions))
    localStorage.setItem("receiptHierarchy", JSON.stringify(receiptHierarchy))
  }, [entries, creditAccountOptions, receiptHierarchy])

  const handleSave = (newEntry) => {
    console.log("Receipt: handleSave called with:", newEntry)
    console.log("Receipt: Current entries before save:", entries)
    console.log("Receipt: editingIndex:", editingIndex)

    let updatedEntries

    if (editingIndex !== null) {
      updatedEntries = entries.map((entry, index) => (index === editingIndex ? newEntry : entry))
      console.log("Receipt: Updated entries (edit mode):", updatedEntries)
    } else {
      updatedEntries = [...entries, newEntry]
      console.log("Receipt: Updated entries (new entry):", updatedEntries)
    }

    // Update state
    setEntries(updatedEntries)

    // Force save to localStorage immediately
    localStorage.setItem("receiptEntries", JSON.stringify(updatedEntries))
    console.log("Receipt: Saved to localStorage:", updatedEntries)

    setEditingIndex(null)
  }

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this receipt entry?")) {
      setEntries(entries.filter((_, i) => i !== index))
    }
  }

  const handleEdit = (index) => {
    setEditingIndex(index)
  }

  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Receipt Management</h1>

        <ReceiptForm
          onSave={handleSave}
          editData={editingIndex !== null ? entries[editingIndex] : null}
          creditAccountOptions={creditAccountOptions}
          setCreditAccountOptions={setCreditAccountOptions}
          receiptHierarchy={receiptHierarchy}
          setReceiptHierarchy={setReceiptHierarchy}
        />

        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6 text-center">Receipt Records</h2>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
              <div className="text-lg mb-2">No receipt entries found.</div>
              <div className="text-sm">Create your first receipt entry using the form above.</div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount (৳)
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {entry.receipt}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {entry.account}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ৳ {entry.amount.toFixed(2)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-xs truncate" title={entry.description}>
                            {entry.description || "-"}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(index)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Edit entry"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete entry"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Amount Footer */}
              <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-700">Total Entries: {entries.length}</div>
                  <div className="text-lg font-bold text-gray-900">Total Amount: ৳ {totalAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
