// server.js
const express = require("express");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "500kb" }));

// serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
if (!GEMINI_KEY) console.warn("⚠️ GEMINI_API_KEY not set");

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body || {};
    if (!prompt) return res.status(400).json({ success: false, error: "Missing prompt" });

    const contents = [];
    if (systemPrompt) contents.push({ role: "system", parts: [{ text: systemPrompt }] });
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_KEY,
        },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
      }
    );

    const data = await resp.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.output?.[0]?.contents?.[0]?.parts?.[0]?.text ||
      "No response";

    res.json({ success: true, text });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

