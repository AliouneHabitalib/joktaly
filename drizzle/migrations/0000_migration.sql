ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_choisi boolean NOT NULL DEFAULT false;
UPDATE public.profiles SET plan_choisi = true;