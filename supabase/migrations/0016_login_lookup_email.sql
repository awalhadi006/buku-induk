-- security definer: lookup email by username or email, bypasses RLS
create or replace function public.login_lookup(p_identifier text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email from profiles
  where username = p_identifier or email = p_identifier
  limit 1;
$$;
