import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginGear from "./LoginGear.jsx";
import AuthModal from "./AuthModal.jsx";
import EntriesModal from "./EntriesModal.jsx";

/** Status-Definitionen: Key, Label, Kachel-Farbe, Icon */
const STATUSES = [
  { key: "present", label: "Anwesend", cls: "is-green", icon: "👤" },
  { key: "travel", label: "Unterwegs", cls: "is-cyan", icon: "✈️" },
  { key: "absent", label: "Abwesend", cls: "is-red", icon: "🚫" },
  { key: "late", label: "Verspätet", cls: "is-amber", icon: "🕒" },
  { key: "sick", label: "Krank", cls: "is-purple", icon: "🤒" },
];

function InfoBoard() {
  const [showAuth, setShowAuth] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [allEntries, setAllEntries] = useState([]);

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("authUser") || "null"); } catch { return null; }
  });

  const API_BASE = "/api";

  // Statt Demo-Daten: leere Arrays
  const [teilnehmer, setTeilnehmer] = useState([]);
  const [azubis, setAzubis] = useState([]);
  const [fachbereichsleiter, setFachbereichsleiter] = useState([]);


  
  // Alle Einträge laden und zyklisch aktualisieren (für Auto-Status)
  useEffect(() => {
    let alive = true;
    async function loadEntries() {
      try {
        const res = await fetch(`${API_BASE}/eintraege.php`, { headers: { Accept: "application/json" } });
        const data = await res.json();
        if (!alive) return;
        setAllEntries(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        console.error("Einträge laden fehlgeschlagen:", e);
      }
    }
    loadEntries();
    const t = setInterval(loadEntries, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // Status automatisch setzen: Termin → is-cyan, Urlaub → is-red
  useEffect(() => {
    const now = new Date();

    const byPerson = new Map();
    for (const e of allEntries) {
      const pid = e.teilnehmer_id;
      const start = new Date(e.start);
      const ende = e.ende ? new Date(e.ende) : null;
      const active = ende ? (now >= start && now <= ende) : (now >= start && now <= new Date(start.getTime() + 60*60*1000)); // 1h Fenster falls kein Ende
      if (!active) continue;

      let status = null;
      if (e.typ === 'termin') status = 'travel'; // blau/cyan
      else if (e.typ === 'urlaub') status = 'absent'; // rot

      if (status) {
        // Pro Person nur eine Priorität (Termin > Urlaub)
        const current = byPerson.get(pid);
        const pri = status === 'travel' ? 2 : 1;
        const curPri = current?.pri ?? 0;
        if (pri >= curPri) byPerson.set(pid, { status, pri });
      }
    }

    function apply(list, setter) {
      if (list.length === 0) return;
      const next = list.map(p => {
        const hit = byPerson.get(p.id);
        return hit ? { ...p, status: hit.status } : p;
        });
      setter(next);
    }

    apply(teilnehmer, setTeilnehmer);
    apply(azubis, setAzubis);
    apply(fachbereichsleiter, setFachbereichsleiter);
  }, [allEntries]);
// Beim Mount aus der API laden
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/teilnehmer.php`, { headers: { Accept: "application/json" } });
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Unerwartete Antwort der Teilnehmer-API. Inhaltstyp: ${ct}. Auszug: ${text.slice(0, 160)}…`);
        }
        const data = await res.json();
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }
        const items = Array.isArray(data.items) ? data.items : [];

        // Frontend-Status (Board-Farben) vorerst lokal: default "present"
        const withStatus = items.map(p => ({ ...p, status: "absent" }));

        setTeilnehmer(withStatus.filter(p => p.rolle === "Teilnehmer"));
        setAzubis(withStatus.filter(p => p.rolle === "Azubi"));
        setFachbereichsleiter(withStatus.filter(p => p.rolle === "Fachbereichsleiter"));

      } catch (err) {
        console.error("Teilnehmer laden fehlgeschlagen:", err);
      }
    }
    load();
    // Auch auf benutzerdefiniertes Refresh-Ereignis reagieren (z.B. nach Registrierung)
    const onRefresh = () => load();
    window.addEventListener('participants:refresh', onRefresh);
    return () => window.removeEventListener('participants:refresh', onRefresh);
  }, []);


  // Offenes Ring-Menü (welche Gruppe/Index + Center-Position am Screen)
  const [ring, setRing] = useState(null); // { group: 'teilnehmer'|'azubis', index: number, center:{x,y} }

  const getStatus = (key) => STATUSES.find(s => s.key === key) ?? STATUSES[0];

  const openRing = (group, index, ev) => {
    const r = ev.currentTarget.getBoundingClientRect();
    setRing({
      group,
      index,
      center: { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    });
  };

  const closeRing = () => setRing(null);

  const applyStatus = (statusKey) => {
    if (!ring) return;
    const upd = (list, setter) => {
      const next = [...list];
      next[ring.index] = { ...next[ring.index], status: statusKey };
      setter(next);
    };
    if (ring.group === "teilnehmer") upd(teilnehmer, setTeilnehmer);
    else if (ring.group === "azubis") upd(azubis, setAzubis);
    else if (ring.group === "fachbereichsleiter")
      upd(fachbereichsleiter, setFachbereichsleiter);

    closeRing();
  };

  const Tile = ({ person, onClick }) => {
    const s = getStatus(person.status);
    return (
      <button className={`ifa-tile ${s.cls}`} onClick={onClick} aria-label={`${person.name}: ${s.label}`}>
        <span className="ifa-tile__label">{person.name}</span>
        <span className="ifa-tile__icon">{s.icon}</span>
      </button>
    );
  };

  return (
    <div className="ifa-board ifa-board--fullscreen">
      <div className="ifa-section">
        <div className="ifa-section__title">Fachbereichsleiter</div>
        <div className="ifa-grid ifa-grid--x4">
          {fachbereichsleiter.map((p, i) => (
            <Tile key={p.id} person={p} onClick={(e) => openRing("fachbereichsleiter", i, e)} />
          ))}
        </div>
      </div>

      <div className="ifa-section">
        <div className="ifa-section__title">Teilnehmer</div>
        <div className="ifa-grid ifa-grid--x4">
          {teilnehmer.map((p, i) => (
            <Tile
              key={p.id}
              person={p}
              onClick={(e) => openRing("teilnehmer", i, e)}
            />
          ))}
        </div>
      </div>


      <div className="ifa-section">
        <div className="ifa-section__title">Auszubildende</div>
        <div className="ifa-grid ifa-grid--x4">
          {azubis.map((p, i) => (
            <Tile key={p.id} person={p} onClick={(e) => openRing("azubis", i, e)} />
          ))}
        </div>
      </div>

      {/* Status-Ring (Overlay) */}
      {ring && (
        <StatusRing
          center={ring.center}
          options={STATUSES}
          onSelect={applyStatus}
          onClose={closeRing}
        />
      )}

      <Clock onTermineClick={() => setShowAuth(true)} />
      <LoginGear />
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onLoggedIn={(u) => { setShowEntries(true);  setUser(u); }} />
      <EntriesModal open={showEntries} onClose={()=>setShowEntries(false)} user={user} />
    </div>
  );
}

