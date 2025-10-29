// main.js — chat frontend

const PROXY_ENDPOINT = "/api/generate";
const SYSTEM_PROMPT = `Role:
You are Coach Joe AI, a friendly assistant for InterLink Global.
Always greet users personally using their Telegram username or ID if provided.`;

// selectors
const input = document.querySelector('input[placeholder="Ask Anything"]');
const sendBtn = document.querySelector("#btn-send-recording");
const chatArea = document.querySelector(".chat-area");
const micBtn = document.querySelector("#btn-mic");

let userName = "User";
let hasIntroduced = false;

// helper to display chat bubbles
function addMessage(text, from = "bot") {
  const msg = document.createElement("div");
  msg.className =
    "flex items-center gap-2 w-full " + (from === "user" ? "flex-row-reverse" : "");
  msg.innerHTML = `
    <img src="${
      from === "user"
        ? "https://public.interlinklabs.ai/1761721359159_Ellipse.png"
        : "https://public.interlinklabs.ai/1761722972563_avt.png"
    }" class="w-10 h-10 rounded-full" />
    <div class="px-4 py-[10px] max-w-[70%] ${
      from === "user"
        ? "bg-[#1A1A1A] text-white rounded-[16px] rounded-br-[8px]"
        : "bg-[#F5F7FA] text-[#0E121B] rounded-[16px] rounded-bl-[8px]"
    }">
      <p class="text-[14px] whitespace-pre-line">${text}</p>
    </div>`;
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// call backend
async function askCoach(prompt) {
  try {
    const res = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemPrompt: SYSTEM_PROMPT }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Unknown error");
    return data.text;
  } catch (err) {
    console.error("askCoach error:", err);
    return "⚠️ Unable to connect to server.";
  }
}

// send message
async function sendMessage() {
  const prompt = input.value.trim();
  if (!prompt) return;

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
  const dots = Array.from(chatArea.querySelectorAll("p")).find(
    (p) => p.textContent === "…"
  );
  if (dots) dots.textContent = reply;
}

// button + Enter key
sendBtn?.addEventListener("click", sendMessage);
input?.addEventListener("keydown", (e) => e.key === "Enter" && sendMessage());

// greet on load
window.addEventListener("load", () => {
  addMessage(`Hello, ${userName}! 👋`, "bot");
  addMessage("You can tell me your Telegram username or ID to personalize chat.", "bot");
});

// mic button (speech recognition)
micBtn?.addEventListener("click", () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported in this browser.");
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();

  micBtn.style.opacity = "0.5";
  recognition.onresult = (event) => {
    input.value = event.results[0][0].transcript;
    micBtn.style.opacity = "1";
    sendMessage();
  };
  recognition.onerror = () => (micBtn.style.opacity = "1");
});
