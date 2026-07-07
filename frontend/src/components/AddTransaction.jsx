import React, { useState, useRef } from 'react'
import { createTransaction, uploadCSV } from '../api'

export default function AddTransaction({ onAdded }) {
  const [form, setForm] = useState({ date: '', merchant: '', amount: '', note: '' })
  const [isIncome, setIsIncome] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.date || !form.merchant || !form.amount) {
      setError('Date, merchant, and amount are required.')
      return
    }
    try {
      const amountValue = parseFloat(form.amount)
      await createTransaction({
        date: form.date,
        merchant: form.merchant,
        amount: isIncome ? -Math.abs(amountValue) : Math.abs(amountValue),
        note: form.note || null,
      })
      setForm({ date: '', merchant: '', amount: '', note: '' })
      setIsIncome(false)
      onAdded()
    } catch (err) {
      setError('Failed to add transaction.')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    try {
      await uploadCSV(file)
      onAdded()
    } catch (err) {
      setError('CSV upload failed. Check format: date, merchant, amount, note.')
    }
    fileInputRef.current.value = ''
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
      <h3 className="font-semibold text-gray-700">Add Transaction</h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="date"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Merchant (e.g. Swiggy)"
          value={form.merchant}
          onChange={e => setForm({ ...form, merchant: e.target.value })}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={form.note}
          onChange={e => setForm({ ...form, note: e.target.value })}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 col-span-1 sm:col-span-2">
          <input type="checkbox" checked={isIncome} onChange={e => setIsIncome(e.target.checked)} />
          This is income (money in)
        </label>
        <button
          type="submit"
          className="col-span-1 sm:col-span-2 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700"
        >
          Add Transaction
        </button>
      </form>

      <div className="border-t border-gray-100 pt-4">
        <label className="text-sm text-gray-600 block mb-2">Or import from CSV (columns: date, merchant, amount, note)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
