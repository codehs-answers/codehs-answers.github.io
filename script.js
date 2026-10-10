(() => {
  "use strict";

  const TOTAL_STEPS = 3;
  const $ = (id) => document.getElementById(id);
  const state = {
    step: 1,
    shareUrl: "",
    itemId: "",
    code: "",
    rawResponse: "",
    fetchedUrl: "",
    busy: false,
    error: ""
  };

  const panels = [...document.querySelectorAll(".step-panel")];
  const backButton = $("back-button");
  const nextButton = $("next-button");
  const shareInput = $("share-url");
  const urlError = $("url-error");
  const output = $("output");
  const status = $("result-status");
  const statusText = $("status-text");
  const debugOutput = $("debug-output");
  const copyButton = $("copy-code");
  const pasteButton = $("paste-button");

  function validateShareUrl(value) {
    let url;
    try { url = new URL(value.trim()); } catch { return "Paste a complete URL beginning with https://codehs.com/share/id/"; }
    if (url.protocol !== "https:" || url.hostname !== "codehs.com") {
      return "Use a secure https://codehs.com share link.";
    }
    if (!/^\/share\/id\/[^/]+\/run\/?$/.test(url.pathname)) {
      return "This does not look like a CodeHS share link. It should look like https://codehs.com/share/id/{id}-{6 characters}/run.";
    }
    return "";
  }

  function setStatus(message, kind = "") {
    status.className = "result-status" + (kind ? " " + kind : "");
    statusText.textContent = message;
  }

  function showStep(step, direction = "forward") {
    state.step = step;
    panels.forEach(panel => {
      const isActive = Number(panel.dataset.step) === step;
      panel.hidden = !isActive;
      panel.classList.remove("step-enter-forward", "step-enter-backward");
      if (isActive) {
        // Restart the entrance animation each time a panel becomes active.
        void panel.offsetWidth;
        panel.classList.add(direction === "backward" ? "step-enter-backward" : "step-enter-forward");
      }
    });
    $("step-counter").textContent = `Step ${step} of ${TOTAL_STEPS}`;
    $("step-percent").textContent = `${Math.round(step / TOTAL_STEPS * 100)}%`;
    $("progress-fill").style.width = `${step / TOTAL_STEPS * 100}%`;
    $("progress-bar").setAttribute("aria-valuenow", String(step));
    $("progress-bar").setAttribute("aria-valuetext", `Step ${step} of ${TOTAL_STEPS}`);
    backButton.disabled = step === 1 || state.busy;
    nextButton.disabled = state.busy;
    nextButton.textContent = step === TOTAL_STEPS ? "↻ Restart" : "Next step →";
    $("footer-hint").textContent = "";
    if (step === 3 && !state.code && !state.busy && !state.error) {
      fetchAndDecode().catch(() => {});
    }
  }

  function markStepComplete(step) {
    const panel = $(`step-${step}`);
    if (!panel || panel.classList.contains("is-completed")) return;
    panel.classList.add("is-completed");
    const icon = panel.querySelector(".step-icon");
    if (icon) {
      icon.classList.remove("completion-pop");
      void icon.offsetWidth;
      icon.classList.add("completion-pop");
    }
    const card = document.querySelector(".wizard-card");
    card.classList.remove("completion-flash");
    void card.offsetWidth;
    card.classList.add("completion-flash");
  }

  // Set this to your deployed Vercel project URL before publishing.
  const API_BASE_URL = "https://YOUR-VERCEL-PROJECT.vercel.app";

  async function fetchAndDecode() {
    if (state.busy) return;
    const error = validateShareUrl(state.shareUrl);
    if (error) {
      state.error = error;
      setStatus(error, "error");
      return;
    }

    state.busy = true;
    state.error = "";
    state.code = "";
    state.itemId = "";
    output.textContent = "Loading solution…";
    debugOutput.textContent = "Requesting the solution API…";
    copyButton.disabled = true;
    setStatus("Finding and decoding the solution…", "loading");
    backButton.disabled = true;
    nextButton.disabled = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareUrl: state.shareUrl }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The solution API returned an unreadable response.");
      }
      if (!response.ok || !result.ok) {
        throw new Error(result.error || `Solution API returned HTTP ${response.status}.`);
      }

      state.itemId = String(result.itemID || "");
      state.code = typeof result.code === "string" ? result.code : "";
      output.textContent = state.code || "(The solution is empty.)";
      debugOutput.textContent = "";
      $("result-meta").hidden = false;
      const fetchedAt = result.fetchedAt ? new Date(result.fetchedAt).toLocaleString() : new Date().toLocaleString();
      $("result-meta").textContent = `Fetched: ${fetchedAt} · ${state.code.length.toLocaleString()} characters`;
      copyButton.disabled = !state.code;
      setStatus("Solution loaded successfully.", "success");
      markStepComplete(3);
      $("result-status").classList.add("status-success-pop");
      $("output").classList.remove("output-reveal");
      void $("output").offsetWidth;
      $("output").classList.add("output-reveal");
      $("fetch-delay-note").hidden = true;
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
      output.textContent = "No code was extracted.";
      setStatus(state.error, "error");
      $("fetch-delay-note").hidden = false;
      debugOutput.textContent = state.error;
    } finally {
      state.busy = false;
      backButton.disabled = state.step === 1;
      nextButton.disabled = false;
    }
  }

  function restart() {
    state.step = 1;
    state.shareUrl = "";
    state.itemId = "";
    state.code = "";
    state.rawResponse = "";
    state.fetchedUrl = "";
    state.busy = false;
    state.error = "";
    panels.forEach(panel => panel.classList.remove("is-completed"));
    $("result-status").classList.remove("status-success-pop");
    $("output").classList.remove("output-reveal");
    $("wizard-card")?.classList.remove("completion-flash");
    shareInput.value = "";
    shareInput.removeAttribute("aria-invalid");
    urlError.hidden = true;
    urlError.textContent = "";
    output.textContent = "Your decoded code will appear here.";
    debugOutput.textContent = "No request has been made yet.";
    $("result-meta").hidden = true;
    copyButton.disabled = true;
    setStatus("Ready when you are.");
    showStep(1);
  }

  nextButton.addEventListener("click", async () => {
    if (state.step === TOTAL_STEPS) {
      restart();
      return;
    }
    if (state.step === 2) {
      state.shareUrl = shareInput.value.trim();
      const error = validateShareUrl(state.shareUrl);
      if (error) {
        shareInput.setAttribute("aria-invalid", "true");
        urlError.textContent = error;
        urlError.hidden = false;
        shareInput.focus();
        return;
      }
      shareInput.removeAttribute("aria-invalid");
      urlError.hidden = true;
      state.code = "";
      state.error = "";
      markStepComplete(2);
      showStep(3, "forward");
      return;
    }
    markStepComplete(state.step);
    showStep(state.step + 1, "forward");
  });

  backButton.addEventListener("click", () => {
    if (state.busy || state.step === 1) return;
    if (state.step === 2) state.shareUrl = shareInput.value.trim();
    showStep(state.step - 1, "backward");
    if (state.step === 2) shareInput.value = state.shareUrl;
  });

  pasteButton.addEventListener("click", async () => {
    try {
      const pasted = await navigator.clipboard.readText();
      if (!pasted.trim()) throw new Error("Clipboard is empty.");
      shareInput.value = pasted.trim();
      state.shareUrl = pasted.trim();
      shareInput.removeAttribute("aria-invalid");
      urlError.hidden = true;
      pasteButton.classList.add("is-done");
      pasteButton.title = "Link pasted";
      setTimeout(() => { pasteButton.classList.remove("is-done"); pasteButton.title = "Paste from clipboard"; }, 1200);
    } catch {
      urlError.textContent = "Clipboard access was blocked. Click the field and press Ctrl+V (or Cmd+V).";
      urlError.hidden = false;
      shareInput.focus();
    }
  });

  shareInput.addEventListener("input", () => {
    state.shareUrl = shareInput.value;
    if (!urlError.hidden) {
      urlError.hidden = true;
      shareInput.removeAttribute("aria-invalid");
    }
  });

  copyButton.addEventListener("click", async () => {
    if (!state.code) return;
    try {
      await navigator.clipboard.writeText(state.code);
      copyButton.querySelector("span").textContent = "Copied";
      copyButton.title = "Copied";
      setTimeout(() => { copyButton.querySelector("span").textContent = "Copy"; copyButton.title = "Copy code"; }, 1400);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(output);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      setStatus("Select the highlighted code and copy it with Ctrl+C / Cmd+C.", "");
    }
  });

  window.addEventListener("beforeunload", () => { state.shareUrl = shareInput.value; });
  showStep(1);
})();
