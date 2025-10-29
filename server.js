// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(express.json({ limit: "500kb" }));
app.use(express.static(path.join(__dirname, "public")));

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
if (!GEMINI_KEY) console.warn("⚠️ GEMINI_API_KEY not set");

// Serve login.html as default
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// AI endpoint
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body || {};
    if (!prompt)
      return res.status(400).json({ success: false, error: "Missing prompt" });

    const contents = [
      { role: "user", parts: [{ text: systemPrompt || "" }] },
      { role: "user", parts: [{ text: prompt }] },
    ];

    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_KEY,
        },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 512 },
        }),
      }
    );

    const data = await resp.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join(" ") ||
      "Sorry, I couldn’t understand that.";

    res.json({ success: true, text });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on http://localhost:${PORT}`));
