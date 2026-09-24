"""Reservas simultáneas de titulares y reemplazantes; solo base ficticia de CI."""
import os
from pathlib import Path
import runpy
import uuid

if os.environ.get("CI") != "true":
    raise SystemExit("Esta prueba se ejecuta únicamente en CI.")
utilidades = runpy.run_path(str(Path(__file__).with_name("probar-concurrencia-estadias.py")))
ejecutar, sesion, esperar_bloqueo = [utilidades[n] for n in ("ejecutar", "sesion", "esperar_bloqueo")]


def probar(operacion_a, operacion_b):
    usuario = str(uuid.uuid4())
    nombre = f"prueba_turnos_{uuid.uuid4().hex}"
    primera = segunda = None
    autenticacion = f"set local role authenticated; select set_config('request.jwt.claim.sub','{usuario}',true) \\gset\n"
    ejecutar(f"insert into auth.users(id) values ('{usuario}'); insert into public.user_access(user_id,role) values ('{usuario}','admin');")
    empleados = [ejecutar(f"""begin; {autenticacion}
      select public.save_employee(null,null,'Persona','Ficticia','{uuid.uuid4().int % 100000000:08d}','Cuidador','2025-01-01'); commit;""") for _ in range(3)]
    a, b, c = empleados
    turnos = [ejecutar(f"""begin; {autenticacion}
      select public.save_shift(null,'{empleado}','2026-09-23','manana', p_request_id := '{uuid.uuid4()}'); commit;""") for empleado in (a, c)]
    versiones = [ejecutar(f"select updated_at from public.shifts where id = '{turno}';") for turno in turnos]
    operaciones = {
        "cubrir_a": f"select public.cover_shift('{turnos[0]}','{b}','Motivo ficticio',null,'{versiones[0]}')",
        "cubrir_c": f"select public.cover_shift('{turnos[1]}','{b}','Motivo ficticio',null,'{versiones[1]}')",
        "asignar": f"select public.save_shift(null,'{b}','2026-09-23','guardia',null,'10:00', p_request_id := '{uuid.uuid4()}')",
        "franco": f"select public.save_shift(null,'{b}','2026-09-23','franco', p_request_id := '{uuid.uuid4()}')",
    }
    try:
        primera = sesion(f"begin; {autenticacion} {operaciones[operacion_a]} \\gset\n\\echo LISTO\n")
        assert primera.stdout.readline().strip() == "LISTO"
        segunda = sesion(f"set application_name = '{nombre}'; begin; {autenticacion} {operaciones[operacion_b]}; commit;\n")
        esperar_bloqueo(nombre, segunda)
        _, error_a = primera.communicate("commit;\n", timeout=15)
        assert primera.returncode == 0, error_a
        _, error_b = segunda.communicate(timeout=15)
        assert segunda.returncode != 0 and "23P01" in error_b, error_b
        assert ejecutar(f"select count(*) from public.shift_reservations where employee_id = '{b}';") == "1"
        assert ejecutar(f"select count(*) from public.shifts where (employee_id = '{b}' or covered_by_employee_id = '{b}') and status <> 'cancelled';") == "1"
        print(f"OK: {operacion_a} primero; {operacion_b} rechazada sin doble asignación")
    finally:
        for proceso in (primera, segunda):
            if proceso is not None and proceso.poll() is None:
                proceso.kill()
                proceso.communicate()
        ids = ','.join(f"'{empleado}'" for empleado in empleados)
        ejecutar(f"""delete from public.shifts where employee_id in ({ids});
          delete from public.employees where id in ({ids});
          delete from public.user_access where user_id = '{usuario}';
          delete from auth.users where id = '{usuario}';""")


if __name__ == "__main__":
    for orden in (("cubrir_a", "cubrir_c"), ("asignar", "cubrir_a"),
                  ("cubrir_a", "asignar"), ("franco", "cubrir_a")):
        probar(*orden)
