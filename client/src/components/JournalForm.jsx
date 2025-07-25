import React, { useState, useEffect } from "react";

const JournalForm = ({ onSave, editData }) => {
  const [journalDate, setJournalDate] = useState("");
  const [entries, setEntries] = useState([
    { account: "", type: "Debit", amount: "" },
    { account: "", type: "Credit", amount: "" },
  ]);

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
    if (onSave) onSave(newEntry);
    
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
      <h2 className="text-xl font-bold mb-4">
        {editData ? "Edit Journal Entry" : "Add Journal Entry"}
      </h2>

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

      {/* Entries Table */}
      <div className="mb-4">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="font-medium text-sm">Account</div>
          <div className="font-medium text-sm">Type</div>
          <div className="font-medium text-sm">Amount (Tk.)</div>
          <div className="font-medium text-sm">Action</div>
        </div>

        {entries.map((entry, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
            {/* Account Select - spans 5 columns */}
            <div className="col-span-5">
              <select
                value={entry.account}
                onChange={(e) => handleChange(index, "account", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="" disabled hidden>
                  Select Account
                </option>
                <option value="Cash">Cash</option>
                <option value="Capital">Capital</option>
                <option value="Inventory">Inventory</option>
                <option value="Sales">Sales</option>
                <option value="Bank">Bank</option>
                <option value="Accounts Receivable">Accounts Receivable</option>
                <option value="Accounts Payable">Accounts Payable</option>
                <option value="Expenses">Expenses</option>
              </select>
            </div>

            {/* Type Select - spans 3 columns */}
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

            {/* Amount Input - spans 3 columns */}
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

            {/* Minus Button - spans 1 column */}
            <div className="col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="text-red-600 hover:text-red-800 text-lg p-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100"
                disabled={entries.length <= 2}
              >
                -
              </button>
            </div>
          </div>
        ))}
      </div>

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
            if (editData) onSave(null); // Cancel edit mode
          }}
          className="px-4 py-2 border border-red-300 rounded-md text-red-700 bg-red-50 shadow-sm hover:bg-red-100 transition-colors"
        >
          {editData ? "Cancel" : "Clear"}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors"
        >
          {editData ? "Update Journal Entry →" : "Create Journal Entry →"}
        </button>
      </div>
    </form>
  );
};

export default JournalForm;