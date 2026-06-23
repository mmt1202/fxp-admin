import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { ModulePage } from '../pages/ModulePage';
import { SystemConfig } from '../pages/SystemConfig';
import { UserSegments } from '../pages/UserSegments';
import { adminModules } from './modules';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...adminModules.map((module) => ({
        path: module.path.slice(1),
        element: module.path === '/config'
          ? <SystemConfig />
          : module.path === '/user-segments'
            ? <UserSegments />
            : <ModulePage title={module.label} description={module.description} module={module.module ?? 'dashboard'} />,
      })),
    ],
  },
]);
