alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists job_title text;

update public.profiles set full_name = 'Thabo Ledimo', job_title = 'Chief Executive Officer',
  avatar_url = '/__l5e/assets-v1/5f958c81-e7f4-43eb-80a6-7efffc017958/thabo_ledimo.jpeg',
  profile_completed = true
where email = 'thabo@startweb.co.za';

update public.profiles set full_name = 'Dodi Maleka', job_title = 'Head of Business Development',
  avatar_url = '/__l5e/assets-v1/7f4b8062-f0d3-42ae-8201-bd35f22076d8/dodi_maleka.png',
  profile_completed = true
where email = 'maleka@startweb.co.za';

update public.profiles set full_name = 'Ntokozo Hlatshwayo', job_title = 'Head of Operations and Delivery',
  avatar_url = '/__l5e/assets-v1/5a900a2a-96d5-498b-8b9a-545806a8c5ec/ntokozo_hlatshwayo.png',
  profile_completed = true
where email = 'ntokozo@startweb.co.za';

update public.profiles set full_name = 'Ndumiso Yedwa', job_title = 'Chief Technology Officer',
  avatar_url = '/__l5e/assets-v1/5c78f6cd-4c9b-4a6a-a33e-2c35b67187f5/ndumiso_yedwa.png',
  profile_completed = true
where email = 'ndumiso@startweb.co.za';