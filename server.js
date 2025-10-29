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
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in environment!");
}

// Default route → login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Chat AI route
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Missing prompt" });
    }

    const body = {
      contents: [
        { role: "user", parts: [{ text: systemPrompt || "" }] },
        { role: "user", parts: [{ text: prompt }] },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res
        .status(500)
        .json({ success: false, error: data.error?.message || "API Error" });
    }

    // ✅ Extract Gemini text safely
    let text = "No response.";
    if (data?.candidates?.length > 0) {
      const parts = data.candidates[0].content.parts;
      text = parts.map((p) => p.text || "").join(" ").trim();
    }

    if (!text || text === "") text = "Sorry, I couldn’t generate a response.";

    res.json({ success: true, text });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 InterLink AI running at http://localhost:${PORT}`)
);
