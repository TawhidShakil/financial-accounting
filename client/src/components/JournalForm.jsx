import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// Click outside hook
function useClickOutside(refs, callback) {
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideAnyRef = refs.some((ref) => ref.current && ref.current.contains(event.target));
      if (!isClickInsideAnyRef) callback();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [refs, callback]);
}

// small helpers
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

// ======================
// AccountSelect
// ======================
const AccountSelect = forwardRef(
  (
    {
      value,
      onChange,
      index,
      accountOptions,
      setAccountOptions,
      accountHierarchy,
      setAccountHierarchy,
      journalDate,
      calculateOpeningBalance,
      handleChange: parentHandleChange,
      typeSelectRefs,
      amountInputRefs,
    },
    ref,
  ) => {
    const [searchTerm, setSearchTerm] = useState(value || "");
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCategoryHierarchy, setShowCategoryHierarchy] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [currentSubcategory, setCurrentSubcategory] = useState(null);
    const [newAccountName, setNewAccountName] = useState("");
    const [isAddingNewAccount, setIsAddingNewAccount] = useState(false);
    const [newAccountCategory, setNewAccountCategory] = useState(null);
    const [newAccountSubcategory, setNewAccountSubcategory] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const [enterCount, setEnterCount] = useState(0);
    const [lastEnterTime, setLastEnterTime] = useState(0);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const newAccountInputRef = useRef(null);
    useImperativeHandle(ref, () => inputRef.current);

    useClickOutside([inputRef, dropdownRef], () => {
      setShowDropdown(false);
      setShowCategoryHierarchy(false);
      setCurrentCategory(null);
      setCurrentSubcategory(null);
      setSelectedIndex(-1);
      setIsAddingNewAccount(false);
      setEnterCount(0);
      setLastEnterTime(0);
    });

    useEffect(() => {
      setSearchTerm(value || "");
    }, [value]);

    const filteredAccountOptions = accountOptions.filter((account) =>
      account.toLowerCase().includes(searchTerm.toLowerCase()),
    );

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

    const accountExists = (name) => {
      const all = getAllAccountsFromHierarchy(accountHierarchy).map((a) => a.toLowerCase());
      return all.includes((name || "").trim().toLowerCase());
    };

    const getCurrentHierarchyOptions = () => {
      if (!currentCategory) {
        return Object.keys(accountHierarchy);
      } else if (!currentSubcategory) {
        if (Array.isArray(accountHierarchy[currentCategory])) {
          return [...accountHierarchy[currentCategory], "+ Add New Account"];
        } else {
          return Object.keys(accountHierarchy[currentCategory]);
        }
      } else {
        return [...accountHierarchy[currentCategory][currentSubcategory], "+ Add New Account"];
      }
    };

    // Input key handlers
    const handleInputKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
        setShowCategoryHierarchy(false);
        setCurrentCategory(null);
        setCurrentSubcategory(null);
        setSelectedIndex(-1);
        setIsAddingNewAccount(false);
        inputRef.current?.blur();
        setEnterCount(0);
        setLastEnterTime(0);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!showDropdown && !showCategoryHierarchy) {
          setShowDropdown(true);
          setSelectedIndex(0);
        } else if (showDropdown && !showCategoryHierarchy) {
          setSelectedIndex((prev) => (prev + 1) % (filteredAccountOptions.length + 1));
        } else if (showCategoryHierarchy) {
          const currentOptions = getCurrentHierarchyOptions();
          setSelectedIndex((prev) => (prev + 1) % currentOptions.length);
        }
        setEnterCount(0);
        setLastEnterTime(0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!showDropdown && !showCategoryHierarchy) {
          setShowDropdown(true);
          setSelectedIndex(filteredAccountOptions.length);
        } else if (showDropdown && !showCategoryHierarchy) {
          setSelectedIndex(
            (prev) => (prev - 1 + filteredAccountOptions.length + 1) % (filteredAccountOptions.length + 1),
          );
        } else if (showCategoryHierarchy) {
          const currentOptions = getCurrentHierarchyOptions();
          setSelectedIndex((prev) => (prev - 1 + currentOptions.length) % currentOptions.length);
        }
        setEnterCount(0);
        setLastEnterTime(0);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isAddingNewAccount) {
          saveNewAccount(undefined, newAccountCategory, newAccountSubcategory);
          return;
        }
        const currentTime = Date.now();
        const isDoubleEnter = enterCount === 1 && currentTime - lastEnterTime < 5000;
        if (isDoubleEnter) {
          setShowDropdown(true);
          setShowCategoryHierarchy(false);
          setCurrentCategory(null);
          setCurrentSubcategory(null);
          setSelectedIndex(0);
          setEnterCount(0);
          setLastEnterTime(0);
        } else {
          setEnterCount(enterCount + 1);
          setLastEnterTime(currentTime);
          setTimeout(() => {
            setEnterCount(0);
            setLastEnterTime(0);
          }, 5000);

          if (showDropdown || showCategoryHierarchy) {
            const currentOptions =
              showDropdown && !showCategoryHierarchy
                ? [...filteredAccountOptions, "+ Add New Account"]
                : getCurrentHierarchyOptions();

            if (selectedIndex >= 0 && selectedIndex < currentOptions.length) {
              const selectedOption = currentOptions[selectedIndex];
              handleOptionSelect(selectedOption);
            } else if (searchTerm && filteredAccountOptions.includes(searchTerm)) {
              handleAccountSelect(searchTerm);
            } else {
              setShowDropdown(false);
              setShowCategoryHierarchy(false);
            }
          } else {
            setShowDropdown(true);
            setSelectedIndex(0);
          }
        }
      }
    };

    const handleInputChange = (e) => setSearchTerm(e.target.value);

    // Select / Add logic
    const handleAccountSelect = (account) => {
      setSearchTerm(account);
      onChange(account);

      // Opening balance এখন 0 (server-সোর্স না থাকায়)
      const openingBalance = calculateOpeningBalance(account, journalDate);
      parentHandleChange(index, "openingBalance", openingBalance);

      setShowDropdown(false);
      setShowCategoryHierarchy(false);
      setCurrentCategory(null);
      setCurrentSubcategory(null);
      setSelectedIndex(-1);
      setTimeout(() => {
        if (index <= 1) {
          amountInputRefs?.current?.[index]?.focus();
        } else {
          typeSelectRefs?.current?.[index]?.focus();
        }
      }, 50);
      setEnterCount(0);
      setLastEnterTime(0);
    };

    // save new account (🔔 localStorage persist বাদ)
    const saveNewAccount = (nameOverride, categoryArg, subcategoryArg) => {
      try {
        const raw = (nameOverride ?? newAccountName ?? "").trim();
        if (!raw) {
          alert("Please enter an account name");
          return;
        }
        if (accountExists(raw)) {
          alert("Account name already exists");
          return;
        }

        const category = categoryArg ?? newAccountCategory;
        const subcategory = subcategoryArg ?? newAccountSubcategory;

        const updatedHierarchy = JSON.parse(JSON.stringify(accountHierarchy));
        if (subcategory) {
          if (!updatedHierarchy[category]?.[subcategory]) {
            updatedHierarchy[category][subcategory] = [];
          }
          updatedHierarchy[category][subcategory].push(raw);
        } else if (Array.isArray(updatedHierarchy[category])) {
          updatedHierarchy[category].push(raw);
        } else {
          alert("Please select a subcategory for this account type.");
          return;
        }

        setAccountHierarchy(updatedHierarchy);
        const updatedAccounts = [...new Set([...accountOptions, raw])];
        setAccountOptions(updatedAccounts);

        // ❌ chartOfAccounts localStorage persist ছিল — এখন সরানো হয়েছে

        handleAccountSelect(raw);

        setIsAddingNewAccount(false);
        setNewAccountName("");
        setEnterCount(0);
        setLastEnterTime(0);
      } catch (err) {
        console.error("Error saving new account:", err);
        alert("An error occurred while saving the new account");
      }
    };

    const startAddingNewAccount = (category, subcategory = null) => {
      setNewAccountCategory(category);
      setNewAccountSubcategory(subcategory);

      const typed = (searchTerm || "").trim();
      if (typed && !accountExists(typed)) {
        saveNewAccount(typed, category, subcategory);
        setShowCategoryHierarchy(false);
        setShowDropdown(false);
        setSelectedIndex(-1);
      } else {
        setIsAddingNewAccount(true);
        setNewAccountName(typed && accountExists(typed) ? "" : typed);
        setShowCategoryHierarchy(false);
        setShowDropdown(false);
        setSelectedIndex(-1);
      }

      setEnterCount(0);
      setLastEnterTime(0);
    };

    const handleOptionSelect = (option) => {
      if (showDropdown && !showCategoryHierarchy) {
        if (option === "+ Add New Account") {
          setShowDropdown(false);
          setShowCategoryHierarchy(true);
          setCurrentCategory(null);
          setCurrentSubcategory(null);
          setSelectedIndex(0);
        } else {
          handleAccountSelect(option);
        }
      } else if (showCategoryHierarchy) {
        if (option === "+ Add New Account") {
          startAddingNewAccount(currentCategory, currentSubcategory);
        } else if (!currentCategory) {
          const typed = (searchTerm || "").trim();
          if (Array.isArray(accountHierarchy[option])) {
            if (typed && !accountExists(typed)) {
              setNewAccountCategory(option);
              setNewAccountSubcategory(null);
              saveNewAccount(typed, option, null);
              setShowCategoryHierarchy(false);
              setShowDropdown(false);
              setSelectedIndex(-1);
            } else {
              setCurrentCategory(option);
              setSelectedIndex(0);
            }
          } else {
            setCurrentCategory(option);
            setSelectedIndex(0);
          }
        } else if (!currentSubcategory) {
          const typed = (searchTerm || "").trim();
          if (Array.isArray(accountHierarchy[currentCategory])) {
            handleAccountSelect(option);
          } else {
            if (typed && !accountExists(typed)) {
              setNewAccountCategory(currentCategory);
              setNewAccountSubcategory(option);
              saveNewAccount(typed, currentCategory, option);
              setShowCategoryHierarchy(false);
              setShowDropdown(false);
              setSelectedIndex(-1);
            } else {
              setCurrentSubcategory(option);
              setSelectedIndex(0);
            }
          }
        } else {
          handleAccountSelect(option);
        }
      }
      setEnterCount(0);
      setLastEnterTime(0);
    };

    // Renderers (unchanged UI)
    const renderExistingAccounts = () => (
      <>
        {filteredAccountOptions.length > 0 ? (
          filteredAccountOptions.map((account, idx) => (
            <div
              key={account}
              onClick={() => handleAccountSelect(account)}
              className={`p-2 cursor-pointer flex justify-between items-center ${selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
            >
              <span className="flex-grow">{account}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const updatedHierarchy = JSON.parse(JSON.stringify(accountHierarchy));
                  for (const category in updatedHierarchy) {
                    if (Array.isArray(updatedHierarchy[category])) {
                      if (updatedHierarchy[category].includes(account)) {
                        updatedHierarchy[category] = updatedHierarchy[category].filter((a) => a !== account);
                        setAccountHierarchy(updatedHierarchy);
                        setAccountOptions((prev) => prev.filter((a) => a !== account));
                        if (value === account) {
                          onChange("");
                          setSearchTerm("");
                        }
                        return;
                      }
                    } else {
                      for (const subcategory in updatedHierarchy[category]) {
                        if (updatedHierarchy[category][subcategory].includes(account)) {
                          updatedHierarchy[category][subcategory] =
                            updatedHierarchy[category][subcategory].filter((a) => a !== account);
                          setAccountHierarchy(updatedHierarchy);
                          setAccountOptions((prev) => prev.filter((a) => a !== account));
                          if (value === account) {
                            onChange("");
                            setSearchTerm("");
                          }
                          return;
                        }
                      }
                    }
                  }
                }}
                className="text-red-500 hover:text-red-700 ml-2"
                title="Delete account"
              >
                −
              </button>
            </div>
          ))
        ) : (
          <div className="p-2 text-gray-500">No matching accounts.</div>
        )}

        <div
          onClick={() => handleOptionSelect("+ Add New Account")}
          className={`p-2 cursor-pointer text-blue-600 font-semibold border-t border-2 border-gray-200 ${selectedIndex === filteredAccountOptions.length ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
        >
          {searchTerm.trim()
            ? accountExists(searchTerm)
              ? "+ Add New Account"
              : `+ Add “${searchTerm.trim()}” account`
            : "+ Add New Account"}
        </div>
      </>
    );

    const renderCategoryOptions = () => (
      <>
        <div
          onClick={() => {
            setShowCategoryHierarchy(false);
            setShowDropdown(true);
            setSelectedIndex(0);
          }}
          className="p-2 border border-transparent hover:border-blue-400 cursor-pointer flex items-center text-blue-600 rounded-md transition-colors duration-200"
        >
          ← Back to Accounts
        </div>
        <div className="font-semibold mb-2 text-gray-700 px-2">Select Category</div>
        {Object.keys(accountHierarchy)
          .filter((category) => category !== "Other")
          .map((category, idx) => (
            <div
              key={category}
              onClick={() => handleOptionSelect(category)}
              className={`p-2 cursor-pointer flex justify-between items-center ${selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
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
                  onClick={() => handleAccountSelect(account)}
                  className={`p-2 cursor-pointer flex justify-between items-center ${selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
                    }`}
                >
                  <span className="flex-grow">{account}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = JSON.parse(JSON.stringify(accountHierarchy));
                      updated[currentCategory] = updated[currentCategory].filter((a) => a !== account);
                      setAccountHierarchy(updated);
                      setAccountOptions((prev) => prev.filter((a) => a !== account));
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
                className={`p-2 cursor-pointer text-blue-600 font-semibold w-full text-left ${selectedIndex === accountHierarchy[currentCategory].length ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
              >
                {searchTerm.trim()
                  ? accountExists(searchTerm)
                    ? "+ Add New Account"
                    : `+ Add “${searchTerm.trim()}” account`
                  : "+ Add New Account"}
              </div>
            </>
          ) : (
            Object.keys(accountHierarchy[currentCategory]).map((subcategory, idx) => (
              <div
                key={subcategory}
                onClick={() => handleOptionSelect(subcategory)}
                className={`p-2 cursor-pointer flex justify-between items-center ${selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
              >
                <span>{subcategory}</span>
                <span className="text-gray-500">→</span>
              </div>
            ))
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
              onClick={() => handleAccountSelect(account)}
              className={`p-2 cursor-pointer flex justify-between items-center ${selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
            >
              <span className="flex-grow">{account}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const updated = JSON.parse(JSON.stringify(accountHierarchy));
                  updated[currentCategory][currentSubcategory] = updated[currentCategory][currentSubcategory].filter(
                    (a) => a !== account,
                  );
                  setAccountHierarchy(updated);
                  setAccountOptions((prev) => prev.filter((a) => a !== account));
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
            className={`p-2 cursor-pointer text-blue-600 font-semibold w-full text-left ${selectedIndex === accounts.length ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
          >
            {searchTerm.trim()
              ? accountExists(searchTerm)
                ? "+ Add New Account"
                : `+ Add “${searchTerm.trim()}” account`
              : "+ Add New Account"}
          </div>
        </>
      );
    };

    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Select Account"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none hover:bg-gray-50"
        />

        {showDropdown && !showCategoryHierarchy && !isAddingNewAccount && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {renderExistingAccounts()}
          </div>
        )}

        {showCategoryHierarchy && !isAddingNewAccount && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {!currentCategory ? renderCategoryOptions() : !currentSubcategory ? renderSubcategoryOptions() : renderAccountOptions()}
          </div>
        )}

        {isAddingNewAccount && (
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={newAccountInputRef}
              type="text"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  saveNewAccount(undefined, newAccountCategory, newAccountSubcategory);
                }
              }}
              placeholder="Enter new account name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <button
              type="button"
              onClick={() => saveNewAccount(undefined, newAccountCategory, newAccountSubcategory)}
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
  },
);
AccountSelect.displayName = "AccountSelect";

// ======================
// TypeSelect
// ======================
const TypeSelect = forwardRef(({ value, onChange, index, amountInputRefs }, ref) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [enterCount, setEnterCount] = useState(0);
  const [lastEnterTime, setLastEnterTime] = useState(0);

  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const options = ["Debit", "Credit"];

  useImperativeHandle(ref, () => triggerRef.current);

  useClickOutside([triggerRef, dropdownRef], () => {
    setShowDropdown(false);
    setSelectedIndex(-1);
    setEnterCount(0);
    setLastEnterTime(0);
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
        setSelectedIndex(-1);
        triggerRef.current?.focus();
        setEnterCount(0);
        setLastEnterTime(0);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDropdownKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      const currentTime = Date.now();
      const isDoubleEnter = enterCount === 1 && currentTime - lastEnterTime < 5000;

      if (isDoubleEnter) {
        setShowDropdown(true);
        setSelectedIndex(options.indexOf(value) >= 0 ? options.indexOf(value) : 0);
        setEnterCount(0);
        setLastEnterTime(0);
      } else {
        setEnterCount(enterCount + 1);
        setLastEnterTime(currentTime);
        setTimeout(() => {
          setEnterCount(0);
          setLastEnterTime(0);
        }, 5000);

        if (showDropdown) {
          if (selectedIndex >= 0) {
            onChange(options[selectedIndex]);
            setShowDropdown(false);
            setTimeout(() => {
              amountInputRefs.current[index]?.focus();
            }, 0);
          }
        } else {
          setShowDropdown(true);
          setSelectedIndex(options.indexOf(value) >= 0 ? options.indexOf(value) : 0);
        }
      }
      return;
    }
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % options.length);
      setEnterCount(0);
      setLastEnterTime(0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + options.length) % options.length);
      setEnterCount(0);
      setLastEnterTime(0);
    }
  };

  const handleOptionSelect = (option) => {
    onChange(option);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setTimeout(() => {
      amountInputRefs.current[index]?.focus();
    }, 0);
    setEnterCount(0);
    setLastEnterTime(0);
  };

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) {
            setSelectedIndex(options.indexOf(value) >= 0 ? options.indexOf(value) : 0);
          }
        }}
        tabIndex={0}
        onKeyDown={handleDropdownKeyDown}
        className={`w-full p-2 border rounded-md cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:outline-none ${value === "Debit" ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
          }`}
      >
        <span>{value}</span>
        <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
      </div>
      {showDropdown && (
        <div ref={dropdownRef} className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {options.map((option, idx) => (
            <div
              key={option}
              onClick={() => handleOptionSelect(option)}
              className={`p-2 cursor-pointer ${selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"}`}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
TypeSelect.displayName = "TypeSelect";

// ======================
// JournalForm (parent)
// ======================
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
    { account: "", type: "Debit", amount: "", openingBalance: 0 },
    { account: "", type: "Credit", amount: "", openingBalance: 0 },
  ]);
  const [successMessage, setSuccessMessage] = useState("");
  const [description, setDescription] = useState("");

  const dateInputRef = useRef(null);
  const accountSelectRefs = useRef([]);
  const typeSelectRefs = useRef([]);
  const amountInputRefs = useRef([]);
  const descriptionInputRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    dateInputRef.current?.focus();
  }, []);

  
  const calculateOpeningBalance = () => 0;

  useEffect(() => {
    accountSelectRefs.current = accountSelectRefs.current.slice(0, entries.length);
    typeSelectRefs.current = typeSelectRefs.current.slice(0, entries.length);
    amountInputRefs.current = amountInputRefs.current.slice(0, entries.length);
  }, [entries]);

  useEffect(() => {
    if (editData) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setJournalDate(editData.date);
      setDescription(editData.description || "");
      const entriesWithBalance = editData.entries.map((entry) => ({
        ...entry,
        openingBalance: 0, 
      }));
      setEntries(entriesWithBalance);
    } else {
      setJournalDate("");
      setDescription("");
      setEntries([
        { account: "", type: "Debit", amount: "", openingBalance: 0 },
        { account: "", type: "Credit", amount: "", openingBalance: 0 },
      ]);
    }
  }, [editData]);

  useEffect(() => {
    if (journalDate) {
      const updatedEntries = entries.map((entry) => ({
        ...entry,
        openingBalance: entry.account ? 0 : 0,
      }));
      setEntries(updatedEntries);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalDate]);

  const handleKeyDown = (e, index, fieldType) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (fieldType === "date") {
        accountSelectRefs.current[0]?.focus();
      } else if (fieldType === "type") {
        amountInputRefs.current[index]?.focus();
      } else if (fieldType === "amount") {
        if (index < entries.length - 1) {
          accountSelectRefs.current[index + 1]?.focus();
        } else {
          descriptionInputRef.current?.focus();
        }
      } else if (fieldType === "description") {
        handleSubmit({ preventDefault: () => { } });
      }
    }
  };

  const addRow = () =>
    setEntries([...entries, { account: "", type: "Debit", amount: "", openingBalance: 0 }]);

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
    if (field === "account") {
      updated[index]["openingBalance"] = 0;
    }
    setEntries(updated);
  };

  // accountHierarchy থেকে category ধরার জন্য (localStorage ছাড়া)
  const findCategoryFromHierarchy = (name) => {
    if (!name) return "";
    for (const cat of Object.keys(accountHierarchy)) {
      const v = accountHierarchy[cat];
      if (Array.isArray(v)) {
        if (v.includes(name)) return cat;
      } else {
        for (const sub of Object.keys(v)) {
          if (v[sub].includes(name)) return cat;
        }
      }
    }
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!journalDate) {
      alert("Please select a journal date");
      dateInputRef.current?.focus();
      return;
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry.account) {
        alert("Please fill all account fields");
        accountSelectRefs.current[i]?.focus();
        return;
      }
      if (!entry.amount) {
        alert("Please fill all amounts");
        amountInputRefs.current[i]?.focus();
        return;
      }
      if (isNaN(entry.amount)) {
        alert("Amount must be a number");
        amountInputRefs.current[i]?.focus();
        return;
      }
      if (Number.parseFloat(entry.amount) <= 0) {
        alert("Amount must be greater than 0");
        amountInputRefs.current[i]?.focus();
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
      alert(`Total debits (${totalDebit}) must equal total credits (${totalCredit})`);
      accountSelectRefs.current[0]?.focus();
      return;
    }

    // ❌ localStorage('chartOfAccounts') বাদ — category হায়ারার্কি থেকে আন্দাজ
    const newEntry = {
      date: journalDate,
      description: description,
      entries: entries.map((entry) => ({
        ...entry,
        amount: Number.parseFloat(entry.amount),
        category: normalizeCat(findCategoryFromHierarchy(entry.account) || entry.category || ""),
        source: "journal",
      })),
    };

    onSave && onSave(newEntry);

    setSuccessMessage(editData ? "Journal entry updated successfully!" : "Journal entry created successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);

    if (!editData) {
      setJournalDate("");
      setDescription("");
      setEntries([
        { account: "", type: "Debit", amount: "", openingBalance: 0 },
        { account: "", type: "Credit", amount: "", openingBalance: 0 },
      ]);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-center text-xl font-bold mb-4">{editData ? "Edit Journal Entry" : "Add Journal Entry"}</h2>
      {successMessage && <div className="text-green-700 text-center font-semibold mb-4">{successMessage}</div>}

      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-8">
          <label className="text-sm font-medium text-gray-700">Journal Date</label>
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
        <div className="col-span-4 text-center">Account</div>
        <div className="col-span-2 text-center">Opening Balance</div>
        <div className="col-span-2 text-center">Type</div>
        <div className="col-span-3 text-center">Amount (Tk.)</div>
        <div className="col-span-1 text-right">Action</div>
      </div>

      {entries.map((entry, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
          <div className="col-span-4">
            <AccountSelect
              value={entry.account}
              onChange={(value) => handleChange(index, "account", value)}
              index={index}
              ref={(el) => (accountSelectRefs.current[index] = el)}
              accountOptions={accountOptions}
              setAccountOptions={setAccountOptions}
              accountHierarchy={accountHierarchy}
              setAccountHierarchy={setAccountHierarchy}
              journalDate={journalDate}
              calculateOpeningBalance={calculateOpeningBalance}
              handleChange={handleChange}
              typeSelectRefs={typeSelectRefs}
              amountInputRefs={amountInputRefs}
            />
          </div>

          <div className="col-span-2">
            <div className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-center font-medium text-sm">
              <span className="text-gray-500">৳ 0.00</span>
            </div>
          </div>

          <div className="col-span-2">
            <TypeSelect
              value={entry.type}
              onChange={(value) => handleChange(index, "type", value)}
              index={index}
              amountInputRefs={amountInputRefs}
              ref={(el) => (typeSelectRefs.current[index] = el)}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
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
            if (editData) {
              setJournalDate(editData.date);
              setDescription(editData.description || "");
              const entriesWithBalance = editData.entries.map((entry) => ({
                ...entry,
                openingBalance: 0,
              }));
              setEntries(entriesWithBalance);
            } else {
              setJournalDate("");
              setDescription("");
              setEntries([
                { account: "", type: "Debit", amount: "", openingBalance: 0 },
                { account: "", type: "Credit", amount: "", openingBalance: 0 },
              ]);
            }
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
