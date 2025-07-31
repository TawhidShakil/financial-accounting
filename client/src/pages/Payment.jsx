import { useState, useEffect } from "react"
import PaymentForm from "../components/PaymentForm"
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline"

const defaultPaymentHierarchy = {
  Cash: [],
  Bank: ["Trust Bank", "NRBC Bank"],
}

const defaultDebitAccountOptions = [
  "Rent Expense",
  "Salaries Expense",
  "Utilities Expense",
  "Office Supplies Expense",
  "Travel Expense",
  "Marketing Expense",
  "Insurance Expense",
  "Maintenance Expense",
  "Professional Fees",
  "Interest Expense",
  "Accounts Payable",
  "Notes Payable",
  "Loan Payable",
  "Advance to Supplier",
  "Prepaid Expenses",
  "Equipment Purchase",
  "Inventory Purchase",
]

export default function Payment() {
  const [entries, setEntries] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [debitAccountOptions, setDebitAccountOptions] = useState(defaultDebitAccountOptions)
  const [paymentHierarchy, setPaymentHierarchy] = useState(defaultPaymentHierarchy)

  useEffect(() => {
    console.log("Payment: Component mounted, loading data from localStorage...")

    const savedEntries = localStorage.getItem("paymentEntries")
    const savedDebitAccounts = localStorage.getItem("paymentDebitAccountOptions")
    const savedHierarchy = localStorage.getItem("paymentHierarchy")
    const savedLedgerEntries = localStorage.getItem("ledgerEntries")

    console.log("Payment: Raw localStorage data:", {
      savedEntries,
      savedDebitAccounts,
      savedHierarchy,
      savedLedgerEntries,
    })

    let paymentEntries = []

    // First, load existing payment entries
    if (savedEntries && savedEntries !== "undefined" && savedEntries !== "null" && savedEntries !== "[]") {
      try {
        const parsedEntries = JSON.parse(savedEntries)
        console.log("Payment: Successfully parsed existing entries:", parsedEntries)
        if (Array.isArray(parsedEntries)) {
          paymentEntries = parsedEntries
        }
      } catch (error) {
        console.error("Payment: Error parsing savedEntries:", error)
      }
    }

    // Then, check for old ledger entries that need to be migrated
    if (savedLedgerEntries && savedLedgerEntries !== "undefined" && savedLedgerEntries !== "null") {
      try {
        const ledgerEntries = JSON.parse(savedLedgerEntries)
        console.log("Payment: Found ledger entries:", ledgerEntries)

        // Find Payment-type entries and convert them back to payment format
        const paymentLedgerEntries = ledgerEntries.filter((entry) => entry.type === "Payment")
        console.log("Payment: Found payment ledger entries:", paymentLedgerEntries)

        // Group by reference to reconstruct original payment entries
        const paymentGroups = {}
        paymentLedgerEntries.forEach((entry) => {
          if (!paymentGroups[entry.reference]) {
            paymentGroups[entry.reference] = []
          }
          paymentGroups[entry.reference].push(entry)
        })

        console.log("Payment: Grouped payment entries:", paymentGroups)

        // Convert back to payment format
        const migratedPayments = Object.values(paymentGroups)
          .map((group) => {
            // Find debit and credit entries
            const debitEntry = group.find((e) => e.debit > 0)
            const creditEntry = group.find((e) => e.credit > 0)

            if (debitEntry && creditEntry) {
              return {
                date: debitEntry.date,
                payment: creditEntry.account, // The account that was credited (payment account)
                account: debitEntry.account, // The account that was debited
                amount: debitEntry.debit,
                description: debitEntry.description || "",
              }
            }
            return null
          })
          .filter(Boolean)

        console.log("Payment: Migrated payments from ledger:", migratedPayments)

        // Merge with existing entries, avoiding duplicates
        const existingReferences = new Set()
        paymentEntries.forEach((entry) => {
          // Create a reference-like key for existing entries
          const refKey = `${entry.date}-${entry.payment}-${entry.account}-${entry.amount}`
          existingReferences.add(refKey)
        })

        const newMigratedPayments = migratedPayments.filter((payment) => {
          const refKey = `${payment.date}-${payment.payment}-${payment.account}-${payment.amount}`
          return !existingReferences.has(refKey)
        })

        console.log("Payment: New migrated payments (avoiding duplicates):", newMigratedPayments)

        paymentEntries = [...paymentEntries, ...newMigratedPayments]

        // Save the merged data back to localStorage
        if (newMigratedPayments.length > 0) {
          localStorage.setItem("paymentEntries", JSON.stringify(paymentEntries))
          console.log("Payment: Saved migrated data to paymentEntries")
        }
      } catch (error) {
        console.error("Payment: Error processing ledger entries:", error)
      }
    }

    // Sort entries by date (newest first)
    paymentEntries.sort((a, b) => new Date(b.date) - new Date(a.date))

    setEntries(paymentEntries)
    console.log("Payment: Final entries set:", paymentEntries)

    // Load other settings
    if (savedDebitAccounts && savedDebitAccounts !== "undefined") {
      try {
        setDebitAccountOptions(JSON.parse(savedDebitAccounts))
      } catch (error) {
        console.error("Payment: Error parsing debit accounts:", error)
      }
    }

    if (savedHierarchy && savedHierarchy !== "undefined") {
      try {
        setPaymentHierarchy(JSON.parse(savedHierarchy))
      } catch (error) {
        console.error("Payment: Error parsing hierarchy:", error)
      }
    }
  }, [])

  useEffect(() => {
    console.log("Payment: Save useEffect triggered, entries:", entries)

    // Only save if we have entries
    if (entries.length > 0) {
      localStorage.setItem("paymentEntries", JSON.stringify(entries))
      console.log("Payment: Saved entries to localStorage:", JSON.stringify(entries))
    } else {
      // Check if localStorage has data that we shouldn't overwrite
      const existing = localStorage.getItem("paymentEntries")
      if (existing && existing !== "[]" && existing !== "null") {
        console.log("Payment: Not overwriting existing localStorage data with empty array")
      } else {
        localStorage.setItem("paymentEntries", JSON.stringify(entries))
        console.log("Payment: Saved empty array to localStorage")
      }
    }

    localStorage.setItem("paymentDebitAccountOptions", JSON.stringify(debitAccountOptions))
    localStorage.setItem("paymentHierarchy", JSON.stringify(paymentHierarchy))
  }, [entries, debitAccountOptions, paymentHierarchy])

  const handleSave = (newEntry) => {
    console.log("Payment: handleSave called with:", newEntry)
    console.log("Payment: Current entries before save:", entries)
    console.log("Payment: editingIndex:", editingIndex)

    let updatedEntries

    if (editingIndex !== null) {
      updatedEntries = entries.map((entry, index) => (index === editingIndex ? newEntry : entry))
      console.log("Payment: Updated entries (edit mode):", updatedEntries)
    } else {
      updatedEntries = [...entries, newEntry]
      console.log("Payment: Updated entries (new entry):", updatedEntries)
    }

    // Update state
    setEntries(updatedEntries)

    // Force save to localStorage immediately
    localStorage.setItem("paymentEntries", JSON.stringify(updatedEntries))
    console.log("Payment: Saved to localStorage:", updatedEntries)

    setEditingIndex(null)
  }

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this payment entry?")) {
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
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Payment Management</h1>

        <PaymentForm
          onSave={handleSave}
          editData={editingIndex !== null ? entries[editingIndex] : null}
          debitAccountOptions={debitAccountOptions}
          setDebitAccountOptions={setDebitAccountOptions}
          paymentHierarchy={paymentHierarchy}
          setPaymentHierarchy={setPaymentHierarchy}
        />

        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6 text-center">Payment Records</h2>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
              <div className="text-lg mb-2">No payment entries found.</div>
              <div className="text-sm">Create your first payment entry using the form above.</div>
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
                        Payment
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {entry.payment}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
