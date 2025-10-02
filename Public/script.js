function openTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(div => div.style.display = "none");
  document.getElementById(tabName).style.display = "block";
}

async function signup() {
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  const res = await fetch("/signup", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.success) window.location.href = "dashboard.html";
  else alert(data.message);
}

async function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const res = await fetch("/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.success) window.location.href = "dashboard.html";
  else alert(data.message);
}

async function sendChat() {
  const input = document.getElementById("chat-input").value;
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML += `<p><b>You:</b> ${input}</p>`;
  document.getElementById("chat-input").value = "";
  const res = await fetch("/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input })
  });
  const data = await res.json();
  chatBox.innerHTML += `<p><b>Xenora:</b> ${data.reply}</p>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function generateImage() {
  const prompt = document.getElementById("image-prompt").value;
  const res = await fetch("/image", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  document.getElementById("image-result").innerHTML = `<img src="${data.imageUrl}" width="200">`;
}

async function saveCharacter() {
  const name = document.getElementById("char-name").value;
  const description = document.getElementById("char-desc").value;
  const personality = document.getElementById("char-personality").value;
  const traits = document.getElementById("char-traits").value;
  const scenario = document.getElementById("char-scenario").value;
  const res = await fetch("/save-character", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, personality, traits, scenario, image_url: "" })
  });
  const data = await res.json();
  if (data.success) loadCharacters();
}

async function loadCharacters() {
  const res = await fetch("/my-characters");
  const data = await res.json();
  if (data.success) {
    const div = document.getElementById("saved-characters");
    div.innerHTML = "";
    data.characters.forEach(c => {
      div.innerHTML += `<div class="character-card"><b>${c.name}</b><br>${c.description}</div>`;
    });
  }
}
loadCharacters();
