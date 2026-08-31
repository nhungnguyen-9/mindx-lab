import type { Product } from '../../shared/types';

export function toProduct(row: any): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    studentName: String(row.student_name),
    className: String(row.class_name),
    category: row.category,
    embedType: row.embed_type ?? 'link',
    thumbnailUrl: String(row.thumbnail_url),
    embedUrl: String(row.embed_url),
    sourceCode: row.source_code ? String(row.source_code) : null,
    published: Boolean(row.published),
    viewCount: Number(row.view_count ?? 0),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}
