-- Allow same room number for different asrama (e.g., "1 Ikhwan" and "1 Akhwat")
ALTER TABLE kamar DROP CONSTRAINT IF EXISTS kamar_nomor_key;
ALTER TABLE kamar ADD CONSTRAINT kamar_nomor_asrama_unique UNIQUE (nomor, asrama);
