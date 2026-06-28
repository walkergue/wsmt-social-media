# WSMT Social Media MVP

This folder contains a browser-based working MVP shell for WSMT Social Media.

## Open the app

Double-click index.html or open it in any browser. No build step or server is required for local demo mode.

## Included

- Local demo mode when live keys are blank
- Supabase-ready configuration placeholders in app.js
- Signup, login, logout, and user profile UI
- Feed with post composer
- Like, comment, share, and bookmark actions
- Saved posts
- Groups and communities
- Marketplace listings
- Ads dashboard
- Business dashboard
- Admin dashboard with MRR, subscribers, reports, moderation queue, and JSON export
- Stripe-ready $1/month membership checkout using a Payment Link or backend checkout endpoint
- Mobile responsive WSMT branding

## Supabase setup still needed for live storage

Create a Supabase project, enable email auth, create matching tables for profiles, posts, saved_posts, groups, marketplace_listings, and ads, then place the public project URL and anon key in app.js.

## Stripe setup still needed for live billing

Create a recurring $1/month product in Stripe. Then either add a Stripe Payment Link to STRIPE_PAYMENT_LINK in app.js or create a backend endpoint that returns a Checkout Session URL and add that endpoint to CHECKOUT_ENDPOINT. Never place a Stripe secret key in frontend code.
