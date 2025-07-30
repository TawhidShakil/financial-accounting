import { useState, useEffect } from "react";
import JournalForm from "../components/JournalForm";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

 useEffect(() => {
  const saved = localStorage.getItem("journalEntries");
  if (saved) {
    setEntries(JSON.parse(saved));
    console.log("Loaded from localStorage");
  }
}, []);


  const handleSave = (newEntry) => {
  let updatedEntries;

  if (editingIndex !== null) {
    // Update existing entry
    updatedEntries = [...entries];
    updatedEntries[editingIndex] = newEntry;
    console.log("API CALL - Update journal entry");
  } else {
    // Add new entry
    updatedEntries = [...entries, newEntry];
    console.log("API CALL - Create journal entry");
  }

  // Save to localStorage
  localStorage.setItem("journalEntries", JSON.stringify(updatedEntries));

  // Update state
  setEntries(updatedEntries);

  // Reset editing index
  setEditingIndex(null);
};


  const handleDelete = (index) => {
    console.log("API CALL - Delete journal entry");
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  return (
    <div>
      {/* console.log('Journal component rendering'); */}
      <JournalForm 
        onSave={handleSave} 
        editData={editingIndex !== null ? entries[editingIndex] : null}
      />
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Journal Records</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.flatMap((entry, entryIndex) =>
                entry.entries.map((item, itemIndex) => (
                  <tr key={`${entryIndex}-${itemIndex}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {itemIndex === 0 ? entry.date : ""}
                    </td>
                    <td className="px-6 py-3 text-left">{item.account}</td>
                    <td className="px-6 py-3 text-left">{item.type}</td>
                    <td className="px-6 py-3 text-left">{item.amount}</td>
                    <td className="px-6 py-3 text-left whitespace-nowrap space-x-2">
                      {itemIndex === 0 && (
                        <>
                          <button
                            onClick={() => handleEdit(entryIndex)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(entryIndex)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete"
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
      </div>
    </div>
  );
}