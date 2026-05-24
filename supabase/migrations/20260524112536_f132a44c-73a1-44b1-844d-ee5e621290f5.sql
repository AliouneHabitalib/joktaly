-- 1. Add 'gratuit' to plan_type enum
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'gratuit' BEFORE 'starter';
