// server.js
import express from "express";
import cors from "cors";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "500kb" }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
if (!GEMINI_KEY) console.warn("⚠️ GEMINI_API_KEY not set");

// === ROUTES ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body || {};
    if (!prompt)
      return res.status(400).json({ success: false, error: "Missing prompt" });

    const contents = [
      ...(systemPrompt ? [{ role: "system", parts: [{ text: systemPrompt }] }] : []),
      { role: "user", parts: [{ text: prompt }] },
    ];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
        }),
      }
    );

    const data = await response.json();

    // FIX: Correct field for Gemini 2.5 API
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join(" ") ||
      data?.output_text ||
      "⚠️ No AI response received.";

    res.json({ success: true, text });
  } catch (err) {
    console.error("❌ AI error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running at http://localhost:${PORT}`));
