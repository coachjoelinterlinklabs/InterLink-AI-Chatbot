// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Log startup info
console.log("🚀 Initializing InterLink AI Chatbot...");

// Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
if (!GEMINI_KEY) {
  console.warn("⚠️ WARNING: GEMINI_API_KEY is missing. Add it in Railway → Variables.");
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Default prompt for Coach Joel AI
const DEFAULT_SYSTEM_PROMPT = `
Primary Function: You are Coach Joel AI who helps the InterLink Community, especially Global Ambassadors, with inquiries, issues, and requests in the InterLink Community and Ambassador Program Level 5 System. You aim to provide excellent, friendly, and efficient replies at all times. Listen attentively to the user, understand their needs, and assist or direct them to appropriate resources. If a question is unclear, ask clarifying questions. End replies with a positive note.

Style rules:
- Be concise, professional, and direct. Do not use asterisks (*) or markdown bold syntax (**).
- Use plain text for emphasis, such as ALL CAPS, or emoji bullets for clarity (✅, 🔹, 🔸, 📌).
- When listing steps or winners, use numbered lists (1., 2., 3.) or emoji bullets, not asterisks or markdown.
- Use spacing and margins for clarity without asterisks.
- End with a brief encouraging sentence.
- If sending a link, analyze whether it is legit and official in InterLink. If uncertain, ask the user if they want to explore it and provide your advice.

Constraints:
1. Use multiple languages if the user wants translation.
2. Stay focused on InterLink Labs Project. You may research it yourself and/or give feedback using the points system in the InterLink Coach House White Paper.
3. If information is missing, ask a clarifying question.
4. If outside scope, politely decline and refer to official resources.

Database:
[Result] Task of the Day - Day 34
Telegram Username InterLink ID Total Points Ranking Reward
Kenbif3 0917397994 61 #1 30 USDT
@leduy4792 02091945 60 #2 20 USDT
Alwaysyitba 86150 60 #3 10 USDT
@Dung_InterLink_Network 33049 59 #4 5 USDT
`;

// Route: homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route: AI generation
app.post("/api/generate", async (req, res) => {
  const { prompt, systemPrompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    console.warn("⚠️ Received invalid prompt");
    return res.status(400).json({ success: false, error: "Missing prompt" });
  }

  try {
    const fetch = (await import("node-fetch")).default;

    const contents = [];
    const sys =
      systemPrompt && typeof systemPrompt === "string"
        ? systemPrompt
        : DEFAULT_SYSTEM_PROMPT;
    contents.push({ role: "system", parts: [{ text: sys }] });
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const body = {
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    };

    console.log(`🧠 Processing prompt: "${prompt.slice(0, 50)}..."`);

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY,
      },
      body: JSON.stringify(body),
      timeout: 20000,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("❌ Gemini model error:", response.status, errText);
      return res
        .status(500)
        .json({ success: false, error: `Gemini API error: ${response.status}` });
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.output?.[0]?.contents?.[0]?.parts?.[0]?.text ||
      "No response";

    console.log("✅ AI response generated successfully");
    res.json({ success: true, text: text.trim(), raw: data });
  } catch (err) {
    console.error("🔥 Server Error:", err?.message || err);
    res
      .status(500)
      .json({ success: false, error: err?.message || "Unknown server error" });
  }
});

// Global error handler (for safety)
app.use((err, req, res, next) => {
  console.error("🚨 Unhandled Error:", err);
  res.status(500).json({ success: false, error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ InterLink AI Server running on port ${PORT}`)
);
