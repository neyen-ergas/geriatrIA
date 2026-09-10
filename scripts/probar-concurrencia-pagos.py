"""Comprueba pagos simultáneos con el aislamiento por defecto de PostgREST.

Solo utiliza la base aislada de CI; no acepta conexiones remotas.
"""
from pathlib import Path
import runpy
import uuid

utilidades = runpy.run_path(str(Path(__file__).with_name("probar-concurrencia-estadias.py")))
ejecutar = utilidades["ejecutar"]
sesion = utilidades["sesion"]
esperar_bloqueo = utilidades["esperar_bloqueo"]


def probar(segundo_importe):
    usuario, residente, estadia, cuota = [str(uuid.uuid4()) for _ in range(4)]
    nombre = f"prueba_pagos_{uuid.uuid4().hex}"
    primera = segunda = None
    ejecutar(f"""
        insert into auth.users (id) values ('{usuario}');
        insert into public.residents (id, first_name, last_name, dni, birth_date)
        values ('{residente}', 'Prueba ficticia', 'Pagos', 'TEST-{residente}', '1940-01-01');
        insert into public.admissions (id, resident_id, admitted_at, monthly_fee, due_day)
        values ('{estadia}', '{residente}', '2025-01-01', 100, 10);
        insert into public.monthly_charges
            (id, admission_id, period, due_date, amount_due, created_by)
        values ('{cuota}', '{estadia}', '2025-01-01', '2025-01-10', 100, '{usuario}');
    """)
    autenticacion = f"""
        set local role authenticated;
        select set_config('request.jwt.claim.sub', '{usuario}', true) \\gset
    """
    try:
        primera = sesion(f"""
            begin isolation level read committed;
            {autenticacion}
            select public.record_payment('{cuota}', '2025-01-10', 60, 'cash') \\gset
            \\echo LISTO
        """)
        assert primera.stdout.readline().strip() == "LISTO"
        segunda = sesion(f"""
            set application_name = '{nombre}';
            begin isolation level read committed;
            {autenticacion}
            select public.record_payment('{cuota}', '2025-01-10', {segundo_importe}, 'cash');
            commit;
        """)
        esperar_bloqueo(nombre, segunda)
        _, error_a = primera.communicate("commit;\n", timeout=15)
        assert primera.returncode == 0, error_a
        _, error_b = segunda.communicate(timeout=15)
        if segundo_importe == 60:
            assert segunda.returncode != 0 and "payment_exceeds_balance" in error_b, error_b
            esperado = "60.00|40.00"
        else:
            assert segunda.returncode == 0, error_b
            esperado = "100.00|0.00"
        assert ejecutar(f"""
            select paid_amount, balance from public.monthly_charge_balances
            where id = '{cuota}';
        """) == esperado
        print(f"OK: pagos simultáneos 60 + {segundo_importe}, saldo consistente")
    finally:
        for proceso in (primera, segunda):
            if proceso is not None and proceso.poll() is None:
                proceso.kill()
                proceso.communicate()
        ejecutar(f"""
            delete from public.payments where monthly_charge_id = '{cuota}';
            delete from public.monthly_charges where id = '{cuota}';
            delete from public.admissions where id = '{estadia}';
            delete from public.residents where id = '{residente}';
            delete from auth.users where id = '{usuario}';
        """)


if __name__ == "__main__":
    for importe in (60, 40):
        probar(importe)
