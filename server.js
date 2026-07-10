import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables from .env if present
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const requiredEnvKeys = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID"
];

// Replicate both Vercel and Netlify functions path for robust compatibility
const envHandler = (req, res) => {
  const missing = requiredEnvKeys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`[Server] Missing Firebase environment variables: ${missing.join(", ")}`);
    return res.status(500).json({
      error: "Missing Firebase environment variables.",
      missing
    });
  }

  res.setHeader("Cache-Control", "no-store");
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  });
};

app.get("/api/firebase-env", envHandler);
app.get("/.netlify/functions/firebase-env", envHandler);

// Serve static files from the root of the workspace
app.use(express.static(__dirname));

// Direct fallbacks for common routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] running on http://0.0.0.0:${PORT}`);
});
