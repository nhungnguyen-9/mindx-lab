import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '@shared/types';
import { api } from '@/lib/api';
import { CATEGORIES } from '@/lib/categories';

export function AdminProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    api
      .fetchAdminProducts(1, 20, search, category)
      .then((res) => setProducts(res.data))
      .catch((err: Error) => setError(err.message || 'Khong the tai danh sach san pham'));
  };

  useEffect(() => {
    load();
  }, [search, category]);

  const onDelete = async (id: string) => {
    const ok = window.confirm('Ban chac chan muon xoa san pham nay?');
    if (!ok) return;
    await api.deleteProduct(id);
    load();
  };

  const onToggle = async (id: string, published: boolean) => {
    await api.togglePublish(id, !published);
    load();
  };

  return (
    <section>
      <div className="admin-head">
        <h1>Quan ly san pham</h1>
        <Link className="btn" to="/admin/products/new">
          Them san pham
        </Link>
      </div>

      <div className="filters">
        <input
          placeholder="Tim theo ten hoc vien/san pham"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Tat ca khung</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.displayName}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error-box">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ten</th>
              <th>Hoc vien</th>
              <th>Khung</th>
              <th>Trang thai</th>
              <th>Hanh dong</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.studentName}</td>
                <td>{product.category}</td>
                <td>{product.published ? 'published' : 'unpublished'}</td>
                <td className="actions">
                  <Link to={`/admin/products/${product.id}/edit`}>Sua</Link>
                  <button onClick={() => onDelete(product.id)}>Xoa</button>
                  <button onClick={() => onToggle(product.id, product.published)}>
                    {product.published ? 'An' : 'Cong khai'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
