## Tars Chat

Production-ready realtime 1:1 chat built with Next.js App Router, Clerk, Convex, and Tailwind + shadcn/ui.

## Features
- Clerk authentication (sign-up/sign-in/sign-out)
- Users directory with search
- Real-time 1:1 conversations
- Typing indicators and online presence
- Unread counts and smart autoscroll
- Reactions and soft-delete
- Group chat creation
- Responsive layout (mobile + desktop)

## Local Setup

1. Install dependencies:
```bash
npm install
```

2. Create a Clerk app and add a JWT template for Convex:
- In Clerk Dashboard, create a JWT template named `convex`.
- Copy `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_SECRET_KEY`, and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

3. Create `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the Clerk keys and run Convex locally (next step) to populate `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL`.

4. Start Convex:
```bash
npx convex dev
```
This will write the Convex deployment values into `.env.local` and generate API types.

5. Start Next.js:
```bash
npm run dev
```

Open http://localhost:3000

## Convex Schema
The data model includes:
- users
- conversations
- conversationMembers
- messages
- presence
- typing
- reactions (optional)

## Deploy to Vercel
1. Push the repo to GitHub.
2. Create a new Vercel project from the repo.
3. Add the following environment variables in Vercel:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_JWT_ISSUER_DOMAIN`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `CONVEX_DEPLOYMENT`
4. In Clerk, set the production domain and redirect URLs to match your Vercel domain.
5. Deploy.
