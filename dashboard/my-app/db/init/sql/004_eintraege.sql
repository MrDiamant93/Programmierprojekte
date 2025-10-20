
-- 004: Tabelle 'eintraege' für Urlaub und Termine
CREATE TABLE IF NOT EXISTS eintraege (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teilnehmer_id INT NOT NULL,
  typ ENUM('urlaub','termin') NOT NULL,
  start DATETIME NOT NULL,
  ende DATETIME NULL,
  titel VARCHAR(255) NOT NULL DEFAULT '',
  beschreibung TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_teilnehmer (teilnehmer_id),
  INDEX idx_typ_start (typ, start),
  CONSTRAINT fk_eintraege_teilnehmer
    FOREIGN KEY (teilnehmer_id) REFERENCES teilnehmer(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
