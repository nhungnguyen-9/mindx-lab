import { Link } from 'react-router-dom';
import type { PublicProduct } from '@shared/types';

interface ProductCardProps {
  product: PublicProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <img src={product.thumbnailUrl} alt={product.name} loading="lazy" />
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <p>{product.studentName}</p>
        <small>{product.className}</small>
      </div>
    </Link>
  );
}
