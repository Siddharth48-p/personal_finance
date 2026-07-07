import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000'

export const api = axios.create({ baseURL: API_BASE })

export const getCategories = () => api.get('/categories').then(r => r.data)
export const createCategory = (data) => api.post('/categories', data).then(r => r.data)
export const deleteCategory = (id) => api.delete(`/categories/${id}`)

export const getTransactions = (month, year) =>
  api.get('/transactions', { params: { month, year } }).then(r => r.data)
export const createTransaction = (data) => api.post('/transactions', data).then(r => r.data)
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`)
export const uploadCSV = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/transactions/upload-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export const getBudgetStatus = (month, year) =>
  api.get('/budgets/status', { params: { month, year } }).then(r => r.data)

export const getRecurring = () => api.get('/recurring').then(r => r.data)
