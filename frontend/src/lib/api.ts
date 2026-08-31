import type {
  AdminCredentials,
  AuthResponse,
  DashboardStats,
  PaginatedResponse,
  Product,
  ProductFormData,
  PublicProduct,
  User,
  UserFormData,
  UserRole
} from '@shared/types';

const API_BASE = '/api';

async function request<T>(
  path: string,
  init?: RequestInit,
  opts?: { skipAuthRedirect?: boolean }
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    // The login endpoint returns 401 for bad credentials; don't treat that as
    // an expired session (which would wipe the token and reload the page).
    if (res.status === 401 && !opts?.skipAuthRedirect) {
      localStorage.removeItem('mindx_admin_token');
      localStorage.removeItem('mindx_user_info');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (res.status === 403) {
      throw new Error('Bạn không có quyền truy cập');
    }
    const fallback = { error: 'Request failed' };
    const body = (await res.json().catch(() => fallback)) as { error?: string };
    throw new Error(body.error ?? fallback.error);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mindx_admin_token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function adminHeaders() {
  return {
    ...getAuthHeaders(),
    'Content-Type': 'application/json'
  };
}

export const api = {
  fetchProducts(
    category: string,
    page = 1,
    limit = 12,
    search = '',
    sort: 'newest' | 'popular' = 'newest'
  ) {
    const params = new URLSearchParams({
      category,
      page: String(page),
      limit: String(limit),
      sort
    });
    if (search) params.set('search', search);
    return request<PaginatedResponse<PublicProduct>>(`/products?${params.toString()}`);
  },

  fetchProduct(id: string) {
    return request<PublicProduct>(`/products/${id}`, {
      headers: getAuthHeaders()
    });
  },

  authLogin(payload: AdminCredentials) {
    return request<AuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      { skipAuthRedirect: true }
    );
  },

  fetchAdminProducts(page = 1, limit = 20, search = '', category = '') {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
      category
    });
    return request<PaginatedResponse<Product>>(`/admin/products?${params.toString()}`, {
      headers: adminHeaders()
    });
  },

  fetchAdminProduct(id: string) {
    return request<Product>(`/admin/products/${id}`, {
      headers: adminHeaders()
    });
  },

  createProduct(payload: ProductFormData) {
    return request<Product>('/admin/products', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(payload)
    });
  },

  updateProduct(id: string, payload: ProductFormData) {
    return request<Product>(`/admin/products/${id}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(payload)
    });
  },

  deleteProduct(id: string) {
    return request<void>(`/admin/products/${id}`, {
      method: 'DELETE',
      headers: adminHeaders()
    });
  },

  togglePublish(id: string, published: boolean) {
    return request<Product>(`/admin/products/${id}/publish`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ published })
    });
  },

  fetchStats() {
    return request<DashboardStats>('/admin/stats', {
      headers: adminHeaders()
    });
  },

  getUploadConfig(fileName: string, mimeType: string, size: number) {
    return request<{
      provider: 'cloudinary';
      uploadUrl: string;
      fields: {
        upload_preset: string;
        folder: string;
      };
    }>('/admin/upload', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ fileName, mimeType, size })
    });
  },

  fetchUsers() {
    return request<User[]>('/admin/users', {
      headers: adminHeaders()
    });
  },

  createUser(data: UserFormData) {
    return request<User>('/admin/users', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(data)
    });
  },

  updateUser(id: string, data: { role: UserRole }) {
    return request<User>(`/admin/users/${id}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(data)
    });
  },

  deleteUser(id: string) {
    return request<void>(`/admin/users/${id}`, {
      method: 'DELETE',
      headers: adminHeaders()
    });
  }
};
