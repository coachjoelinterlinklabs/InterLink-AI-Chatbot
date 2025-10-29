const PROXY_ENDPOINT = "/api/generate";

const SYSTEM_PROMPT = `
You are Coach Joe AI, the official assistant for InterLink Global Network.
Always respond helpfully, professionally, and concisely.
`;

const chatArea = document.getElementById("chatArea");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("btn-send-recording");

function addMessage(text, sender = "bot") {
  const wrapper = document.createElement("div");
  wrapper.classList.add("flex", "items-start", "gap-2", "w-full");
  if (sender === "user") wrapper.classList.add("flex-row-reverse");

  const avatar = document.createElement("img");
  avatar.src =
    sender === "user"
      ? "https://public.interlinklabs.ai/1761721359159_Ellipse.png"
      : "https://public.interlinklabs.ai/1761722972563_avt.png";
  avatar.classList.add("w-8", "h-8", "rounded-full");

  const bubble = document.createElement("div");
  bubble.classList.add(
    "px-4",
    "py-2",
    "rounded-2xl",
    "max-w-[80%]",
    sender === "user" ? "bg-[#1A1A1A] text-white" : "bg-[#F5F7FA] text-black"
  );
  bubble.textContent = text;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatArea.appendChild(wrapper);
  chatArea.scrollTop = chatArea.scrollHeight;
  return bubble;
}

async function askCoach(prompt) {
  try {
    const res = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemPrompt: SYSTEM_PROMPT }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.text;
  } catch (err) {
    console.error("askCoach error:", err);
    return "⚠️ AI server unreachable. Try again later.";
  }
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  const userID = localStorage.getItem("interlinkID") || "User";

  addMessage(text, "user");
  input.value = "";

  const loadingEl = addMessage("...", "bot");
  const reply = await askCoach(`Hello, ${userID}. ${text}`);
  loadingEl.textContent = reply;
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
