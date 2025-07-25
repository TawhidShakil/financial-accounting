import React, { useState, useEffect } from "react";

const JournalForm = ({ onSave, editData }) => {
  const defaultAccounts = [
    "Cash",
    "Capital",
    "Inventory",
    "Sales",
    "Bank",
    "Accounts Receivable",
    "Accounts Payable",
    "Expenses",
  ];

  // Load accounts from localStorage if available, else default list
  const [accountOptions, setAccountOptions] = useState(() => {
    const saved = localStorage.getItem("accountOptions");
    return saved ? JSON.parse(saved) : defaultAccounts;
  });

  const [journalDate, setJournalDate] = useState("");
  const [entries, setEntries] = useState([
    { account: "", type: "Debit", amount: "" },
    { account: "", type: "Credit", amount: "" },
  ]);

  const [addingNewAccountIndex, setAddingNewAccountIndex] = useState(null);
  const [newAccountName, setNewAccountName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize form with edit data if provided
  useEffect(() => {
    if (editData) {
      setJournalDate(editData.date);
      setEntries(editData.entries);
    } else {
      setJournalDate("");
      setEntries([
        { account: "", type: "Debit", amount: "" },
        { account: "", type: "Credit", amount: "" },
      ]);
    }
  }, [editData]);

  const addRow = () => {
    setEntries([...entries, { account: "", type: "Debit", amount: "" }]);
  };

  const removeRow = (index) => {
    if (entries.length <= 2) {
      alert("You must have at least one debit and one credit entry");
      return;
    }
    const updated = [...entries];
    updated.splice(index, 1);
    setEntries(updated);
  };

  const handleChange = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!journalDate) {
      alert("Please select a journal date");
      return;
    }

    // Check all fields are filled
    for (let entry of entries) {
      if (!entry.account || !entry.amount) {
        alert("Please fill all account fields and amounts");
        return;
      }
    }

    // Validate amounts are positive numbers
    for (let entry of entries) {
      if (isNaN(entry.amount)) {
        alert("Amount must be a number");
        return;
      }
      if (parseFloat(entry.amount) <= 0) {
        alert("Amount must be greater than 0");
        return;
      }
    }

    // Validate that total debits equal total credits
    const totalDebit = entries
      .filter((entry) => entry.type === "Debit")
      .reduce((sum, entry) => sum + parseFloat(entry.amount), 0);

    const totalCredit = entries
      .filter((entry) => entry.type === "Credit")
      .reduce((sum, entry) => sum + parseFloat(entry.amount), 0);

    if (totalDebit !== totalCredit) {
      alert(
        `Total debits (${totalDebit}) must equal total credits (${totalCredit})`
      );
      return;
    }

    const newEntry = {
      date: journalDate,
      entries: entries.map((entry) => ({
        ...entry,
        amount: parseFloat(entry.amount),
      })),
    };

     // API CALL - Save journal entry (create or update)
    if (onSave) {
      onSave(newEntry);
    }

    setSuccessMessage(editData ? "Journal entry updated successfully!" : "Journal entry created successfully!");

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    // Reset form only if not in edit mode
    if (!editData) {
      setJournalDate("");
      setEntries([
        { account: "", type: "Debit", amount: "" },
        { account: "", type: "Credit", amount: "" },
      ]);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md"
    >
      <h2 className="text-center text-xl font-bold mb-4">
        {editData ? "Edit Journal Entry" : "Add Journal Entry"}
      </h2>

      {successMessage && (
        <div className="text-green-700 text-center font-semibold mb-4">
          {successMessage}
        </div>
      )}

      {/* Journal Date */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-8">
          <label className="text-sm font-medium text-gray-700">
            Journal Date
          </label>
          <input
            type="date"
            value={journalDate}
            onChange={(e) => setJournalDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            required
          />
        </div>
      </div>

      {/* Headers */}
      <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-700">
        <div className="col-span-5 text-center">Account</div>
        <div className="col-span-3 text-center">Type</div>
        <div className="col-span-3 text-center">Amount (Tk.)</div>
        <div className="col-span-1 text-right">Action</div>
      </div>

      {/* Entry Rows */}
      {entries.map((entry, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
          {/* Account Select/Input */}
          <div className="col-span-5">
            {addingNewAccountIndex === index ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Enter new account"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = newAccountName.trim();
                    if (
                      trimmed &&
                      !accountOptions.includes(trimmed)
                    ) {
                      const updatedAccounts = [...accountOptions, trimmed];
                      setAccountOptions(updatedAccounts);
                      // Save updated accounts list in localStorage for persistence
                      localStorage.setItem(
                        "accountOptions",
                        JSON.stringify(updatedAccounts)
                      );
                      handleChange(index, "account", trimmed);
                    }
                    setNewAccountName("");
                    setAddingNewAccountIndex(null);
                  }}
                  className="px-4 py-2 border border-green-300 text-green-700 bg-green-50 shadow-sm rounded-md hover:bg-green-100 transition"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewAccountName("");
                    setAddingNewAccountIndex(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 bg-gray-50 shadow-sm rounded-md hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={entry.account}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "__add__") {
                    setAddingNewAccountIndex(index);
                  } else {
                    handleChange(index, "account", value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="" disabled hidden>
                  Select Account
                </option>
                {accountOptions.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
                <option value="__add__" className="text-blue-600 font-semibold">
                  {" "}
                  ➕ Add New Account
                </option>
              </select>
            )}
          </div>

          {/* Type Select */}
          <div className="col-span-3">
            <select
              value={entry.type}
              onChange={(e) => handleChange(index, "type", e.target.value)}
              className={`w-full p-2 border rounded-md ${
                entry.type === "Debit"
                  ? "border-green-300 bg-green-50"
                  : "border-red-300 bg-red-50"
              }`}
            >
              <option value="Debit">Debit</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          {/* Amount Input */}
          <div className="col-span-3">
            <input
              type="number"
              value={entry.amount}
              onChange={(e) => handleChange(index, "amount", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Remove Button */}
          <div className="col-span-1 flex justify-end">
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-red-600 hover:text-red-800 text-lg p-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100"
              disabled={entries.length <= 2}
              title="Remove Entry"
            >
              −
            </button>
          </div>
        </div>
      ))}

      {/* Add Row */}
      <button
        type="button"
        onClick={addRow}
        className="mb-6 w-30 h-7 border border-blue-300 rounded-md text-blue-700 bg-blue-50 shadow-sm flex items-center hover:bg-blue-100 transition-colors"
      >
        <span className="mr-1">+</span>Add Account
      </button>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setJournalDate("");
            setEntries([
              { account: "", type: "Debit", amount: "" },
              { account: "", type: "Credit", amount: "" },
            ]);
            if (editData) onSave(null);
          }}
          className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 shadow-sm rounded-md hover:bg-red-100 transition"
        >
          {editData ? "Cancel" : "Clear"}
        </button>
        <button
          type="submit"
          
          className="px-4 py-2 border border-green-300 text-green-700 bg-green-50 shadow-sm rounded-md hover:bg-green-100 transition"
        >
          {editData ? "Update Journal Entry →" : "Create Journal Entry →"}
        </button>
      </div>
    </form>
  );
};

export default JournalForm;
