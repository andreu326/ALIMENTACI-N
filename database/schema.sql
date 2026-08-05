create extension if not exists "pgcrypto";

create type public.base_unit as enum ('g', 'kg', 'ml', 'l', 'unit');
create type public.meal_slot as enum ('breakfast', 'lunch', 'dinner', 'snack_1', 'snack_2');
create type public.plan_status as enum ('draft', 'active', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'es-CL',
  currency text not null default 'CLP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calories numeric(8,2) not null check (calories > 0),
  protein_g numeric(8,2) not null check (protein_g >= 0),
  carbs_g numeric(8,2) not null check (carbs_g >= 0),
  fat_g numeric(8,2) not null check (fat_g >= 0),
  meals_per_day smallint not null default 5 check (meals_per_day between 1 and 8),
  days_per_week smallint not null default 7 check (days_per_week between 1 and 7),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  base_unit public.base_unit not null,
  nutrition_basis numeric(10,3) not null default 100 check (nutrition_basis > 0),
  calories numeric(10,3) not null default 0,
  protein_g numeric(10,3) not null default 0,
  carbs_g numeric(10,3) not null default 0,
  fat_g numeric(10,3) not null default 0,
  brand text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, brand)
);

create table public.purchase_formats (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  label text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit public.base_unit not null,
  price numeric(12,2) not null check (price >= 0),
  is_preferred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  servings numeric(8,2) not null default 1 check (servings > 0),
  prep_minutes smallint check (prep_minutes >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id),
  quantity numeric(12,3) not null check (quantity > 0),
  unit public.base_unit not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipe_id, ingredient_id)
);

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  status public.plan_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table public.planned_meals (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id),
  meal_date date not null,
  slot public.meal_slot not null,
  servings numeric(8,2) not null default 1 check (servings > 0),
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shopping_overrides (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id),
  quantity_purchased numeric(12,3),
  checked boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (weekly_plan_id, ingredient_id)
);

create index planned_meals_plan_date_idx on public.planned_meals(weekly_plan_id, meal_date);
create index recipe_ingredients_recipe_idx on public.recipe_ingredients(recipe_id);
create index purchase_formats_ingredient_idx on public.purchase_formats(ingredient_id);

alter table public.profiles enable row level security;
alter table public.nutrition_targets enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.weekly_plans enable row level security;

create policy "profiles_owner" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "targets_owner" on public.nutrition_targets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ingredients_owner" on public.ingredients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipes_owner" on public.recipes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "plans_owner" on public.weekly_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
