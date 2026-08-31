export type Category =
  | 'scratch'
  | 'game'
  | 'app-python'
  | 'web'
  | 'computer-science';

/**
 * How the frontend should render `embedUrl`:
 * - 'link'   : an arbitrary external URL shown in an iframe (legacy behaviour)
 * - 'web'    : entry index.html of a hosted static bundle (HTML/CSS/JS, GameMaker HTML5, pygbag)
 * - 'scratch': a hosted .sb3 file, played via an embedded Scratch player
 */
export type EmbedType =
  | 'link'
  | 'web'
  | 'scratch'
  | 'gamemaker'
  | 'pygame'
  | 'python-script';

export const EMBED_TYPES: EmbedType[] = [
  'link',
  'web',
  'scratch',
  'gamemaker',
  'pygame',
  'python-script'
];

export interface Product {
  id: string;
  name: string;
  studentName: string;
  className: string;
  category: Category;
  embedType: EmbedType;
  thumbnailUrl: string;
  embedUrl: string;
  sourceCode: string | null;
  published: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PublicProduct = Omit<Product, 'published'>;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductFormData {
  name: string;
  studentName: string;
  className: string;
  category: Category;
  embedType: EmbedType;
  thumbnailUrl: string;
  embedUrl: string;
  sourceCode: string;
}

export interface BundleUploadResult {
  embedType: EmbedType;
  entryUrl: string;
}

export type UserRole = 'admin' | 'teacher' | 'sale';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export interface UserFormData {
  username: string;
  password: string;
  role: UserRole;
}

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
  };
}

export interface AuthContext {
  userId: string;
  role: UserRole;
}

export interface DashboardStats {
  totalProducts: number;
  publishedProducts: number;
  unpublishedProducts: number;
  totalViews: number;
  byCategory: Record<Category, number>;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, string>;
}
