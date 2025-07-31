import React, { useState, useEffect, useRef } from "react";

const JournalForm = ({
  onSave,
  editData,
  accountOptions,
  setAccountOptions,
  accountHierarchy,
  setAccountHierarchy,
}) => {
  const [journalDate, setJournalDate] = useState("");
  const [entries, setEntries] = useState([
    { account: "", type: "Debit", amount: "" },
    { account: "", type: "Credit", amount: "" },
  ]);
  const [successMessage, setSuccessMessage] = useState("");
  const [description, setDescription] = useState("");
  
  // Refs for focus management
  const dateInputRef = useRef(null);
  const accountSelectRefs = useRef([]);
  const typeSelectRefs = useRef([]);
  const amountInputRefs = useRef([]);
  const descriptionInputRef = useRef(null);
  const formRef = useRef(null);

  // Initialize refs arrays
  useEffect(() => {
    accountSelectRefs.current = accountSelectRefs.current.slice(0, entries.length);
    typeSelectRefs.current = typeSelectRefs.current.slice(0, entries.length);
    amountInputRefs.current = amountInputRefs.current.slice(0, entries.length);
  }, [entries]);

  // Initialize form with edit data if provided
  useEffect(() => {
    if (editData) {
      setJournalDate(editData.date);
      setDescription(editData.description || "");
      setEntries(editData.entries);
    } else {
      setJournalDate("");
      setDescription("");
      setEntries([
        { account: "", type: "Debit", amount: "" },
        { account: "", type: "Credit", amount: "" },
      ]);
    }
  }, [editData]);

  // Handle Enter key navigation
  const handleKeyDown = (e, index, fieldType) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      if (fieldType === 'date') {
        if (accountSelectRefs.current[0]) {
          accountSelectRefs.current[0].focus();
        }
      } else if (fieldType === 'account') {
        typeSelectRefs.current[index]?.focus();
      } else if (fieldType === 'type') {
        amountInputRefs.current[index]?.focus();
      } else if (fieldType === 'amount') {
        if (index < entries.length - 1) {
          accountSelectRefs.current[index + 1]?.focus();
        } else {
          descriptionInputRef.current?.focus();
        }
      } else if (fieldType === 'description') {
        handleSubmit({ preventDefault: () => {} });
      }
    }
  };

  // Account Select Component
  const AccountSelect = ({ value, onChange, index }) => {
    const [showHierarchy, setShowHierarchy] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [currentSubcategory, setCurrentSubcategory] = useState(null);
    const [newAccountName, setNewAccountName] = useState("");
    const [isAddingNewAccount, setIsAddingNewAccount] = useState(false);
    const [newAccountCategory, setNewAccountCategory] = useState(null);
    const [newAccountSubcategory, setNewAccountSubcategory] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowHierarchy(false);
          setCurrentCategory(null);
          setCurrentSubcategory(null);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const handleAccountSelect = (account) => {
      onChange(account);
      setShowHierarchy(false);
      setCurrentCategory(null);
      setCurrentSubcategory(null);
      // Auto-focus to type select after account selection
      setTimeout(() => {
        typeSelectRefs.current[index]?.focus();
      }, 0);
    };

    const startAddingNewAccount = (category, subcategory = null) => {
      setIsAddingNewAccount(true);
      setNewAccountCategory(category);
      setNewAccountSubcategory(subcategory);
      setNewAccountName("");
      setShowHierarchy(false);
    };

    const deleteAccount = (account, category, subcategory = null) => {
      const updatedHierarchy = JSON.parse(JSON.stringify(accountHierarchy));
      
      if (subcategory) {
        updatedHierarchy[category][subcategory] = updatedHierarchy[category][subcategory]
          .filter(acc => acc !== account);
      } else if (Array.isArray(updatedHierarchy[category])) {
        updatedHierarchy[category] = updatedHierarchy[category]
          .filter(acc => acc !== account);
      } else {
        if (updatedHierarchy[category]?.["Other"]) {
          updatedHierarchy[category]["Other"] = updatedHierarchy[category]["Other"]
            .filter(acc => acc !== account);
        }
      }

      setAccountHierarchy(updatedHierarchy);
      const updatedAccounts = accountOptions.filter(acc => acc !== account);
      setAccountOptions(updatedAccounts);
      
      if (value === account) {
        onChange("");
      }
    };

    const getAllAccountsFromHierarchy = (hierarchy) => {
      let accounts = [];
      for (const category in hierarchy) {
        if (Array.isArray(hierarchy[category])) {
          accounts = [...accounts, ...hierarchy[category]];
        } else {
          for (const subcategory in hierarchy[category]) {
            accounts = [...accounts, ...hierarchy[category][subcategory]];
          }
        }
      }
      return accounts;
    };

    const saveNewAccount = () => {
      try {
        const trimmedName = newAccountName.trim();
        
        if (!trimmedName) {
          alert("Please enter an account name");
          return;
        }

        const allAccounts = getAllAccountsFromHierarchy(accountHierarchy);
        if (allAccounts.includes(trimmedName)) {
          alert("Account name already exists");
          return;
        }

        const updatedHierarchy = JSON.parse(JSON.stringify(accountHierarchy));
        
        if (newAccountSubcategory) {
          if (!updatedHierarchy[newAccountCategory]?.[newAccountSubcategory]) {
            updatedHierarchy[newAccountCategory][newAccountSubcategory] = [];
          }
          updatedHierarchy[newAccountCategory][newAccountSubcategory].push(trimmedName);
        } else if (Array.isArray(updatedHierarchy[newAccountCategory])) {
          updatedHierarchy[newAccountCategory].push(trimmedName);
        } else {
          if (!updatedHierarchy[newAccountCategory]) {
            updatedHierarchy[newAccountCategory] = { "Other": [] };
          } else if (!updatedHierarchy[newAccountCategory]["Other"]) {
            updatedHierarchy[newAccountCategory]["Other"] = [];
          }
          updatedHierarchy[newAccountCategory]["Other"].push(trimmedName);
        }

        setAccountHierarchy(updatedHierarchy);
        const updatedAccounts = [...new Set([...accountOptions, trimmedName])];
        setAccountOptions(updatedAccounts);
        onChange(trimmedName);
        setIsAddingNewAccount(false);
        setNewAccountName("");
        
        // Auto-focus to type select after adding new account
        setTimeout(() => {
          typeSelectRefs.current[index]?.focus();
        }, 0);
      } catch (error) {
        console.error("Error saving new account:", error);
        alert("An error occurred while saving the new account");
      }
    };

    const renderCategoryOptions = () => (
      <>
        <div className="font-semibold mb-2 text-gray-700">Main Categories</div>
        {Object.keys(accountHierarchy).map((category) => (
          <div
            key={category}
            onClick={() => setCurrentCategory(category)}
            className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
          >
            <span>{category}</span>
            <span className="text-gray-500">→</span>
          </div>
        ))}
      </>
    );

    const renderSubcategoryOptions = () => (
      <>
        <div
          onClick={() => setCurrentCategory(null)}
          className="p-2 border border-transparent hover:border-blue-400 cursor-pointer flex items-center text-blue-600 rounded-md transition-colors duration-200"
        >
          ← Back to Categories
        </div>
        <div className="font-semibold mb-2 border border-gray-300 bg-gray-200 shadow-sm text-black-150 text-center">
          {currentCategory}
        </div>

        {Array.isArray(accountHierarchy[currentCategory]) ? (
          <>
            {accountHierarchy[currentCategory].map((account) => (
              <div
                key={account}
                className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              >
                <span 
                  onClick={() => handleAccountSelect(account)}
                  className="flex-grow"
                >
                  {account}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAccount(account, currentCategory);
                  }}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="Delete account"
                >
                  −
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startAddingNewAccount(currentCategory);
              }}
              className="p-2 hover:bg-gray-100 cursor-pointer text-blue-600 font-semibold w-full text-left"
            >
              + Add New Account
            </button>
          </>
        ) : (
          Object.keys(accountHierarchy[currentCategory]).map((subcategory) => (
            <div
              key={subcategory}
              onClick={() => setCurrentSubcategory(subcategory)}
              className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
            >
              <span>{subcategory}</span>
              <span className="text-gray-500">→</span>
            </div>
          ))
        )}
      </>
    );

    const renderAccountOptions = () => {
      const accounts = accountHierarchy[currentCategory][currentSubcategory];

      return (
        <>
          <div
            onClick={() => setCurrentSubcategory(null)}
            className="p-2 border border-transparent hover:border-blue-400 cursor-pointer flex items-center text-blue-600 rounded-md transition-colors duration-200"
          >
            ← Back to {currentCategory}
          </div>
          <div className="font-semibold mb-2 border border-gray-300 bg-gray-200 shadow-sm text-black-150 text-center">
            {currentSubcategory}
          </div>

          {accounts.map((account) => (
            <div
              key={account}
              className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
            >
              <span 
                onClick={() => handleAccountSelect(account)}
                className="flex-grow"
              >
                {account}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAccount(account, currentCategory, currentSubcategory);
                }}
                className="text-red-500 hover:text-red-700 ml-2"
                title="Delete account"
                >
                −
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              startAddingNewAccount(currentCategory, currentSubcategory);
            }}
            className="p-2 hover:bg-gray-100 cursor-pointer text-blue-600 font-semibold w-full text-left"
          >
            + Add New Account
          </button>
        </>
      );
    };

    return (
      <div 
        className="relative" 
        ref={el => accountSelectRefs.current[index] = el}
        tabIndex={0}
        onKeyDown={(e) => handleKeyDown(e, index, 'account')}
      >
        <div
          onClick={() => setShowHierarchy(!showHierarchy)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer"
        >
          {value || "Select Account"}
        </div>

        {showHierarchy && !isAddingNewAccount && (
          <div 
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2">
              {!currentCategory
                ? renderCategoryOptions()
                : !currentSubcategory
                ? renderSubcategoryOptions()
                : renderAccountOptions()}
            </div>
          </div>
        )}

        {isAddingNewAccount && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              placeholder="Enter new account name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <button
              type="button"
              onClick={saveNewAccount}
              className="px-4 py-2 border border-green-300 text-green-700 bg-green-50 shadow-sm rounded-md hover:bg-green-100 transition"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingNewAccount(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-gray-50 shadow-sm rounded-md hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

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

    if (!journalDate) {
      alert("Please select a journal date");
      return;
    }

    for (let entry of entries) {
      if (!entry.account || !entry.amount) {
        alert("Please fill all account fields and amounts");
        return;
      }
    }

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
      description: description,
      entries: entries.map((entry) => ({
        ...entry,
        amount: parseFloat(entry.amount),
      })),
    };

    if (onSave) {
      onSave(newEntry);
    }

    setSuccessMessage(
      editData
        ? "Journal entry updated successfully!"
        : "Journal entry created successfully!"
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    if (!editData) {
      setJournalDate("");
      setDescription("");
      setEntries([
        { account: "", type: "Debit", amount: "" },
        { account: "", type: "Credit", amount: "" },
      ]);
    }
  };

  return (
    <form
      ref={formRef}
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

      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-8">
          <label className="text-sm font-medium text-gray-700">
            Journal Date
          </label>
          <input
            ref={dateInputRef}
            type="date"
            value={journalDate}
            onChange={(e) => setJournalDate(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 0, 'date')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-700">
        <div className="col-span-5 text-center">Account</div>
        <div className="col-span-3 text-center">Type</div>
        <div className="col-span-3 text-center">Amount (Tk.)</div>
        <div className="col-span-1 text-right">Action</div>
      </div>

      {entries.map((entry, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
          <div className="col-span-5">
            <AccountSelect
              value={entry.account}
              onChange={(value) => handleChange(index, "account", value)}
              index={index}
            />
          </div>

          <div className="col-span-3">
            <select
              ref={el => typeSelectRefs.current[index] = el}
              value={entry.type}
              onChange={(e) => handleChange(index, "type", e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index, 'type')}
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

          <div className="col-span-3">
            <input
              ref={el => amountInputRefs.current[index] = el}
              type="number"
              value={entry.amount}
              onChange={(e) => handleChange(index, "amount", e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index, 'amount')}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

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

      <button
        type="button"
        onClick={addRow}
        className="mb-6 w-30 h-7 border border-blue-300 rounded-md text-blue-700 bg-blue-50 shadow-sm flex items-center hover:bg-blue-100 transition-colors"
      >
        <span className="mr-1">+</span>Add Account
      </button>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <input
          ref={descriptionInputRef}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 0, 'description')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          placeholder="Enter a description for this journal entry"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setJournalDate("");
            setDescription("");
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