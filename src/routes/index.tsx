import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { ModulePage } from '../pages/ModulePage';
import { SystemConfig } from '../pages/SystemConfig';
import { ContentQuality } from '../pages/ContentQuality';
import { AdminModule, adminModules } from './modules';

function renderModule(module: AdminModule) {
  if (module.path === '/config') {
    return <SystemConfig />;
  }

  if (module.module === 'content-quality') {
    return <ContentQuality />;
  }

  return <ModulePage title={module.label} description={module.description} module={module.module} />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...adminModules.map((module) => ({
        path: module.path.slice(1),
        element: renderModule(module),
      })),
    ],
  },
]);
