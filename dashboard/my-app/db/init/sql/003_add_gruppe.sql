-- Migration: add 'gruppe' column to 'teilnehmer'
ALTER TABLE teilnehmer
  ADD COLUMN gruppe VARCHAR(100) NOT NULL DEFAULT '' AFTER massnahme;
