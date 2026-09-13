"""Dos envíos simultáneos de una consulta: una sola estadía. Solo base aislada de CI."""
from pathlib import Path
import runpy
import uuid

utilidades = runpy.run_path(str(Path(__file__).with_name("probar-concurrencia-estadias.py")))
ejecutar, sesion, esperar_bloqueo = [utilidades[n] for n in ("ejecutar", "sesion", "esperar_bloqueo")]


def probar():
    usuario, consulta = [str(uuid.uuid4()) for _ in range(2)]
    nombre = f"prueba_conversion_{uuid.uuid4().hex}"
    dni = f"TEST-{consulta}"
    primera = segunda = None
    ejecutar(f"""
        insert into auth.users (id) values ('{usuario}'); insert into public.user_access (user_id, role) values ('{usuario}', 'admin');
        insert into public.consulta (id, nombre, telefono, estado, visita_fecha, visita_franja)
        values ('{consulta}', 'Prueba ficticia', '000000', 'visita_agendada', '2025-01-01', 'manana');
    """)
    version = ejecutar(f"select actualizado_en from public.consulta where id = '{consulta}';")
    autenticacion = f"""
        set local role authenticated;
        select set_config('request.jwt.claim.sub', '{usuario}', true) \\gset
    """
    convertir = f"""select public.convert_consultation_admission(
        '{consulta}', '{version}', '2025-02-01', 100, 10,
        p_resident_first_name => 'Prueba ficticia', p_resident_last_name => 'Conversión',
        p_resident_dni => '{dni}', p_resident_birth_date => '1940-01-01',
        p_contact_first_name => 'Contacto ficticio', p_contact_last_name => 'Prueba',
        p_contact_relationship => 'Familiar', p_contact_phone => '000000')"""
    try:
        primera = sesion(f"begin; {autenticacion} {convertir} as ingreso \\gset\n\\echo :ingreso\n")
        ingreso = primera.stdout.readline().strip()
        assert str(uuid.UUID(ingreso)) == ingreso
        segunda = sesion(f"set application_name = '{nombre}'; begin; {autenticacion} {convertir}; commit;\n")
        esperar_bloqueo(nombre, segunda)
        _, error_a = primera.communicate("commit;\n", timeout=15)
        assert primera.returncode == 0, error_a
        salida_b, error_b = segunda.communicate(timeout=15)
        assert segunda.returncode == 0, error_b
        assert salida_b.strip() == ingreso, salida_b
        assert ejecutar(f"""
            select (select count(*) from public.residents where dni = '{dni}'),
                (select count(*) from public.admissions where resident_id in
                    (select id from public.residents where dni = '{dni}')),
                (select count(*) from public.family_contacts where resident_id in
                    (select id from public.residents where dni = '{dni}')),
                (select count(*) from public.visit_events where consultation_id = '{consulta}' and action = 'closed'),
                (select count(*) from public.consultation_admissions where consultation_id = '{consulta}');
        """) == "1|1|1|1|1"
        print("OK: envíos simultáneos recuperan la misma estadía sin duplicar persona, contacto ni cierre")
    finally:
        for proceso in (primera, segunda):
            if proceso is not None and proceso.poll() is None:
                proceso.kill()
                proceso.communicate()
        ejecutar(f"""
            delete from public.consultation_admissions where consultation_id = '{consulta}';
            delete from public.visit_events where consultation_id = '{consulta}';
            delete from public.admissions where resident_id in (select id from public.residents where dni = '{dni}');
            delete from public.family_contacts where resident_id in (select id from public.residents where dni = '{dni}');
            delete from public.residents where dni = '{dni}';
            delete from public.consulta where id = '{consulta}';
            delete from public.user_access where user_id = '{usuario}'; delete from auth.users where id = '{usuario}';
        """)


if __name__ == "__main__":
    probar()
