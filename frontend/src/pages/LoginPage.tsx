import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';
import logo from '../images/logo.png';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as { from?: string })?.from || '/';

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.authLogin({ username, password });
            auth.login(res.token, res.user);
            navigate(from, { replace: true });
        } catch (err) {
            const message =
                err instanceof Error && err.message && err.message !== 'Unauthorized'
                    ? err.message
                    : 'Tên đăng nhập hoặc mật khẩu không đúng';
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="admin-auth">
            <form className="admin-form login-form" onSubmit={handleSubmit}>
                <div className="login-head">
                    <img src={logo} alt="MindX Lab" className="login-logo" />
                    <h1>Đăng nhập</h1>
                    <p className="login-sub">Đăng nhập để quản lý sản phẩm</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                <div className="login-field">
                    <label htmlFor="username">Tên đăng nhập</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoFocus
                        placeholder="Nhập tên đăng nhập"
                    />
                </div>

                <div className="login-field">
                    <label htmlFor="password">Mật khẩu</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Nhập mật khẩu"
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </form>
        </div>
    );
}
