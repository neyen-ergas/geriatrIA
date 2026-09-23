"""Edición y acciones rápidas simultáneas. Solo datos ficticios en CI."""
import os
from pathlib import Path
import runpy
import uuid

if os.environ.get("CI") != "true":
    raise SystemExit("Esta prueba se ejecuta únicamente en CI.")
utilidades = runpy.run_path(str(Path(__file__).with_name("probar-concurrencia-estadias.py")))
ejecutar, sesion, esperar_bloqueo = [utilidades[n] for n in ("ejecutar", "sesion", "esperar_bloqueo")]


def probar(operacion_primera, operacion_segunda):
    usuario = str(uuid.uuid4())
    nombre = f"prueba_entrevistas_{uuid.uuid4().hex}"
    primera = segunda = None
    autenticacion = f"set local role authenticated; select set_config('request.jwt.claim.sub','{usuario}',true) \\gset\n"
    ejecutar(f"""insert into auth.users(id) values ('{usuario}');
      insert into public.user_access(user_id,role) values ('{usuario}','admin');""")
    entrevista = ejecutar(f"""begin; {autenticacion}
      select public.save_interview(p_candidate_name := 'Persona ficticia',
        p_interview_date := '2026-09-22', p_medical_notes := 'Original'); commit;""")
    version = ejecutar(f"select updated_at from public.interviews where id = '{entrevista}';")
    operaciones = {
        "editar": f"select public.save_interview(p_id := '{entrevista}', p_candidate_name := 'Persona ficticia', p_interview_date := '2026-09-22', p_status := 'scheduled', p_medical_notes := 'Editada', p_expected_updated_at := '{version}')",
        "completar": f"select public.transition_interview('{entrevista}','{version}','completed')",
        "cancelar": f"select public.transition_interview('{entrevista}','{version}','cancelled')",
    }
    try:
        primera = sesion(f"begin; {autenticacion} {operaciones[operacion_primera]} \\gset\n\\echo LISTO\n")
        assert primera.stdout.readline().strip() == "LISTO"
        segunda = sesion(f"set application_name = '{nombre}'; begin; {autenticacion} {operaciones[operacion_segunda]}; commit;\n")
        esperar_bloqueo(nombre, segunda)
        _, error_a = primera.communicate("commit;\n", timeout=15)
        assert primera.returncode == 0, error_a
        _, error_b = segunda.communicate(timeout=15)
        assert segunda.returncode != 0 and "interview_changed" in error_b, error_b
        estado = {"editar": "scheduled", "completar": "completed", "cancelar": "cancelled"}[operacion_primera]
        nota = "Editada" if operacion_primera == "editar" else "Original"
        assert ejecutar(f"select status || ':' || medical_notes from public.interviews where id = '{entrevista}';") == f"{estado}:{nota}"
        print(f"OK: {operacion_primera} primero; {operacion_segunda} rechazada sin perder cambios")
    finally:
        for proceso in (primera, segunda):
            if proceso is not None and proceso.poll() is None:
                proceso.kill()
                proceso.communicate()
        ejecutar(f"""delete from public.interviews where id = '{entrevista}';
          delete from public.user_access where user_id = '{usuario}';
          delete from auth.users where id = '{usuario}';""")


if __name__ == "__main__":
    for orden in (("editar", "completar"), ("completar", "editar"),
                  ("completar", "cancelar"), ("cancelar", "completar")):
        probar(*orden)
