import { useEffect, useState } from 'react';
import type { DashboardStats } from '@shared/types';
import { api } from '@/lib/api';
import { CATEGORIES } from '@/lib/categories';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .fetchStats()
      .then(setStats)
      .catch((err: Error) => setError(err.message || 'Khong the tai thong ke'));
  }, []);

  if (error) return <p className="error-box">{error}</p>;
  if (!stats) return <p>Dang tai thong ke...</p>;

  return (
    <section className="stats-wrap">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Tong san pham</h3>
          <p>{stats.totalProducts}</p>
        </div>
        <div className="stat-card">
          <h3>Da cong khai</h3>
          <p>{stats.publishedProducts}</p>
        </div>
        <div className="stat-card">
          <h3>Dang an</h3>
          <p>{stats.unpublishedProducts}</p>
        </div>
        <div className="stat-card">
          <h3>Tong luot xem</h3>
          <p>{stats.totalViews}</p>
        </div>
      </div>

      <table className="breakdown-table">
        <thead>
          <tr>
            <th>Khung</th>
            <th>So luong</th>
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((c) => (
            <tr key={c.slug}>
              <td>{c.displayName}</td>
              <td>{stats.byCategory[c.slug] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
