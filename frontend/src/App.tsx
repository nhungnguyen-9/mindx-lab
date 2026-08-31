import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { CategoryPage } from './pages/CategoryPage';
import { HomePage } from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { ProductPage } from './pages/ProductPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProductForm } from './pages/admin/AdminProductForm';
import { AdminProductList } from './pages/admin/AdminProductList';
import { AdminUserList } from './pages/admin/AdminUserList';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUserList />} />
      </Route>

      <Route
        path="/admin/products/*"
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminProductList />} />
        <Route path="new" element={<AdminProductForm mode="create" />} />
        <Route path=":id/edit" element={<AdminProductForm mode="edit" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
