import { useState, useEffect, useMemo } from "react";
import JournalForm from "../components/JournalForm";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { getAccounts } from "../services/accountService";
import { listEntries, createEntry } from "../services/journalService";

const defaultHierarchy = {
  Assets: {
    "Current Assets": ["Cash","Bank Accounts","Accounts Receivable","Inventory"],
    "Fixed Assets": ["Land","Buildings","Equipment","Vehicles"],
  },
  Expenses: ["Rent Expense","Salaries Expense","Utilities Expense"],
  Revenues: ["Sales Revenue","Service Revenue"],
  Liabilities: {
    "Short-term Liabilities": ["Accounts Payable","Short-term Loans","Interest Payable","Salary Payable"],
    "Long-term Liabilities": ["Mortgages","Bonds Payable"],
  },
  Capital: ["Owner's Equity","Retained Earnings"],
};

const CAN_EDIT_DELETE = false; // apply later

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [accountHierarchy, setAccountHierarchy] = useState(() => {
    const saved = localStorage.getItem("accountHierarchy");
    return saved ? JSON.parse(saved) : defaultHierarchy;
  });
  const [accountOptions, setAccountOptions] = useState(() => {
    const saved = localStorage.getItem("accountOptions");
    if (saved) return JSON.parse(saved);
    const flatten = (h) => Object.entries(h).flatMap(([_,v]) => Array.isArray(v) ? v : flatten(v));
    const initial = flatten(defaultHierarchy);
    localStorage.setItem("accountOptions", JSON.stringify(initial));
    return initial;
  });

  const [accounts, setAccounts] = useState([]);
  const byId = useMemo(() => new Map(accounts.map(a=>[a._id,a])), [accounts]);
  const byName = useMemo(() => new Map(accounts.map(a=>[a.name,a])), [accounts]);

  useEffect(()=>localStorage.setItem("accountHierarchy", JSON.stringify(accountHierarchy)),[accountHierarchy]);
  useEffect(()=>localStorage.setItem("accountOptions", JSON.stringify(accountOptions)),[accountOptions]);
  useEffect(()=>{
    const flatten = (h) => Object.entries(h).flatMap(([_,v]) => Array.isArray(v) ? v : flatten(v));
    setAccountOptions(flatten(accountHierarchy));
  },[accountHierarchy]);

  const refresh = async () => {
    const [accs, serverEntries] = await Promise.all([getAccounts(), listEntries()]);
    setAccounts(accs);
    const toUi = (se) => {
      const uiLines = [];
      (se.lines||[]).forEach(ln=>{
        const acc = (typeof ln.account === "object" && ln.account?.name) ? ln.account : byId.get(ln.account);
        const label = acc?.name || "—";
        if (ln.debit && Number(ln.debit)>0)  uiLines.push({account:label,type:"Debit", amount:Number(ln.debit)});
        if (ln.credit && Number(ln.credit)>0) uiLines.push({account:label,type:"Credit",amount:Number(ln.credit)});
      });
      return {_id: se._id, date:(se.date||"").slice(0,10), description: se.description||"", entries: uiLines};
    };
    setEntries(serverEntries.map(toUi));
  };

  useEffect(()=>{ refresh(); },[]);

  const handleSave = async (newEntry) => {
    // UI → API payload (account name → _id)
    const missing = [];
    const lines = newEntry.entries.map(it=>{
      const acc = byName.get(it.account);
      if (!acc) missing.push(it.account);
      return {
        account: acc?._id,
        debit:  it.type === "Debit"  ? Number(it.amount) : 0,
        credit: it.type === "Credit" ? Number(it.amount) : 0,
      };
    });
    if (missing.length) {
      alert(`These accounts don't exist in DB: ${missing.join(", ")}\nCreate them first in Accounts page.`);
      return;
    }
    await createEntry({ date: newEntry.date, description: newEntry.description, lines });
    await refresh();
    setEditingIndex(null);
  };

  const handleDelete = (index) => {
    // add later
    alert("Delete is not available yet. (Backend endpoint pending)");
  };
  const handleEdit = (index) => {
    if (!CAN_EDIT_DELETE) {
      alert("Edit is not available yet. (Backend endpoint pending)");
      return;
    }
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
          <div className="text-center py-8 text-gray-500">No journal entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.flatMap((entry, entryIndex) =>
                  entry.entries.map((item, itemIndex) => (
                    <tr key={`${entry._id || entryIndex}-${itemIndex}`}>
                      <td className="px-6 py-4 whitespace-nowrap">{itemIndex === 0 ? entry.date : ""}</td>
                      <td className="px-6 py-4">{item.account}</td>
                      <td className="px-6 py-4">{item.type}</td>
                      <td className="px-6 py-4">{Number(item.amount).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{itemIndex === 0 ? entry.description || "-" : ""}</td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        {itemIndex === 0 && (
                          <>
                            <button
                              onClick={() => handleEdit(entryIndex)}
                              className={`p-1 rounded ${CAN_EDIT_DELETE ? "text-blue-600 hover:text-blue-900 hover:bg-blue-50" : "opacity-40 cursor-not-allowed"}`}
                              title={CAN_EDIT_DELETE ? "Edit" : "Edit (coming soon)"}
                              disabled={!CAN_EDIT_DELETE}
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(entryIndex)}
                              className={`p-1 rounded ${CAN_EDIT_DELETE ? "text-red-600 hover:text-red-900 hover:bg-red-50" : "opacity-40 cursor-not-allowed"}`}
                              title={CAN_EDIT_DELETE ? "Delete" : "Delete (coming soon)"}
                              disabled={!CAN_EDIT_DELETE}
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
