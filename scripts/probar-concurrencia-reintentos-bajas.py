"""Reintentos y bajas frente a turnos simultáneos, con datos ficticios solo en CI."""
import os
from pathlib import Path
import runpy
import uuid

if os.environ.get("CI") != "true":
    raise SystemExit("Esta prueba se ejecuta únicamente en CI.")
utilidades = runpy.run_path(str(Path(__file__).with_name("probar-concurrencia-estadias.py")))
ejecutar, sesion, esperar_bloqueo = [utilidades[n] for n in ("ejecutar", "sesion", "esperar_bloqueo")]


def escenario(tipo):
    usuario, solicitud = str(uuid.uuid4()), str(uuid.uuid4())
    nombre = f"prueba_reintentos_{uuid.uuid4().hex}"
    autenticar = f"set local role authenticated; select set_config('request.jwt.claim.sub','{usuario}',true) \\gset\n"
    primera = segunda = None
    ejecutar(f"insert into auth.users(id) values ('{usuario}'); insert into public.user_access(user_id,role) values ('{usuario}','admin');")
    empleado = ejecutar(f"begin; {autenticar} select public.save_employee(null,null,'Persona','Ficticia','{uuid.uuid4().int % 100000000:08d}','Cuidador','2025-01-01'); commit;")
    entrevista = f"select public.save_interview(p_candidate_name := 'Persona ficticia', p_interview_date := '2026-09-25', p_request_id := '{solicitud}')"
    turno = f"select public.save_shift(null,'{empleado}','2026-09-25','manana', p_request_id := '{solicitud}')"
    version = ejecutar(f"select updated_at from public.employees where id = '{empleado}';")
    baja = f"select public.terminate_employee('{empleado}','{version}','2026-09-24','Fin ficticio')"
    operacion_a, operacion_b = {
        "entrevista": (entrevista, entrevista),
        "turno": (turno, turno),
        "turno_primero": (turno, baja),
        "baja_primero": (baja, turno),
    }[tipo]
    try:
        primera = sesion(f"begin; {autenticar} {operacion_a} as resultado \\gset\n\\echo LISTO\n")
        assert primera.stdout.readline().strip() == "LISTO"
        segunda = sesion(f"set application_name = '{nombre}'; begin; {autenticar} {operacion_b}; commit;\n")
        esperar_bloqueo(nombre, segunda)
        _, error_a = primera.communicate("commit;\n", timeout=15)
        assert primera.returncode == 0, error_a
        salida_b, error_b = segunda.communicate(timeout=15)
        if tipo in ("entrevista", "turno"):
            assert segunda.returncode == 0, error_b
            recurso = "interviews" if tipo == "entrevista" else "shifts"
            assert ejecutar(f"select count(*) from public.{recurso};") == "1"
            assert ejecutar(f"select resource_id from public.creation_requests where scope = '{'interview' if tipo == 'entrevista' else 'shift'}' and request_id = '{solicitud}';") in salida_b
        else:
            esperado = "employee_has_future_shifts" if tipo == "turno_primero" else "shift_outside_employment_dates"
            assert segunda.returncode != 0 and esperado in error_b, error_b
            assert ejecutar(f"select count(*) from public.shifts where employee_id = '{empleado}' and status <> 'cancelled';") == ("1" if tipo == "turno_primero" else "0")
        print(f"OK: {tipo}, bloqueo y resultado consistente")
    finally:
        for proceso in (primera, segunda):
            if proceso is not None and proceso.poll() is None:
                proceso.kill()
                proceso.communicate()
        ejecutar(f"delete from public.shifts where employee_id = '{empleado}'; delete from public.interviews where created_by = '{usuario}'; delete from public.employees where id = '{empleado}'; delete from public.user_access where user_id = '{usuario}'; delete from auth.users where id = '{usuario}';")


if __name__ == "__main__":
    for caso in ("entrevista", "turno", "turno_primero", "baja_primero"):
        escenario(caso)
