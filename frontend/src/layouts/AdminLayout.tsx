import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';

export function AdminLayout() {
  const navigate = useNavigate();
  const auth = useAuth();

  const logout = () => {
    auth.logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h2>Admin</h2>
        <nav>
          {auth.hasRole(['admin']) && (
            <Link to="/admin">Thống kê</Link>
          )}
          {auth.hasRole(['admin', 'teacher']) && (
            <Link to="/admin/products">Quản lý SP</Link>
          )}
          {auth.hasRole(['admin']) && (
            <Link to="/admin/users">Người dùng</Link>
          )}
          <button onClick={logout}>Đăng xuất</button>
        </nav>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}
