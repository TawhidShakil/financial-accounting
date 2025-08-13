// DateRangeFilter.js
import React from "react";

export default function DateRangeFilter({ fromDate, toDate, onChange, onClear }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-end mb-8">
      <div className="flex gap-2 items-center">
        <label className="font-medium text-gray-700">From</label>
        <input
          type="date"
          value={fromDate}
          onChange={e => onChange({ from: e.target.value, to: toDate })}
          className="border px-2 py-1 rounded-md"
          max={toDate}
        />
      </div>
      <div className="flex gap-2 items-center">
        <label className="font-medium text-gray-700">To</label>
        <input
          type="date"
          value={toDate}
          onChange={e => onChange({ from: fromDate, to: e.target.value })}
          className="border px-2 py-1 rounded-md"
          min={fromDate}
        />
      </div>
      {(fromDate || toDate) && (
        <button
          onClick={onClear}
          className="ml-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm text-gray-700"
          type="button"
        >
          Clear Filter
        </button>
      )}
    </div>
  );
}
