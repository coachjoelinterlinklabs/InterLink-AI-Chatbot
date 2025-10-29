// server.js (CommonJS — put at repo root)
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "500kb" }));

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_KEY) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set.");
}

app.get("/", (req, res) => res.send("InterLink Coach Proxy is running."));

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ success: false, error: "Missing 'prompt' string in request body." });
    }

    const contents = [];
    if (systemPrompt) {
      contents.push({ role: "system", parts: [{ text: systemPrompt }] });
    }
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(502).json({ success: false, error: "Upstream error", details: txt });
    }

    const data = await resp.json();

    // permissive extraction of text
    let text = "";
    try {
      if (Array.isArray(data?.output) && data.output[0]?.contents) {
        text = data.output[0].contents.map(p => p.text || "").join("");
      } else if (Array.isArray(data?.candidates) && data.candidates[0]?.content) {
        text = data.candidates.map(c => c.content).join("\n\n");
      } else if (typeof data?.text === "string") {
        text = data.text;
      } else {
        text = JSON.stringify(data);
      }
    } catch (e) {
      text = JSON.stringify(data);
    }

    return res.json({ success: true, text });
  } catch (err) {
    console.error("Generate error:", err);
    return res.status(500).json({ success: false, error: "Server error", details: err?.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
