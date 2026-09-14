begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users(id) values ('88000000-0000-4000-8000-000000000001'),('88000000-0000-4000-8000-000000000002');
insert into user_access(user_id,role) values ('88000000-0000-4000-8000-000000000001','management'),('88000000-0000-4000-8000-000000000002','readonly');
insert into residents(id,first_name,last_name,dni,birth_date) values
 ('88000000-0000-4000-8000-000000000010','Persona','Ficticia','TEST-RECORDS','1940-01-01'),
 ('88000000-0000-4000-8000-000000000011','Otra','Ficticia','TEST-RECORDS-2','1940-01-01');
insert into admissions(id,resident_id,admitted_at,monthly_fee,due_day) values
 ('88000000-0000-4000-8000-000000000030','88000000-0000-4000-8000-000000000010','2025-01-01',100,10);
select ok(not public,'documentos privados') from storage.buckets where id = 'resident-documents';
select is(file_size_limit,3145728::bigint,'límite de tamaño en Storage') from storage.buckets where id = 'resident-documents';
select ok(not has_table_privilege('authenticated', t, 'insert,update,delete'),'sin DML directo: ' || t)
 from unnest(array['resident_documents','medical_indications','medications','special_needs','inventory_items']) t;
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select save_resident_record('special_needs','88000000-0000-4000-8000-000000000010',gen_random_uuid())$$,
 '42501','authentication_required','sin sesión no consulta datos');
select set_config('request.jwt.claim.sub','88000000-0000-4000-8000-000000000002',true);
select throws_ok($$select save_resident_record('special_needs','88000000-0000-4000-8000-000000000010',gen_random_uuid())$$,
 '42501','permission_denied','Solo lectura no escribe');
select set_config('request.jwt.claim.sub','88000000-0000-4000-8000-000000000001',true);
select throws_ok($$select save_resident_record('user_access','88000000-0000-4000-8000-000000000010',gen_random_uuid())$$,
 '22023','invalid_resident_record','tabla fuera de lista rechazada');
select throws_ok($$select save_resident_record('special_needs','88000000-0000-4000-8000-000000000010',gen_random_uuid(),'{"created_by":"forjado"}')$$,
 '22023','invalid_record_field','no permite forjar metadatos');
select save_resident_record('special_needs','88000000-0000-4000-8000-000000000010','88000000-0000-4000-8000-000000000020',
 '{"category":"mobility","details":"Descripción ficticia"}');
select updated_at as version from special_needs where id = '88000000-0000-4000-8000-000000000020' \gset
select throws_ok(format($$select save_resident_record('special_needs','88000000-0000-4000-8000-000000000011','88000000-0000-4000-8000-000000000020',
 '{"category":"care","details":"Texto"}',%L)$$, :'version'),'P0002','resident_record_not_found','pertenencia al residente');
select save_resident_record('special_needs','88000000-0000-4000-8000-000000000010','88000000-0000-4000-8000-000000000020',
 '{"category":"care","details":"Cambio ficticio"}',:'version');
select throws_ok(format($$select save_resident_record('special_needs','88000000-0000-4000-8000-000000000010','88000000-0000-4000-8000-000000000020',
 '{}',%L,'Archivo viejo')$$, :'version'),'40001','resident_record_changed','archivo desactualizado no pisa edición');
select updated_at as actual from special_needs where id = '88000000-0000-4000-8000-000000000020' \gset
select save_resident_record('special_needs','88000000-0000-4000-8000-000000000010','88000000-0000-4000-8000-000000000020','{}',:'actual','Finalizado ficticio');
select updated_at as archivado from special_needs where id = '88000000-0000-4000-8000-000000000020' \gset
select throws_ok(format($$select save_resident_record('special_needs','88000000-0000-4000-8000-000000000010','88000000-0000-4000-8000-000000000020',
 '{"category":"care","details":"No guardar"}',%L)$$, :'archivado'),'23514','resident_record_archived','archivado solo de consulta');
select save_resident_record('medical_indications','88000000-0000-4000-8000-000000000010','88000000-0000-4000-8000-000000000021',
 '{"title":"Prueba","instructions":"Texto ficticio","professional":"Profesional ficticio","starts_on":"2025-01-01","ends_on":"2025-01-31"}');
select save_resident_record('medications','88000000-0000-4000-8000-000000000010','88000000-0000-4000-8000-000000000022',
 '{"name":"Medicamento ficticio","dose":"Dosis de prueba","frequency":"Frecuencia ficticia","schedule":"Pauta de prueba","professional":"Profesional ficticio","starts_on":"2025-01-01"}');
