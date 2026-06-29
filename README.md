# fxp-admin

## Environment variables

Copy `.env.example` to `.env` and adjust the values for your environment.

```env
VITE_API_BASE_URL=https://api.example.com
# Local development:
# VITE_API_BASE_URL=http://localhost:3000
```

`VITE_API_BASE_URL` is the backend service root address, not the management API prefix. Do not include `/admin` in this base URL because the business API paths already start with `/admin/...`.
