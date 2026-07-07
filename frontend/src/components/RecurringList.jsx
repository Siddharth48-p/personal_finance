import React from 'react'

export default function RecurringList({ recurring }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-700 mb-1">Detected Recurring Payments</h3>
      <p className="text-xs text-gray-400 mb-4">
        Same merchant, similar amount, appearing in 2+ different months.
      </p>
      {recurring.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          Nothing detected yet — add transactions across a couple of months to see recurring charges.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {recurring.map((r, i) => (
            <div key={i} className="flex justify-between items-center py-3">
              <div>
                <p className="font-medium text-gray-800">{r.merchant}</p>
                <p className="text-xs text-gray-400">
                  {r.occurrences} occurrences · {r.category_name || 'Uncategorized'} · last on {r.last_date}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-700">₹{r.average_amount.toLocaleString('en-IN')}/mo</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
