-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  full_name text,
  career text,
  year_of_entry integer,
  avatar_url text,
  reputation integer DEFAULT 0,
  is_moderator boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  color text,
  post_count integer DEFAULT 0,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid,
  category_id integer,
  tags ARRAY,
  is_anonymous boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  is_solved boolean DEFAULT false,
  view_count integer DEFAULT 0,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  fts tsvector DEFAULT to_tsvector('spanish'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || COALESCE(content, ''::text))),
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id),
  CONSTRAINT posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  parent_reply_id uuid,
  author_id uuid,
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  is_accepted boolean DEFAULT false,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT replies_pkey PRIMARY KEY (id),
  CONSTRAINT replies_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT replies_parent_reply_id_fkey FOREIGN KEY (parent_reply_id) REFERENCES public.replies(id),
  CONSTRAINT replies_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  target_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['post'::text, 'reply'::text])),
  value integer NOT NULL CHECK (value = ANY (ARRAY['-1'::integer, 1])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT votes_pkey PRIMARY KEY (id),
  CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.study_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  file_type text,
  subject text NOT NULL,
  subject_code text,
  career text,
  year integer,
  semester integer CHECK (semester = ANY (ARRAY[1, 2])),
  uploader_id uuid,
  download_count integer DEFAULT 0,
  upvotes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  fts tsvector DEFAULT to_tsvector('spanish'::regconfig, ((((COALESCE(title, ''::text) || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || COALESCE(subject, ''::text))),
  rating_sum integer DEFAULT 0,
  rating_count integer DEFAULT 0,
  CONSTRAINT study_materials_pkey PRIMARY KEY (id),
  CONSTRAINT study_materials_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL CHECK (type = ANY (ARRAY['reply'::text, 'vote'::text, 'accepted'::text, 'mention'::text])),
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid,
  target_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['post'::text, 'reply'::text, 'material'::text])),
  reason text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'dismissed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.flyers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  contact_info text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flyers_pkey PRIMARY KEY (id),
  CONSTRAINT flyers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.news (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT news_pkey PRIMARY KEY (id),
  CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  type text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT calendar_events_pkey PRIMARY KEY (id),
  CONSTRAINT calendar_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.communities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6'::text,
  is_private boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT communities_pkey PRIMARY KEY (id),
  CONSTRAINT communities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.community_members (
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text,
  status text NOT NULL DEFAULT 'approved'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT community_members_pkey PRIMARY KEY (community_id, user_id),
  CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.community_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  author_id uuid,
  title text,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'discussion'::text CHECK (type = ANY (ARRAY['discussion'::text, 'announcement'::text, 'question'::text])),
  is_pinned boolean DEFAULT false,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_posts_pkey PRIMARY KEY (id),
  CONSTRAINT community_posts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.community_post_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  author_id uuid,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_post_replies_pkey PRIMARY KEY (id),
  CONSTRAINT community_post_replies_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT community_post_replies_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.material_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL,
  user_id uuid NOT NULL,
  vote smallint NOT NULL CHECK (vote = ANY (ARRAY['-1'::integer, 1])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT material_votes_pkey PRIMARY KEY (id),
  CONSTRAINT material_votes_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.study_materials(id),
  CONSTRAINT material_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.beta_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT beta_suggestions_pkey PRIMARY KEY (id),
  CONSTRAINT beta_suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.sus_surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  q1 integer NOT NULL CHECK (q1 >= 1 AND q1 <= 5),
  q2 integer NOT NULL CHECK (q2 >= 1 AND q2 <= 5),
  q3 integer NOT NULL CHECK (q3 >= 1 AND q3 <= 5),
  q4 integer NOT NULL CHECK (q4 >= 1 AND q4 <= 5),
  q5 integer NOT NULL CHECK (q5 >= 1 AND q5 <= 5),
  q6 integer NOT NULL CHECK (q6 >= 1 AND q6 <= 5),
  q7 integer NOT NULL CHECK (q7 >= 1 AND q7 <= 5),
  q8 integer NOT NULL CHECK (q8 >= 1 AND q8 <= 5),
  q9 integer NOT NULL CHECK (q9 >= 1 AND q9 <= 5),
  q10 integer NOT NULL CHECK (q10 >= 1 AND q10 <= 5),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sus_surveys_pkey PRIMARY KEY (id),
  CONSTRAINT sus_surveys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);