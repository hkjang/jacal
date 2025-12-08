import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authAPI, publicAPI } from '../lib/api';

export function useAuth() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [registrationAllowed, setRegistrationAllowed] = useState(true);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Check if user is logged in and fetch public config
  useEffect(() => {
    // Fetch public config to check if registration is allowed
    publicAPI.getConfig().then(config => {
      setRegistrationAllowed(config.allowRegistration);
    }).catch(() => {
      // Default to allowing registration if config can't be fetched
      setRegistrationAllowed(true);
    });

    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // Optionally fetch user details to set isAdmin if needed, 
      // but for now we rely on the initial login/register response or just token presence
      // In a real app, we might want to validate the token or fetch /auth/me
      authAPI.me().then(response => {
        setIsAdmin(response.user.isAdmin || false);
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
    } catch (error: any) {
      console.error('Auth error:', error);
      // Show specific error message from API if available
      const message = error.response?.data?.message || t('auth.failed', '인증 실패');
      alert(message);
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
    registrationAllowed,
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

