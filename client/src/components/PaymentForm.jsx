import { useState, useEffect, useRef } from "react"

const PaymentForm = ({
  onSave,
  editData,
  debitAccountOptions,
  setDebitAccountOptions,
  paymentHierarchy,
  setPaymentHierarchy,
}) => {
  const [paymentDate, setPaymentDate] = useState("")
  const [payment, setPayment] = useState("")
  const [account, setAccount] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Refs for Enter key navigation
  const dateRef = useRef(null)
  const paymentRef = useRef(null)
  const accountRef = useRef(null)
  const amountRef = useRef(null)
  const descriptionRef = useRef(null)
  const submitRef = useRef(null)

  // Initialize form with edit data if provided
  useEffect(() => {
    if (editData) {
      setPaymentDate(editData.date)
      setPayment(editData.payment)
      setAccount(editData.account)
      setAmount(editData.amount.toString())
      setDescription(editData.description || "")
    } else {
      setPaymentDate("")
      setPayment("")
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

  // Payment Select Component (with hierarchy for credit side)
  const PaymentSelect = ({ value, onChange }) => {
    const [showHierarchy, setShowHierarchy] = useState(false)
    const [currentCategory, setCurrentCategory] = useState(null)
    const [newBankName, setNewBankName] = useState("")
    const [isAddingNewBank, setIsAddingNewBank] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowHierarchy(false)
          setCurrentCategory(null)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [])

    const handlePaymentSelect = (paymentAccount) => {
      onChange(paymentAccount)
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
        const updatedHierarchy = JSON.parse(JSON.stringify(paymentHierarchy))
        updatedHierarchy.Bank = updatedHierarchy.Bank.filter((bank) => bank !== bankName)
        setPaymentHierarchy(updatedHierarchy)

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
      if (paymentHierarchy.Bank.includes(trimmedName)) {
        alert("Bank name already exists")
        return
      }

      // Create a deep copy of the hierarchy
      const updatedHierarchy = JSON.parse(JSON.stringify(paymentHierarchy))
      updatedHierarchy.Bank.push(trimmedName)

      // Update states
      setPaymentHierarchy(updatedHierarchy)

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
        <div className="font-semibold mb-2 text-gray-700">Payment Categories</div>
        {Object.keys(paymentHierarchy).map((category) => (
          <div key={category}>
            {category === "Cash" ? (
              <div onClick={() => handlePaymentSelect("Cash")} className="p-2 hover:bg-gray-100 cursor-pointer">
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

        {paymentHierarchy.Bank.map((bank) => (
          <div key={bank} className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
            <span onClick={() => handlePaymentSelect(bank)} className="flex-grow">
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
          ref={paymentRef}
          onClick={() => setShowHierarchy(!showHierarchy)}
          onKeyDown={(e) => handleKeyDown(e, accountRef)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          tabIndex={0}
        >
          {value || "Select Payment Account"}
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

  // Account Select Component (with search-as-you-type and "Add New Account" option in dropdown)
  const AccountSelect = ({ value, onChange }) => {
    const [showDropdown, setShowDropdown] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddingNewAccount, setIsAddingNewAccount] = useState(false)
    const [newAccountName, setNewAccountName] = useState("")
    const dropdownRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false)
          setIsAddingNewAccount(false)
          setSearchTerm("")
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [])

    // Filter accounts based on search term
    const filteredAccounts = debitAccountOptions.filter((account) =>
      account.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const handleAccountSelect = (accountName) => {
      onChange(accountName)
      setShowDropdown(false)
      setSearchTerm("")
      // Focus next field
      if (amountRef.current) {
        amountRef.current.focus()
      }
    }

    const handleInputChange = (e) => {
      const inputValue = e.target.value
      setSearchTerm(inputValue)
      setShowDropdown(true)

      // Only update parent if there's an exact match
      const exactMatch = debitAccountOptions.find((account) => account.toLowerCase() === inputValue.toLowerCase())
      if (exactMatch) {
        onChange(exactMatch)
      } else if (inputValue === "") {
        onChange("")
      }
    }

    const handleInputFocus = () => {
      setShowDropdown(true)
      // Initialize search term with current value when focusing
      setSearchTerm(value || "")
    }

    const handleInputBlur = () => {
      // Small delay to allow clicking on dropdown items
      setTimeout(() => {
        if (!dropdownRef.current?.contains(document.activeElement)) {
          setShowDropdown(false)
          setSearchTerm("")
        }
      }, 150)
    }

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        if (filteredAccounts.length === 1) {
          // Auto-select if only one match
          handleAccountSelect(filteredAccounts[0])
        } else if (filteredAccounts.length > 1) {
          // Select first match if multiple
          handleAccountSelect(filteredAccounts[0])
        } else if (searchTerm) {
          // If no matches but there's text, keep the text as value
          onChange(searchTerm)
          setShowDropdown(false)
          if (amountRef.current) {
            amountRef.current.focus()
          }
        } else {
          // Move to next field
          if (amountRef.current) {
            amountRef.current.focus()
          }
        }
      } else if (e.key === "Escape") {
        setShowDropdown(false)
        setSearchTerm("")
      }
    }

    const startAddingNewAccount = () => {
      setIsAddingNewAccount(true)
      setNewAccountName(searchTerm)
      setShowDropdown(false)
    }

    const saveNewAccount = () => {
      const trimmedName = newAccountName.trim()

      if (!trimmedName) {
        alert("Please enter an account name")
        return
      }

      // Check for existing account
      if (debitAccountOptions.includes(trimmedName)) {
        alert("Account name already exists")
        return
      }

      // Add to account options
      const updatedAccounts = [...debitAccountOptions, trimmedName]
      setDebitAccountOptions(updatedAccounts)

      // Select the new account and reset state
      onChange(trimmedName)
      setIsAddingNewAccount(false)
      setNewAccountName("")
      setSearchTerm("")

      // Focus next field
      if (amountRef.current) {
        amountRef.current.focus()
      }
    }

    // Display value: show search term when dropdown is open and user is typing, otherwise show selected value
    const displayValue = showDropdown ? searchTerm : value || ""

    return (
      <div className="relative" ref={dropdownRef}>
        <input
          ref={(el) => {
            inputRef.current = el
            if (accountRef) {
              accountRef.current = el
            }
          }}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search or select account..."
          autoComplete="off"
        />

        {showDropdown && !isAddingNewAccount && (
          <div
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking dropdown
          >
            <div className="p-2">
              <div className="font-semibold mb-2 text-gray-700">Debit Accounts</div>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <div
                    key={account}
                    onClick={() => handleAccountSelect(account)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: searchTerm
                          ? account.replace(
                              new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
                              '<mark class="bg-yellow-200">$1</mark>',
                            )
                          : account,
                      }}
                    />
                  </div>
                ))
              ) : searchTerm ? (
                <div className="p-2 text-gray-500 italic">No accounts found for "{searchTerm}"</div>
              ) : (
                debitAccountOptions.map((account) => (
                  <div
                    key={account}
                    onClick={() => handleAccountSelect(account)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {account}
                  </div>
                ))
              )}
              <button
                type="button"
                onClick={startAddingNewAccount}
                className="p-2 hover:bg-gray-100 cursor-pointer text-blue-600 font-semibold w-full text-left border-t border-gray-200 mt-1"
              >
                + Add New Account
                {searchTerm && ` "${searchTerm}"`}
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
                  e.preventDefault()
                  saveNewAccount()
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
                setIsAddingNewAccount(false)
                setSearchTerm("")
                // Refocus the main input
                if (inputRef.current) {
                  inputRef.current.focus()
                }
              }}
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

    if (!paymentDate) {
      alert("Please select a payment date")
      return
    }

    if (!payment) {
      alert("Please select a payment account")
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
      date: paymentDate,
      payment: payment,
      account: account,
      amount: Number.parseFloat(amount),
      description: description.trim() || "",
    }

    if (onSave) {
      onSave(newEntry)
    }

    // Push corresponding ledger entries
    const existingLedgerEntries = JSON.parse(localStorage.getItem("ledgerEntries") || "[]")

    // Debit entry (Account)
    const debitEntry = {
      date: paymentDate,
      account: account,
      debit: Number.parseFloat(amount),
      credit: 0,
      description: description.trim() || "",
      type: "Payment",
      reference: `Payment-${Date.now()}`,
    }

    // Credit entry (Payment account)
    const creditEntry = {
      date: paymentDate,
      account: payment,
      debit: 0,
      credit: Number.parseFloat(amount),
      description: description.trim() || "",
      type: "Payment",
      reference: `Payment-${Date.now()}`,
    }

    // Add both entries to ledger
    const updatedLedgerEntries = [...existingLedgerEntries, debitEntry, creditEntry]
    localStorage.setItem("ledgerEntries", JSON.stringify(updatedLedgerEntries))

    setSuccessMessage(editData ? "Payment entry updated successfully!" : "Payment entry created successfully!")

    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)

    if (!editData) {
      setPaymentDate("")
      setPayment("")
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
      <h2 className="text-center text-xl font-bold mb-4">{editData ? "Edit Payment Entry" : "Add Payment Entry"}</h2>

      {successMessage && <div className="text-green-700 text-center font-semibold mb-4">{successMessage}</div>}

      {/* Date Field - Matches JournalForm */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-8">
          <label className="text-sm font-medium text-gray-700">Payment Date</label>
          <input
            ref={dateRef}
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, paymentRef)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            required
          />
        </div>
      </div>

      {/* Other Fields - Original Vertical Layout */}
      <div className="space-y-6">
        {/* Payment (Credit) Field */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 w-32">Payment</label>
          <div className="flex-1">
            <PaymentSelect value={payment} onChange={setPayment} />
          </div>
        </div>

        {/* Account (Debit) Field */}
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
            setPaymentDate("")
            setPayment("")
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
          {editData ? "Update Payment Entry" : "Create Payment Entry"}
        </button>
      </div>
    </form>
  )
}

export default PaymentForm
