
DO $$
DECLARE
  ws uuid := '5b8fa6b7-1586-4790-8d23-85f0422910b3';
  acc uuid := gen_random_uuid();
  proj uuid := gen_random_uuid();
  ph_plan uuid := gen_random_uuid();
  ph_dev uuid := gen_random_uuid();
  ph_live uuid := gen_random_uuid();
  ph_hold uuid := gen_random_uuid();
  thabo uuid := '47cb6b5c-8168-4640-86fa-44b584316eac';
  ntokozo uuid := '2ca3649f-bf29-486c-8d2a-fc063081f75a';
  r record;
  ph uuid;
  tid uuid;
  owner uuid;
  st text;
BEGIN
  INSERT INTO public.accounts (id, workspace_id, name, is_reference_client)
  VALUES (acc, ws, 'SMAIT Operations Management', false);

  INSERT INTO public.projects (id, workspace_id, account_id, name, status, owner_id)
  VALUES (proj, ws, acc, 'Campaign tracker', 'active', thabo);

  INSERT INTO public.project_phases (id, workspace_id, project_id, name, sort_order, status) VALUES
    (ph_plan, ws, proj, 'Planning', 1, 'not_started'),
    (ph_dev,  ws, proj, 'Developing', 2, 'not_started'),
    (ph_live, ws, proj, 'Live', 3, 'not_started'),
    (ph_hold, ws, proj, 'On hold', 4, 'not_started');

  FOR r IN
    SELECT * FROM (VALUES
      ('SMAIT','Normal','candicentokozoh','Live',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1dpz0XkphxtC7G0GjWWYQ1Pd5y557Rt2i',NULL),
      ('Kenya Foodball Federation','AI','ogthemba','Live','2026-07-05'::date,NULL::date,'https://drive.google.com/drive/folders/1NQiZTVgOlz2VvyPs3QL1b60pS5pt6xRu',NULL),
      ('Kenya Tourism Board','AI','ledimothabo','Developing','2026-07-08'::date,'2026-07-15'::date,'https://drive.google.com/drive/folders/1Mcem0MLpRiqPgcUjwoFgq7xo7HpXCUJz',NULL),
      ('Protel Studio','Normal','ledimothabo','Planning','2026-07-09'::date,'2026-07-15'::date,'https://drive.google.com/drive/folders/1KeRWSRYXToDN3XOI_PEqL_cL38mTxpRB',NULL),
      ('NSAFAS','AI','ledimothabo','Developing','2026-07-01'::date,'2026-07-31'::date,NULL,NULL),
      ('ANC','AI','ledimothabo','Developing',NULL::date,NULL::date,NULL,NULL),
      ('BOSA','AI','ledimothabo','Developing',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1XxgKykcgpo5AsZDN8LYXL6b2FHQj3z4M',NULL),
      ('Heritage','Normal','candicentokozoh','Planning',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1YkE43aYii1K7uIDXP4C0uSoTFSBwve8V',NULL),
      ('Afribiz','Normal','ledimothabo','Live',NULL::date,NULL::date,'https://afribizinvest.com/','Landing page done, Ndumiso working on additions to the site'),
      ('Matlotlo Khumo','Normal','candicentokozoh','On hold',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1BPpYaGud9a5f-RKyKvPxI2yXfCrQhUIp',NULL),
      ('Dr Moyo','Normal','candicentokozoh','Live',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1LnG1Vb_uOymAr7-VSVe8ZkCafwXgQjzV',NULL),
      ('Dr Maphiri','Normal','ledimothabo','On hold',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1Ux8ujyw6QLp0GlNAAEaTAd7le3Fn_-ld',NULL),
      ('Dibuka','Normal','ledimothabo','On hold',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1glVhG4zlfbyDKt688zaibxRMYXuzgeL7',NULL),
      ('Itirele','Normal','ledimothabo','On hold',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1L3ieHRfJZ9XsWvW-6FhnvNJ7p5RRizHV',NULL),
      ('Easy Docs','Normal','candicentokozoh','On hold',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1KokfYooIadXFgk0TVyMolXl8EEBn1jkn','Ndu is also responsible for this account'),
      ('V cam','Normal','ledimothabo','Live',NULL::date,NULL::date,NULL,NULL),
      ('AISMA','Normal','ledimothabo','Live',NULL::date,NULL::date,NULL,NULL),
      ('ETHNO Care','Normal','ledimothabo','Developing',NULL::date,NULL::date,NULL,NULL),
      ('Filament','Normal','ledimothabo','On hold',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1jAv85n8xVbzo5aNSNscJJRgcAhAcUOks','Ndu is also responsible for this account'),
      ('Makweleng','Normal','candicentokozoh','On hold',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1-CwMm_MbQvfz5nglSsfOvBcfCySlbd1F','Ndu is also responsible for this account'),
      ('Chasm Bridge','Normal','candicentokozoh','On hold',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1DMRcD2wlmwQiFTTyDy6t1OtTpua2Ya01','Ndu is also responsible for this account'),
      ('Dr. SS Shivuri','Normal','ledimothabo','Planning',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1_Wq9Vd4kbSDC4Xntx62EvZQq-c9V0Tp3',NULL),
      ('Dr. Rogers','Normal','ledimothabo','Planning',NULL::date,NULL::date,'https://drive.google.com/drive/folders/1eRKrJ1LbOBE4cQH1Bymrn7CxIZ8293ko',NULL)
    ) AS t(campaign, ctype, owner_email, cstatus, start_date, end_date, link, notes)
  LOOP
    ph := CASE r.cstatus
      WHEN 'Planning' THEN ph_plan
      WHEN 'Developing' THEN ph_dev
      WHEN 'Live' THEN ph_live
      ELSE ph_hold END;
    owner := CASE WHEN r.owner_email = 'ledimothabo' THEN thabo ELSE ntokozo END;
    st := CASE WHEN r.cstatus IN ('Developing','Live') THEN 'in_progress' ELSE 'todo' END;
    tid := gen_random_uuid();

    INSERT INTO public.tasks (id, workspace_id, project_id, phase_id, title, description, status, due_date)
    VALUES (
      tid, ws, proj, ph, r.campaign,
      concat_ws(E'\n',
        'Type: ' || r.ctype,
        'Status: ' || r.cstatus,
        CASE WHEN r.start_date IS NOT NULL THEN 'Start date: ' || to_char(r.start_date, 'DD Mon YYYY') END,
        CASE WHEN r.end_date IS NOT NULL THEN 'End date: ' || to_char(r.end_date, 'DD Mon YYYY') END,
        CASE WHEN r.link IS NOT NULL THEN 'Folder: ' || r.link END,
        CASE WHEN r.notes IS NOT NULL THEN 'Notes: ' || r.notes END
      ),
      st, r.end_date
    );

    INSERT INTO public.task_assignees (task_id, user_id, workspace_id)
    VALUES (tid, owner, ws);
  END LOOP;
END $$;
