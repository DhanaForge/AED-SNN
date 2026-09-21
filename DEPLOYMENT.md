# AED-SNN — Deployment Guide

This guide outlines how to deploy the **Adaptive Event-Driven Spiking Neural Network Simulator (AED-SNN)**.

---

## 1. Instant Static Deployment (Frontend UI)

The frontend is built with React 19 + Vite and compiles to static HTML/CSS/JS in `frontend/dist/`.

### Method A: Netlify Drop (Fastest — 10 Seconds, No CLI Login)
1. Open [app.netlify.com/drop](https://app.netlify.com/drop) in your browser.
2. Drag and drop the `AED-SNN/frontend/dist` folder directly into the browser window.
3. Your site will be live instantly with a public HTTPS URL (e.g., `https://aed-snn-research.netlify.app`).

---

### Method B: Vercel CLI
1. Open a terminal in `AED-SNN/frontend`:
   ```bash
   cd frontend
   npx vercel
   ```
2. Follow the prompts:
   - **Set up and deploy?** `Y`
   - **Which scope?** (Select your account)
   - **Link to existing project?** `N`
   - **Project name?** `aed-snn`
   - **In which directory is your code located?** `./`
   - **Want to modify settings?** `N` (Automatically detected via `vercel.json`)
3. For production deployment:
   ```bash
   npx vercel --prod
   ```

---

### Method C: Netlify CLI
1. Run in `AED-SNN/frontend`:
   ```bash
   cd frontend
   npx netlify deploy --prod --dir=dist
   ```
2. Authorize Netlify in your browser when prompted.

---

### Method D: GitHub Git Integration (Vercel / Netlify Dashboard)
1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) or [app.netlify.com/start](https://app.netlify.com/start).
3. Import your repository.
4. Set the following build settings:
   - **Root Directory**: `AED-SNN/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

---

## 2. Full-Stack Deployment with Live C++ Backend

To run live C++ simulations in the cloud (custom neuron counts $N$, real-time spikes, and WebSockets):

### Deploying Backend to Render.com (Free Web Service)
1. Create a `Dockerfile` in `AED-SNN/` with `g++`, `cmake`, and Node.js.
2. Connect your repository to [render.com](https://render.com).
3. Choose **Web Service** with runtime **Docker** or **Node**.
4. In the Vercel / Netlify frontend settings, add the environment variable:
   ```text
   VITE_API_BASE_URL=https://your-aed-snn-backend.onrender.com
   ```
5. The frontend will automatically connect to your cloud C++ backend!
