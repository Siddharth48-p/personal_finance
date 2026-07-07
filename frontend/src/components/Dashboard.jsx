import React from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#84cc16']

export default function Dashboard({ transactions }) {
  const expenses = transactions.filter(t => t.amount > 0)
  const income = transactions.filter(t => t.amount < 0)

  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0)
  const totalIncome = income.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const net = totalIncome - totalExpense

  const byCategory = {}
  expenses.forEach(t => {
    const name = t.category?.name || 'Uncategorized'
    byCategory[name] = (byCategory[name] || 0) + t.amount
  })
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value: Math.round(value) }))

  const barData = pieData.sort((a, b) => b.value - a.value).slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Income" value={totalIncome} color="text-green-600" />
        <StatCard label="Expenses" value={totalExpense} color="text-red-600" />
        <StatCard label="Net" value={net} color={net >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Spend by Category</h3>
          {pieData.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name }) => name}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `₹${v}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Top Categories</h3>
          {barData.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>₹{value.toLocaleString('en-IN')}</p>
    </div>
  )
}

function EmptyState() {
  return <p className="text-sm text-gray-400 py-10 text-center">No data yet. Add or import transactions to see charts.</p>
}
