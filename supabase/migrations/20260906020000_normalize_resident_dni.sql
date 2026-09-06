-- Un DNI con puntos o espacios identifica a la misma persona.
-- Auditoría, compatibilidad y recuperación: docs/residentes-dni.md.
begin;

lock table public.residents in share row exclusive mode;

create function public.normalize_resident_dni(p_dni text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  -- Conjunto de espacios de ECMAScript (\s), independiente del locale SQL.
  select translate(p_dni,
    U&'. \0009\000a\000b\000c\000d\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff',
    '');
$$;

revoke all on function public.normalize_resident_dni(text) from public, anon;
grant execute on function public.normalize_resident_dni(text)
  to authenticated, service_role;

do $$
begin
  if exists (
    select 1 from public.residents
    where public.normalize_resident_dni(dni) = ''
  ) then
    raise exception 'resident_dni_empty_requires_review' using errcode = '23514';
  end if;
  if exists (
    select 1 from public.residents
    group by public.normalize_resident_dni(dni)
    having count(*) > 1
  ) then
    raise exception 'resident_dni_collisions_require_review'
      using errcode = '23505';
  end if;
end;
$$;

-- La auditoría anterior aborta antes de tocar filas si hay colisiones.
update public.residents
set dni = public.normalize_resident_dni(dni)
where dni <> public.normalize_resident_dni(dni);

create function public.set_normalized_resident_dni()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.dni = public.normalize_resident_dni(new.dni);
  return new;
end;
$$;

revoke all on function public.set_normalized_resident_dni()
  from public, anon, authenticated, service_role;

create trigger residents_normalize_dni
before insert or update of dni on public.residents
for each row execute function public.set_normalized_resident_dni();

-- El UNIQUE existente arbitra también las escrituras concurrentes, porque
-- todas llegan al índice después de normalizar. Se conserva su nombre.
alter table public.residents
  add constraint residents_dni_normalized check (
    dni <> '' and dni = public.normalize_resident_dni(dni)
  );

commit;
