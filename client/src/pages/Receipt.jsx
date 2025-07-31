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
    const savedEntries = localStorage.getItem("receiptEntries")
    const savedCreditAccounts = localStorage.getItem("receiptCreditAccountOptions")
    const savedHierarchy = localStorage.getItem("receiptHierarchy")

    if (savedEntries) setEntries(JSON.parse(savedEntries))
    if (savedCreditAccounts) setCreditAccountOptions(JSON.parse(savedCreditAccounts))
    if (savedHierarchy) setReceiptHierarchy(JSON.parse(savedHierarchy))
  }, [])

  useEffect(() => {
    localStorage.setItem("receiptEntries", JSON.stringify(entries))
    localStorage.setItem("receiptCreditAccountOptions", JSON.stringify(creditAccountOptions))
    localStorage.setItem("receiptHierarchy", JSON.stringify(receiptHierarchy))
  }, [entries, creditAccountOptions, receiptHierarchy])

  const handleSave = (newEntry) => {
    if (editingIndex !== null) {
      setEntries(entries.map((entry, index) => (index === editingIndex ? newEntry : entry)))
    } else {
      setEntries([...entries, newEntry])
    }
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
