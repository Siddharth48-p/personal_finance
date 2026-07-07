import React, { useState } from 'react'
import { createCategory } from '../api'

export default function BudgetList({ budgets, categories, onUpdated }) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [limit, setLimit] = useState('')
  const [error, setError] = useState('')

  const handleSetBudget = async (e) => {
    e.preventDefault()
    setError('')
    if (!selectedCategory || !limit) {
      setError('Pick a category and enter a limit.')
      return
    }
    try {
      await createCategory({ name: selectedCategory, budget_limit: parseFloat(limit) })
      setSelectedCategory('')
      setLimit('')
      onUpdated()
    } catch {
      setError('Failed to set budget.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Set a Budget Limit</h3>
        <form onSubmit={handleSetBudget} className="flex flex-wrap gap-3 items-end">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Monthly limit (₹)"
            value={limit}
            onChange={e => setLimit(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-40"
          />
          <button type="submit" className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700">
            Save
          </button>
        </form>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">This Month's Budgets</h3>
        {budgets.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No budgets set yet.</p>
        ) : (
          <div className="space-y-4">
            {budgets.map(b => (
              <BudgetBar key={b.category_id} budget={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BudgetBar({ budget }) {
  const percent = Math.min(budget.percent_used || 0, 100)
  const isOver = (budget.percent_used || 0) >= 100
  const isWarning = (budget.percent_used || 0) >= 80 && !isOver

  const barColor = isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{budget.category_name}</span>
        <span className="text-gray-500">
          ₹{budget.spent.toLocaleString('en-IN')} / ₹{budget.budget_limit.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
      {isOver && <p className="text-xs text-red-500 mt-1">Over budget!</p>}
    </div>
  )
}
