-- Migration: add 'Fachbereichsleiter' to enum 'rolle' on table 'teilnehmer'
-- Safe to run multiple times if the column already has this exact ENUM set.
ALTER TABLE teilnehmer
  MODIFY rolle ENUM('Teilnehmer','Azubi','Fachbereichsleiter') NOT NULL;
