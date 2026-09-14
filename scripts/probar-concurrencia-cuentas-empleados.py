"""Vínculo, habilitación y baja en dos sesiones; solo base aislada de CI."""
from pathlib import Path
import runpy
import uuid

utilidades = runpy.run_path(str(Path(__file__).with_name("probar-concurrencia-estadias.py")))
ejecutar, sesion, esperar_bloqueo = [utilidades[n] for n in ("ejecutar", "sesion", "esperar_bloqueo")]


def probar(operacion, baja_primero):
    admin, usuario = str(uuid.uuid4()), str(uuid.uuid4())
    nombre = f"prueba_cuenta_empleado_{uuid.uuid4().hex}"
    empleado = None
    primera = segunda = None
    ejecutar(f"""insert into auth.users (id) values ('{admin}'), ('{usuario}');
        insert into public.user_access (user_id, role, enabled)
        values ('{admin}', 'admin', true), ('{usuario}', 'management', {str(operacion == 'vincular').lower()});
    """)
    autenticacion = f"""set local role authenticated;
        select set_config('request.jwt.claim.sub', '{admin}', true) \\gset
    """
    try:
        empleado = ejecutar(f"""begin; {autenticacion}
            select public.save_employee(null,null,'Ficticio','Prueba','TEST-{uuid.uuid4().hex[:16]}','Cuidador','2025-01-01');
            commit;
        """)
        if operacion == "habilitar":
            ejecutar(f"""begin; {autenticacion}
                select public.set_employee_account('{usuario}',
                    (select updated_at from public.user_access where user_id = '{usuario}'), '{empleado}');
                commit;
            """)
        version_cuenta = ejecutar(f"select updated_at from public.user_access where user_id = '{usuario}';")
        version_empleado = ejecutar(f"select updated_at from public.employees where id = '{empleado}';")
        cuenta = (f"select public.set_employee_account('{usuario}','{version_cuenta}','{empleado}');" if operacion == "vincular"
                  else f"select public.set_user_access('{usuario}','management',true,'{version_cuenta}');")
        baja = f"select public.terminate_employee('{empleado}','{version_empleado}','2025-02-01','Fin ficticio');"
        sql_a, sql_b = (baja, cuenta) if baja_primero else (cuenta, baja)
        primera = sesion(f"""begin; {autenticacion}
            {sql_a.removesuffix(';')} \\gset
            \\echo LISTO
        """)
        assert primera.stdout.readline().strip() == "LISTO"
        segunda = sesion(f"""set application_name = '{nombre}'; begin; {autenticacion}
            {sql_b}
            commit;
        """)
        esperar_bloqueo(nombre, segunda)
        _, error_a = primera.communicate("commit;\n", timeout=15)
        assert primera.returncode == 0, error_a
        _, error_b = segunda.communicate(timeout=15)
        esperado = "employee_inactive" if baja_primero else "employee_access_enabled"
        assert segunda.returncode != 0 and esperado in error_b, error_b
        assert ejecutar(f"""select count(*) from public.user_access a join public.employees e on e.id = a.employee_id
            where a.user_id = '{usuario}' and a.enabled and e.terminated_at is not null;
        """) == "0"
        print(f"OK: {operacion}, baja primero={baja_primero}, rechazo {esperado}")
    finally:
        for proceso in (primera, segunda):
            if proceso is not None and proceso.poll() is None:
                proceso.kill()
                proceso.communicate()
        ejecutar(f"""delete from public.employee_account_events where user_id = '{usuario}';
            delete from public.access_events where user_id = '{usuario}';
            delete from public.user_access where user_id in ('{admin}', '{usuario}');
        """)
        if empleado:
            ejecutar(f"delete from public.employees where id = '{empleado}';")
        ejecutar(f"delete from auth.users where id in ('{admin}', '{usuario}');")


if __name__ == "__main__":
    for operacion in ("vincular", "habilitar"):
        for baja_primero in (False, True):
            probar(operacion, baja_primero)
