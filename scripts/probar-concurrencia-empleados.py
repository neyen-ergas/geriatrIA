"""Edición y baja simultáneas con versión obsoleta. Solo base aislada de CI."""
from pathlib import Path
import runpy
import uuid

utilidades = runpy.run_path(str(Path(__file__).with_name("probar-concurrencia-estadias.py")))
ejecutar, sesion, esperar_bloqueo = [utilidades[n] for n in ("ejecutar", "sesion", "esperar_bloqueo")]


def probar():
    usuario = str(uuid.uuid4())
    dni = f"TEST-{uuid.uuid4().hex[:16]}"
    nombre = f"prueba_empleados_{uuid.uuid4().hex}"
    empleado = None
    primera = segunda = None
    ejecutar(f"insert into auth.users (id) values ('{usuario}');")
    autenticacion = f"""
        set local role authenticated;
        select set_config('request.jwt.claim.sub', '{usuario}', true) \\gset
    """
    try:
        empleado = ejecutar(f"""begin; {autenticacion}
            select public.save_employee(null,null,'Ficticio','Prueba','{dni}','Cuidador','2025-01-01');
            commit;
        """)
        version = ejecutar(f"select updated_at from public.employees where id = '{empleado}';")
        primera = sesion(f"""begin; {autenticacion}
            select public.save_employee('{empleado}','{version}','Ficticio','Prueba','{dni}','Coordinador','2025-01-01') \\gset
            \\echo LISTO
        """)
        assert primera.stdout.readline().strip() == "LISTO"
        segunda = sesion(f"""set application_name = '{nombre}'; begin; {autenticacion}
            select public.terminate_employee('{empleado}','{version}','2025-02-01','Prueba');
            commit;
        """)
        esperar_bloqueo(nombre, segunda)
        _, error_a = primera.communicate("commit;\n", timeout=15)
        assert primera.returncode == 0, error_a
        _, error_b = segunda.communicate(timeout=15)
        assert segunda.returncode != 0 and "employee_changed" in error_b, error_b
        assert ejecutar(f"select job_title, terminated_at is null from public.employees where id = '{empleado}';") == "Coordinador|t"
        print("OK: una baja desactualizada no sobrescribe la edición concurrente")
    finally:
        for proceso in (primera, segunda):
            if proceso is not None and proceso.poll() is None:
                proceso.kill()
                proceso.communicate()
        if empleado:
            ejecutar(f"delete from public.employees where id = '{empleado}';")
        ejecutar(f"delete from auth.users where id = '{usuario}';")


if __name__ == "__main__":
    probar()
