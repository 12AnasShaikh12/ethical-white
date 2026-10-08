# Ethical White

Ethical White is a React/Vite skincare storefront with an Express API for the optional DeepSeek skin guide.

## Run locally

```bash
npm install
npm run dev
```

To enable the chat assistant locally, copy `.env.example` to `.env`, add your `DEEPSEEK_API_KEY`, and run the API in a second terminal:

```bash
npm run api
```

## Deploy for free with Render

This project is configured as one Render web service. Render builds the Vite site and the Express server serves both the site and `/api/chat`, so the app remains available when this computer is turned off.

1. Create an empty GitHub repository named `ethical-white`.
2. In this project folder, run:

   ```bash
   git init
   git add .
   git commit -m "Prepare Ethical White for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/ethical-white.git
   git push -u origin main
   ```

   Replace `YOUR-USERNAME` with your GitHub username.

3. Open [render.com](https://render.com), sign in with GitHub, choose **New +** and **Web Service**, then select the repository.
4. Use these settings:

   - **Runtime:** Node
   - **Build Command:** `npm ci && npm run build`                                   
   - **Start Command:** `npm start`
   - **Instance Type:** Free

5. In Render's **Environment Variables**, add `DEEPSEEK_API_KEY` with your DeepSeek key. Add `DEEPSEEK_MODEL` with `deepseek-chat` if desired. Never put the real key in GitHub, `.env`, React code, or `VITE_` variables.
6. Click **Create Web Service**. Render will give you a public `onrender.com` URL that works from any device.

The free Render service may sleep after inactivity, so the first visit or chat request can take a short moment to wake it. Future pushes to the GitHub `main` branch automatically redeploy the site.

## Production check before pushing

```bash
npm run build
npm start
```

Open `http://localhost:8787` after both commands are running. The production server expects the `dist` folder created by `npm run build`.
