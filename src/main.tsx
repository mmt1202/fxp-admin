import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppConfigBootstrap } from './components/AppConfigBootstrap';
import { router } from './routes';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppConfigBootstrap>
      <RouterProvider router={router} />
    </AppConfigBootstrap>
  </StrictMode>,
);
