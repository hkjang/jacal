import { useTranslation } from 'react-i18next';

interface AuthPageProps {
  loginMode: 'login' | 'register';
  setLoginMode: (mode: 'login' | 'register') => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  name: string;
  setName: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AuthPage({
  loginMode,
  setLoginMode,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  onSubmit,
}: AuthPageProps) {
  const { t } = useTranslation();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Jacal</h1>
        <p className="auth-subtitle">{t('app.subtitle', '지능형 생산성 플랫폼')}</p>
        
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${loginMode === 'login' ? 'active' : ''}`}
            onClick={() => setLoginMode('login')}
          >
            {t('auth.login', '로그인')}
          </button>
          <button 
            className={`auth-tab ${loginMode === 'register' ? 'active' : ''}`}
            onClick={() => setLoginMode('register')}
          >
            {t('auth.register', '회원가입')}
          </button>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          {loginMode === 'register' && (
            <div className="form-group">
              <label>{t('auth.name', '이름')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>{t('auth.email', '이메일')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>{t('auth.password', '비밀번호')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {loginMode === 'login' ? t('auth.login', '로그인') : t('auth.register', '회원가입')}
          </button>
        </form>
      </div>
    </div>
  );
}
