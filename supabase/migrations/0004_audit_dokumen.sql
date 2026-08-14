-- 0004_audit_dokumen: tambahkan trigger audit untuk tabel dokumen santri.
-- Jalankan di Supabase Dashboard > SQL Editor satu blok penuh.

drop trigger if exists audit_santri_documents on santri_documents;
create trigger audit_santri_documents
after insert or update or delete on santri_documents
for each row execute function public.audit_row();

comment on table santri_documents is 'Dokumen per santri (KK, akta, ijazah, SKL, dll); file di Supabase Storage. Perubahan dicatat di audit_logs.';