select throws_ok($$select save_resident_record('medical_indications','88000000-0000-4000-8000-000000000010',gen_random_uuid(),
 '{"title":"Prueba","instructions":"Texto","professional":"Ficticio","starts_on":"2025-02-01","ends_on":"2025-01-01"}')$$,
 '23514',null,'vigencia coherente en base');
select save_resident_record('inventory_items','88000000-0000-4000-8000-000000000010','88000000-0000-4000-8000-000000000023',
 '{"admission_id":"88000000-0000-4000-8000-000000000030","description":"Objeto ficticio","quantity":2,"received_on":"2025-01-01","returned_on":"2025-02-01"}');
select throws_ok($$select save_resident_record('inventory_items','88000000-0000-4000-8000-000000000011',gen_random_uuid(),
 '{"admission_id":"88000000-0000-4000-8000-000000000030","description":"Objeto","quantity":1,"received_on":"2025-01-01"}')$$,
 '23514','inventory_admission_mismatch','pertenencia debe usar estadía de esa persona');
select throws_ok($$select save_resident_record('inventory_items','88000000-0000-4000-8000-000000000010',gen_random_uuid(),
 '{"admission_id":"88000000-0000-4000-8000-000000000030","description":"Objeto","quantity":0,"received_on":"2025-01-01"}')$$,
 '23514',null,'cantidad positiva');
select '88000000-0000-4000-8000-000000000001/88000000-0000-4000-8000-000000000010/88000000-0000-4000-8000-000000000024.pdf' as ruta \gset
select throws_ok($$insert into storage.objects(bucket_id,name) values ('resident-documents',
 '88000000-0000-4000-8000-000000000002/88000000-0000-4000-8000-000000000010/prueba.pdf')$$,'42501',null,'no carga en carpeta ajena');
insert into storage.objects(bucket_id,name) values ('resident-documents',:'ruta');
select set_config('request.jwt.claim.sub','88000000-0000-4000-8000-000000000002',true);
select is((select count(*) from storage.objects where name = :'ruta'),0::bigint,'otra cuenta no ve archivo sin registrar');
select throws_ok($$insert into storage.objects(bucket_id,name) values ('resident-documents',
 '88000000-0000-4000-8000-000000000002/88000000-0000-4000-8000-000000000010/prueba.pdf')$$,'42501',null,'Solo lectura no carga archivos');
select set_config('request.jwt.claim.sub','88000000-0000-4000-8000-000000000001',true);
select save_resident_record('resident_documents','88000000-0000-4000-8000-000000000010','88000000-0000-4000-8000-000000000024',
 jsonb_build_object('title','Documento ficticio','document_type','Prueba','file_path',:'ruta'));
select updated_at as version_doc from resident_documents where id = '88000000-0000-4000-8000-000000000024' \gset
select throws_ok(format($$select save_resident_record('resident_documents','88000000-0000-4000-8000-000000000010','88000000-0000-4000-8000-000000000024',
 '{"title":"Cambio","document_type":"Prueba","file_path":"otra.pdf"}',%L)$$, :'version_doc'),'23514','document_file_immutable','archivo original no se reemplaza');
select set_config('request.jwt.claim.sub','88000000-0000-4000-8000-000000000002',true);
select is((select count(*) from storage.objects where name = :'ruta'),1::bigint,'Solo lectura descarga documento registrado');
select is((select count(*) from medications where resident_id = '88000000-0000-4000-8000-000000000010'),1::bigint,'Solo lectura consulta medicación');
select is((select count(*) from special_needs where id = '88000000-0000-4000-8000-000000000020'),1::bigint,'historial archivado permanece legible');
select set_config('request.jwt.claim.sub','',true);
select is((select count(*) from medications),0::bigint,'sin identidad no hay lectura');
select is((select count(*) from storage.objects where bucket_id = 'resident-documents'),0::bigint,'sin identidad no hay archivos');
reset role;
select is((select count(*) from audit_events where record_id = '88000000-0000-4000-8000-000000000020' and table_name = 'special_needs'),3::bigint,'auditoría de alta, edición y archivo sin intentos fallidos');
select is((select count(distinct table_name) from audit_events where actor_id = '88000000-0000-4000-8000-000000000001'),5::bigint,'las cinco tablas quedan auditadas');
select * from finish();
rollback;
