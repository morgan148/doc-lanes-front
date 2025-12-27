# Vercel Deployment (Known-Good)

This document describes the **known-good production configuration**
for the Medusa Storefront v2 frontend deployed on **Vercel**.

This configuration is confirmed working with:
- Backend: Medusa v2 on Railway
- Storefront: Next.js (App Router)
- Auth: Medusa Store API (publishable key)

---

## Repository

- Repo: `doc-lanes-front`
- Branch: `main`
- Tag: `known-good`

---

## Vercel Project Settings

### Framework
- **Next.js**

### Build Command
```bash
npm run build

### Environment Variables
  NEXT_PUBLIC_MEDUSA_BACKEND_URL="https://doc-lanes-back-production.up.railway.app"
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="pk*******"
  NEXT_PUBLIC_BASE_URL="https://doc-lanes-front.vercel.app"
  MEDUSA_BACKEND_URL="https://doc-lanes-back-production.up.railway.app"
  NEXT_PUBLIC_DEFAULT_REGION="us"

###Output Directory
      .next

### Install Command
    npm install --legacy-peer-deps

### Runtime Requirements
    node.js: 20.x
    app Router enabled
    Dynamic Rendering enabled where required products and collections: 
        export const dynamic = "force-dynamic"