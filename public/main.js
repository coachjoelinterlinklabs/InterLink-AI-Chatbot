// main.js (frontend) — call your Railway-hosted proxy endpoint
const PROXY_ENDPOINT = "/api/generate"; // if frontend and backend are on same host:port; otherwise full URL

const SYSTEM_PROMPT = `Role:
... your long system prompt ...
`;

// function to call the proxy
async function askCoach(prompt) {
  try {
    const body = {
      prompt,
      systemPrompt: SYSTEM_PROMPT
    };
    const res = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || data.details || "Unknown");
    return data.text;
  } catch (err) {
    console.error("askCoach error:", err);
    throw err;
  }
}

// Example usage:
(async () => {
  try {
    const reply = await askCoach("Hello, how can you help me?");
    console.log("AI reply:", reply);
  } catch (e) {
    console.error(e);
  }
})();
