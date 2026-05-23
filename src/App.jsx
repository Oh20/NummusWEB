import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Earnings from './pages/Earnings'
import Expenses from './pages/Expenses'
import PaymentMethods from './pages/PaymentMethods'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/"                element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"       element={<Dashboard />} />
            <Route path="/earnings"        element={<Earnings />} />
            <Route path="/expenses"        element={<Expenses />} />
            <Route path="/payment-methods" element={<PaymentMethods />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}