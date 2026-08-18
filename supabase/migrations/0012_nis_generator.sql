-- NIS auto-generator: unique constraint + RPC

-- Unique constraint on nis (nullable — only enforced when value is present)
create unique index if not exists uix_santri_nis ON santri (nis) where nis is not null and nis <> '';

-- RPC: generate next NIS from a pattern string
-- Tokens: {TAHUN} = 2-digit year, {JENJANG} = configurable code, {NO} = auto-increment
create or replace function public.generate_nis(p_pattern text)
returns text language plpgsql security definer set search_path = public as $$
declare
  result text := '';
  pos int := 1;
  token text;
  tok_val text;
  next_no int;
  jenjang_map jsonb := '{}'::jsonb;
  raw_map text;
begin
  -- load jenjang mapping from settings
  select value into raw_map from settings where key = 'nis_jenjang_map';
  if raw_map is not null and raw_map <> '' then
    jenjang_map := raw_map::jsonb;
  end if;

  while pos <= length(p_pattern) loop
    if substr(p_pattern, pos, 1) = '{' then
      token := substr(p_pattern, pos + 1, position('}' in substr(p_pattern, pos + 1)) - 1);
      pos := pos + length(token) + 2;
      tok_val := case token
        when 'TAHUN'   then to_char(current_date, 'YY')
        when 'JENJANG' then coalesce(jenjang_map ->> 'default', 'X')
        else '{' || token || '}'
      end;
      result := result || tok_val;
    else
      result := result || substr(p_pattern, pos, 1);
      pos := pos + 1;
    end if;
  end loop;

  -- find next sequence number for this prefix
  select coalesce(max(
    (regexp_replace(nis, '^' || result || '0*', '')::int)
  ), 0) + 1
  into next_no
  from santri
  where nis ~ ('^' || result || '[0-9]+$');

  result := result || lpad(next_no::text, 3, '0');
  return result;
end
$$;

-- RPC: bulk-generate NIS for all santri without one
create or replace function public.bulk_generate_nis(p_pattern text)
returns int language plpgsql security definer set search_path = public as $$
declare
  rec record;
  new_nis text;
  cnt int := 0;
begin
  for rec in
    select id from santri
    where nis is null or trim(nis) = ''
    order by created_at
  loop
    new_nis := public.generate_nis(p_pattern);
    update santri set nis = new_nis where id = rec.id;
    cnt := cnt + 1;
  end loop;
  return cnt;
end
$$;

grant execute on function public.generate_nis(text) to authenticated;
grant execute on function public.bulk_generate_nis(text) to authenticated;
