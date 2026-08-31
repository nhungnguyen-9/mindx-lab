import { useEffect, useState } from 'react';
import type { User, UserRole } from '@shared/types';
import { api } from '../../lib/api';

const ROLES: UserRole[] = ['admin', 'teacher', 'sale'];

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function AdminUserList() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formUsername, setFormUsername] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formRole, setFormRole] = useState<UserRole>('sale');
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const loadUsers = async () => {
        try {
            setError('');
            const data = await api.fetchUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);
        try {
            await api.createUser({
                username: formUsername,
                password: formPassword,
                role: formRole,
            });
            setFormUsername('');
            setFormPassword('');
            setFormRole('sale');
            setShowForm(false);
            await loadUsers();
        } catch (err: any) {
            setFormError(err.message || 'Không thể tạo người dùng');
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: UserRole) => {
        try {
            setError('');
            await api.updateUser(userId, { role: newRole });
            await loadUsers();
        } catch (err: any) {
            setError(err.message || 'Không thể cập nhật role');
        }
    };

    const handleDelete = async (userId: string, username: string) => {
        const confirmed = window.confirm(
            `Bạn chắc chắn muốn xóa người dùng "${username}"?`
        );
        if (!confirmed) return;
        try {
            setError('');
            await api.deleteUser(userId);
            await loadUsers();
        } catch (err: any) {
            setError(err.message || 'Không thể xóa người dùng');
        }
    };

    if (loading) {
        return (
            <section className="p-6">
                <p className="text-gray-500">Đang tải...</p>
            </section>
        );
    }

    return (
        <section className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Đóng' : 'Thêm người dùng'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={handleCreate}
                    className="bg-gray-50 border border-gray-200 rounded p-4 mb-6 max-w-md"
                >
                    <h2 className="text-lg font-semibold mb-3">Tạo người dùng mới</h2>
                    {formError && (
                        <p className="text-red-600 text-sm mb-2">{formError}</p>
                    )}
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">
                            Tên đăng nhập
                        </label>
                        <input
                            type="text"
                            value={formUsername}
                            onChange={(e) => setFormUsername(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            placeholder="username"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Mật khẩu</label>
                        <input
                            type="password"
                            value={formPassword}
                            onChange={(e) => setFormPassword(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Vai trò</label>
                        <select
                            value={formRole}
                            onChange={(e) => setFormRole(e.target.value as UserRole)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                            {ROLES.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={formLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {formLoading ? 'Đang tạo...' : 'Tạo'}
                    </button>
                </form>
            )}

            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-200 px-4 py-2 text-left">
                                Username
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left">
                                Role
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left">
                                Ngày tạo
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="border border-gray-200 px-4 py-2">
                                    {user.username}
                                </td>
                                <td className="border border-gray-200 px-4 py-2">
                                    <select
                                        value={user.role}
                                        onChange={(e) =>
                                            handleUpdateRole(user.id, e.target.value as UserRole)
                                        }
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="border border-gray-200 px-4 py-2">
                                    {formatDate(user.createdAt)}
                                </td>
                                <td className="border border-gray-200 px-4 py-2">
                                    <button
                                        onClick={() => handleDelete(user.id, user.username)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="border border-gray-200 px-4 py-4 text-center text-gray-500"
                                >
                                    Chưa có người dùng nào
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
