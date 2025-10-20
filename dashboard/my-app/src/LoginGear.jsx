import { useState, useEffect } from "react";

const ALLOWED_ROLES = ["Teilnehmer", "Azubi", "Fachbereichsleiter"];

export default function LoginGear() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [massnahme, setMassnahme] = useState("");
  const [rolle, setRolle] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const closeModal = () => setOpen(false);

  useEffect(() => {
    if (open) {
      setName(""); setMassnahme(""); setRolle("");
      setPassword(""); setConfirm("");
      setMsg(null); setLoading(false);
    }
  }, [open]);

  const submitRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !massnahme.trim() || !rolle.trim() || !password) {
      setMsg("Bitte fülle alle Felder aus."); return;
    }
    if (password !== confirm) {
      setMsg("Passwörter stimmen nicht überein."); return;
    }
    setLoading(true); setMsg(null);
    try {
      const res = await fetch("/api/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, massnahme, rolle, password }),
      })
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Registrierung fehlgeschlagen");
      setMsg("✅ Erfolgreich registriert. Du kannst dich jetzt anmelden.");
      setTimeout(() => setOpen(false), 1200);
    } catch (err) {
      setMsg(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="auth-register"
        onClick={() => setOpen(true)}
        aria-label="Registrieren"
      >
        Registrieren
      </button>

      {open && (
        <div className="auth-modal__backdrop" onClick={closeModal}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal__header">
              <strong>Registrieren</strong>
              <button className="auth-close" onClick={closeModal} aria-label="Schließen">✖</button>
            </div>

            <form className="auth-form" onSubmit={submitRegister}>
              <div className="ds-field">
                <label className="ds-label">Name</label>
                <input className="ds-input" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="ds-field">
                <label className="ds-label">Maßnahme</label>
                <input className="ds-input" name="massnahme" value={massnahme} onChange={(e) => setMassnahme(e.target.value)} required />
              </div>

              <div className="ds-field">
                <label className="ds-label">Rolle</label>
                <select className="ds-input" name="rolle" value={rolle} onChange={(e) => setRolle(e.target.value)} required>
                  <option value="">– bitte wählen –</option>
                  {ALLOWED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="ds-field">
                <label className="ds-label">Passwort</label>
                <input className="ds-input" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="ds-field">
                <label className="ds-label">Passwort bestätigen</label>
                <input className="ds-input" type="password" name="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>

              <div className="ds-inline-stack" style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                <button className="ds-btn" type="submit" disabled={loading}>
                  {loading ? "Sende…" : "Registrieren"}
                </button>
                {msg && <div className="auth-msg">{msg}</div>}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
