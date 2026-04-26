create table public.exact_tokens (
  client_name text primary key,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  division integer,
  created_at timestamptz default now()
);

alter table public.exact_tokens disable row level security;
