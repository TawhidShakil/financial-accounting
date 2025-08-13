import { useEffect, useRef, useState } from "react";

const categoryOptions = ["Asset", "Expense", "Revenue", "Liability", "Capital"];

// Canonicalize category for reports
const normalizeCat = (c) => {
  const v = (c || "").toLowerCase().trim();
  if (!v) return "";
  if (v.startsWith("asset")) return "asset";
  if (v.startsWith("liab")) return "liability";
  if (v.startsWith("equity") || v.startsWith("capital") || v.startsWith("owner")) return "equity";
  if (v.startsWith("rev")) return "revenue";
  if (v.startsWith("exp")) return "expense";
  return v;
};

const ReceiptForm = ({
  onSave,
  editData,
  creditAccountOptions,
  setCreditAccountOptions,
  receiptHierarchy,
  setReceiptHierarchy,
}) => {
  const [receiptDate, setReceiptDate] = useState("");
  const [receipt, setReceipt] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Refs
  const dateRef = useRef(null);
  const receiptRef = useRef(null);
  const accountRef = useRef(null);
  const amountRef = useRef(null);
  const descriptionRef = useRef(null);
  const submitRef = useRef(null);
  const categoryRef = useRef(null);

  useEffect(() => {
    dateRef.current?.focus();
  }, []);

  useEffect(() => {
    if (editData) {
      setReceiptDate(editData.date);
      setReceipt(editData.receipt);
      setAccount(editData.account);
      setAmount(editData.amount.toString());
      setDescription(editData.description || "");
      setCategory(editData.category || "");
    } else {
      setReceiptDate("");
      setReceipt("");
      setAccount("");
      setAmount("");
      setDescription("");
      setCategory("");
    }
  }, [editData]);

  const handleKeyDown = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  // ----------------------
  // ReceiptSelect (Debit side: Cash/Bank)
  // ----------------------
  const ReceiptSelect = ({ value, onChange }) => {
    const [showHierarchy, setShowHierarchy] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [newBankName, setNewBankName] = useState("");
    const [isAddingNewBank, setIsAddingNewBank] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowHierarchy(false);
          setCurrentCategory(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const handleReceiptSelect = (receiptAccount) => {
      onChange(receiptAccount);
      setShowHierarchy(false);
      setCurrentCategory(null);
      setTimeout(() => {
        if (accountRef.current) {
          if (accountRef.current.focus) accountRef.current.focus();
          else if (accountRef.current.querySelector?.("input")) {
            accountRef.current.querySelector("input").focus();
          }
        }
      }, 100);
    };

    const startAddingNewBank = () => {
      setIsAddingNewBank(true);
      setNewBankName("");
      setShowHierarchy(false);
    };

    const deleteBank = (bankName) => {
      if (window.confirm(`Are you sure you want to delete "${bankName}"?`)) {
        const updatedHierarchy = JSON.parse(JSON.stringify(receiptHierarchy));
        updatedHierarchy.Bank = updatedHierarchy.Bank.filter((bank) => bank !== bankName);
        setReceiptHierarchy(updatedHierarchy);
        if (value === bankName) onChange("");
      }
    };

    const saveNewBank = () => {
      const trimmedName = newBankName.trim();
      if (!trimmedName) {
        alert("Please enter a bank name");
        return;
      }
      if (receiptHierarchy.Bank.includes(trimmedName)) {
        alert("Bank name already exists");
        return;
      }
      const updatedHierarchy = JSON.parse(JSON.stringify(receiptHierarchy));
      updatedHierarchy.Bank.push(trimmedName);
      setReceiptHierarchy(updatedHierarchy);
      onChange(trimmedName);
      setIsAddingNewBank(false);
      setNewBankName("");
      accountRef.current?.focus();
    };

    const renderCategoryOptions = () => (
      <>
        <div className="font-semibold mb-2 text-gray-700">Receipt Categories</div>
        {Object.keys(receiptHierarchy).map((cat) => (
          <div key={cat}>
            {cat === "Cash" ? (
              <div onClick={() => handleReceiptSelect("Cash")} className="p-2 hover:bg-gray-100 cursor-pointer">
                Cash
              </div>
            ) : (
              <div
                onClick={() => setCurrentCategory(cat)}
                className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              >
                <span>{cat}</span>
                <span className="text-gray-500">→</span>
              </div>
            )}
          </div>
        ))}
      </>
    );

    const renderBankOptions = () => (
      <>
        <div
          onClick={() => setCurrentCategory(null)}
          className="p-2 border border-transparent hover:border-blue-400 cursor-pointer flex items-center text-blue-600 rounded-md transition-colors duration-200"
        >
          ← Back to Categories
        </div>
        <div className="font-semibold mb-2 border border-gray-300 bg-gray-200 shadow-sm text-black text-center">
          Bank
        </div>
        {receiptHierarchy.Bank.map((bank) => (
          <div key={bank} className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
            <span onClick={() => handleReceiptSelect(bank)} className="flex-grow">
              {bank}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteBank(bank);
              }}
              className="text-red-500 hover:text-red-700 ml-2"
              title="Delete bank"
            >
              −
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            startAddingNewBank();
          }}
          className="p-2 hover:bg-gray-100 cursor-pointer text-blue-600 font-semibold w-full text-left"
        >
          + Add New Bank
        </button>
      </>
    );

    return (
      <div className="relative" ref={dropdownRef}>
        <div
          ref={receiptRef}
          onClick={() => setShowHierarchy(!showHierarchy)}
          onKeyDown={(e) => handleKeyDown(e, accountRef)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          tabIndex={0}
        >
          {value || "Select Receipt Account"}
        </div>
        {showHierarchy && !isAddingNewBank && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2">{!currentCategory ? renderCategoryOptions() : renderBankOptions()}</div>
          </div>
        )}
        {isAddingNewBank && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveNewBank();
                }
              }}
              placeholder="Enter new bank name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <button
              type="button"
              onClick={saveNewBank}
              className="px-4 py-2 border border-green-300 text-green-700 bg-green-50 shadow-sm rounded-md hover:bg-green-100 transition"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingNewBank(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-gray-50 shadow-sm rounded-md hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  // ----------------------
  // AccountSelect (Credit side: Revenue/AR/…)
  // ----------------------
  const AccountSelect = ({ value, onChange }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddingNewAccount, setIsAddingNewAccount] = useState(false);
    const [newAccountName, setNewAccountName] = useState("");
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
          setIsAddingNewAccount(false);
          setSearchTerm("");
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredAccounts = creditAccountOptions.filter((acc) =>
      acc.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleAccountSelect = (name) => {
      onChange(name);
      setShowDropdown(false);
      setSearchTerm("");
      amountRef.current?.focus();
    };

    const handleInputChange = (e) => {
      const inputValue = e.target.value;
      setSearchTerm(inputValue);
      setShowDropdown(true);
      const exactMatch = creditAccountOptions.find((acc) => acc.toLowerCase() === inputValue.toLowerCase());
      if (exactMatch) {
        onChange(exactMatch);
      } else if (inputValue === "") {
        onChange("");
      }
    };

    const handleInputFocus = () => {
      setShowDropdown(true);
      setSearchTerm(value || "");
    };

    const handleInputBlur = () => {
      setTimeout(() => {
        if (!dropdownRef.current?.contains(document.activeElement)) {
          setShowDropdown(false);
          setSearchTerm("");
        }
      }, 150);
    };

    const handleKeyDownInner = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredAccounts.length >= 1) {
          handleAccountSelect(filteredAccounts[0]);
        } else if (searchTerm) {
          onChange(searchTerm);
          setShowDropdown(false);
          amountRef.current?.focus();
        } else {
          amountRef.current?.focus();
        }
      } else if (e.key === "Escape") {
        setShowDropdown(false);
        setSearchTerm("");
      }
    };

    const startAddingNewAccount = () => {
      setIsAddingNewAccount(true);
      setNewAccountName(searchTerm);
      setShowDropdown(false);
    };

    const saveNewAccount = () => {
      const trimmedName = newAccountName.trim();
      if (!trimmedName) {
        alert("Please enter an account name");
        return;
      }
      if (creditAccountOptions.includes(trimmedName)) {
        alert("Account name already exists");
        return;
      }
      const updated = [...creditAccountOptions, trimmedName];
      setCreditAccountOptions(updated);
      onChange(trimmedName);
      setIsAddingNewAccount(false);
      setNewAccountName("");
      setSearchTerm("");
      amountRef.current?.focus();
    };

    const displayValue = showDropdown ? searchTerm : value || "";

    return (
      <div className="relative" ref={dropdownRef}>
        <input
          ref={(el) => {
            inputRef.current = el;
            if (accountRef) accountRef.current = el;
          }}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDownInner}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search or select account..."
          autoComplete="off"
        />
        {showDropdown && !isAddingNewAccount && (
          <div
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="p-2">
              <div className="font-semibold mb-2 text-gray-700">Credit Accounts</div>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((acc) => (
                  <div key={acc} onClick={() => handleAccountSelect(acc)} className="p-2 hover:bg-gray-100 cursor-pointer">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: searchTerm
                          ? acc.replace(
                            new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
                            '<mark class="bg-yellow-200">$1</mark>',
                          )
                          : acc,
                      }}
                    />
                  </div>
                ))
              ) : searchTerm ? (
                <div className="p-2 text-gray-500 italic">No accounts found for "{searchTerm}"</div>
              ) : (
                creditAccountOptions.map((acc) => (
                  <div key={acc} onClick={() => handleAccountSelect(acc)} className="p-2 hover:bg-gray-100 cursor-pointer">
                    {acc}
                  </div>
                ))
              )}
              <button
                type="button"
                onClick={startAddingNewAccount}
                className="p-2 hover:bg-gray-100 cursor-pointer text-blue-600 font-semibold w-full text-left border-t border-gray-200 mt-1"
              >
                + Add New Account{searchTerm && ` "${searchTerm}"`}
              </button>
            </div>
          </div>
        )}
        {isAddingNewAccount && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveNewAccount();
                }
              }}
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
              onClick={() => {
                setIsAddingNewAccount(false);
                setSearchTerm("");
                inputRef.current?.focus();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-gray-50 shadow-sm rounded-md hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  // ----------------------
  // Submit
  // ----------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!receiptDate) {
      alert("Please select a receipt date");
      dateRef.current?.focus();
      return;
    }
    if (!receipt) {
      alert("Please select a receipt account");
      receiptRef.current?.focus();
      return;
    }
    if (!account) {
      alert("Please select an account");
      accountRef.current?.focus();
      return;
    }
    if (!category) {
      alert("Please select a category for the account");
      categoryRef.current?.focus();
      return;
    }
    if (!amount) {
      alert("Please enter an amount");
      amountRef.current?.focus();
      return;
    }
    const floatAmount = Number.parseFloat(amount);
    if (isNaN(floatAmount)) {
      alert("Amount must be a number");
      amountRef.current?.focus();
      return;
    }
    if (Number.parseFloat(floatAmount) <= 0) {
      alert("Amount must be greater than 0");
      amountRef.current?.focus();
      return;
    }

    const newEntry = {
      date: receiptDate,
      receipt,
      account,
      amount: floatAmount,
      description: description.trim() || "",
      category,
    };
    onSave?.(newEntry);

    const entryReference = `Receipt-${Date.now()}`;
    const existingLedgerEntries = JSON.parse(localStorage.getItem("ledgerEntries") || "[]");

    // --- COA persist / update ---
    const coaKey = "chartOfAccounts";
    const coa = JSON.parse(localStorage.getItem(coaKey) || "{}");

    // Credit account uses user's selected category
    coa[account] = {
      ...(coa[account] || {}),
      category: normalizeCat(category),
    };
    // Receipt account (Cash/Bank) typically Asset
    if (!coa[receipt]?.category) {
      coa[receipt] = {
        ...(coa[receipt] || {}),
        category: "asset",
      };
    }
    localStorage.setItem(coaKey, JSON.stringify(coa));

    // Ledger lines with category
    const debitEntry = {
      date: receiptDate,
      account: receipt,
      debit: floatAmount,
      credit: 0,
      description: description.trim() || "",
      type: "Receipt",
      reference: entryReference,
      category: normalizeCat(coa[receipt]?.category || "asset"),
    };
    const creditEntry = {
      date: receiptDate,
      account: account,
      debit: 0,
      credit: floatAmount,
      description: description.trim() || "",
      type: "Receipt",
      reference: entryReference,
      category: normalizeCat(category),
    };

    const updatedLedgerEntries = [...existingLedgerEntries, debitEntry, creditEntry];
    localStorage.setItem("ledgerEntries", JSON.stringify(updatedLedgerEntries));

    setSuccessMessage(editData ? "Receipt entry updated successfully!" : "Receipt entry created successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);

    if (!editData) {
      setReceiptDate("");
      setReceipt("");
      setAccount("");
      setAmount("");
      setDescription("");
      setCategory("");
      dateRef.current?.focus();
    }
  };

  // ----------------------
  // UI
  // ----------------------
  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-center text-xl font-bold mb-4">{editData ? "Edit Receipt Entry" : "Add Receipt Entry"}</h2>
      {successMessage && <div className="text-green-700 text-center font-semibold mb-4">{successMessage}</div>}

      {/* Date Field */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-8">
          <label className="text-sm font-medium text-gray-700">Receipt Date</label>
          <input
            ref={dateRef}
            type="date"
            value={receiptDate}
            onChange={(e) => setReceiptDate(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, receiptRef)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            required
          />
        </div>
      </div>

      {/* Main Fields */}
      <div className="space-y-6">
        {/* Receipt (Debit) */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-32">Receipt</label>
          <div className="flex-1">
            <ReceiptSelect value={receipt} onChange={setReceipt} />
          </div>
        </div>

        {/* Account (Credit) + Category */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-32">Account</label>
          <div className="flex-1 flex gap-2 items-center">
            <div className="w-1/2">
              <AccountSelect value={account} onChange={setAccount} />
            </div>
            <div className="w-1/2">
              <select
                ref={categoryRef}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Amount Field */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-32">Amount (৳)</label>
          <input
            ref={amountRef}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, descriptionRef)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="0.00"
            step="any"
            min="0"
            required
          />
        </div>

        {/* Description Field */}
        <div className="flex items-start gap-4">
          <label className="text-sm font-medium text-gray-700 w-32 pt-2">Description</label>
          <textarea
            ref={descriptionRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                submitRef.current?.focus();
              }
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Optional description (Ctrl+Enter to move to submit)"
            rows="3"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <button
          type="button"
          onClick={() => {
            setReceiptDate("");
            setReceipt("");
            setAccount("");
            setAmount("");
            setDescription("");
            setCategory("");
            if (editData) onSave?.(null);
          }}
          className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 shadow-sm rounded-md hover:bg-red-100 transition"
        >
          {editData ? "Cancel" : "Clear"}
        </button>
        <button
          ref={submitRef}
          type="submit"
          className="px-4 py-2 border border-green-300 text-green-700 bg-green-50 shadow-sm rounded-md hover:bg-green-100 transition"
        >
          {editData ? "Update Receipt Entry" : "Create Receipt Entry"}
        </button>
      </div>
    </form>
  );
};

export default ReceiptForm;
