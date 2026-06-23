import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { AnalyticsPage, DashboardPage } from '../pages/AnalyticsPages';
import { ModulePage } from '../pages/ModulePage';
import { SystemConfig } from '../pages/SystemConfig';
import { RiskConfig } from '../pages/RiskConfig';
import { UserDetailPage } from '../pages/UserDetailPage';
import { UserListPage } from '../pages/UserListPage';
import { MembershipPlans } from '../pages/MembershipPlans';
import { adminModules } from './modules';
import { PermissionRoute } from './PermissionRoute';

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
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.path === '/membership/plans'
            ? <MembershipPlans />
            : <ModulePage title={module.label} description={module.description} />,
        })),
      ],
    },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.path === '/users'
            ? <UserListPage />
            : <ModulePage title={module.label} description={module.description} />,
        })),
        { path: 'users/:userId', element: <UserDetailPage /> },
      ],
    },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: <PermissionRoute module={module} />,
        })),
      ],
    },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.path === '/risk'
            ? <RiskConfig />
            : <ModulePage title={module.label} description={module.description} />,
        })),
      ],
    },
]);
