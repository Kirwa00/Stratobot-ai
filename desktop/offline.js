const target = new URLSearchParams(location.search).get("retry") || "https://www.stratobot.trade/app";
document.getElementById("retry").addEventListener("click", () => {
  location.href = target;
});
