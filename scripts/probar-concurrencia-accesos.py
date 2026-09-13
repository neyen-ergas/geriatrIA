"""Último administrador y revocación simultánea; solo base aislada de CI."""
from pathlib import Path
import runpy
import uuid

utilidades = runpy.run_path(str(Path(__file__).with_name("probar-concurrencia-estadias.py")))
ejecutar, sesion, esperar_bloqueo = [utilidades[n] for n in ("ejecutar", "sesion", "esperar_bloqueo")]


def autenticar(usuario):
    return f"""set local role authenticated;
        select set_config('request.jwt.claim.sub', '{usuario}', true) \\gset
    """


def probar(caso):
    a, b = str(uuid.uuid4()), str(uuid.uuid4())
    nombre = f"prueba_accesos_{uuid.uuid4().hex}"
    primera = segunda = None
    ejecutar(f"""insert into auth.users (id) values ('{a}'), ('{b}');
        insert into public.user_access (user_id, role) values ('{a}', 'admin'), ('{b}', 'admin');
    """)
    try:
        va = ejecutar(f"select updated_at from public.user_access where user_id = '{a}';")
        vb = ejecutar(f"select updated_at from public.user_access where user_id = '{b}';")
        if caso == "ultimo administrador":
            sql_a = f"select public.set_user_access('{a}','readonly',true,'{va}');"
            sql_b = f"select public.set_user_access('{b}','readonly',true,'{vb}');"
            autor_a, autor_b = a, b
        else:
            sql_a = "select public.require_permission('operational.write');"
            sql_b = f"select public.set_user_access('{b}','management',false,'{vb}');"
            autor_a, autor_b = b, a
        primera = sesion(f"""begin; {autenticar(autor_a)}
            {sql_a.replace(';', ' '+chr(92)+'gset', 1)}
            \\echo LISTO
        """)
        assert primera.stdout.readline().strip() == "LISTO"
        segunda = sesion(f"""set application_name = '{nombre}'; begin; {autenticar(autor_b)}
            {sql_b}
            commit;
        """)
        esperar_bloqueo(nombre, segunda)
        _, error_a = primera.communicate("commit;\n", timeout=15)
        assert primera.returncode == 0, error_a
        _, error_b = segunda.communicate(timeout=15)
        if caso == "ultimo administrador":
            assert segunda.returncode != 0 and "last_admin_required" in error_b, error_b
            assert ejecutar("select count(*) from public.user_access where role = 'admin' and enabled;") == "1"
        else:
            assert segunda.returncode == 0, error_b
            denegada = sesion(f"""begin; {autenticar(b)}
                select public.create_monthly_charge(null,null,null,null);
                commit;
            """)
            _, error = denegada.communicate(timeout=15)
            assert denegada.returncode != 0 and "permission_denied" in error, error
        print(f"OK: {caso}")
    finally:
        for proceso in (primera, segunda):
            if proceso is not None and proceso.poll() is None:
                proceso.kill()
                proceso.communicate()
        ejecutar(f"""delete from public.access_events where user_id in ('{a}', '{b}');
            delete from public.user_access where user_id in ('{a}', '{b}');
            delete from auth.users where id in ('{a}', '{b}');
        """)


if __name__ == "__main__":
    for caso in ("ultimo administrador", "revocacion durante escritura"):
        probar(caso)
