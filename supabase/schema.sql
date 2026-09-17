-- Adaptilearn Supabase schema
-- Run this once in the Supabase SQL editor for the connected project.

create table if not exists public.users (
  id serial primary key,
  name text not null,
  email text not null unique,
  preferred_style text not null default 'text',
  interest_lens text not null default 'Gaming',
  mastery_score real not null default 0,
  streak_days integer not null default 0,
  minutes_learned integer not null default 0
);

create table if not exists public.concepts (
  id serial primary key,
  title text not null,
  description text not null,
  parent_concept_id integer references public.concepts(id),
  difficulty_level integer not null,
  estimated_minutes integer not null
);

create table if not exists public.student_knowledge_state (
  id serial primary key,
  user_id integer not null references public.users(id) on delete cascade,
  concept_id integer not null references public.concepts(id) on delete cascade,
  competency_level real not null default 0,
  friction_score integer not null default 0,
  last_reviewed_at timestamptz,
  unique (user_id, concept_id)
);

create table if not exists public.learning_logs (
  id serial primary key,
  user_id integer not null references public.users(id) on delete cascade,
  concept_id integer not null references public.concepts(id) on delete cascade,
  time_spent_seconds integer not null default 0,
  quiz_score real not null default 0,
  friction_signals_detected jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.users (
  id, name, email, preferred_style, interest_lens, mastery_score, streak_days, minutes_learned
) values (
  1, 'Alex Morgan', 'alex@adaptilearn.demo', 'visual', 'Gaming', 0.43, 4, 86
)
on conflict (id) do nothing;

insert into public.concepts (
  id, title, description, parent_concept_id, difficulty_level, estimated_minutes
) values
  (1, 'Variables & State', 'Store values and track how they change while a program runs.', null, 1, 8),
  (2, 'Control Flow', 'Choose and repeat actions with conditions and loops.', 1, 1, 10),
  (3, 'Functions', 'Package repeatable behavior behind reusable names.', 2, 2, 10),
  (4, 'Data Structures', 'Organize collections so common operations stay clear and efficient.', 2, 2, 12),
  (5, 'Algorithms', 'Use precise steps to transform an input into a useful result.', 3, 3, 14)
on conflict (id) do nothing;

insert into public.student_knowledge_state (
  id, user_id, concept_id, competency_level, friction_score, last_reviewed_at
) values
  (1, 1, 1, 0.92, 0, now() - interval '2 days'),
  (2, 1, 2, 0.62, 1, now() - interval '1 day'),
  (3, 1, 3, 0.38, 2, now() - interval '4 hours'),
  (4, 1, 4, 0.18, 3, now() - interval '8 hours'),
  (5, 1, 5, 0.05, 0, null)
on conflict (user_id, concept_id) do nothing;

select setval(
  pg_get_serial_sequence('public.users', 'id'),
  greatest((select coalesce(max(id), 1) from public.users), 1),
  true
);
select setval(
  pg_get_serial_sequence('public.concepts', 'id'),
  greatest((select coalesce(max(id), 1) from public.concepts), 1),
  true
);
select setval(
  pg_get_serial_sequence('public.student_knowledge_state', 'id'),
  greatest((select coalesce(max(id), 1) from public.student_knowledge_state), 1),
  true
);
select setval(
  pg_get_serial_sequence('public.learning_logs', 'id'),
  greatest((select coalesce(max(id), 1) from public.learning_logs), 1),
  true
);