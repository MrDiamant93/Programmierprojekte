import { useEffect, useMemo, useState } from "react";

const API_BASE = "/api";

// Kurzes deutsches Datumsformat für bessere Lesbarkeit und weniger Umbruchprobleme
const formatDateDE = (val) => {
  try {
    if (!val) return "-";
    const d = new Date(val);
    return d.toLocaleString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch {
    return String(val);
  }
};

/**
 * Modal zum Verwalten von Urlaub/Terminen für den eingeloggten Teilnehmer.
 * - Öffnet nach erfolgreichem Login automatisch
 * - Liste der eigenen Einträge + Formular zum Hinzufügen
 */
export default function EntriesModal({ open, onClose, user, onLogout }) {
  // Öffnet den nativen Kalender/Uhrzeit-Picker bei Fokus/Klick (Chrome/Edge/Safari)
  const openNativePicker = (e) => {
    try {
      if (e?.currentTarget && typeof e.currentTarget.showPicker === 'function') {
        e.currentTarget.showPicker();
      }
    } catch {}
  };

  const handleLogout = () => {
    if (confirm('Möchtest du dich wirklich abmelden?')) {
      try { localStorage.removeItem('authUser'); } catch {}
      onClose?.();
      onLogout?.();
    }
  };
  const [typ, setTyp] = useState("termin");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const startValue = useMemo(() => {
    if (!startDate) return "";
    return startTime ? `${startDate} ${startTime}:00` : `${startDate}`;
  }, [startDate, startTime]);

  const endValue = useMemo(() => {
    if (!endDate) return "";
    return endTime ? `${endDate} ${endTime}:00` : `${endDate}`;
  }, [endDate, endTime]);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/eintraege.php?teilnehmer_id=${user.id}`, { headers: { Accept: "application/json" } });
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [open, user]);

  async function addEntry(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const payload = {
        teilnehmer_id: user.id,
        typ,
        start: startValue,
        ende: endValue,
        titel,
        beschreibung
      };
      const res = await fetch(`${API_BASE}/eintraege.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Fehler beim Speichern");
      // Reload list
      const res2 = await fetch(`${API_BASE}/eintraege.php?teilnehmer_id=${user.id}`);
      const data2 = await res2.json();
      setItems(Array.isArray(data2.items) ? data2.items : []);
      window.dispatchEvent(new Event('entries:changed'));
      // reset form
      setTitel("");
      setBeschreibung("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEntry(id) {
    const ok = confirm("Eintrag wirklich löschen?");
    if (!ok) return;
    try {
      await fetch(`${API_BASE}/eintraege.php?id=${id}`, { method: "DELETE" });
      setItems(items.filter(x => x.id !== id));
      window.dispatchEvent(new Event('entries:changed'));
    } catch (e) {
      console.error(e);
    }
  }

  if (!open) return null;

  return (
    <div className="auth-modal__backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__header">
          <div className="ifa-modal__title">Einträge verwalten</div><div className="ds-inline-stack" style={{ gap: 8 }}>{user && (<span className="ds-text--muted">Angemeldet als <strong>{user.name}</strong></span>)}{user && (<button className="ds-btn ds-btn--ghost" onClick={handleLogout} title="Abmelden">Abmelden</button>)}</div>
          <button className="ds-btn" onClick={onClose}>Schließen</button>
        </div>

        <div className="entries-stack">
          <form className="entries-form" onSubmit={addEntry}>
            <div className="ds-field">
              <label>Typ</label>

              <select className="ds-input" value={typ} onChange={e => setTyp(e.target.value)}>
                <option value="termin">Termin</option>
                <option value="urlaub">Urlaub</option>
              </select>
            </div>

            <div className="ds-field">
              <label>Start (Datum)</label>
              <input
                className="ds-input"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                onFocus={openNativePicker}
                onClick={openNativePicker}
              />
</div>
            <div className="ds-field">
              <label>Start (Uhrzeit optional)</label>
              <input
                className="ds-input"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                onFocus={openNativePicker}
                onClick={openNativePicker}
              />
</div>

            <div className="ds-field">
              <label>Ende (Datum, optional)</label>
              <input
                className="ds-input"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                onFocus={openNativePicker}
                onClick={openNativePicker}
              />
</div>
            <div className="ds-field">
              <label>Ende (Uhrzeit optional)</label>
              <input
                className="ds-input"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                onFocus={openNativePicker}
                onClick={openNativePicker}
              />
</div>

            <div className="ds-field wide">
              <label>Titel (optional)</label>
              <input className="ds-input" type="text" value={titel} onChange={e => setTitel(e.target.value)} placeholder="z. B. Arzttermin" />
            </div>

            <div className="ds-field wide">
              <label>Beschreibung (optional)</label>
              <input className="ds-input" type="text" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="Notizen…" />
            </div>

            <button className="ds-btn" type="submit" disabled={loading}>{loading ? "Speichert…" : "Hinzufügen"}</button>
            {err && <div className="auth-msg">{err}</div>}
          </form>

          <div className="ds-table__wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Start</th>
                  <th>Ende</th>
                  <th>Titel</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={5} style={{ opacity: .7 }}>Noch keine Einträge</td></tr>
                )}
                {items.map(it => (
                  <tr key={it.id}>
                    <td>{it.typ}</td>
                    <td>{formatDateDE(it.start)}</td>
                    <td>{it.ende ? formatDateDE(it.ende) : "-"}</td>
                    <td style={{wordBreak:'break-word'}}>{it.titel || "-"}</td>
                    <td style={{whiteSpace:"nowrap"}}><button className="ds-btn" style={{height:32,padding:"0 10px"}} onClick={() => deleteEntry(it.id)}>Löschen</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
