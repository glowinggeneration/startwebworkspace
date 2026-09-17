UPDATE public.workspace_members m
SET role = 'cto'::public.workspace_role
FROM public.profiles p
WHERE p.id = m.user_id AND lower(p.email) = 'ndumiso@startweb.co.za';

UPDATE public.workspace_members m
SET role = 'pm'::public.workspace_role
FROM public.profiles p
WHERE p.id = m.user_id AND lower(p.email) = 'ntokozo@startweb.co.za';

UPDATE public.workspace_members m
SET role = 'sales'::public.workspace_role
FROM public.profiles p
WHERE p.id = m.user_id AND lower(p.email) = 'maleka@startweb.co.za';