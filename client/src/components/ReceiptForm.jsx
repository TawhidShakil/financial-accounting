"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDownIcon } from "@heroicons/react/24/outline" // Import ChevronDownIcon

const ReceiptForm = ({
  onSave,
  editData,
  creditAccountOptions,
  setCreditAccountOptions,
  receiptHierarchy,
  setReceiptHierarchy,
  creditAccountHierarchy, // New prop
  setCreditAccountHierarchy, // New prop
}) => {
  const [receiptDate, setReceiptDate] = useState("")
  const [receipt, setReceipt] = useState("")
  const [account, setAccount] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Refs for Enter key navigation
  const dateRef = useRef(null)
  const receiptRef = useRef(null)
  const accountRef = useRef(null)
  const amountRef = useRef(null)
  const descriptionRef = useRef(null)
  const submitRef = useRef(null)

  // Initialize form with edit data if provided
  useEffect(() => {
    if (editData) {
      setReceiptDate(editData.date)
      setReceipt(editData.receipt)
      setAccount(editData.account)
      setAmount(editData.amount.toString())
      setDescription(editData.description || "")
    } else {
      setReceiptDate("")
      setReceipt("")
      setAccount("")
      setAmount("")
      setDescription("")
    }
  }, [editData])

  // Handle Enter key navigation
  const handleKeyDown = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (nextRef && nextRef.current) {
        nextRef.current.focus()
      }
    }
  }

  // Custom hook for click outside detection
  function useClickOutside(refs, callback) {
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (refs.every((ref) => ref.current && !ref.current.contains(event.target))) {
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

  // Receipt Select Component (with hierarchy for debit side)
  const ReceiptSelect = ({ value, onChange }) => {
    const [showHierarchy, setShowHierarchy] = useState(false)
    const [currentCategory, setCurrentCategory] = useState(null)
    const [newBankName, setNewBankName] = useState("")
    const [isAddingNewBank, setIsAddingNewBank] = useState(false)
    const dropdownRef = useRef(null)
    const triggerRef = useRef(null)

    useClickOutside([triggerRef, dropdownRef], () => {
      setShowHierarchy(false)
      setCurrentCategory(null)
    })

    const handleReceiptSelect = (receiptAccount) => {
      onChange(receiptAccount)
      setShowHierarchy(false)
      setCurrentCategory(null)
      // Focus next field after selection with a small delay to ensure DOM is updated
      setTimeout(() => {
        if (accountRef.current) {
          if (accountRef.current.focus) {
            accountRef.current.focus()
          } else if (accountRef.current.querySelector("input")) {
            accountRef.current.querySelector("input").focus()
          }
        }
      }, 100)
    }

    const startAddingNewBank = () => {
      setIsAddingNewBank(true)
      setNewBankName("")
      setShowHierarchy(false)
    }

    const deleteBank = (bankName) => {
      if (window.confirm(`Are you sure you want to delete "${bankName}"?`)) {
        const updatedHierarchy = JSON.parse(JSON.stringify(receiptHierarchy))
        updatedHierarchy.Bank = updatedHierarchy.Bank.filter((bank) => bank !== bankName)
        setReceiptHierarchy(updatedHierarchy)

        // Clear the selection if the deleted bank was selected
        if (value === bankName) {
          onChange("")
        }
      }
    }

    const saveNewBank = () => {
      const trimmedName = newBankName.trim()

      if (!trimmedName) {
        alert("Please enter a bank name")
        return
      }

      // Check for existing bank
      if (receiptHierarchy.Bank.includes(trimmedName)) {
        alert("Bank name already exists")
        return
      }

      // Create a deep copy of the hierarchy
      const updatedHierarchy = JSON.parse(JSON.stringify(receiptHierarchy))
      updatedHierarchy.Bank.push(trimmedName)

      // Update states
      setReceiptHierarchy(updatedHierarchy)

      // Select the new bank and reset state
      onChange(trimmedName)
      setIsAddingNewBank(false)
      setNewBankName("")

      // Focus next field
      if (accountRef.current) {
        accountRef.current.focus()
      }
    }

    const renderCategoryOptions = () => (
      <>
        <div className="font-semibold mb-2 text-gray-700">Receipt Categories</div>
        {Object.keys(receiptHierarchy).map((category) => (
          <div key={category}>
            {category === "Cash" ? (
              <div onClick={() => handleReceiptSelect("Cash")} className="p-2 hover:bg-gray-100 cursor-pointer">
                Cash
              </div>
            ) : (
              <div
                onClick={() => setCurrentCategory(category)}
                className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              >
                <span>{category}</span>
                <span className="text-gray-500">→</span>
              </div>
            )}
          </div>
        ))}
      </>
    )

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
                e.stopPropagation()
                deleteBank(bank)
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
            e.stopPropagation()
            startAddingNewBank()
          }}
          className="p-2 hover:bg-gray-100 cursor-pointer text-blue-600 font-semibold w-full text-left"
        >
          + Add New Bank
        </button>
      </>
    )

    return (
      <div className="relative" ref={dropdownRef}>
        <div
          ref={(el) => {
            triggerRef.current = el
            receiptRef.current = el // Assign to receiptRef for external use
          }}
          onClick={() => setShowHierarchy(!showHierarchy)}
          onKeyDown={(e) => handleKeyDown(e, accountRef)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          tabIndex={0}
        >
          {value || "Select Receipt Account"}
        </div>

        {showHierarchy && !isAddingNewBank && (
          <div
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
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
                  e.preventDefault()
                  saveNewBank()
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
    )
  }

  // Account Select Component (with hierarchy and "Add New Account" option)
  const AccountSelect = ({ value, onChange }) => {
    const [showHierarchy, setShowHierarchy] = useState(false)
    const [currentCategory, setCurrentCategory] = useState(null)
    const [currentSubcategory, setCurrentSubcategory] = useState(null)
    const [newAccountName, setNewAccountName] = useState("")
    const [isAddingNewAccount, setIsAddingNewAccount] = useState(false)
    const [newAccountCategory, setNewAccountCategory] = useState(null)
    const [newAccountSubcategory, setNewAccountSubcategory] = useState(null)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [doubleEnterCount, setDoubleEnterCount] = useState(0)
    const dropdownRef = useRef(null)
    const triggerRef = useRef(null)
    const newAccountInputRef = useRef(null)

    useClickOutside([triggerRef, dropdownRef], () => {
      setShowHierarchy(false)
      setCurrentCategory(null)
      setCurrentSubcategory(null)
      setSelectedIndex(-1)
    })

    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setShowHierarchy(false)
          setCurrentCategory(null)
          setCurrentSubcategory(null)
          setSelectedIndex(-1)
          triggerRef.current?.focus()
        }
      }
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    // Handle keyboard navigation in dropdown
    const handleDropdownKeyDown = (e) => {
      if (!showHierarchy) {
        if (e.key === "Enter") {
          setDoubleEnterCount((prev) => prev + 1)
          setTimeout(() => setDoubleEnterCount(0), 300)
          if (doubleEnterCount === 0) {
            e.preventDefault()
            setTimeout(() => {
              amountRef.current?.focus()
            }, 0)
          } else if (doubleEnterCount === 1) {
            e.preventDefault()
            setShowHierarchy(true)
            setSelectedIndex(0)
          }
        }
        return
      }

      const getCurrentOptions = () => {
        if (!currentCategory) {
          return Object.keys(creditAccountHierarchy)
        } else if (!currentSubcategory) {
          if (Array.isArray(creditAccountHierarchy[currentCategory])) {
            return [...creditAccountHierarchy[currentCategory], "+ Add New Account"]
          } else {
            return Object.keys(creditAccountHierarchy[currentCategory])
          }
        } else {
          return [...creditAccountHierarchy[currentCategory][currentSubcategory], "+ Add New Account"]
        }
      }

      const currentOptions = getCurrentOptions()

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % currentOptions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + currentOptions.length) % currentOptions.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < currentOptions.length) {
          const selectedOption = currentOptions[selectedIndex]
          handleOptionSelect(selectedOption)
        }
      }
    }

    const handleOptionSelect = (option) => {
      if (!currentCategory) {
        setCurrentCategory(option)
        setSelectedIndex(0)
      } else if (!currentSubcategory) {
        if (option === "+ Add New Account") {
          startAddingNewAccount(currentCategory)
        } else if (Array.isArray(creditAccountHierarchy[currentCategory])) {
          handleAccountSelect(option)
        } else {
          setCurrentSubcategory(option)
          setSelectedIndex(0)
        }
      } else {
        if (option === "+ Add New Account") {
          startAddingNewAccount(currentCategory, currentSubcategory)
        } else {
          handleAccountSelect(option)
        }
      }
    }

    const handleAccountSelect = (account) => {
      onChange(account)
      setShowHierarchy(false)
      setCurrentCategory(null)
      setCurrentSubcategory(null)
      setSelectedIndex(-1)
      setTimeout(() => {
        amountRef.current?.focus()
      }, 50)
    }

    const startAddingNewAccount = (category, subcategory = null) => {
      setIsAddingNewAccount(true)
      setNewAccountCategory(category)
      setNewAccountSubcategory(subcategory)
      setNewAccountName("")
      setShowHierarchy(false)
      setSelectedIndex(-1)
    }

    const deleteAccount = (account, category, subcategory = null) => {
      if (window.confirm(`Are you sure you want to delete "${account}"?`)) {
        const updatedHierarchy = JSON.parse(JSON.stringify(creditAccountHierarchy))
        if (subcategory) {
          updatedHierarchy[category][subcategory] = updatedHierarchy[category][subcategory].filter(
            (acc) => acc !== account,
          )
        } else if (Array.isArray(updatedHierarchy[category])) {
          updatedHierarchy[category] = updatedHierarchy[category].filter((acc) => acc !== account)
        } else {
          if (updatedHierarchy[category]?.["Other"]) {
            updatedHierarchy[category]["Other"] = updatedHierarchy[category]["Other"].filter((acc) => acc !== account)
          }
        }
        setCreditAccountHierarchy(updatedHierarchy)
        if (value === account) {
          onChange("")
        }
      }
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
        const allAccounts = getAllAccountsFromHierarchy(creditAccountHierarchy)
        if (allAccounts.includes(trimmedName)) {
          alert("Account name already exists")
          return
        }
        const updatedHierarchy = JSON.parse(JSON.stringify(creditAccountHierarchy))
        if (newAccountSubcategory) {
          if (!updatedHierarchy[newAccountCategory]?.[newAccountSubcategory]) {
            updatedHierarchy[newAccountCategory][newAccountSubcategory] = []
          }
          updatedHierarchy[newAccountCategory][newAccountSubcategory].push(trimmedName)
        } else if (Array.isArray(updatedHierarchy[newAccountCategory])) {
          updatedHierarchy[newAccountCategory].push(trimmedName)
        } else {
          if (!updatedHierarchy[newAccountCategory]) {
            updatedHierarchy[newAccountCategory] = { Other: [] }
          } else if (!updatedHierarchy[newAccountCategory]["Other"]) {
            updatedHierarchy[newAccountCategory]["Other"] = []
          }
          updatedHierarchy[newAccountCategory]["Other"].push(trimmedName)
        }
        setCreditAccountHierarchy(updatedHierarchy)
        onChange(trimmedName)
        setIsAddingNewAccount(false)
        setNewAccountName("")
        setTimeout(() => {
          amountRef.current?.focus()
        }, 0)
      } catch (error) {
        console.error("Error saving new account:", error)
        alert("An error occurred while saving the new account")
      }
    }

    const handleNewAccountKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        saveNewAccount()
      }
    }

    const renderCategoryOptions = () => (
      <>
        <div className="font-semibold mb-2 text-gray-700 px-2">Main Categories</div>
        {Object.keys(creditAccountHierarchy).map((category, idx) => (
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
      const options = Array.isArray(creditAccountHierarchy[currentCategory])
        ? [...creditAccountHierarchy[currentCategory], "+ Add New Account"]
        : Object.keys(creditAccountHierarchy[currentCategory])

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
          {Array.isArray(creditAccountHierarchy[currentCategory]) ? (
            <>
              {creditAccountHierarchy[currentCategory].map((account, idx) => (
                <div
                  key={account}
                  className={`p-2 cursor-pointer flex justify-between items-center ${
                    selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
                >
                  <span onClick={() => handleAccountSelect(account)} className="flex-grow">
                    {account}
                  </span>
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
                  selectedIndex === creditAccountHierarchy[currentCategory].length ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
              >
                + Add New Account
              </div>
            </>
          ) : (
            Object.keys(creditAccountHierarchy[currentCategory]).map((subcategory, idx) => (
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
      const accounts = creditAccountHierarchy[currentCategory][currentSubcategory]
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
              className={`p-2 cursor-pointer flex justify-between items-center ${
                selectedIndex === idx ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              <span onClick={() => handleAccountSelect(account)} className="flex-grow">
                {account}
              </span>
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
      <div className="relative" ref={dropdownRef}>
        <div
          ref={(el) => {
            triggerRef.current = el
            accountRef.current = el // Assign to accountRef for external use
          }}
          onClick={() => {
            setShowHierarchy(!showHierarchy)
            if (!showHierarchy) {
              setSelectedIndex(0)
            }
          }}
          onKeyDown={handleDropdownKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:outline-none hover:bg-gray-50"
          tabIndex={0}
        >
          <span className={value ? "text-gray-900" : "text-gray-500"}>{value || "Select Account"}</span>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-500 transition-transform ${showHierarchy ? "transform rotate-180" : ""}`}
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
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!receiptDate) {
      alert("Please select a receipt date")
      return
    }

    if (!receipt) {
      alert("Please select a receipt account")
      return
    }

    if (!account) {
      alert("Please select an account")
      return
    }

    if (!amount) {
      alert("Please enter an amount")
      return
    }

    if (isNaN(amount)) {
      alert("Amount must be a number")
      return
    }

    if (Number.parseFloat(amount) <= 0) {
      alert("Amount must be greater than 0")
      return
    }

    const newEntry = {
      date: receiptDate,
      receipt: receipt,
      account: account,
      amount: Number.parseFloat(amount),
      description: description.trim() || "",
    }

    if (onSave) {
      onSave(newEntry)
    }

    // Push corresponding ledger entries
    const existingLedgerEntries = JSON.parse(localStorage.getItem("ledgerEntries") || "[]")

    // Debit entry (Receipt account)
    const debitEntry = {
      date: receiptDate,
      account: receipt,
      debit: Number.parseFloat(amount),
      credit: 0,
      description: description.trim() || "",
      type: "Receipt",
      reference: `Receipt-${Date.now()}`,
    }

    // Credit entry (Account)
    const creditEntry = {
      date: receiptDate,
      account: account,
      debit: 0,
      credit: Number.parseFloat(amount),
      description: description.trim() || "",
      type: "Receipt",
      reference: `Receipt-${Date.now()}`,
    }

    // Add both entries to ledger
    const updatedLedgerEntries = [...existingLedgerEntries, debitEntry, creditEntry]
    localStorage.setItem("ledgerEntries", JSON.stringify(updatedLedgerEntries))

    setSuccessMessage(editData ? "Receipt entry updated successfully!" : "Receipt entry created successfully!")

    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)

    if (!editData) {
      setReceiptDate("")
      setReceipt("")
      setAccount("")
      setAmount("")
      setDescription("")
      // Focus back to first field
      if (dateRef.current) {
        dateRef.current.focus()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-center text-xl font-bold mb-4">{editData ? "Edit Receipt Entry" : "Add Receipt Entry"}</h2>

      {successMessage && <div className="text-green-700 text-center font-semibold mb-4">{successMessage}</div>}

      {/* Date Field - Matches JournalForm */}
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

      {/* Other Fields - Original Vertical Layout */}
      <div className="space-y-6">
        {/* Receipt (Debit) Field */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-32">Receipt</label>
          <div className="flex-1">
            <ReceiptSelect value={receipt} onChange={setReceipt} />
          </div>
        </div>

        {/* Account (Credit) Field */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-32">Account</label>
          <div className="flex-1">
            <AccountSelect value={account} onChange={setAccount} />
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
            step="0.01"
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
                e.preventDefault()
                if (submitRef.current) {
                  submitRef.current.focus()
                }
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
            setReceiptDate("")
            setReceipt("")
            setAccount("")
            setAmount("")
            setDescription("")
            if (editData) onSave(null)
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
  )
}

export default ReceiptForm
