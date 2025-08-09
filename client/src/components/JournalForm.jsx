import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { ChevronDownIcon } from "@heroicons/react/24/outline"

// Custom hook for click outside detection
function useClickOutside(refs, callback) {
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideAnyRef = refs.some((ref) => ref.current && ref.current.contains(event.target))
      if (!isClickInsideAnyRef) {
        callback()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [refs, callback])
}

// Account Select Component - Modified to be typable and filter suggestions
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
      handleChange: parentHandleChange, // Renamed to avoid conflict with internal handleChange
      typeSelectRefs, // Passed from parent for focus management
    },
    ref,
  ) => {
    const [searchTerm, setSearchTerm] = useState(value || "")
    const [showDropdown, setShowDropdown] = useState(false)
    const [showCategoryHierarchy, setShowCategoryHierarchy] = useState(false)
    const [currentCategory, setCurrentCategory] = useState(null)
    const [currentSubcategory, setCurrentSubcategory] = useState(null)
    const [newAccountName, setNewAccountName] = useState("")
    const [isAddingNewAccount, setIsAddingNewAccount] = useState(false)
    const [newAccountCategory, setNewAccountCategory] = useState(null)
    const [newAccountSubcategory, setNewAccountSubcategory] = useState(null)
    const [selectedIndex, setSelectedIndex] = useState(-1)

    // For double enter detection
    const [enterCount, setEnterCount] = useState(0)
    const [lastEnterTime, setLastEnterTime] = useState(0)

    const inputRef = useRef(null) // Internal ref for the input element
    const dropdownRef = useRef(null)
    const newAccountInputRef = useRef(null)

    // Expose the internal inputRef to the parent via the forwarded ref
    useImperativeHandle(ref, () => inputRef.current)

    // Close when clicking outside of input or dropdown
    useClickOutside([inputRef, dropdownRef], () => {
      setShowDropdown(false)
      setShowCategoryHierarchy(false)
      setCurrentCategory(null)
      setCurrentSubcategory(null)
      setSelectedIndex(-1)
      setIsAddingNewAccount(false) // Also close new account input
      setEnterCount(0) // Reset enter count on outside click
      setLastEnterTime(0)
    })

    useEffect(() => {
      setSearchTerm(value || "") // Keep input in sync with parent value
    }, [value])

    // Filter accounts based on searchTerm
    const filteredAccountOptions = accountOptions.filter((account) =>
      account.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Helper to get current options for hierarchy navigation
    const getCurrentHierarchyOptions = () => {
      if (!currentCategory) {
        return Object.keys(accountHierarchy)
      } else if (!currentSubcategory) {
        if (Array.isArray(accountHierarchy[currentCategory])) {
          return [...accountHierarchy[currentCategory], "+ Add New Account"]
        } else {
          return Object.keys(accountHierarchy[currentCategory])
        }
      } else {
        return [...accountHierarchy[currentCategory][currentSubcategory], "+ Add New Account"]
      }
    }

    // Handle keyboard navigation in the input field
    const handleInputKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowDropdown(false)
        setShowCategoryHierarchy(false)
        setCurrentCategory(null)
        setCurrentSubcategory(null)
        setSelectedIndex(-1)
        setIsAddingNewAccount(false)
        inputRef.current?.blur() // Remove focus from input
        setEnterCount(0)
        setLastEnterTime(0)
        return
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        if (!showDropdown && !showCategoryHierarchy) {
          setShowDropdown(true)
          setSelectedIndex(0)
        } else if (showDropdown && !showCategoryHierarchy) {
          setSelectedIndex((prev) => (prev + 1) % (filteredAccountOptions.length + 1)) // +1 for "Add New Account"
        } else if (showCategoryHierarchy) {
          const currentOptions = getCurrentHierarchyOptions()
          setSelectedIndex((prev) => (prev + 1) % currentOptions.length)
        }
        setEnterCount(0) // Reset enter count on arrow navigation
        setLastEnterTime(0)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        if (!showDropdown && !showCategoryHierarchy) {
          setShowDropdown(true)
          setSelectedIndex(filteredAccountOptions.length) // Select "Add New Account" or last filtered
        } else if (showDropdown && !showCategoryHierarchy) {
          setSelectedIndex(
            (prev) => (prev - 1 + filteredAccountOptions.length + 1) % (filteredAccountOptions.length + 1),
          )
        } else if (showCategoryHierarchy) {
          const currentOptions = getCurrentHierarchyOptions()
          setSelectedIndex((prev) => (prev - 1 + currentOptions.length) % currentOptions.length)
        }
        setEnterCount(0) // Reset enter count on arrow navigation
        setLastEnterTime(0)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (isAddingNewAccount) {
          saveNewAccount()
          return
        }

        const currentTime = Date.now()
        const isDoubleEnter = enterCount === 1 && currentTime - lastEnterTime < 5000 // 5 seconds for double enter

        if (isDoubleEnter) {
          // Double Enter: Open dropdown
          setShowDropdown(true)
          setShowCategoryHierarchy(false) // Ensure hierarchy is not shown initially
          setCurrentCategory(null)
          setCurrentSubcategory(null)
          setSelectedIndex(0)
          setEnterCount(0) // Reset for next sequence
          setLastEnterTime(0)
        } else {
          // Single Enter or first Enter in a sequence
          setEnterCount(enterCount + 1)
          setLastEnterTime(currentTime)

          // Reset enter count after a delay if no second enter occurs
          setTimeout(() => {
            setEnterCount(0)
            setLastEnterTime(0)
          }, 5000) // Reset after 5 seconds

          if (showDropdown || showCategoryHierarchy) {
            // If dropdown/hierarchy is open
            const currentOptions =
              showDropdown && !showCategoryHierarchy
                ? [...filteredAccountOptions, "+ Add New Account"]
                : getCurrentHierarchyOptions()

            if (selectedIndex >= 0 && selectedIndex < currentOptions.length) {
              // An item is highlighted, select it
              const selectedOption = currentOptions[selectedIndex]
              handleOptionSelect(selectedOption) // This will handle both account selection and hierarchy navigation
            } else if (searchTerm && filteredAccountOptions.includes(searchTerm)) {
              // No item highlighted, but typed value is an exact match
              handleAccountSelect(searchTerm)
            } else {
              // No item highlighted, no exact match, just close dropdown
              setShowDropdown(false)
              setShowCategoryHierarchy(false)
            }
          } else {
            // If dropdown is closed, open it
            setShowDropdown(true)
            setSelectedIndex(0) // Highlight first item
          }
        }
      }
    }

    const handleInputChange = (e) => {
      setSearchTerm(e.target.value)
    }

    const handleOptionSelect = (option) => {
      if (showDropdown && !showCategoryHierarchy) {
        // Currently in the main filtered list
        if (option === "+ Add New Account") {
          setShowDropdown(false)
          setShowCategoryHierarchy(true) // Transition to category selection
          setCurrentCategory(null) // Start from top of hierarchy
          setCurrentSubcategory(null)
          setSelectedIndex(0)
        } else {
          handleAccountSelect(option) // Select existing account
        }
      } else if (showCategoryHierarchy) {
        // Currently navigating category hierarchy
        if (option === "+ Add New Account") {
          // Now, if we are in hierarchy and click "Add New Account", it means we've chosen category/subcategory
          startAddingNewAccount(currentCategory, currentSubcategory)
        } else if (!currentCategory) {
          setCurrentCategory(option)
          setSelectedIndex(0)
        } else if (!currentSubcategory) {
          if (Array.isArray(accountHierarchy[currentCategory])) {
            handleAccountSelect(option)
          } else {
            setCurrentSubcategory(option)
            setSelectedIndex(0)
          }
        } else {
          handleAccountSelect(option)
        }
      }
      setEnterCount(0) // Reset enter count on option selection
      setLastEnterTime(0)
    }

    const handleAccountSelect = (account) => {
      setSearchTerm(account)
      onChange(account)
      const openingBalance = calculateOpeningBalance(account, journalDate)
      parentHandleChange(index, "openingBalance", openingBalance) // Use parentHandleChange
      setShowDropdown(false)
      setShowCategoryHierarchy(false)
      setCurrentCategory(null)
      setCurrentSubcategory(null)
      setSelectedIndex(-1)
      // Auto-focus to type select after account selection
      setTimeout(() => {
        typeSelectRefs.current[index]?.focus()
      }, 50)
      setEnterCount(0) // Reset enter count on account selection
      setLastEnterTime(0)
    }

    const startAddingNewAccount = (category, subcategory = null) => {
      setIsAddingNewAccount(true)
      setNewAccountCategory(category)
      setNewAccountSubcategory(subcategory)
      setNewAccountName("")
      setShowCategoryHierarchy(false)
      setShowDropdown(false) // Ensure main dropdown is also closed
      setSelectedIndex(-1)
      setEnterCount(0) // Reset enter count
      setLastEnterTime(0)
    }

    const deleteAccount = (account, category, subcategory = null) => {
      const updatedHierarchy = JSON.parse(JSON.stringify(accountHierarchy))
      if (subcategory) {
        updatedHierarchy[category][subcategory] = updatedHierarchy[category][subcategory].filter(
          (acc) => acc !== account,
        )
      } else if (Array.isArray(updatedHierarchy[category])) {
        updatedHierarchy[category] = updatedHierarchy[category].filter((acc) => acc !== account)
      }
      setAccountHierarchy(updatedHierarchy)
      const updatedAccounts = accountOptions.filter((acc) => acc !== account)
      setAccountOptions(updatedAccounts)
      if (value === account) {
        onChange("")
        setSearchTerm("") // Clear search term if deleted account was selected
      }
      setEnterCount(0) // Reset enter count
      setLastEnterTime(0)
    }

    const getAllAccountsFromHierarchy = (hierarchy) => {
      let accounts = []
      for (const category in hierarchy) {
        if (Array.isArray(hierarchy[category])) {
          accounts = [...accounts, ...hierarchy[category]]
        } else {
          for (const subcategory in hierarchy[category]) {
            accounts = [...accounts, ...hierarchy[category][subcategory]]
          }
        }
      }
      return accounts
    }

    const saveNewAccount = () => {
      try {
        const trimmedName = newAccountName.trim()
        if (!trimmedName) {
          alert("Please enter an account name")
          return
        }
        const allAccounts = getAllAccountsFromHierarchy(accountHierarchy)
        if (allAccounts.includes(trimmedName)) {
          alert("Account name already exists")
          return
        }
        const updatedHierarchy = JSON.parse(JSON.stringify(accountHierarchy))
        if (newAccountSubcategory) {
          if (!updatedHierarchy[newAccountCategory]?.[newAccountSubcategory]) {
            updatedHierarchy[newAccountCategory][newAccountSubcategory] = []
          }
          updatedHierarchy[newAccountCategory][newAccountSubcategory].push(trimmedName)
        } else if (Array.isArray(updatedHierarchy[newAccountCategory])) {
          updatedHierarchy[newAccountCategory].push(trimmedName)
        } else {
          alert("Please select a subcategory for this account type.")
          return
        }
        setAccountHierarchy(updatedHierarchy)
        const updatedAccounts = [...new Set([...accountOptions, trimmedName])]
        setAccountOptions(updatedAccounts)
        handleAccountSelect(trimmedName) // Select the newly added account
        setIsAddingNewAccount(false)
        setNewAccountName("")
        setEnterCount(0) // Reset enter count
        setLastEnterTime(0)
      } catch (error) {
        console.error("Error saving new account:", error)
        alert("An error occurred while saving the new account")
      }
    }

    // Handle Enter key in new account input
    const handleNewAccountKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation() // Prevent form submission
        saveNewAccount()
      }
    }

    const renderExistingAccounts = () => (
      <>
        {filteredAccountOptions.length > 0 ? (
          filteredAccountOptions.map((account, idx) => (
            <div
              key={account}
              onClick={() => handleAccountSelect(account)}
              className={`p-2 cursor-pointer flex justify-between items-center ${
                selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              <span className="flex-grow">{account}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // Find the account in hierarchy and delete it
                  const allAccounts = getAllAccountsFromHierarchy(accountHierarchy)
                  if (allAccounts.includes(account)) {
                    for (const category in accountHierarchy) {
                      if (Array.isArray(accountHierarchy[category])) {
                        if (accountHierarchy[category].includes(account)) {
                          deleteAccount(account, category)
                          return
                        }
                      } else {
                        for (const subcategory in accountHierarchy[category]) {
                          if (accountHierarchy[category][subcategory].includes(account)) {
                            deleteAccount(account, category, subcategory)
                            return
                          }
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
          className={`p-2 cursor-pointer text-blue-600 font-semibold border-t border-2 border-gray-200 ${
            selectedIndex === filteredAccountOptions.length ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          + Add New Account
        </div>
      </>
    )

    const renderCategoryOptions = () => (
      <>
        <div
          onClick={() => {
            setShowCategoryHierarchy(false)
            setShowDropdown(true)
            setSelectedIndex(0)
          }}
          className="p-2 border border-transparent hover:border-blue-400 cursor-pointer flex items-center text-blue-600 rounded-md transition-colors duration-200"
        >
          ← Back to Accounts
        </div>
        <div className="font-semibold mb-2 text-gray-700 px-2">Select Category</div>
        {Object.keys(accountHierarchy)
          .filter((category) => category !== "Other") // <--- ADDED THIS LINE
          .map((category, idx) => (
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
    )

    const renderSubcategoryOptions = () => {
      const options = Array.isArray(accountHierarchy[currentCategory])
        ? [...accountHierarchy[currentCategory], "+ Add New Account"]
        : Object.keys(accountHierarchy[currentCategory])
      return (
        <>
          <div
            onClick={() => {
              setCurrentCategory(null)
              setSelectedIndex(0)
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
                  className={`p-2 cursor-pointer flex justify-between items-center ${
                    selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
                >
                  <span className="flex-grow">{account}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteAccount(account, currentCategory)
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
                  selectedIndex === accountHierarchy[currentCategory].length ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
              >
                + Add New Account
              </div>
            </>
          ) : (
            Object.keys(accountHierarchy[currentCategory]).map((subcategory, idx) => (
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
            ))
          )}
        </>
      )
    }

    const renderAccountOptions = () => {
      const accounts = accountHierarchy[currentCategory][currentSubcategory]
      return (
        <>
          <div
            onClick={() => {
              setCurrentSubcategory(null)
              setSelectedIndex(0)
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
              className={`p-2 cursor-pointer flex justify-between items-center ${
                selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              <span className="flex-grow">{account}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteAccount(account, currentCategory, currentSubcategory)
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
              selectedIndex === accounts.length ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
          >
            + Add New Account
          </div>
        </>
      )
    }

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

        {/* Main dropdown showing existing accounts */}
        {showDropdown && !showCategoryHierarchy && !isAddingNewAccount && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {renderExistingAccounts()}
          </div>
        )}

        {/* Category hierarchy dropdown */}
        {showCategoryHierarchy && !isAddingNewAccount && (
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

        {/* Add new account input */}
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
    )
  },
)

AccountSelect.displayName = "AccountSelect"

// Type Select Component with Enhanced Navigation
const TypeSelect = forwardRef(({ value, onChange, index, amountInputRefs }, ref) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // For double enter detection
  const [enterCount, setEnterCount] = useState(0)
  const [lastEnterTime, setLastEnterTime] = useState(0)

  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const options = ["Debit", "Credit"]

  // Expose the internal triggerRef to the parent via the forwarded ref
  useImperativeHandle(ref, () => triggerRef.current)

  // Close when clicking outside
  useClickOutside([triggerRef, dropdownRef], () => {
    setShowDropdown(false)
    setSelectedIndex(-1)
    setEnterCount(0) // Reset enter count on outside click
    setLastEnterTime(0)
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowDropdown(false)
        setSelectedIndex(-1)
        triggerRef.current?.focus()
        setEnterCount(0)
        setLastEnterTime(0)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Handle keyboard navigation in dropdown
  const handleDropdownKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()

      const currentTime = Date.now()
      const isDoubleEnter = enterCount === 1 && currentTime - lastEnterTime < 5000 // 5 seconds for double enter

      if (isDoubleEnter) {
        // Double Enter: Open dropdown
        setShowDropdown(true)
        setSelectedIndex(options.indexOf(value) >= 0 ? options.indexOf(value) : 0)
        setEnterCount(0) // Reset for next sequence
        setLastEnterTime(0)
      } else {
        // Single Enter or first Enter in a sequence
        setEnterCount(enterCount + 1)
        setLastEnterTime(currentTime)

        // Reset enter count after a delay if no second enter occurs
        setTimeout(() => {
          setEnterCount(0)
          setLastEnterTime(0)
        }, 5000) // Reset after 5 seconds

        if (showDropdown) {
          // If dropdown is open and Enter is pressed
          if (selectedIndex >= 0) {
            onChange(options[selectedIndex])
            setShowDropdown(false)
            setTimeout(() => {
              amountInputRefs.current[index]?.focus()
            }, 0)
          }
        } else {
          // If dropdown is closed and Enter is pressed
          setShowDropdown(true)
          setSelectedIndex(options.indexOf(value) >= 0 ? options.indexOf(value) : 0)
        }
      }
      return
    }
    if (!showDropdown) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % options.length)
      setEnterCount(0) // Reset enter count on arrow navigation
      setLastEnterTime(0)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + options.length) % options.length)
      setEnterCount(0) // Reset enter count on arrow navigation
      setLastEnterTime(0)
    }
  }

  const handleOptionSelect = (option) => {
    onChange(option)
    setShowDropdown(false)
    setSelectedIndex(-1)
    // Auto-focus to amount field
    setTimeout(() => {
      amountInputRefs.current[index]?.focus()
    }, 0)
    setEnterCount(0) // Reset enter count on option selection
    setLastEnterTime(0)
  }

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={() => {
          setShowDropdown(!showDropdown)
          if (!showDropdown) {
            setSelectedIndex(options.indexOf(value) >= 0 ? options.indexOf(value) : 0)
          }
        }}
        tabIndex={0} // Keep tabIndex here for focus
        onKeyDown={handleDropdownKeyDown}
        className={`w-full p-2 border rounded-md cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:outline-none ${
          value === "Debit" ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
        }`}
      >
        <span>{value}</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-500 transition-transform ${showDropdown ? "transform rotate-180" : ""}`}
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
  )
})

TypeSelect.displayName = "TypeSelect"

const JournalForm = ({
  onSave,
  editData,
  accountOptions,
  setAccountOptions,
  accountHierarchy,
  setAccountHierarchy,
  // Remove ledgerData prop since we read from localStorage
}) => {
  const [journalDate, setJournalDate] = useState("")
  const [entries, setEntries] = useState([
    { account: "", type: "Debit", amount: "", openingBalance: 0 },
    { account: "", type: "Credit", amount: "", openingBalance: 0 },
  ])
  const [successMessage, setSuccessMessage] = useState("")
  const [description, setDescription] = useState("")

  // Refs for focus management
  const dateInputRef = useRef(null)
  const accountSelectRefs = useRef([])
  const typeSelectRefs = useRef([])
  const amountInputRefs = useRef([])
  const descriptionInputRef = useRef(null)
  const formRef = useRef(null)

  // Focus journal date on initial load
  useEffect(() => {
    dateInputRef.current?.focus()
  }, [])

  // Function to calculate opening balance for an account as of a specific date
  const calculateOpeningBalance = (accountName, journalDate) => {
    if (!accountName || !journalDate) {
      return 0
    }
    // Read ledger entries from localStorage (same as your Ledger component)
    const savedLedgerEntries = localStorage.getItem("ledgerEntries") || "[]"
    const savedJournalEntries = localStorage.getItem("journalEntries") || "[]"
    const allLedgerEntries = JSON.parse(savedLedgerEntries)
    const journalEntries = JSON.parse(savedJournalEntries)

    // Convert Journal entries from nested structure to Ledger format (same logic as Ledger component)
    journalEntries.forEach((journalEntry) => {
      if (journalEntry.entries && Array.isArray(journalEntry.entries)) {
        journalEntry.entries.forEach((item) => {
          allLedgerEntries.push({
            date: journalEntry.date,
            account: item.account,
            debit: item.type === "Debit" ? item.amount : 0,
            credit: item.type === "Credit" ? item.amount : 0,
            type: "Journal",
            reference: `Journal-${journalEntry.date}-${item.account}`,
          })
        })
      } else {
        // Handle flat structure if it exists
        allLedgerEntries.push({
          date: journalEntry.date,
          account: journalEntry.debitAccount,
          debit: journalEntry.amount,
          credit: 0,
          type: "Journal",
          reference: `Journal-${journalEntry.date}-${journalEntry.debitAccount}`,
        })
        allLedgerEntries.push({
          date: journalEntry.date,
          account: journalEntry.creditAccount,
          debit: 0,
          credit: journalEntry.amount,
          type: "Journal",
          reference: `Journal-${journalEntry.date}-${journalEntry.creditAccount}`,
        })
      }
    })

    // Filter entries for the specific account that are BEFORE the journal date
    const entriesBeforeDate = allLedgerEntries.filter(
      (entry) => entry.account === accountName && new Date(entry.date) < new Date(journalDate),
    )

    if (entriesBeforeDate.length === 0) {
      return 0
    }

    // Sort entries by date
    entriesBeforeDate.sort((a, b) => new Date(a.date) - new Date(b.date))

    // Calculate balance using same logic as Ledger component
    const totalDebits = entriesBeforeDate.reduce((sum, entry) => sum + (entry.debit || 0), 0)
    const totalCredits = entriesBeforeDate.reduce((sum, entry) => sum + (entry.credit || 0), 0)

    // Return net balance (positive for debit balance, negative for credit balance)
    return totalDebits - totalCredits
  }

  // Initialize refs arrays
  useEffect(() => {
    accountSelectRefs.current = accountSelectRefs.current.slice(0, entries.length)
    typeSelectRefs.current = typeSelectRefs.current.slice(0, entries.length)
    amountInputRefs.current = amountInputRefs.current.slice(0, entries.length)
  }, [entries])

  // Initialize form with edit data if provided
  useEffect(() => {
    if (editData) {
      // Scroll to top when editing
      window.scrollTo({ top: 0, behavior: "smooth" })

      setJournalDate(editData.date)
      setDescription(editData.description || "")
      const entriesWithBalance = editData.entries.map((entry) => ({
        ...entry,
        openingBalance: calculateOpeningBalance(entry.account, editData.date),
      }))
      setEntries(entriesWithBalance)
    } else {
      setJournalDate("")
      setDescription("")
      setEntries([
        { account: "", type: "Debit", amount: "", openingBalance: 0 },
        { account: "", type: "Credit", amount: "", openingBalance: 0 },
      ])
    }
  }, [editData])

  // Recalculate opening balances when journal date changes
  useEffect(() => {
    if (journalDate) {
      const updatedEntries = entries.map((entry) => ({
        ...entry,
        opening_balance: entry.account ? calculateOpeningBalance(entry.account, journalDate) : 0,
      }))
      setEntries(updatedEntries)
    }
  }, [journalDate])

  // Handle Enter key navigation between main form fields
  const handleKeyDown = (e, index, fieldType) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (fieldType === "date") {
        if (accountSelectRefs.current[0]) {
          accountSelectRefs.current[0].focus()
        }
      } else if (fieldType === "type") {
        amountInputRefs.current[index]?.focus()
      } else if (fieldType === "amount") {
        if (index < entries.length - 1) {
          accountSelectRefs.current[index + 1]?.focus()
        } else {
          descriptionInputRef.current?.focus()
        }
      } else if (fieldType === "description") {
        handleSubmit({ preventDefault: () => {} })
      }
      // Account field's Enter key logic is handled internally by AccountSelect
    }
  }

  const addRow = () => {
    setEntries([...entries, { account: "", type: "Debit", amount: "", openingBalance: 0 }])
  }

  const removeRow = (index) => {
    if (entries.length <= 2) {
      alert("You must have at least one debit and one credit entry")
      return
    }
    const updated = [...entries]
    updated.splice(index, 1)
    setEntries(updated)
  }

  const handleChange = (index, field, value) => {
    const updated = [...entries]
    updated[index][field] = value
    // If account is changed, update opening balance using the journal date
    if (field === "account") {
      updated[index]["openingBalance"] = calculateOpeningBalance(value, journalDate)
    }
    setEntries(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!journalDate) {
      alert("Please select a journal date")
      dateInputRef.current?.focus()
      return
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (!entry.account) {
        alert("Please fill all account fields")
        accountSelectRefs.current[i]?.focus()
        return
      }
      if (!entry.amount) {
        alert("Please fill all amounts")
        amountInputRefs.current[i]?.focus()
        return
      }
      if (isNaN(entry.amount)) {
        alert("Amount must be a number")
        amountInputRefs.current[i]?.focus()
        return
      }
      if (Number.parseFloat(entry.amount) <= 0) {
        alert("Amount must be greater than 0")
        amountInputRefs.current[i]?.focus()
        return
      }
    }

    const totalDebit = entries
      .filter((entry) => entry.type === "Debit")
      .reduce((sum, entry) => sum + Number.parseFloat(entry.amount), 0)
    const totalCredit = entries
      .filter((entry) => entry.type === "Credit")
      .reduce((sum, entry) => sum + Number.parseFloat(entry.amount), 0)

    if (totalDebit !== totalCredit) {
      alert(`Total debits (${totalDebit}) must equal total credits (${totalCredit})`)
      // Focus on the first account field as a general fallback for balance mismatch
      accountSelectRefs.current[0]?.focus()
      return
    }

    const newEntry = {
      date: journalDate,
      description: description,
      entries: entries.map((entry) => ({
        ...entry,
        amount: Number.parseFloat(entry.amount),
      })),
    }

    if (onSave) {
      onSave(newEntry)
    }

    setSuccessMessage(editData ? "Journal entry updated successfully!" : "Journal entry created successfully!")
    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)

    if (!editData) {
      setJournalDate("")
      setDescription("")
      setEntries([
        { account: "", type: "Debit", amount: "", openingBalance: 0 },
        { account: "", type: "Credit", amount: "", openingBalance: 0 },
      ])
    }
  }

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

      {/* Updated grid header with Opening Balance column */}
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
              handleChange={handleChange} // Pass parent's handleChange
              typeSelectRefs={typeSelectRefs} // Pass typeSelectRefs for focus management
            />
          </div>
          {/* Opening Balance Display */}
          <div className="col-span-2">
            <div className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-center font-medium text-sm">
              {entry.openingBalance === 0 ? (
                <span className="text-gray-500">৳ 0.00</span>
              ) : entry.openingBalance > 0 ? (
                <span className="text-green-600">৳ {Math.abs(entry.openingBalance).toFixed(2)} Dr</span>
              ) : (
                <span className="text-red-600">৳ {Math.abs(entry.openingBalance).toFixed(2)} Cr</span>
              )}
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
              // For edit mode, just reset to original values without calling onSave(null)
              setJournalDate(editData.date)
              setDescription(editData.description || "")
              const entriesWithBalance = editData.entries.map((entry) => ({
                ...entry,
                openingBalance: calculateOpeningBalance(entry.account, editData.date),
              }))
              setEntries(entriesWithBalance)
            } else {
              // For new entry mode, clear the form
              setJournalDate("")
              setDescription("")
              setEntries([
                { account: "", type: "Debit", amount: "", openingBalance: 0 },
                { account: "", type: "Credit", amount: "", openingBalance: 0 },
              ])
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
  )
}

export default JournalForm
