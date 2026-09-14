"""Dos ediciones del mismo contacto desde ficha/ingreso. Solo base aislada de CI."""
import os
from pathlib import Path
import runpy
import uuid

if os.environ.get("CI") != "true":
    raise SystemExit("Esta prueba se ejecuta únicamente en CI.")
utilidades = runpy.run_path(str(Path(__file__).with_name("probar-concurrencia-estadias.py")))
ejecutar, sesion, esperar_bloqueo = [utilidades[n] for n in ("ejecutar", "sesion", "esperar_bloqueo")]


def probar(ingreso_primero):
    usuario, residente, contacto, ingreso = [str(uuid.uuid4()) for _ in range(4)]
    nombre = f"prueba_familiares_{uuid.uuid4().hex}"
    primera = segunda = None
    autenticacion = f"set local role authenticated; select set_config('request.jwt.claim.sub','{usuario}',true) \\gset\n"
    ejecutar(f"""insert into auth.users(id) values ('{usuario}');
      insert into public.user_access(user_id,role) values ('{usuario}','management');
      insert into public.residents(id,first_name,last_name,dni,birth_date)
      values ('{residente}','Persona','Ficticia','TEST-{residente}','1940-01-01');
      insert into public.family_contacts(id,resident_id,first_name,last_name,relationship,phone)
      values ('{contacto}','{residente}','Familiar','Ficticio','Hija','0000000');
      insert into public.admissions(id,resident_id,admitted_at,monthly_fee,due_day)
      values ('{ingreso}','{residente}','2025-01-01',100,10);
    """)
    version = ejecutar(f"select updated_at from public.family_contacts where id = '{contacto}';")
    editar_contacto = f"select public.save_family_contact('{residente}','{contacto}','{version}','Familiar','Ficticio','Hija','1111111')"
    editar_ingreso = f"""select public.update_active_admission('{residente}','{contacto}','{ingreso}',
      'Persona','Ficticia','TEST-{residente}','1940-01-01','Familiar','Ficticio','Hija','2222222',false,false,
      '2025-01-01',100,10,p_expected_contact_updated_at := '{version}')"""
    sql_a, sql_b = (editar_ingreso, editar_contacto) if ingreso_primero else (editar_contacto, editar_ingreso)
    try:
        primera = sesion(f"begin; {autenticacion} {sql_a} \\gset\n\\echo LISTO\n")
        assert primera.stdout.readline().strip() == "LISTO"
        segunda = sesion(f"set application_name = '{nombre}'; begin; {autenticacion} {sql_b}; commit;")
        esperar_bloqueo(nombre, segunda)
        _, error_a = primera.communicate("commit;\n", timeout=15)
        assert primera.returncode == 0, error_a
        _, error_b = segunda.communicate(timeout=15)
        assert segunda.returncode != 0 and "contact_changed" in error_b, error_b
        telefono = "2222222" if ingreso_primero else "1111111"
        assert ejecutar(f"select phone from public.family_contacts where id = '{contacto}';") == telefono
        assert ejecutar(f"select count(*) from public.audit_events where table_name = 'family_contacts' and record_id = '{contacto}' and action = 'update';") == "1"
        print(f"OK: ingreso primero={ingreso_primero}; edición vieja rechazada y un solo evento confirmado")
    finally:
        for proceso in (primera, segunda):
            if proceso is not None and proceso.poll() is None:
                proceso.kill()
                proceso.communicate()
        ejecutar(f"""delete from public.admissions where id = '{ingreso}';
          delete from public.family_contacts where id = '{contacto}';
          delete from public.residents where id = '{residente}';
          delete from public.user_access where user_id = '{usuario}';
          delete from auth.users where id = '{usuario}';""")


if __name__ == "__main__":
    probar(False)
    probar(True)
