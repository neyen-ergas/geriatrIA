"""Edición y archivo de un registro en dos sesiones. Solo CI aislado."""
import os
from pathlib import Path
import runpy
import uuid

if os.environ.get("CI") != "true":
    raise SystemExit("Esta prueba se ejecuta únicamente en CI.")
utilidades = runpy.run_path(str(Path(__file__).with_name("probar-concurrencia-estadias.py")))
ejecutar, sesion, esperar_bloqueo = [utilidades[n] for n in ("ejecutar", "sesion", "esperar_bloqueo")]


def probar(archivo_primero):
    usuario, residente, registro = [str(uuid.uuid4()) for _ in range(3)]
    nombre = f"prueba_registro_{uuid.uuid4().hex}"
    primera = segunda = None
    autenticacion = f"set local role authenticated; select set_config('request.jwt.claim.sub','{usuario}',true) \\gset\n"
    ejecutar(f"""insert into auth.users(id) values ('{usuario}');
      insert into public.user_access(user_id,role) values ('{usuario}','management');
      insert into public.residents(id,first_name,last_name,dni,birth_date)
      values ('{residente}','Persona','Ficticia','TEST-{residente}','1940-01-01');
      begin; {autenticacion}
      select public.save_resident_record('special_needs','{residente}','{registro}',
        '{{"category":"care","details":"Inicial ficticio"}}'); commit;
    """)
    version = ejecutar(f"select updated_at from public.special_needs where id = '{registro}';")
    editar = f"select public.save_resident_record('special_needs','{residente}','{registro}','{{\"category\":\"care\",\"details\":\"Cambio ficticio\"}}','{version}')"
    archivar = f"select public.save_resident_record('special_needs','{residente}','{registro}','{{}}','{version}','Motivo ficticio')"
    sql_a, sql_b = (archivar, editar) if archivo_primero else (editar, archivar)
    try:
        primera = sesion(f"begin; {autenticacion} {sql_a} \\gset\n\\echo LISTO\n")
        assert primera.stdout.readline().strip() == "LISTO"
        segunda = sesion(f"set application_name = '{nombre}'; begin; {autenticacion} {sql_b}; commit;\n")
        esperar_bloqueo(nombre, segunda)
        _, error_a = primera.communicate("commit;\n", timeout=15)
        assert primera.returncode == 0, error_a
        _, error_b = segunda.communicate(timeout=15)
        assert segunda.returncode != 0 and "resident_record_changed" in error_b, error_b
        assert ejecutar(f"select archived_at is not null from public.special_needs where id = '{registro}';") == ("t" if archivo_primero else "f")
        assert ejecutar(f"select count(*) from public.audit_events where table_name = 'special_needs' and record_id = '{registro}' and action = 'update';") == "1"
        print(f"OK: archivo primero={archivo_primero}; segunda operación rechazada, un solo cambio confirmado")
    finally:
        for proceso in (primera, segunda):
            if proceso is not None and proceso.poll() is None:
                proceso.kill()
                proceso.communicate()
        ejecutar(f"""delete from public.special_needs where id = '{registro}';
          delete from public.residents where id = '{residente}';
          delete from public.user_access where user_id = '{usuario}';
          delete from auth.users where id = '{usuario}';""")


if __name__ == "__main__":
    probar(False)
    probar(True)
