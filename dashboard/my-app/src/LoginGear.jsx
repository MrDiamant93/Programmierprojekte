import { useEffect, useState } from "react";

export default function LoginGear() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("settings"); // "settings" | "register"
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
    const [gruppe, setGruppe] = useState("");
  const [massnahme, setMassnahme] = useState("");
const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem("authUser");
      if (u) setUser(JSON.parse(u));
    } catch {
      // ignore
    }
  }, []);

  // Re-sync user when storage changes (e.g., login from AuthModal)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "authUser") {
        try { setUser(e.newValue ? JSON.parse(e.newValue) : null); } catch { setUser(null); }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (open) {
      setMsg(null);
      setLoading(false);
      if (mode === "register") {
        setName("");
        setPassword("");
        setConfirm("");
      }
    }
  }, [open, mode]);

  const closeModal = () => setOpen(false);

  const logout = () => {
    localStorage.removeItem("authUser");
    setUser(null);
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !password) {
      setMsg("Bitte Name und Passwort eingeben.");
      return;
    }
    if (password !== confirm) {
      setMsg("Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/register.php", {method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password,
          gruppe: gruppe.trim(),
          massnahme: massnahme.trim(),
          rolle: "Teilnehmer"
        })
,
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Unerwartete Antwort. Inhaltstyp: ${ct}. Auszug: ${text.slice(0, 160)}…`);
      }

      const payload = await res.json();
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${res.status}`);

      // Nutzer direkt als eingeloggt speichern
      localStorage.setItem("authUser", JSON.stringify(payload.user));
      setUser(payload.user);
      setMsg("Registrierung erfolgreich. Eingeloggt.");
      setMode("settings");
    } catch (err) {
      setMsg(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="auth-gear"
        onClick={() => { setOpen(true); setMode("settings"); }}
        aria-label="Einstellungen"
      >
        <span className="auth-gear__icon">⚙️</span>
        {user && <span className="auth-gear__dot" title="Angemeldet" />}
      </button>

      {open && (
        <div className="auth-modal__backdrop" onClick={closeModal}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal__header">
              <strong>{mode === "register" ? "Registrieren" : "Einstellungen"}</strong>
              <div className="ds-inline-stack" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <button className="ds-btn" onClick={() => setMode(mode === "register" ? "settings" : "register")}>
                  {mode === "register" ? "Einstellungen" : "Registrieren"}
                </button>
                <button className="auth-close" onClick={closeModal} aria-label="Schließen">✖</button>
              </div>
            </div>

            {mode === "register" ? (
              <form className="auth-form" onSubmit={submitRegister}>
                <div className="ds-field">
                  <label className="ds-label">Name</label>
                  <input className="ds-input" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="ds-field">
                  <label className="ds-label">Gruppe</label>
                  <input className="ds-input" name="gruppe" value={gruppe} onChange={(e) => setGruppe(e.target.value)} required />
                </div>
                <div className="ds-field">
                  <label className="ds-label">Maßnahme</label>
                  <input className="ds-input" name="massnahme" value={massnahme} onChange={(e) => setMassnahme(e.target.value)} required />
                </div>
                <div className="ds-field">
                  <label className="ds-label">Passwort</label>
                  <input className="ds-input" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="ds-field">
                  <label className="ds-label">Passwort bestätigen</label>
                  <input className="ds-input" type="password" name="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                </div>
                <div className="auth-actions">
                  <button className="ds-btn ds-btn--primary" type="submit" disabled={loading}>
                    {loading ? "Wird angelegt…" : "Konto anlegen"}
                  </button>
                </div>
                {msg && <div className="auth-msg">{msg}</div>}
              </form>
            ) : (
              <div className="ds-stack" style={{ gap: "14px" }}>
                {user ? (
                  <>
                    <div><strong>Angemeldet als:</strong> {user?.name || "Unbekannt"}</div>
                    <div className="auth-actions">
                      <button className="ds-btn" onClick={logout}>Abmelden</button>
                    </div>
                  </>
                ) : (
                  <div>Keine Anmeldung aktiv. Bitte über den Button <strong>„Termine/Urlaub“</strong> anmelden.</div>
                )}
                {msg && <div className="auth-msg">{msg}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}