# Merge Feature Audit

This audit was created after repairing merge conflicts to verify that merged branch functionality is still represented in the current React admin app. The repository has no remote refs available in this workspace, so the audit is based on first-parent merge history and each merge commit's second parent.

## Method

- Listed merge commits with `git log --first-parent --merges`.
- For each merge, inspected the second parent with `git diff-tree --name-status -r <second-parent>`.
- Compared changed `src/pages`, `src/api`, and `src/routes` files against the current `HEAD` router, module registry, and API exports.
- Restored confirmed missing feature wiring instead of reintroducing broken conflict fragments.

## Findings

| Merged feature branch / commit subject | Added or changed feature area | Current status |
| --- | --- | --- |
| Add admin property management page | `Properties`, property API, `/properties` route | Preserved via the richer `PropertyManagement` route. The older `Properties` component remains as an alternate page but is not routed because `PropertyManagement` includes list/detail/review/visibility/delete actions. |
| Harden admin property management flows | `PropertyManagement`, property actions | Preserved via `/properties`. |
| Add property completeness governance | property completeness API and governance page | Preserved via `/property-governance` and property completeness API helpers. |
| Add local community moderation API mock | community API and content moderation page | Preserved via `/content-moderation`. |
| Add admin user detail page | user list/detail pages | Preserved via `/users` and `/users/:userId`. |
| Add admin user membership and report review pages | user membership actions and report review page | Restored wiring: membership operations are now reachable via `/membership`; report review remains reachable via `/moderation` and `/reports`. |
| Add admin operation logs page | operation log API/page | Preserved via `/operation-logs`. |
| Add admin API client and docs | API modules barrel | Restored safely as `adminApiModules` namespace to avoid duplicate named exports. |
| Refactor admin app structure | dashboard/orders/reports/settings legacy DOM pages and API modules | React equivalents or generic loaders are retained; legacy DOM pages are not routed by the React app. |
| Implement recall task management | recall task API/page | Preserved via `/marketing/recall-tasks`. |
| Add content quality scoring admin page | content quality API/page | Preserved via `/content-quality`. |
| Add user lifecycle analytics page | lifecycle API/page | Preserved via `/user-lifecycle`. |
| Add user segmentation operations page | user segments API/page | Preserved via `/user-segments`. |
| Add marketing campaign management | marketing campaign API/page | Preserved via `/marketing`. |
| Complete marketing tools workflows | coupons and redeem codes | Restored wiring via `/marketing/tools`. |
| Harden system health response handling | system health API/page | Preserved via `/system-health`. |
| Add official CMS article management | CMS API/page | Preserved via `/cms`. |
| Add recommendation pool management | recommendation API/page | Preserved via `/recommendation-pools`. |
| Polish regional heat analytics implementation | location/community analytics API/page | Preserved via `/regional-heat`. |
| Harden membership plan management | membership plan API/page | Preserved via `/membership/plans`. |
| Connect analytics pages to API | analytics API/pages | Preserved via `/analytics` and `/dashboard`. |
| Implement admin login flow | login API/page | Preserved via `/login`. |
| Implement admin permission UI | admin users and permission route | Preserved via `PermissionRoute` and `/admin-users`. |
| Polish risk configuration interactions | risk API/page | Preserved via `/risk`. |
| MVP / initial scaffold / backend alignment | base modules and generic API-backed fallback page | Preserved via module registry and `ModulePage` fallback. |

## Confirmed repairs from this audit

1. `/marketing/tools` now routes to `MarketingTools`, restoring the coupon and redeem-code workflows.
2. `/membership` now routes to `UsersPage`, restoring the merged user membership view/update workflow that was otherwise present but not reachable.
3. `src/api/index.ts` keeps the core client exports and exposes legacy API modules as `adminApiModules`, avoiding both deleted access and duplicate-export build failures.
