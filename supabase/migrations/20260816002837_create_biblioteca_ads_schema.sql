/*
# Biblioteca ADS — Database Schema

## Overview
Creates the complete database structure for the "Biblioteca ADS — Turma B" platform,
a class library for sharing course materials (slides, PDFs, exercises).

## New Tables
1. `user_roles` — Maps auth users to roles (admin)
2. `subjects` — Disciplines/subjects (e.g., Banco de Dados, Programação)
3. `lessons` — Individual lessons within a subject
4. `lesson_files` — Files attached to a lesson (stored in Supabase Storage)
5. `announcements` — Public announcements/notices

## Security (RLS)
- Public (anon) can READ published subjects, lessons, lesson_files, and announcements
- Only authenticated users with role 'admin' can WRITE (insert/update/delete)
- An `is_admin()` SECURITY DEFINER function checks user_roles for authorization
*/

-- ============================================================
-- TABLE: user_roles (must exist before is_admin function)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- user_roles policies
DROP POLICY IF EXISTS "users_read_own_roles" ON public.user_roles;
CREATE POLICY "users_read_own_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_read_all_roles" ON public.user_roles;
CREATE POLICY "admin_read_all_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_roles" ON public.user_roles;
CREATE POLICY "admin_insert_roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_roles" ON public.user_roles;
CREATE POLICY "admin_update_roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_roles" ON public.user_roles;
CREATE POLICY "admin_delete_roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- TABLE: subjects (disciplines)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  display_order int NOT NULL DEFAULT 0,
  course text NOT NULL DEFAULT 'ADS',
  class_group text NOT NULL DEFAULT 'B',
  semester text NOT NULL DEFAULT '2',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subjects_slug ON public.subjects(slug);
CREATE INDEX IF NOT EXISTS idx_subjects_display_order ON public.subjects(display_order);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_subjects" ON public.subjects;
CREATE POLICY "public_read_published_subjects" ON public.subjects
  FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "admin_read_all_subjects" ON public.subjects;
CREATE POLICY "admin_read_all_subjects" ON public.subjects
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_subjects" ON public.subjects;
CREATE POLICY "admin_insert_subjects" ON public.subjects
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_subjects" ON public.subjects;
CREATE POLICY "admin_update_subjects" ON public.subjects
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_subjects" ON public.subjects;
CREATE POLICY "admin_delete_subjects" ON public.subjects
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- TABLE: lessons
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  number int,
  title text NOT NULL,
  professor text,
  description text,
  lesson_date date,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON public.lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_date ON public.lessons(lesson_date DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON public.lessons(created_at DESC);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_lessons" ON public.lessons;
CREATE POLICY "public_read_published_lessons" ON public.lessons
  FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "admin_read_all_lessons" ON public.lessons;
CREATE POLICY "admin_read_all_lessons" ON public.lessons
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_lessons" ON public.lessons;
CREATE POLICY "admin_insert_lessons" ON public.lessons
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_lessons" ON public.lessons;
CREATE POLICY "admin_update_lessons" ON public.lessons
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_lessons" ON public.lessons;
CREATE POLICY "admin_delete_lessons" ON public.lessons
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- TABLE: lesson_files
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lesson_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  file_size bigint,
  is_primary boolean NOT NULL DEFAULT false,
  thumbnail_url text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_files_lesson_id ON public.lesson_files(lesson_id);

ALTER TABLE public.lesson_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_lesson_files" ON public.lesson_files;
CREATE POLICY "public_read_lesson_files" ON public.lesson_files
  FOR SELECT TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_files.lesson_id
      AND lessons.is_published = true
    )
  );

DROP POLICY IF EXISTS "admin_read_all_lesson_files" ON public.lesson_files;
CREATE POLICY "admin_read_all_lesson_files" ON public.lesson_files
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_lesson_files" ON public.lesson_files;
CREATE POLICY "admin_insert_lesson_files" ON public.lesson_files
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_lesson_files" ON public.lesson_files;
CREATE POLICY "admin_update_lesson_files" ON public.lesson_files
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_lesson_files" ON public.lesson_files;
CREATE POLICY "admin_delete_lesson_files" ON public.lesson_files
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- TABLE: announcements
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  announcement_date date NOT NULL DEFAULT CURRENT_DATE,
  is_important boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_date ON public.announcements(announcement_date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_announcements" ON public.announcements;
CREATE POLICY "public_read_published_announcements" ON public.announcements
  FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "admin_read_all_announcements" ON public.announcements;
CREATE POLICY "admin_read_all_announcements" ON public.announcements
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_announcements" ON public.announcements;
CREATE POLICY "admin_insert_announcements" ON public.announcements
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_announcements" ON public.announcements;
CREATE POLICY "admin_update_announcements" ON public.announcements
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_announcements" ON public.announcements;
CREATE POLICY "admin_delete_announcements" ON public.announcements
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- UPDATED_AT trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subjects_updated_at ON public.subjects;
CREATE TRIGGER subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS lessons_updated_at ON public.lessons;
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS lesson_files_updated_at ON public.lesson_files;
CREATE TRIGGER lesson_files_updated_at BEFORE UPDATE ON public.lesson_files
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS announcements_updated_at ON public.announcements;
CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
