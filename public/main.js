// main.js — frontend
const PROXY_ENDPOINT = "/api/generate";
const SYSTEM_PROMPT = `
Role:
You are Coach Joe AI, the helpful assistant for InterLink Global Network.
Always be professional, friendly, and greet users personally if their Telegram username or ID is known.
`;

const input = document.querySelector('input[placeholder="Ask Anything"]');
const sendBtn = document.querySelector("#btn-send-recording");
const chatArea = document.querySelector(".chat-area");
const micBtn = document.querySelector("#btn-mic");

let userName = "Linker";
let hasIntroduced = false;

// Add message bubble to chat
function addMessage(text, from = "user") {
  const msg = document.createElement("div");
  msg.className =
    "flex items-center gap-2 w-full " +
    (from === "user" ? "flex-row-reverse" : "");
  msg.innerHTML = `
    <img
      src="${
        from === "user"
          ? "https://public.interlinklabs.ai/1761721359159_Ellipse.png"
          : "https://public.interlinklabs.ai/1761722972563_avt.png"
      }"
      class="w-10 h-10 rounded-full"
    />
    <div class="px-4 py-[10px] max-w-[70%] ${
      from === "user"
        ? "bg-[#1A1A1A] text-white rounded-[16px] rounded-br-[8px]"
        : "bg-[#F5F7FA] text-[#0E121B] rounded-[16px] rounded-bl-[8px]"
    }">
      <p class="text-[14px] whitespace-pre-line">${text}</p>
    </div>
  `;
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Call backend
async function askCoach(prompt) {
  try {
    const body = { prompt, systemPrompt: SYSTEM_PROMPT };
    const res = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Unknown");
    return data.text;
  } catch (err) {
    console.error("askCoach error:", err);
    return "⚠️ Unable to reach Coach Joe AI.";
  }
}

// Send message handler
async function sendMessage() {
  const prompt = input.value.trim();
  if (!prompt) return;

  // Detect Telegram ID or username
  if (!hasIntroduced && /@?\w{3,}/.test(prompt)) {
    userName = prompt.replace("@", "");
    addMessage(`Got it! Hello, ${userName} 👋`, "bot");
    hasIntroduced = true;
    input.value = "";
    return;
  }

  addMessage(prompt, "user");
  input.value = "";
  addMessage("…", "bot");

  const personalizedPrompt = hasIntroduced
    ? `User ${userName} says: ${prompt}`
    : prompt;

  const reply = await askCoach(personalizedPrompt);

  // Replace "…" with AI reply
  const dots = Array.from(chatArea.querySelectorAll("p")).find(
    (p) => p.textContent === "…"
  );
  if (dots) dots.textContent = reply || "No response from AI.";
}

// Send events
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => e.key === "Enter" && sendMessage());

// Greeting
window.addEventListener("load", () => {
  addMessage(`Hello, ${userName}! 👋`, "bot");
  addMessage(
    "You can tell me your Telegram username or ID to personalize our chat.",
    "bot"
  );
});

// 🎙 Voice recognition
micBtn?.addEventListener("click", async () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported.");
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.start();
  micBtn.style.opacity = "0.5";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    micBtn.style.opacity = "1";
    sendMessage();
  };
  recognition.onerror = () => (micBtn.style.opacity = "1");
});
