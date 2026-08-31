import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Category, EmbedType } from '@shared/types';
import { api } from '@/lib/api';
import { uploadProjectBundle, type BundleUploadType } from '@/lib/bundle-upload';
import { CATEGORIES } from '@/lib/categories';

const EMBED_TYPE_OPTIONS: { value: EmbedType; label: string }[] = [
  { value: 'link', label: 'Link nhúng (URL có sẵn)' },
  { value: 'web', label: 'Web bundle (.zip có index.html)' },
  { value: 'gamemaker', label: 'GameMaker HTML5 (.zip đã build)' },
  { value: 'scratch', label: 'Scratch (.sb3)' }
];

const BUNDLE_UPLOAD_TYPES: EmbedType[] = ['web', 'gamemaker', 'scratch'];
const ZIP_BUNDLE_TYPES: EmbedType[] = ['web', 'gamemaker'];

interface AdminProductFormProps {
  mode: 'create' | 'edit';
}

export function AdminProductForm({ mode }: AdminProductFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = useMemo(() => mode === 'edit' && !!id, [mode, id]);

  const [name, setName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [category, setCategory] = useState<Category>('scratch');
  const [embedType, setEmbedType] = useState<EmbedType>('link');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [bundleUploading, setBundleUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    let active = true;

    setLoading(true);
    api
      .fetchAdminProduct(id)
      .then((p) => {
        if (!active) return;
        setName(p.name);
        setStudentName(p.studentName);
        setClassName(p.className);
        setCategory(p.category);
        setEmbedType(p.embedType);
        setThumbnailUrl(p.thumbnailUrl);
        setEmbedUrl(p.embedUrl);
        setSourceCode(p.sourceCode ?? '');
      })
      .catch((err: Error) => {
        if (active) setError(err.message || 'Không thể tải sản phẩm');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isEdit, id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !studentName || !className || !thumbnailUrl || !embedUrl) {
      setError('Vui long dien day du cac truong bat buoc');
      return;
    }

    const payload = {
      name,
      studentName,
      className,
      category,
      embedType,
      thumbnailUrl,
      embedUrl,
      sourceCode
    };

    try {
      if (isEdit && id) {
        await api.updateProduct(id, payload);
      } else {
        await api.createProduct(payload);
      }
      navigate('/admin/products');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Khong the luu san pham';
      setError(message);
    }
  };

  const uploadThumbnail = async (file?: File) => {
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const config = await api.getUploadConfig(file.name, file.type, file.size);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', config.fields.upload_preset);
      formData.append('folder', config.fields.folder);

      const uploaded = await fetch(config.uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!uploaded.ok) {
        throw new Error('Upload anh len Cloudinary that bai');
      }

      const body = (await uploaded.json()) as { secure_url?: string; url?: string };
      const imageUrl = body.secure_url || body.url;

      if (!imageUrl) {
        throw new Error('Cloudinary khong tra ve URL anh');
      }

      setThumbnailUrl(imageUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Khong the upload anh';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const uploadBundle = async (file?: File) => {
    if (!file) return;
    if (!BUNDLE_UPLOAD_TYPES.includes(embedType)) return;

    setError('');
    setBundleUploading(true);
    try {
      const result = await uploadProjectBundle(embedType as BundleUploadType, file);
      setEmbedUrl(result.entryUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể upload bundle';
      setError(message);
    } finally {
      setBundleUploading(false);
    }
  };

  return (
    <section>
      <h1>{isEdit ? 'Chinh sua san pham' : 'Them san pham'}</h1>
      {loading && <p>Đang tải dữ liệu sản phẩm...</p>}
      <form className="admin-form" onSubmit={submit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ten san pham" required />
        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Ten hoc vien"
          required
        />
        <input
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          placeholder="Ten lop"
          required
        />

        <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.displayName}
            </option>
          ))}
        </select>

        <input
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="Thumbnail URL"
          required
        />
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => uploadThumbnail(e.target.files?.[0])}
          disabled={uploading}
        />
        {uploading && <p>Dang upload anh...</p>}

        <label>Loại nội dung</label>
        <select value={embedType} onChange={(e) => setEmbedType(e.target.value as EmbedType)}>
          {EMBED_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {ZIP_BUNDLE_TYPES.includes(embedType) && (
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => uploadBundle(e.target.files?.[0])}
            disabled={bundleUploading}
          />
        )}
        {embedType === 'scratch' && (
          <input
            type="file"
            accept=".sb3"
            onChange={(e) => uploadBundle(e.target.files?.[0])}
            disabled={bundleUploading}
          />
        )}
        {bundleUploading && <p>Đang upload bundle...</p>}

        <input
          value={embedUrl}
          onChange={(e) => setEmbedUrl(e.target.value)}
          placeholder={
            embedType === 'link'
              ? 'Embed URL'
              : 'URL nội dung (tự điền sau khi upload)'
          }
          readOnly={embedType !== 'link'}
          required
        />
        <textarea
          value={sourceCode}
          onChange={(e) => setSourceCode(e.target.value)}
          placeholder="Source code"
          rows={10}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit">Luu</button>
      </form>
    </section>
  );
}
