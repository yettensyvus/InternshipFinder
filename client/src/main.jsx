import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './i18n/i18n';
import './index.css'; // Tailwind styles

function ThemeAwareToastContainer() {
  const [theme, setTheme] = useState(() => (
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  ));

  useEffect(() => {
    const update = () => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('app-settings-changed', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('app-settings-changed', update);
    };
  }, []);

  return (
    <ToastContainer
      position="top-right"
      autoClose={2200}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme={theme}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeAwareToastContainer />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
