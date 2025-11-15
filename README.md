# Two-Person Chat — Updated (room-based) Starter Repo

This repo contains a frontend (Vite + React + Tailwind) and a Node.js Socket.io server, updated to use private rooms and a 'Share link' button so two friends can chat easily by opening the same URL.

## Quick overview for non-technical friend
1. You (Alice) will deploy the server and the frontend (or I can deploy for you).
2. Open the frontend URL (e.g., https://your-frontend.vercel.app). Click "Share link" — it copies a private URL like `...?room=abc123`.
3. Send that URL to your friend. They open it, and both of you will be in the same private room and chat realtime — no accounts needed.

## Detailed steps for you (full instructions)

### Option A — Simple (I deploy for you)
If you want, tell me and I will deploy the server (Railway/Replit) and the frontend (Vercel) and give you the two URLs. Then you just copy the Share link from the frontend and send it to your friend.

### Option B — You deploy (step-by-step)

#### 1) Deploy server to Railway (or Replit)
a. Create a Railway account at https://railway.app (or Replit account at https://replit.com).b. Create a new project -> Deploy from GitHub (push this repo to GitHub first) OR start from scratch and paste `server` contents. Railway auto-detects Node. Set Start Command: `node server.js`.c. After deploy, note the public URL (e.g., https://your-server.uprailway.app). Copy it.

Alternative (Replit): create a new Node repl, upload `server.js` & `package.json`, click Run and copy the Replit URL.

#### 2) Deploy frontend to Vercel
a. Create a Vercel account at https://vercel.com and connect your GitHub. b. Import the `frontend` folder as a new project. c. In Vercel Project Settings -> Environment Variables, add `VITE_SERVER_URL` with your server URL (e.g., https://your-server.uprailway.app). d. Deploy. Vercel will give you a URL like https://your-frontend.vercel.app

#### 3) Using the chat (for both friends)
1. Open the frontend URL in any browser. The app will generate (or read) a `room` id.
2. Click **Share link** — it copies a URL like `https://your-frontend.vercel.app/?room=abc123`.
3. Send that URL (via SMS, email, or paste anywhere) to your friend. When they open it, both of you are in the same private room.
4. Start typing — messages are realtime. No login required.

#### 4) Local testing before deploy (optional)
- Run the server locally: `cd server && npm install && npm start` (server runs on http://localhost:4000)
- Run the frontend locally: `cd frontend && npm install && npm run dev` (Vite dev server, usually http://localhost:5173)
- Open the frontend in two different browsers or devices and set the URL `http://localhost:5173/?room=testroom` to test.

## Security & notes
- Room ids are not secret if shared. Don't post them publicly.
- This prototype broadcasts only to room members. For production add HTTPS, auth, persistence.
- If you want me to deploy this for you and hand over the URLs, say so and provide any preference (Railway or Replit).

