import type { Category, Product } from '../../shared/types';

type MutableProduct = Product;

const now = new Date().toISOString();

let products: MutableProduct[] = [
  {
    id: 'p-1',
    name: 'Scratch Maze Adventure',
    studentName: 'Nguyen Minh Anh',
    className: 'Scratch A1',
    category: 'scratch',
    embedType: 'link',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    embedUrl: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted',
    sourceCode: 'when green flag clicked\nforever\n  move 10 steps\n  if on edge, bounce',
    published: true,
    viewCount: 0,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'p-2',
    name: 'Portfolio Web',
    studentName: 'Tran Bao Han',
    className: 'Web B2',
    category: 'web',
    embedType: 'link',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    embedUrl: 'https://example.com',
    sourceCode: '<h1>Hello MindX</h1>',
    published: true,
    viewCount: 0,
    createdAt: now,
    updatedAt: now
  }
];

export function listProducts() {
  return products;
}

export function listByCategory(category?: string, publishedOnly = true) {
  return products.filter((p) => {
    const byPub = publishedOnly ? p.published : true;
    const byCategory = category ? p.category === category : true;
    return byPub && byCategory;
  });
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function createProduct(input: Omit<Product, 'id' | 'viewCount' | 'createdAt' | 'updatedAt' | 'published'>) {
  const product: Product = {
    ...input,
    id: `p-${Date.now()}`,
    viewCount: 0,
    published: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  products = [product, ...products];
  return product;
}

export function updateProduct(
  id: string,
  payload: Partial<
    Pick<Product, 'name' | 'studentName' | 'className' | 'category' | 'thumbnailUrl' | 'embedUrl' | 'sourceCode'>
  >
) {
  let updated: Product | undefined;
  products = products.map((p) => {
    if (p.id !== id) return p;
    updated = { ...p, ...payload, updatedAt: new Date().toISOString() };
    return updated;
  });
  return updated;
}

export function removeProduct(id: string) {
  const before = products.length;
  products = products.filter((p) => p.id !== id);
  return products.length < before;
}

export function togglePublish(id: string, published?: boolean) {
  let updated: Product | undefined;
  products = products.map((p) => {
    if (p.id !== id) return p;
    updated = {
      ...p,
      published: typeof published === 'boolean' ? published : !p.published,
      updatedAt: new Date().toISOString()
    };
    return updated;
  });
  return updated;
}

export function increaseViewCount(id: string) {
  products = products.map((p) => (p.id === id ? { ...p, viewCount: p.viewCount + 1 } : p));
}

export function buildStats() {
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.published).length;
  const unpublishedProducts = totalProducts - publishedProducts;
  const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);

  const categories: Category[] = ['scratch', 'game', 'app-python', 'web', 'computer-science'];
  const byCategory = categories.reduce((acc, key) => {
    acc[key] = products.filter((p) => p.category === key).length;
    return acc;
  }, {} as Record<Category, number>);

  return {
    totalProducts,
    publishedProducts,
    unpublishedProducts,
    totalViews,
    byCategory
  };
}
