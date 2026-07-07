import React from 'react'

export default function TransactionList({ transactions, onDelete }) {
  if (transactions.length === 0) {
    return <p className="text-sm text-gray-400 py-10 text-center">No transactions for this month yet.</p>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Merchant</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium text-right">Amount</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map(t => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-600">{t.date}</td>
              <td className="px-4 py-3 text-gray-800">{t.merchant}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs">
                  {t.category?.name || 'Uncategorized'}
                </span>
              </td>
              <td className={`px-4 py-3 text-right font-medium ${t.amount < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                {t.amount < 0 ? '+' : '-'}₹{Math.abs(t.amount).toLocaleString('en-IN')}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onDelete(t.id)}
                  className="text-gray-400 hover:text-red-500 text-xs"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
