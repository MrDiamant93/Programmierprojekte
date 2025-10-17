import { useEffect, useState } from "react";

/**
 * Minimaler Anmelde-Dialog (nur Name + Passwort)
 * - POST /api/login.php erwartet JSON { name, password }
 * - Bei Erfolg: localStorage.authUser setzen und Callback onLoggedIn(user) auslösen
 */
export default function AuthModal({ open, onClose, onLoggedIn }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (open) {
      setName("");
      setPassword("");
      setMsg(null);
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !password) {
      setMsg("Bitte Name und Passwort eingeben.");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/login.php", {method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password
        })
,
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Unerwartete Antwort. Inhaltstyp: ${ct}. Auszug: ${text.slice(0, 160)}…`);
      }

      const payload = await res.json();
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || `HTTP ${res.status}`);
      }

      localStorage.setItem("authUser", JSON.stringify(payload.user));
      if (onLoggedIn) onLoggedIn(payload.user);
      onClose?.();
    } catch (err) {
      setMsg(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="auth-modal__backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__header">
          <strong>Anmelden</strong>
          <button className="auth-close" onClick={onClose} aria-label="Schließen">✖</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="ds-field">
            <label className="ds-label">Name</label>
            <input
              className="ds-input"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="ds-field">
            <label className="ds-label">Passwort</label>
            <input
              className="ds-input"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-actions">
            <button className="ds-btn ds-btn--primary" type="submit" disabled={loading}>
              {loading ? "Wird angemeldet…" : "Anmelden"}
            </button>
          </div>
          {msg && <div className="auth-msg">{msg}</div>}
        </form>
      </div>
    </div>
  );
}
