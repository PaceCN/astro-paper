window.PaceAdmin = (() => {
  const api = async (path, options = {}) => {
    const response = await fetch(`/api/admin/${path}`, {
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(data.error || `API failed: ${response.status}`);
    return data;
  };

  const escapeHtml = value =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const formatDate = (value, fallback = "-") => {
    if (!value) return fallback;
    return String(value).replace("T", " ").slice(0, 16);
  };

  const parseTags = value => {
    if (Array.isArray(value)) return value.join(", ");
    try {
      const parsed = JSON.parse(String(value || "[]"));
      return Array.isArray(parsed) ? parsed.join(", ") : String(value || "");
    } catch {
      return String(value || "");
    }
  };

  const statusClass = status => {
    const value = String(status || "unknown").toLowerCase();
    if (
      ["published", "success", "completed", "done", "enabled"].includes(value)
    )
      return "admin-badge admin-badge-success";
    if (["failed", "error", "blocked", "disabled", "cancelled"].includes(value))
      return "admin-badge admin-badge-danger";
    if (["queued", "running", "claimed", "draft", "pending"].includes(value))
      return "admin-badge admin-badge-warning";
    return "admin-badge";
  };

  const badge = (status, label = status) =>
    `<span class="${statusClass(status)}">${escapeHtml(label || "-")}</span>`;

  const setText = (root, selector, value) => {
    const element = root.querySelector(selector);
    if (element) element.textContent = String(value ?? "-");
  };

  const setStatus = (element, message, type = "muted") => {
    if (!element) return;
    element.textContent = message;
    element.className = `admin-message admin-message-${type}`;
    element.hidden = !message;
  };

  const emptyTableRow = (tbody, colspan, message) => {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="admin-empty">${escapeHtml(message)}</td></tr>`;
  };

  const initPage = (root, onAuthenticated) => {
    const loginForm = root.querySelector("[data-login]");
    const admin = root.querySelector("[data-admin]");
    const loginError = root.querySelector("[data-login-error]");
    const loginCard = root.querySelector("[data-login-card]") || loginForm;

    const refreshAuth = async () => {
      const me = await api("me");
      const authenticated = Boolean(me.authenticated);
      root.dataset.authenticated = authenticated ? "true" : "false";
      document.dispatchEvent(
        new CustomEvent("admin-auth-change", { detail: { authenticated } })
      );
      if (authenticated) {
        if (loginCard) loginCard.hidden = true;
        if (admin) admin.hidden = false;
        await onAuthenticated();
      } else {
        if (loginCard) loginCard.hidden = false;
        if (admin) admin.hidden = true;
      }
    };

    loginForm?.addEventListener("submit", async event => {
      event.preventDefault();
      setStatus(loginError, "", "danger");
      try {
        await api("login", {
          method: "POST",
          body: JSON.stringify({ password: loginForm.password.value }),
        });
        loginForm.reset();
        await refreshAuth();
      } catch (error) {
        setStatus(
          loginError,
          error instanceof Error ? error.message : String(error),
          "danger"
        );
      }
    });

    refreshAuth().catch(error => {
      root.dataset.authenticated = "false";
      document.dispatchEvent(
        new CustomEvent("admin-auth-change", {
          detail: { authenticated: false },
        })
      );
      if (loginCard) loginCard.hidden = false;
      if (admin) admin.hidden = true;
      setStatus(
        loginError,
        error instanceof Error ? error.message : "无法检查登录状态",
        "danger"
      );
    });
  };

  return {
    api,
    badge,
    emptyTableRow,
    escapeHtml,
    formatDate,
    initPage,
    parseTags,
    setStatus,
    setText,
    statusClass,
  };
})();
