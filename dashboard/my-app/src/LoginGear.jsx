import { useEffect, useState } from "react";

const API_BASE = "/api";

export default function LoginGear() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({
    name: "",
    massnahme: "",
    rolle: "Teilnehmer",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem("authUser");
      if (u) setUser(JSON.parse(u));
    } catch {
      // ignore
    }
  }, []);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    setOpen(false);
    setMsg(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === "register" && form.password !== form.confirm) {
        setMsg("Passwörter stimmen nicht überein.");
        return;
      }

      const endpoint = mode === "login" ? "/api/login.php" : "/api/register.php";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          massnahme: form.massnahme.trim(),
          rolle: form.rolle,            // ← WICHTIG
          password: form.password
        }),
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Unerwartete Antwort (Status ${res.status}). Content-Type: ${ct}. Auszug: ${text.slice(0, 120)}…`);
      }

      const payload = await res.json();
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${res.status}`);

      localStorage.setItem("authUser", JSON.stringify(payload.user));
      setUser(payload.user);
      setMsg(mode === "login" ? "Erfolgreich angemeldet." : "Registrierung erfolgreich. Eingeloggt.");
    } catch (err) {
      setMsg(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };


  const logout = () => {
    localStorage.removeItem("authUser");
    setUser(null);
    setForm((prev) => ({ ...prev, password: "", confirm: "" }));
    setMsg("Abgemeldet.");
  };

  return (
    <>
      <button
        className="auth-gear"
        onClick={() => setOpen(true)}
        aria-label="Anmelden / Einstellungen"
      >
        <span className="auth-gear__icon">⚙️</span>
        {user && <span className="auth-gear__dot" title="Angemeldet" />}
      </button>

      {open && (
        <div className="auth-modal__backdrop" onClick={closeModal}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal__header">
              <strong>{mode === "login" ? "Anmelden" : "Registrieren"}</strong>
              <button className="auth-close" onClick={closeModal} aria-label="Schließen">
                ×
              </button>
            </div>

            {user ? (
              <div className="auth-logged">
                <div>
                  Angemeldet als <b>{user.name}</b> ({user.rolle}, {user.massnahme})
                </div>
                <button className="ds-btn" onClick={logout}>
                  Abmelden
                </button>
              </div>
            ) : (
              <>
                <div className="auth-tabs">
                  <button
                    className={`auth-tab ${mode === "login" ? "is-active" : ""}`}
                    onClick={() => setMode("login")}
                    type="button"
                  >
                    Anmelden
                  </button>
                  <button
                    className={`auth-tab ${mode === "register" ? "is-active" : ""}`}
                    onClick={() => setMode("register")}
                    type="button"
                  >
                    Registrieren
                  </button>
                </div>

                <form className="auth-form" onSubmit={submit}>
                  <label>
                    <span>Name</span>
                    <input
                      className="ds-input"
                      name="name"
                      value={form.name}
                      onChange={update}
                      required
                    />
                  </label>

                  <label>
                    <span>Maßnahme</span>
                    <input
                      className="ds-input"
                      name="massnahme"
                      value={form.massnahme}
                      onChange={update}
                      required
                    />
                  </label>

                  <label className="auth-field">
                    <span>Rolle</span>
                    <select
                      value={form.rolle}
                      onChange={(e) => setForm({ ...form, rolle: e.target.value })}
                      required
                    >
                      <option value="Teilnehmer">Teilnehmer</option>
                      <option value="Azubi">Azubi</option>
                      <option value="Fachbereichsleiter">Fachbereichsleiter</option>
                    </select>
                  </label>

                  <label>
                    <span>Passwort</span>
                    <input
                      className="ds-input"
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={update}
                      required
                      minLength={6}
                    />
                  </label>

                  {mode === "register" && (
                    <label>
                      <span>Passwort (Wiederholen)</span>
                      <input
                        className="ds-input"
                        type="password"
                        name="confirm"
                        value={form.confirm}
                        onChange={update}
                        required
                        minLength={6}
                      />
                    </label>
                  )}

                  <button className="ds-btn ds-btn--primary" disabled={loading}>
                    {loading
                      ? "Bitte warten…"
                      : mode === "login"
                        ? "Anmelden"
                        : "Konto anlegen"}
                  </button>
                </form>
              </>
            )}

            {msg && <div className="auth-msg">{msg}</div>}
          </div>
        </div>
      )}
    </>
  );
}

