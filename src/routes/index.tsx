import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { ContentModeration } from '../pages/ContentModeration';
import { AnalyticsPage, DashboardPage } from '../pages/AnalyticsPages';
import { MarketingCampaigns } from '../pages/MarketingCampaigns';
import { ModulePage } from '../pages/ModulePage';
import { RecommendationPools } from '../pages/RecommendationPools';
import { CmsArticles } from '../pages/CmsArticles';
import { SystemConfig } from '../pages/SystemConfig';
import { RiskConfig } from '../pages/RiskConfig';
import { UserDetailPage } from '../pages/UserDetailPage';
import { UserListPage } from '../pages/UserListPage';
import { MembershipPlans } from '../pages/MembershipPlans';
import { SystemHealth } from '../pages/SystemHealth';
import { adminModules } from './modules';
import { PermissionRoute } from './PermissionRoute';
import { adminModules, type AdminModule } from './modules';

function renderModulePage(module: AdminModule) {
  switch (module.module) {
    case 'config':
      return <SystemConfig />;
    case 'marketing':
      return <MarketingCampaigns />;
    default:
      return <ModulePage title={module.label} description={module.description} module={module.module} />;
  }
}

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
          element: renderModulePage(module),
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
          element: module.path === '/content-moderation'
            ? <ContentModeration />
            : <ModulePage title={module.label} description={module.description} />,
        })),
      ],
    }
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
{
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...adminModules.map((module) => ({
        path: module.path.slice(1),
        element: module.path === '/config'
          ? <SystemConfig />
          : <ModulePage title={module.label} description={module.description} />,
        element: <ModulePage title={module.label} description={module.description} module={module.module} />,
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
          element: module.element ?? <ModulePage title={module.label} description={module.description} />,
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
            element: module.path === '/config'
              ? <SystemConfig />
              : module.path === '/recommendation-pools'
                ? <RecommendationPools />
                : <ModulePage title={module.label} description={module.description} module={module.module} />,
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
          element: module.module === 'config'
            ? <SystemConfig />
            : module.module === 'cms'
              ? <CmsArticles />
              : <ModulePage title={module.label} description={module.description} module={module.module} />,
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
            element: module.path === '/system-health'
              ? <SystemHealth />
              : <ModulePage title={module.label} description={module.description} />,
          })),
        ],
      },
]);
