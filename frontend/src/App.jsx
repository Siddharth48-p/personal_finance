import React, { useState, useEffect, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import TransactionList from './components/TransactionList'
import AddTransaction from './components/AddTransaction'
import BudgetList from './components/BudgetList'
import RecurringList from './components/RecurringList'
import { getTransactions, deleteTransaction, getCategories, getBudgetStatus, getRecurring } from './api'

const TABS = ['Overview', 'Transactions', 'Budgets', 'Recurring']

export default function App() {
  const [tab, setTab] = useState('Overview')
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [recurring, setRecurring] = useState([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [month] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())

  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      const [txns, cats, budgetStatus, rec] = await Promise.all([
        getTransactions(month, year),
        getCategories(),
        getBudgetStatus(month, year),
        getRecurring(),
      ])
      setTransactions(txns)
      setCategories(cats)
      setBudgets(budgetStatus)
      setRecurring(rec)
    } catch (err) {
      console.error('Failed to load data. Is the backend running on port 8000?', err)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const handleDelete = async (id) => {
    await deleteTransaction(id)
    refreshAll()
  }

  const monthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Ledger</h1>
            <p className="text-xs text-gray-400">{monthLabel}</p>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-6 flex gap-6">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px ${
                tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {loading ? (
          <p className="text-sm text-gray-400 py-10 text-center">Loading...</p>
        ) : (
          <>
            {tab === 'Overview' && <Dashboard transactions={transactions} />}

            {tab === 'Transactions' && (
              <div className="space-y-6">
                <AddTransaction onAdded={refreshAll} />
                <TransactionList transactions={transactions} onDelete={handleDelete} />
              </div>
            )}

            {tab === 'Budgets' && (
              <BudgetList budgets={budgets} categories={categories} onUpdated={refreshAll} />
            )}

            {tab === 'Recurring' && <RecurringList recurring={recurring} />}
          </>
        )}
      </main>
    </div>
  )
}
