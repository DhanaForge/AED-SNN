# AED-SNN — Comprehensive Deployment Guide

This guide explains how to deploy **AED-SNN** so that it works seamlessly on any device, anywhere in the world.

---

## ⚡ Key Concepts: Why Static Netlify Needs Special Handling

1. **Netlify is a Static Host (CDN)**:
   - Netlify hosts static HTML, CSS, and JS bundles (`frontend/dist/`).
   - Netlify **cannot** run native C++ executables (`aed_snn.exe` / `aed_snn`) or persistent Node.js servers with WebSocket ports (`:3000`).
2. **The "Another Device / Another Location" Problem**:
   - By default, the development configuration points to `http://localhost:3000`.
   - When opened on another device (e.g. phone, tablet, or another computer), that device searches for a server running on **its own** `localhost:3000`, which doesn't exist.
   - In addition, Netlify serves over secure **HTTPS**, so modern browsers block calls to `http://localhost:3000` as **Mixed Content Security Violations**.
3. **The Solution (Two Deployment Modes)**:
   - **Mode 1: Zero-Setup Standalone Cloud Mode (Works directly on Netlify)**:
     The frontend includes an **In-Browser Biological LIF SNN Engine**. Any device accessing the Netlify URL can configure arbitrary neurons, launch simulations, see real-time spike propagation, and inspect regime switches client-side without any backend server!
   - **Mode 2: Full-Stack Cloud Deployment (Authoritative C++ Binary)**:
     Deploy the backend Docker container to a cloud host (e.g. Render.com / Railway) and point Netlify's `VITE_API_BASE_URL` to your cloud backend URL.

---

## Option 1: Standalone Deployment on Netlify (1-Minute Setup)

With the built-in biological LIF simulation engine and bundled historical experiment datasets, the static build works on any phone, tablet, or remote machine out of the box.

### Step 1: Build the Latest Bundle
Run from the workspace root or `AED-SNN/frontend`:
```bash
npm run build
```
This updates `AED-SNN/frontend/dist/`.

### Step 2: Deploy to Netlify

#### Method A: Netlify Drop (No CLI, Drag-and-Drop)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the `AED-SNN/frontend/dist` folder into the browser window.
3. Your site is live immediately! Open the link on your phone or any external device.

#### Method B: Netlify CLI
```bash
cd AED-SNN/frontend
npx netlify deploy --prod --dir=dist
```

#### Method C: Netlify via GitHub
1. Connect your repository to Netlify.
2. Set **Base directory**: `AED-SNN/frontend`
3. Set **Build command**: `npm run build`
4. Set **Publish directory**: `dist`
5. Click **Deploy Site**.

---

## Option 2: Full-Stack Deployment with Cloud C++ Simulator

If you want live simulations to run using the authoritative compiled C++ binary in the cloud:

### 1. Deploy the Backend to Render.com (Free)
1. Sign up at [render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set **Runtime** to **Docker** (Render will automatically detect `AED-SNN/Dockerfile`, compile the C++ binary with `cmake` and `g++`, and start the Node.js API bridge).
5. Once deployed, Render provides a public HTTPS URL (e.g., `https://aed-snn-backend.onrender.com`).

### 2. Connect Your Netlify Frontend to Render
1. Go to your Netlify site dashboard -> **Site configuration** -> **Environment variables**.
2. Add the variable:
   ```text
   VITE_API_BASE_URL=https://your-backend-name.onrender.com
   ```
3. Trigger a redeploy on Netlify.
4. Now, any device anywhere will communicate directly with your cloud-hosted C++ simulator via secure WebSockets (`wss://`) and REST API (`https://`)!
