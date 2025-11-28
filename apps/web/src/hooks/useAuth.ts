import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../lib/api';

export function useAuth() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // Optionally fetch user details to set isAdmin if needed, 
      // but for now we rely on the initial login/register response or just token presence
      // In a real app, we might want to validate the token or fetch /auth/me
      authAPI.me().then(user => {
        setIsAdmin(user.isAdmin || false);
      }).catch(() => {
        // Token might be invalid
        // localStorage.removeItem('token');
        // setIsAuthenticated(false);
      });
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (loginMode === 'login') {
        const data = await authAPI.login(email, password);
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        setIsAdmin(data.user.isAdmin || false);
      } else {
        const data = await authAPI.register(email, name, password);
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        setIsAdmin(data.user.isAdmin || false);
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert(t('auth.failed', '인증 실패'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setIsAdmin(false);
    setEmail('');
    setPassword('');
    setName('');
  };

  return {
    isAuthenticated,
    isAdmin,
    loginMode,
    setLoginMode,
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    handleAuth,
    handleLogout
  };
}
