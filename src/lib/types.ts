export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  professor: string | null;
  display_order: number;
  course: string;
  class_group: string;
  semester: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  subject_id: string;
  number: number | null;
  title: string;
  professor: string | null;
  description: string | null;
  lesson_date: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonFile {
  id: string;
  lesson_id: string;
  name: string;
  storage_path: string;
  file_size: number | null;
  is_primary: boolean;
  thumbnail_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_date: string;
  is_important: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  user_id: string;
  role: string;
  created_at: string;
}

export interface LessonWithSubject extends Lesson {
  subjects: Pick<Subject, 'id' | 'name' | 'slug'>;
}

export interface LessonWithFiles extends Lesson {
  lesson_files: LessonFile[];
}

export interface SubjectWithCount extends Subject {
  lessons: { count: number }[];
}
