const chatEl = document.getElementById("chat");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("chat-input");

// sessionId sederhana per tab browser, supaya riwayat chat tidak tercampur antar user
const sessionId =
  sessionStorage.getItem("qaqc-session") ||
  (() => {
    const id = crypto.randomUUID();
    sessionStorage.setItem("qaqc-session", id);
    return id;
  })();

function addUserMessage(text) {
  const row = document.createElement("div");
  row.className = "msg user";
  row.innerHTML = `<div class="bubble"></div>`;
  row.querySelector(".bubble").textContent = text;
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function addBotMessage(answer, documents = []) {
  const row = document.createElement("div");
  row.className = "msg bot";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = answer;
  row.appendChild(bubble);

  documents.forEach((doc) => {
    const card = document.createElement("div");
    card.className = "doc-card";
    card.innerHTML = `
      <div class="doc-name">${doc.nama}</div>
      <div class="doc-meta">Masa berlaku: ${doc.masaBerlaku}</div>
      <a class="download-btn" href="${doc.downloadUrl}" target="_blank" rel="noopener">
        Unduh Dokumen
      </a>
    `;
    row.appendChild(card);
  });

  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function addTypingIndicator() {
  const row = document.createElement("div");
  row.className = "msg bot";
  row.id = "typing-indicator";
  row.innerHTML = `<div class="bubble typing">QA/QC Assistant sedang mengetik...</div>`;
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById("typing-indicator")?.remove();
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = inputEl.value.trim();
  if (!message) return;

  addUserMessage(message);
  inputEl.value = "";
  addTypingIndicator();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId }),
    });

    const data = await res.json();
    removeTypingIndicator();

    if (!res.ok) {
      addBotMessage(data.error || "Maaf, terjadi kesalahan. Silakan coba lagi.");
      return;
    }

    addBotMessage(data.answer, data.documents);
  } catch (err) {
    removeTypingIndicator();
    addBotMessage("Maaf, tidak dapat terhubung ke server. Silakan coba lagi.");
  }
});
