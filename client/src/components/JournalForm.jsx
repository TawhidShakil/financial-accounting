import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

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
    accountSelectRefs.current = accountSelectRefs.current.slice(
      0,
      entries.length
    );
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (fieldType === "date") {
        if (accountSelectRefs.current[0]) {
          accountSelectRefs.current[0].focus();
        }
      } else if (fieldType === "account") {
        typeSelectRefs.current[index]?.focus();
      } else if (fieldType === "type") {
        amountInputRefs.current[index]?.focus();
      } else if (fieldType === "amount") {
        if (index < entries.length - 1) {
          accountSelectRefs.current[index + 1]?.focus();
        } else {
          descriptionInputRef.current?.focus();
        }
      } else if (fieldType === "description") {
        handleSubmit({ preventDefault: () => {} });
      }
    }
  };

  // Custom hook for click outside detection
  function useClickOutside(refs, callback) {
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          refs.every(
            (ref) => ref.current && !ref.current.contains(event.target)
          )
        ) {
          callback();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, [refs, callback]);
  }

  // Type Select Component with Enhanced Navigation
  const TypeSelect = ({ value, onChange, index }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [enterPressed, setEnterPressed] = useState(false);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const options = ["Debit", "Credit"];

    // Close when clicking outside
    useClickOutside([triggerRef, dropdownRef], () => {
      setShowDropdown(false);
      setSelectedIndex(-1);
    });

    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setShowDropdown(false);
          setSelectedIndex(-1);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Handle keyboard navigation in dropdown
    const handleDropdownKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();

        if (showDropdown) {
        // If dropdown is open and Enter is pressed
        if (selectedIndex >= 0) {
          onChange(options[selectedIndex]);
          setShowDropdown(false);
          setTimeout(() => {
            amountInputRefs.current[index]?.focus();
          }, 0);
        }
      } else {
        // If dropdown is closed and Enter is pressed
        setShowDropdown(true);
        setSelectedIndex(options.indexOf(value) >= 0 ? options.indexOf(value) : 0);
      }
      return;
    }

      if (!showDropdown) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % options.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + options.length) % options.length
        );
      }
    };

    const handleOptionSelect = (option) => {
      onChange(option);
      setShowDropdown(false);
      setSelectedIndex(-1);
      // Auto-focus to amount field
      setTimeout(() => {
        amountInputRefs.current[index]?.focus();
      }, 0);
    };

    return (
      <div className="relative" tabIndex={0} onKeyDown={handleDropdownKeyDown}>
        <div
          ref={triggerRef}
          onClick={() => {
            setShowDropdown(!showDropdown);
            if (!showDropdown) {
              setSelectedIndex(
                options.indexOf(value) >= 0 ? options.indexOf(value) : 0
              );
            }
          }}
          className={`w-full p-2 border rounded-md cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:outline-none ${
            value === "Debit"
              ? "border-green-300 bg-green-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <span>{value}</span>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-500 transition-transform ${
              showDropdown ? "transform rotate-180" : ""
            }`}
          />
        </div>
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg"
          >
            {options.map((option, idx) => (
              <div
                key={option}
                onClick={() => handleOptionSelect(option)}
                className={`p-2 cursor-pointer ${
                  selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
                } ${option === "Debit" ? "text-black-700" : "text-black-700"}`}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [doubleEnterCount, setDoubleEnterCount] = useState(0);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const newAccountInputRef = useRef(null);

    // Close when clicking outside
    useClickOutside([triggerRef, dropdownRef], () => {
      setShowHierarchy(false);
      setCurrentCategory(null);
      setCurrentSubcategory(null);
      setSelectedIndex(-1);
    });

    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setShowHierarchy(false);
          setCurrentCategory(null);
          setCurrentSubcategory(null);
          setSelectedIndex(-1);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Handle keyboard navigation in dropdown
    const handleDropdownKeyDown = (e) => {
      if (!showHierarchy) {
        if (e.key === "Enter") {
          // Track double enter
          setDoubleEnterCount((prev) => prev + 1);
          setTimeout(() => setDoubleEnterCount(0), 300); // Reset after 300ms

          if (doubleEnterCount === 0) {
            // First Enter - move to next field
            e.preventDefault();
            setTimeout(() => {
              typeSelectRefs.current[index]?.focus();
            }, 0);
          } else if (doubleEnterCount === 1) {
            // Second Enter - open dropdown
            e.preventDefault();
            setShowHierarchy(true);
            setSelectedIndex(0);
          }
        }
        return;
      }

      const getCurrentOptions = () => {
        if (!currentCategory) {
          return Object.keys(accountHierarchy);
        } else if (!currentSubcategory) {
          if (Array.isArray(accountHierarchy[currentCategory])) {
            return [...accountHierarchy[currentCategory], "+ Add New Account"];
          } else {
            return Object.keys(accountHierarchy[currentCategory]);
          }
        } else {
          return [
            ...accountHierarchy[currentCategory][currentSubcategory],
            "+ Add New Account",
          ];
        }
      };

      const currentOptions = getCurrentOptions();

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % currentOptions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + currentOptions.length) % currentOptions.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < currentOptions.length) {
          const selectedOption = currentOptions[selectedIndex];
          handleOptionSelect(selectedOption);
        }
      }
    };

    const handleOptionSelect = (option) => {
      if (!currentCategory) {
        // Selecting category
        setCurrentCategory(option);
        setSelectedIndex(0);
      } else if (!currentSubcategory) {
        if (option === "+ Add New Account") {
          startAddingNewAccount(currentCategory);
        } else if (Array.isArray(accountHierarchy[currentCategory])) {
          // Direct account selection
          handleAccountSelect(option);
        } else {
          // Selecting subcategory
          setCurrentSubcategory(option);
          setSelectedIndex(0);
        }
      } else {
        if (option === "+ Add New Account") {
          startAddingNewAccount(currentCategory, currentSubcategory);
        } else {
          // Final account selection
          handleAccountSelect(option);
        }
      }
    };

    const handleAccountSelect = (account) => {
      onChange(account);
      setShowHierarchy(false);
      setCurrentCategory(null);
      setCurrentSubcategory(null);
      setSelectedIndex(-1);
      // Auto-focus to type select after account selection
      setTimeout(() => {
        const typeSelect = typeSelectRefs.current[index];
        if (typeSelect) {
          typeSelect.focus();
        }
      }, 50);
    };

    const startAddingNewAccount = (category, subcategory = null) => {
      setIsAddingNewAccount(true);
      setNewAccountCategory(category);
      setNewAccountSubcategory(subcategory);
      setNewAccountName("");
      setShowHierarchy(false);
      setSelectedIndex(-1);
    };

    const deleteAccount = (account, category, subcategory = null) => {
      const updatedHierarchy = JSON.parse(JSON.stringify(accountHierarchy));
      if (subcategory) {
        updatedHierarchy[category][subcategory] = updatedHierarchy[category][
          subcategory
        ].filter((acc) => acc !== account);
      } else if (Array.isArray(updatedHierarchy[category])) {
        updatedHierarchy[category] = updatedHierarchy[category].filter(
          (acc) => acc !== account
        );
      } else {
        if (updatedHierarchy[category]?.["Other"]) {
          updatedHierarchy[category]["Other"] = updatedHierarchy[category][
            "Other"
          ].filter((acc) => acc !== account);
        }
      }
      setAccountHierarchy(updatedHierarchy);
      const updatedAccounts = accountOptions.filter((acc) => acc !== account);
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
          updatedHierarchy[newAccountCategory][newAccountSubcategory].push(
            trimmedName
          );
        } else if (Array.isArray(updatedHierarchy[newAccountCategory])) {
          updatedHierarchy[newAccountCategory].push(trimmedName);
        } else {
          if (!updatedHierarchy[newAccountCategory]) {
            updatedHierarchy[newAccountCategory] = { Other: [] };
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

    // Handle Enter key in new account input
    const handleNewAccountKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation(); // Add this to prevent form submission
        saveNewAccount();
      }
    };

    const renderCategoryOptions = () => (
      <>
        <div className="font-semibold mb-2 text-gray-700 px-2">
          Main Categories
        </div>
        {Object.keys(accountHierarchy).map((category, idx) => (
          <div
            key={category}
            onClick={() => handleOptionSelect(category)}
            className={`p-2 cursor-pointer flex justify-between items-center ${
              selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
          >
            <span>{category}</span>
            <span className="text-gray-500">→</span>
          </div>
        ))}
      </>
    );

    const renderSubcategoryOptions = () => {
      const options = Array.isArray(accountHierarchy[currentCategory])
        ? [...accountHierarchy[currentCategory], "+ Add New Account"]
        : Object.keys(accountHierarchy[currentCategory]);

      return (
        <>
          <div
            onClick={() => {
              setCurrentCategory(null);
              setSelectedIndex(0);
            }}
            className="p-2 border border-transparent hover:border-blue-400 cursor-pointer flex items-center text-blue-600 rounded-md transition-colors duration-200"
          >
            ← Back to Categories
          </div>
          <div className="font-semibold mb-2 border border-gray-300 bg-gray-200 shadow-sm text-gray-800 text-center py-1">
            {currentCategory}
          </div>
          {Array.isArray(accountHierarchy[currentCategory]) ? (
            <>
              {accountHierarchy[currentCategory].map((account, idx) => (
                <div
                  key={account}
                  className={`p-2 cursor-pointer flex justify-between items-center ${
                    selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
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
              <div
                onClick={() => handleOptionSelect("+ Add New Account")}
                className={`p-2 cursor-pointer text-blue-600 font-semibold w-full text-left ${
                  selectedIndex === accountHierarchy[currentCategory].length
                    ? "bg-blue-100"
                    : "hover:bg-gray-100"
                }`}
              >
                + Add New Account
              </div>
            </>
          ) : (
            Object.keys(accountHierarchy[currentCategory]).map(
              (subcategory, idx) => (
                <div
                  key={subcategory}
                  onClick={() => handleOptionSelect(subcategory)}
                  className={`p-2 cursor-pointer flex justify-between items-center ${
                    selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
                >
                  <span>{subcategory}</span>
                  <span className="text-gray-500">→</span>
                </div>
              )
            )
          )}
        </>
      );
    };

    const renderAccountOptions = () => {
      const accounts = accountHierarchy[currentCategory][currentSubcategory];
      return (
        <>
          <div
            onClick={() => {
              setCurrentSubcategory(null);
              setSelectedIndex(0);
            }}
            className="p-2 border border-transparent hover:border-blue-400 cursor-pointer flex items-center text-blue-600 rounded-md transition-colors duration-200"
          >
            ← Back to {currentCategory}
          </div>
          <div className="font-semibold mb-2 border border-gray-300 bg-gray-200 shadow-sm text-gray-800 text-center py-1">
            {currentSubcategory}
          </div>
          {accounts.map((account, idx) => (
            <div
              key={account}
              className={`p-2 cursor-pointer flex justify-between items-center ${
                selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
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
          <div
            onClick={() => handleOptionSelect("+ Add New Account")}
            className={`p-2 cursor-pointer text-blue-600 font-semibold w-full text-left ${
              selectedIndex === accounts.length
                ? "bg-blue-100"
                : "hover:bg-gray-100"
            }`}
          >
            + Add New Account
          </div>
        </>
      );
    };

    return (
      <div
        className="relative"
        ref={(el) => (accountSelectRefs.current[index] = el)}
        tabIndex={0}
        onKeyDown={handleDropdownKeyDown}
      >
        <div
          ref={triggerRef}
          onClick={() => {
            setShowHierarchy(!showHierarchy);
            if (!showHierarchy) {
              setSelectedIndex(0);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:outline-none hover:bg-gray-50"
        >
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {value || "Select Account"}
          </span>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-500 transition-transform ${
              showHierarchy ? "transform rotate-180" : ""
            }`}
          />
        </div>
        {showHierarchy && !isAddingNewAccount && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {!currentCategory
              ? renderCategoryOptions()
              : !currentSubcategory
              ? renderSubcategoryOptions()
              : renderAccountOptions()}
          </div>
        )}
        {isAddingNewAccount && (
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={newAccountInputRef}
              type="text"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              onKeyDown={handleNewAccountKeyDown}
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
    for (const entry of entries) {
      if (!entry.account || !entry.amount) {
        alert("Please fill all account fields and amounts");
        return;
      }
    }
    for (const entry of entries) {
      if (isNaN(entry.amount)) {
        alert("Amount must be a number");
        return;
      }
      if (Number.parseFloat(entry.amount) <= 0) {
        alert("Amount must be greater than 0");
        return;
      }
    }
    const totalDebit = entries
      .filter((entry) => entry.type === "Debit")
      .reduce((sum, entry) => sum + Number.parseFloat(entry.amount), 0);
    const totalCredit = entries
      .filter((entry) => entry.type === "Credit")
      .reduce((sum, entry) => sum + Number.parseFloat(entry.amount), 0);
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
        amount: Number.parseFloat(entry.amount),
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
            onKeyDown={(e) => handleKeyDown(e, 0, "date")}
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
            <TypeSelect
              value={entry.type}
              onChange={(value) => handleChange(index, "type", value)}
              index={index}
            />
          </div>
          <div className="col-span-3">
            <input
              ref={(el) => (amountInputRefs.current[index] = el)}
              type="number"
              value={entry.amount}
              onChange={(e) => handleChange(index, "amount", e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index, "amount")}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
        className="mb-6 px-4 py-2 border border-blue-300 rounded-md text-blue-700 bg-blue-50 shadow-sm flex items-center hover:bg-blue-100 transition-colors"
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
          onKeyDown={(e) => handleKeyDown(e, 0, "description")}
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