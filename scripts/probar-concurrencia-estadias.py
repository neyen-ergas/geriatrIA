"""Prueba bloqueos reales en Supabase local usando solo datos ficticios.

Requiere Docker y la base local iniciada. No acepta conexiones remotas.
"""

from pathlib import Path
import re
import subprocess
import time
import uuid

CONFIG = Path(__file__).resolve().parents[1] / "supabase/config.toml"
PROYECTO = re.search(r'^project_id = "([A-Za-z0-9_-]+)"$',
                     CONFIG.read_text(), re.MULTILINE).group(1)
COMANDO = [
    "docker", "exec", "-i", f"supabase_db_{PROYECTO}",
    "psql", "-X", "-qAt", "-U", "postgres", "-d", "postgres",
    "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose",
]


def ejecutar(sql):
    resultado = subprocess.run(
        COMANDO, input=sql, text=True, capture_output=True, timeout=20,
    )
    if resultado.returncode:
        raise RuntimeError(resultado.stderr)
    return resultado.stdout.strip()


def sesion(sql):
    proceso = subprocess.Popen(
        COMANDO, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, text=True,
    )
    proceso.stdin.write(sql)
    proceso.stdin.flush()
    return proceso


def esperar_bloqueo(nombre, proceso):
    limite = time.monotonic() + 10
    while time.monotonic() < limite:
        if proceso.poll() is not None:
            raise AssertionError("La segunda conexión terminó sin esperar el bloqueo")
        if ejecutar(f"""
            select count(*) from pg_stat_activity
            where application_name = '{nombre}' and wait_event_type = 'Lock';
        """) == "1":
            return
        time.sleep(0.1)
    raise AssertionError("No se observó el bloqueo entre las conexiones")


def probar(aislamiento, caso):
    residente = str(uuid.uuid4())
    nombre = f"prueba_estadias_{uuid.uuid4().hex}"
    primera = segunda = None
    ejecutar(f"""
        insert into public.residents (id, first_name, last_name, dni, birth_date)
        values ('{residente}', 'Prueba ficticia', 'Concurrencia',
            'TEST-{residente}', '1940-01-01');
    """)
    ingreso = f"""
        insert into public.admissions
            (resident_id, admitted_at, discharged_at, monthly_fee, due_day)
        values ('{residente}', '2025-01-01', '2025-02-01', 100, 10);
    """
    nacimiento = f"""
        update public.residents set birth_date = '2025-01-15'
        where id = '{residente}';
    """
    if caso == "historias":
        escritura_a = ingreso
        escritura_b = ingreso.replace("2025-01-01", "2025-01-15")
        esperado = "23P01"
    elif caso == "nacimiento primero":
        escritura_a, escritura_b = nacimiento, ingreso
        esperado = "23514"
    else:
        escritura_a, escritura_b = ingreso, nacimiento
        esperado = "23514"
    if aislamiento == "repeatable read":
        esperado = "40001"
    autenticacion = r"""
        set local role authenticated;
        select set_config('request.jwt.claim.sub',
            '10000000-0000-4000-8000-000000000099', true) \gset
    """
    try:
        primera = sesion(f"begin; {autenticacion} {escritura_a} \\echo LISTO\n")
        assert primera.stdout.readline().strip() == "LISTO"
        segunda = sesion(f"""
            set application_name = '{nombre}';
            begin isolation level {aislamiento};
            {autenticacion}
            select count(*) from public.residents where id = '{residente}';
            {escritura_b}
            commit;
        """)
        esperar_bloqueo(nombre, segunda)
        salida_a, error_a = primera.communicate("commit;\n", timeout=15)
        assert primera.returncode == 0, error_a
        salida_b, error_b = segunda.communicate(timeout=15)
        assert segunda.returncode != 0 and esperado in error_b, error_b
        assert ejecutar(f"""
            select count(*) from public.admissions a
            join public.residents r on r.id = a.resident_id
            where r.id = '{residente}' and a.admitted_at < r.birth_date;
        """) == "0"
        cantidad = "0" if caso == "nacimiento primero" else "1"
        assert ejecutar(f"""
            select count(*) from public.admissions
            where resident_id = '{residente}';
        """) == cantidad
        print(f"OK: {aislamiento}, {caso}: bloqueo y rechazo {esperado}")
    finally:
        for proceso in (primera, segunda):
            if proceso is not None and proceso.poll() is None:
                proceso.kill()
                proceso.communicate()
        # Solo se retiran las filas sintéticas creadas por esta ejecución.
        ejecutar(f"""
            delete from public.admissions where resident_id = '{residente}';
            delete from public.residents where id = '{residente}';
        """)


if __name__ == "__main__":
    for nivel in ("read committed", "repeatable read"):
        for escenario in ("historias", "nacimiento primero", "ingreso primero"):
            probar(nivel, escenario)
