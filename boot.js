app.addEventListener("click", handleClick);
app.addEventListener("input", handleInput);
app.addEventListener("submit", handleSubmit);
topbarActions.addEventListener("click", handleClick);

render();
registerServiceWorker();

function registerServiceWorker() {
  const canRegister = window.navigator &&
    "serviceWorker" in window.navigator &&
    window.location &&
    /^https?:$/.test(window.location.protocol) &&
    typeof window.addEventListener === "function";

  if (!canRegister) return;

  window.addEventListener("load", () => {
    window.navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // The game should still work normally if install support is unavailable.
    });
  });
}
