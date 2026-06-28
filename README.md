# WSMT Social Media MVP

Deployment-ready MVP shell for WSMT Social Media. The app runs in local demo mode when Supabase and Stripe environment variables are blank. A checked-in env-config.js keeps double-click local preview working, and deployment builds regenerate it from environment variables.

## Run locally

1. Open a terminal in this folder.
2. Run: npm install
3. Run: npm run dev
4. Open the local URL Vite prints, usually http://localhost:5173

You can also double-click index.html for a simple local preview, but npm run dev is the recommended deployment-style local run.

## Environment variables

Create a .env file from .env.example and fill in only public/browser-safe values. The npm scripts generate env-config.js from these values:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_STRIPE_PAYMENT_LINK
- VITE_CHECKOUT_ENDPOINT

Do not put a Stripe secret key in frontend code or in any VITE_ variable. Stripe secret keys belong only in a backend/serverless function.

## Connect Supabase

1. Create a Supabase project.
2. Enable email authentication.
3. Create tables for profiles, posts, saved_posts, groups, marketplace_listings, and ads.
4. Add your Supabase project URL to VITE_SUPABASE_URL.
5. Add your public anon key to VITE_SUPABASE_ANON_KEY.

The app will keep using local browser storage until those values are present.

## Connect Stripe

Recommended quick setup:

1. Create a recurring Stripe product priced at $1/month.
2. Create a Stripe Payment Link for that recurring product.
3. Add that URL to VITE_STRIPE_PAYMENT_LINK.

More flexible setup:

1. Create a backend or serverless function that creates a Stripe Checkout Session.
2. Store the Stripe secret key only in that backend environment.
3. Return the Checkout Session URL from the backend.
4. Add that endpoint URL to VITE_CHECKOUT_ENDPOINT.

If both Stripe variables are blank, the app uses local demo membership activation.

## Deploy to Vercel

1. Push this folder to a Git repository.
2. Import the repository in Vercel.
3. Framework preset: Vite.
4. Build command: npm run build.
5. Output directory: dist.
6. Add the VITE_ environment variables in Vercel Project Settings.
7. Deploy.

## Deploy to Netlify

1. Push this folder to a Git repository.
2. Import the repository in Netlify.
3. Build command: npm run build.
4. Publish directory: dist.
5. Add the VITE_ environment variables in Site configuration.
6. Deploy.

## Included MVP features

- WSMT branded responsive UI
- Signup, login, logout, and profile screens
- Local demo data storage
- Supabase-ready config placeholders
- Feed, composer, likes, comments, shares, bookmarks, and saved posts
- Groups, marketplace listings, ads dashboard, business dashboard, and admin dashboard
- Stripe-ready $1/month recurring membership checkout
