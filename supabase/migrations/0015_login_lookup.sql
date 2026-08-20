-- security definer: lookup email by username, bypasses RLS
create or replace function public.login_lookup(p_username text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email from profiles where username = p_username limit 1;
$$;
