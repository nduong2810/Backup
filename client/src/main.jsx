import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import store from './store';
import { ToastProvider } from './context/ToastContext';
import ScrollToTop from './components/common/ScrollToTop.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ToastProvider>
          <ScrollToTop />
          <App />
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
