import { useState, useEffect } from "react";
import JournalForm from "../components/JournalForm";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

const defaultHierarchy = {
  Assets: {
    "Current Assets": ["Cash", "Bank Accounts", "Accounts Receivable", "Inventory"],
    "Fixed Assets": ["Land", "Buildings", "Equipment", "Vehicles"]
  },
  Expenses: ["Rent Expense", "Salaries Expense", "Utilities Expense"],
  Revenues: ["Sales Revenue", "Service Revenue"],
  Liabilities: {
    "Short-term Liabilities": ["Accounts Payable", "Short-term Loans", "Interest Payable", "Salary Payable"],
    "Long-term Liabilities": ["Mortgages", "Bonds Payable"]
  },
  Capital: ["Owner's Equity", "Retained Earnings"]
};

export default function Journal() {
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem("journalEntries");
    return savedEntries ? JSON.parse(savedEntries) : [];
  });
  
  const [editingIndex, setEditingIndex] = useState(null);
  
  const [accountHierarchy, setAccountHierarchy] = useState(() => {
    const savedHierarchy = localStorage.getItem("accountHierarchy");
    return savedHierarchy ? JSON.parse(savedHierarchy) : defaultHierarchy;
  });
  
  const [accountOptions, setAccountOptions] = useState(() => {
    const savedAccounts = localStorage.getItem("accountOptions");
    if (savedAccounts) return JSON.parse(savedAccounts);
    
    // Initialize from hierarchy if no saved accounts
    const flattenAccounts = (hierarchy) => {
      let accounts = [];
      for (const [key, value] of Object.entries(hierarchy)) {
        if (Array.isArray(value)) {
          accounts.push(...value);
        } else {
          accounts.push(...flattenAccounts(value));
        }
      }
      return accounts;
    };
    
    const initialAccounts = flattenAccounts(defaultHierarchy);
    localStorage.setItem("accountOptions", JSON.stringify(initialAccounts));
    return initialAccounts;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("journalEntries", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("accountHierarchy", JSON.stringify(accountHierarchy));
  }, [accountHierarchy]);

  useEffect(() => {
    localStorage.setItem("accountOptions", JSON.stringify(accountOptions));
  }, [accountOptions]);

  // Update account options whenever hierarchy changes
  useEffect(() => {
    const flattenAccounts = (hierarchy) => {
      let accounts = [];
      for (const [key, value] of Object.entries(hierarchy)) {
        if (Array.isArray(value)) {
          accounts.push(...value);
        } else {
          accounts.push(...flattenAccounts(value));
        }
      }
      return accounts;
    };

    const updatedAccounts = flattenAccounts(accountHierarchy);
    setAccountOptions(updatedAccounts);
  }, [accountHierarchy]);

  const handleSave = (newEntry) => {
    if (editingIndex !== null) {
      setEntries(entries.map((entry, index) => 
        index === editingIndex ? newEntry : entry
      ));
    } else {
      setEntries([...entries, newEntry]);
    }
    setEditingIndex(null);
  };

  const handleDelete = (index) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  return (
    <div>
      <JournalForm
        onSave={handleSave}
        editData={editingIndex !== null ? entries[editingIndex] : null}
        accountOptions={accountOptions}
        setAccountOptions={setAccountOptions}
        accountHierarchy={accountHierarchy}
        setAccountHierarchy={setAccountHierarchy}
      />

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-center">Journal Records</h2>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No journal entries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.flatMap((entry, entryIndex) =>
                  entry.entries.map((item, itemIndex) => (
                    <tr key={`${entryIndex}-${itemIndex}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {itemIndex === 0 ? entry.date : ""}
                      </td>
                      <td className="px-6 py-4">{item.account}</td>
                      <td className="px-6 py-4">{item.type}</td>
                      <td className="px-6 py-4">{item.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        {itemIndex === 0 && (
                          <>
                            <button
                              onClick={() => handleEdit(entryIndex)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(entryIndex)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}