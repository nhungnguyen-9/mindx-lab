import { CategoryCard } from '@/components/CategoryCard';
import { CATEGORIES } from '@/lib/categories';

export function HomePage() {
  return (
    <section>
      <div className="hero">
        <h1>Các dự án học viên MindX</h1>
        <p>Khám phá các sản phẩm thực chiến và sáng tạo</p>
      </div>

      <div className="category-grid">
        {CATEGORIES.map((category) => (
          <CategoryCard key={category.slug} category={category} />
        ))}
      </div>
    </section>
  );
}
