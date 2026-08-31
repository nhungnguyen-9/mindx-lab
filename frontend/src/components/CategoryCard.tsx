import { Link } from 'react-router-dom';
import type { CategoryMeta } from '@/lib/categories';

interface CategoryCardProps {
  category: CategoryMeta;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link to={`/category/${category.slug}`} className="category-card">
      <img src={category.heroImage} alt={category.displayName} loading="lazy" />
      <div className="category-card-content">
        <h3>{category.displayName}</h3>
        <p>{category.description}</p>
      </div>
    </Link>
  );
}
