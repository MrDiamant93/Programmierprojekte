import { useEffect, useMemo, useState } from "react";

const API_BASE = "/api";

/**
 * Modal zum Verwalten von Urlaub/Terminen für den eingeloggten Teilnehmer.
 * - Öffnet nach erfolgreichem Login automatisch
 * - Liste der eigenen Einträge + Formular zum Hinzufügen
 */
export default function EntriesModal({ open, onClose, user }) {
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
    } catch (e) {
      console.error(e);
    }
  }

  if (!open) return null;

  return (
    <div className="ifa-modal">
      <div className="auth-modal__backdrop" onClick={onClose} />
      <div className="auth-modal">
        <div className="auth-modal__header">
          <div className="ifa-modal__title">Einträge verwalten</div>
          <button className="ds-btn" onClick={onClose}>Schließen</button>
        </div>

        <div className="ds-stack" style={{ gap: 16 }}>
          <form className="ds-inline-stack" style={{ gap: 12, alignItems: "flex-end", flexWrap: "wrap" }} onSubmit={addEntry}>
            <div className="ds-field">
              <label>Typ</label>
              <select value={typ} onChange={e => setTyp(e.target.value)}>
                <option value="termin">Termin</option>
                <option value="urlaub">Urlaub</option>
              </select>
            </div>

            <div className="ds-field">
              <label>Start (Datum)</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="ds-field">
              <label>Start (Uhrzeit optional)</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>

            <div className="ds-field">
              <label>Ende (Datum, optional)</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="ds-field">
              <label>Ende (Uhrzeit optional)</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>

            <div className="ds-field" style={{ minWidth: 200 }}>
              <label>Titel (optional)</label>
              <input type="text" value={titel} onChange={e => setTitel(e.target.value)} placeholder="z. B. Arzttermin" />
            </div>

            <div className="ds-field" style={{ minWidth: 260 }}>
              <label>Beschreibung (optional)</label>
              <input type="text" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="Notizen…" />
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
                    <td>{new Date(it.start).toLocaleString()}</td>
                    <td>{it.ende ? new Date(it.ende).toLocaleString() : "-"}</td>
                    <td>{it.titel || "-"}</td>
                    <td><button className="ds-btn" onClick={() => deleteEntry(it.id)}>Löschen</button></td>
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
