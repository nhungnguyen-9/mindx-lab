import { useMemo, useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '@/lib/categories';
import { useAuth } from '@/lib/auth-context';
import logoImage from '@/images/logo.png';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const links = useMemo(
    () => CATEGORIES.map((c) => ({ to: `/category/${c.slug}`, label: c.displayName })),
    []
  );

  return (
    <header className="navbar-wrap">
      <nav className="navbar container">
        <Link to="/" className="logo" onClick={() => setIsOpen(false)}>
          <img src={logoImage} alt="MindX Lab logo" />
        </Link>

        {/* Mobile toggles on the right */}
        <div className="mobile-only-flex" style={{ display: 'none', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              color: 'var(--ink)'
            }}
            aria-label="Toggle theme"
          >
            {isDark ? '🌚' : '🌞'}
          </button>
          <button
            className="hamburger"
            aria-label="Toggle menu"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
          {links.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
          <li className="desktop-theme-toggle">
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: 'var(--ink)',
                padding: '0.4rem'
              }}
              aria-label="Toggle theme"
            >
              {isDark ? '🌚' : '🌞'}
            </button>
          </li>

          {/* Auth section */}
          {!auth.isAuthenticated ? (
            <li>
              <Link
                to="/login"
                className="nav-link"
                onClick={() => setIsOpen(false)}
              >
                Đăng nhập
              </Link>
            </li>
          ) : (
            <>
              <li>
                <span className="nav-link" style={{ cursor: 'default' }}>
                  {auth.user?.username}
                </span>
              </li>
              {auth.user?.role === 'admin' && (
                <li>
                  <Link
                    to="/admin"
                    className="nav-link"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
              )}
              {auth.user?.role === 'teacher' && (
                <li>
                  <Link
                    to="/admin/products"
                    className="nav-link"
                    onClick={() => setIsOpen(false)}
                  >
                    Quản lý SP
                  </Link>
                </li>
              )}
              <li>
                <button
                  type="button"
                  className="nav-link"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                    color: 'inherit',
                    padding: 0
                  }}
                >
                  Đăng xuất
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
