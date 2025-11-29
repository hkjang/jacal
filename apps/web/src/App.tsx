import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import AuthPage from './components/AuthPage';
import MainLayout from './components/MainLayout';
import './App.css';

import { ViewType } from './types/navigation';

const STORAGE_KEY = 'jacal_current_view';
const validViews: ViewType[] = ['home', 'calendar', 'settings', 'admin', 'habits', 'dashboard', 'teams'];

function App() {
  // Initialize view from localStorage or default to 'home'
  const [view, setView] = useState<ViewType>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ViewType | null;
    return stored && validViews.includes(stored) ? stored : 'home';
  });
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  
  const { 
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
  } = useAuth();

  // Persist view changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, view);
  }, [view]);

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    { key: '1', alt: true, handler: () => setView('home'), description: 'Go to Home' },
    { key: '2', alt: true, handler: () => setView('calendar'), description: 'Go to Calendar' },
    { key: '3', alt: true, handler: () => setView('settings'), description: 'Go to Settings' },
    { key: '4', alt: true, handler: () => setView('admin'), description: 'Go to Admin', condition: isAdmin },
    { key: '/', shift: true, handler: () => setShowShortcutsModal(true), description: 'Show shortcuts' },
    { key: 'k', ctrlOrCmd: true, handler: () => {
      const input = document.querySelector('.nlu-input') as HTMLInputElement;
      if (input) input.focus();
    }, description: 'Focus input' },
  ], isAuthenticated);

  if (!isAuthenticated) {
    return (
      <AuthPage
        loginMode={loginMode}
        setLoginMode={setLoginMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        name={name}
        setName={setName}
        onSubmit={handleAuth}
      />
    );
  }

  return (
    <>
      <MainLayout
        currentView={view}
        onViewChange={setView}
        userEmail={email}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </>
  );
}

export default App;