/** Kreist Menü um den Klickpunkt */
function StatusRing({ center, options, onSelect, onClose, radius = 120 }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const count = options.length;
  const angle0 = -90; // Start oben

  return (
    <div className="ifa-ring-overlay" onClick={onClose}>
      <div className="ifa-ring" role="menu" aria-label="Status auswählen">
        {options.map((opt, i) => {
          const angle = angle0 + (360 / count) * i;
          const rad = (angle * Math.PI) / 180;
          const x = center.x + radius * Math.cos(rad);
          const y = center.y + radius * Math.sin(rad);
          return (
            <button
              key={opt.key}
              role="menuitem"
              className={`ifa-ring__btn ${opt.cls}`}
              style={{ left: x, top: y }}
              onClick={(e) => { e.stopPropagation(); onSelect(opt.key); }}
              aria-label={opt.label}
              title={opt.label}
            >
              <span className="ifa-ring__icon">{opt.icon}</span>
            </button>
          );
        })}
        <div
          className="ifa-ring__center"
          style={{ left: center.x, top: center.y }}
          aria-hidden
        />
      </div>
      <EntriesModal open={showEntries} onClose={()=>setShowEntries(false)} user={user} />
    </div>
  );
}

function Clock({ timeZone = "Europe/Berlin", onTermineClick }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const locale = "de-DE";
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(now);
  const date = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "2-digit", timeZone }).format(now);
  return (
    <div className="ifa-clock-dock">
      <button className="ds-btn ds-btn--primary ifa-termin-btn" onClick={onTermineClick}>
        Termine/Urlaub
      </button>
      <div className="ifa-clock">
        <div className="ifa-clock__time">{time}</div>
        <div className="ifa-clock__date">{date}</div>
      </div>
      <EntriesModal open={showEntries} onClose={()=>setShowEntries(false)} user={user} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="ds-app ds-app--bare">
        <main className="ds-main ds-main--flush">
          <Routes>
            <Route path="/" element={<Navigate to="/board" replace />} />
            <Route path="/board" element={<InfoBoard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
