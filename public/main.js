// public/main.js
(() => {
  const chatEl = document.getElementById("chat");
  const inputEl = document.getElementById("input");
  const sendBtn = document.getElementById("sendBtn");
  const statusEl = document.getElementById("status");
  const userBadge = document.getElementById("user-badge");
  const logoutBtn = document.getElementById("btn-logout");
  const rememberCheckbox = document.getElementById("rememberId");

  // read InterLink ID from sessionStorage/localStorage
  const SESSION_KEY = "interlink_id";
  const PERSIST_KEY = "interlink_id_persist";

  const sessionId = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(PERSIST_KEY);
  if (sessionId) {
    userBadge.textContent = `InterLink ID: ${sessionId}`;
    if (localStorage.getItem(PERSIST_KEY)) rememberCheckbox.checked = true;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  } else {
    userBadge.textContent = "Not logged in — go to login page";
  }

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PERSIST_KEY);
    userBadge.textContent = "Not logged in";
    window.location.href = "/login.html";
  });

  function appendMessage({ from = "ai", text = "", small = false }) {
    const wrap = document.createElement("div");
    wrap.className = `flex ${from === "user" ? "justify-end" : "justify-start"}`;

    const inner = document.createElement("div");
    inner.className = `px-4 py-3 max-w-[70%] ${from === "user" ? "bubble-user" : "bubble-ai"}`;
    inner.style.wordBreak = "break-word";
    if (small) {
      inner.classList.add("text-sm", "typing");
    }
    inner.textContent = text;
    wrap.appendChild(inner);
    chatEl.appendChild(wrap);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function appendTyping() {
    const el = document.createElement("div");
    el.className = "typing text-sm small-muted text-left";
    el.id = "typing-indicator";
    el.textContent = "Coach Joel AI is typing...";
    const wrap = document.createElement("div");
    wrap.className = "flex justify-start";
    wrap.appendChild(el);
    chatEl.appendChild(wrap);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById("typing-indicator");
    if (t && t.parentElement) t.parentElement.remove();
  }

  async function callBackend(prompt) {
    try {
      statusEl.textContent = "Sending...";
      const payload = {
        prompt,
        // we will allow the backend to use its default system prompt; no override needed
      };
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data || !data.success) {
        console.error("Backend error:", data);
        return { ok: false, text: data?.error || "Model returned no response" };
      }
      return { ok: true, text: data.text };
    } catch (err) {
      console.error("Network error:", err);
      return { ok: false, text: err.message || "Network error" };
    } finally {
      statusEl.textContent = "";
    }
  }

  // reveal text with typing effect (char-by-char)
  function revealText(targetEl, text, speed = 18) {
    return new Promise((resolve) => {
      targetEl.textContent = "";
      let i = 0;
      const id = setInterval(() => {
        i++;
        targetEl.textContent = text.slice(0, i);
        chatEl.scrollTop = chatEl.scrollHeight;
        if (i >= text.length) {
          clearInterval(id);
          resolve();
        }
      }, speed);
    });
  }

  async function handleSend() {
    const text = inputEl.value.trim();
    if (!text) return;
    // append user message
    appendMessage({ from: "user", text });

    inputEl.value = "";
    // optionally remember user id
    const shouldPersist = rememberCheckbox.checked;
    const currentInterlink = sessionStorage.getItem(SESSION_KEY);
    if (shouldPersist && currentInterlink) localStorage.setItem(PERSIST_KEY, currentInterlink);

    // show typing indicator
    appendTyping();
    removeTyping(); // remove then add to ensure placed at bottom
    appendTyping();

    // call backend
    const res = await callBackend(text);

    removeTyping();

    if (!res.ok) {
      appendMessage({ from: "ai", text: `Error: ${res.text}` });
      return;
    }

    // add AI bubble with typing reveal
    const wrap = document.createElement("div");
    wrap.className = "flex justify-start";
    const inner = document.createElement("div");
    inner.className = "px-4 py-3 max-w-[70%] bubble-ai";
    inner.style.wordBreak = "break-word";
    wrap.appendChild(inner);
    chatEl.appendChild(wrap);
    chatEl.scrollTop = chatEl.scrollHeight;

    await revealText(inner, res.text, 12);
  }

  sendBtn.addEventListener("click", handleSend);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Simple voice button behavior placeholder (optional voice implementation)
  const voiceBtn = document.getElementById("voiceBtn");
  let recognizing = false;
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Rec();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    voiceBtn.addEventListener("click", () => {
      if (!recognizing) {
        rec.start();
      } else {
        rec.stop();
      }
    });

    rec.onstart = () => {
      recognizing = true;
      voiceBtn.textContent = "Listening...";
    };
    rec.onresult = (ev) => {
      const t = ev.results[0][0].transcript;
      inputEl.value = t;
      recognizing = false;
      voiceBtn.textContent = "Voice";
    };
    rec.onerror = (e) => {
      console.warn("Speech error", e);
      recognizing = false;
      voiceBtn.textContent = "Voice";
    };
    rec.onend = () => {
      recognizing = false;
      voiceBtn.textContent = "Voice";
    };
  } else {
    // hide voice button if unsupported
    voiceBtn.style.display = "none";
  }

  // If user navigates directly to message page without login, redirect to login page
  (function ensureLogin() {
    const sid = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(PERSIST_KEY);
    if (!sid) {
      // redirect to login page to capture InterLink ID
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 400);
      return;
    }
    // show saved id
    userBadge.textContent = `InterLink ID: ${sid}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  })();
})();
