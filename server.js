import express from "express";
import cors from "cors";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: "500kb" }));

// serve static frontend
app.use(express.static(path.join(__dirname, "public")));

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
if (!GEMINI_KEY) console.warn("⚠️ GEMINI_API_KEY not set");

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body || {};
    if (!prompt)
      return res.status(400).json({ success: false, error: "Missing prompt" });

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt || ""}\n${prompt}` }],
        },
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    };

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_KEY,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ No valid response from Gemini.";

    res.json({ success: true, text });
  } catch (err) {
    console.error("❌ Error generating:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
