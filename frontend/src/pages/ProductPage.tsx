import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PublicProduct, Category } from '@shared/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const CATEGORIES_WITH_CODE: Category[] = ['scratch', 'app-python', 'web', 'computer-science'];
const CATEGORIES_WITH_EMBED: Category[] = ['scratch', 'game', 'web', 'computer-science'];
const CATEGORIES_WITH_GALLERY: Category[] = ['app-python'];

const TAB_LABELS: Record<Category, { play: string; code: string }> = {
  scratch: { play: 'Chơi/Xem', code: 'Xem Code' },
  game: { play: '', code: '' },
  'app-python': { play: 'Xem Giao Diện', code: 'Xem Code' },
  web: { play: 'Xem Website', code: 'Xem Code' },
  'computer-science': { play: 'Xem Sản Phẩm', code: 'Xem Code' },
};

export function ProductPage() {
  const { id } = useParams();
  const auth = useAuth();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [tab, setTab] = useState<'play' | 'code'>('play');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [embedError, setEmbedError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;

    setLoading(true);
    api
      .fetchProduct(id)
      .then((data) => {
        if (active) {
          setProduct(data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (active) {
          if (err.message?.includes('404') || err.message?.includes('not found')) {
            setNotFound(true);
          } else {
            setError(err.message || 'Không thể tải sản phẩm');
          }
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <p className="container">Đang tải sản phẩm...</p>;

  if (notFound) {
    return (
      <div className="container product-detail">
        <div className="error-box">
          <h2>404 - Không tìm thấy sản phẩm</h2>
          <p>Sản phẩm này không tồn tại hoặc chưa được công bố.</p>
          <Link to="/" className="btn" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (error) return <p className="container error-box">{error}</p>;
  if (!product) return null;

  const showTabs = CATEGORIES_WITH_CODE.includes(product.category);
  const canViewCode = auth.hasRole(['sale', 'teacher', 'admin']);
  const showCodeTab = showTabs && canViewCode;
  const showEmbed = CATEGORIES_WITH_EMBED.includes(product.category);
  const showGallery = CATEGORIES_WITH_GALLERY.includes(product.category);
  const labels = TAB_LABELS[product.category];

  // Scratch projects are played through an embedded Scratch player that loads
  // the hosted .sb3 file; everything else is iframed directly.
  const embedSrc =
    product.embedType === 'scratch'
      ? `https://turbowarp.org/embed?project_url=${encodeURIComponent(product.embedUrl)}`
      : product.embedUrl;

  const galleryImages = showGallery
    ? product.embedUrl.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <article className="container product-detail">
      <header className="product-header">
        <h1>{product.name}</h1>
        <p>
          {product.studentName} - {product.className}
        </p>
      </header>

      {showTabs && (
        <div className="tabs">
          <button className={tab === 'play' ? 'active' : ''} onClick={() => setTab('play')}>
            {labels.play}
          </button>
          {showCodeTab && (
            <button className={tab === 'code' ? 'active' : ''} onClick={() => setTab('code')}>
              {labels.code}
            </button>
          )}
        </div>
      )}

      {/* Embed viewer for scratch, game, web, cs */}
      {showEmbed && (tab === 'play' || !showTabs) && (
        <div className="panel">
          {!embedError ? (
            <iframe
              title={product.name}
              src={embedSrc}
              className="embed-frame"
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen allow-popups allow-forms"
              allow="autoplay; fullscreen; gamepad; microphone; camera"
              onError={() => setEmbedError(true)}
            />
          ) : (
            <div className="error-box">
              <p>Không thể tải nội dung tương tác.</p>
              <a href={product.embedUrl} target="_blank" rel="noreferrer">
                Mở liên kết gốc
              </a>
            </div>
          )}
        </div>
      )}

      {/* Image gallery for app-python */}
      {showGallery && tab === 'play' && (
        <div className="panel">
          {galleryImages.length > 0 ? (
            <div className="image-gallery" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              {galleryImages.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${product.name} - Screenshot ${idx + 1}`}
                  style={{
                    maxWidth: '100%',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                  }}
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            <p className="empty">Không có ảnh giao diện.</p>
          )}
        </div>
      )}

      {/* Code viewer for categories with code */}
      {showCodeTab && tab === 'code' && product.sourceCode && (
        <pre className="code-panel">
          <code>{product.sourceCode}</code>
        </pre>
      )}
    </article>
  );
}
