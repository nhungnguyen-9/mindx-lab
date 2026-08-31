import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole } from '@shared/types';

export type { UserRole };

export interface AuthUser {
    id: string;
    username: string;
    role: UserRole;
}

export interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    login: (token: string, user: AuthUser) => void;
    logout: () => void;
    hasRole: (roles: UserRole[]) => boolean;
}

const TOKEN_KEY = 'mindx_admin_token';
const USER_KEY = 'mindx_user_info';

function isTokenExpired(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    try {
        const payload = JSON.parse(atob(parts[1]));
        if (typeof payload.exp !== 'number') return false;
        return payload.exp < Date.now() / 1000;
    } catch {
        return true;
    }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        const userJson = localStorage.getItem(USER_KEY);

        if (!token || !userJson) {
            return;
        }

        if (isTokenExpired(token)) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            return;
        }

        try {
            const parsed = JSON.parse(userJson) as AuthUser;
            setUser(parsed);
        } catch {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
    }, []);

    const login = (token: string, user: AuthUser) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
    };

    const hasRole = (roles: UserRole[]): boolean => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    const value: AuthContextValue = {
        user,
        isAuthenticated: user !== null,
        login,
        logout,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
