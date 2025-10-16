-- Initiales Schema
CREATE TABLE IF NOT EXISTS teilnehmer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  massnahme VARCHAR(100) NOT NULL,
  rolle ENUM('Teilnehmer','Azubi','Fachbereichsleiter') NOT NULL,
  passwort_hash VARCHAR(255) NOT NULL,
  UNIQUE KEY uniq_name_massnahme_rolle (name, massnahme, rolle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
