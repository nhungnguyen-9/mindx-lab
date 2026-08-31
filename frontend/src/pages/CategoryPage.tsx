import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { PublicProduct } from '@shared/types';
import { Pagination } from '@/components/Pagination';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';
import { getCategoryBySlug } from '@/lib/categories';

export function CategoryPage() {
  const { slug } = useParams();
  const category = useMemo(() => getCategoryBySlug(slug), [slug]);

  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to the first page whenever the category or sort changes.
  useEffect(() => {
    setPage(1);
  }, [category, sort]);

  useEffect(() => {
    if (!category) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    api
      .fetchProducts(category.slug, page, 12, search, sort)
      .then((res) => {
        if (!active) return;
        setProducts(res.data);
        setTotalPages(res.pagination.totalPages || 1);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || 'Khong the tai du lieu. Vui long thu lai.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, page, search, sort, reloadKey]);

  if (!category) {
    return <p className="empty">Khung hoc tap khong hop le.</p>;
  }

  return (
    <section>
      <div className="page-head">
        <h1>{category.displayName}</h1>
      </div>

      <div className="catalog-controls">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên sản phẩm hoặc học viên..."
          aria-label="Tìm kiếm sản phẩm"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'newest' | 'popular')}
          aria-label="Sắp xếp"
        >
          <option value="newest">Mới nhất</option>
          <option value="popular">Xem nhiều nhất</option>
        </select>
      </div>

      {loading && <p>Dang tai du lieu...</p>}

      {!loading && error && (
        <div className="error-box">
          <p>{error}</p>
          <button onClick={() => setReloadKey((v) => v + 1)}>Thu lai</button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="empty">
          {search
            ? `Không tìm thấy sản phẩm nào khớp với "${search}"`
            : 'Chua co san pham nao trong khung nay'}
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </section>
  );
}
