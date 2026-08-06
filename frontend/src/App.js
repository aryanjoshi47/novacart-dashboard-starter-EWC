import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './utils/ThemeContext';
import { UserProvider, useUser } from './utils/UserContext';
import OrdersView    from './pages/OrdersView';
import ProductsView  from './pages/ProductsView';
import CustomersView from './pages/CustomersView';
import './App.css';

function AppRoutes() {
  const { role, loading } = useUser();

  // Don't render the customers route until we know the role
  if (loading) {
    return (
      <Routes>
        <Route path="/"         element={<Navigate to="/orders" replace />} />
        <Route path="/orders"   element={<OrdersView />} />
        <Route path="/products" element={<ProductsView />} />
        <Route path="*"         element={<Navigate to="/orders" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/"          element={<Navigate to="/orders" replace />} />
      <Route path="/orders"    element={<OrdersView />} />
      <Route path="/products"  element={<ProductsView />} />
      <Route
        path="/customers"
        element={role === 'admin' ? <CustomersView /> : <Navigate to="/orders" replace />}
      />
      <Route path="*"          element={<Navigate to="/orders" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  );
}
