import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { AnalyticsPage, DashboardPage } from '../pages/AnalyticsPages';
import { ModulePage } from '../pages/ModulePage';
import { adminModules } from './modules';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      ...adminModules
        .filter((module) => !['/dashboard', '/analytics'].includes(module.path))
        .map((module) => ({
          path: module.path.slice(1),
          element: <ModulePage title={module.label} description={module.description} />,
        })),
    ],
  },
]);
