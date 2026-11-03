const form = document.getElementById("form");
const input = document.getElementById("key");
const error = document.getElementById("error");
const go = document.getElementById("go");

window.stratobot.notice().then((n) => {
  if (n) error.textContent = n;
});

document.getElementById("buy").addEventListener("click", () => window.stratobot.buy());

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  error.textContent = "";
  go.disabled = true;
  go.textContent = "Checking…";
  const r = await window.stratobot.activate(input.value);
  if (!r.ok) {
    error.textContent = r.error;
    go.disabled = false;
    go.textContent = "Activate";
  }
});
