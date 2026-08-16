import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, BookOpen, FileText, Calendar, User, Hash } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Subject, LessonWithFiles } from '@/lib/types';
import { formatDate } from '@/lib/pdf';
import { LessonCard } from '@/components/LessonCard';

export function SubjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<LessonWithFiles[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setLoading(true);
      setError(false);
      try {
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();

        if (subjectError || !subjectData) {
          setError(true);
          return;
        }
        setSubject(subjectData as Subject);

        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*, lesson_files(*)')
          .eq('subject_id', subjectData.id)
          .eq('is_published', true)
          .order('lesson_date', { ascending: false });

        if (lessonsError) throw lessonsError;
        setLessons(lessonsData as LessonWithFiles[]);

        // Build thumbnail map from lesson_files
        const thumbMap: Record<string, string | null> = {};
        for (const lesson of lessonsData || []) {
          const files = (lesson as LessonWithFiles).lesson_files;
          if (files && files.length > 0) {
            const primary = files.find((f) => f.is_primary) || files[0];
            if (primary?.thumbnail_url) {
              thumbMap[lesson.id] = primary.thumbnail_url;
            }
          }
        }
        setThumbnails(thumbMap);
      } catch (err) {
        console.error('Error loading subject:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="h-8 w-64 bg-slate-100 rounded animate-pulse mb-3" />
        <div className="h-4 w-96 bg-slate-100 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/disciplinas" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Voltar para disciplinas
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Disciplina não encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/disciplinas" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Voltar para disciplinas
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{subject.name}</h1>
          {subject.description && (
            <p className="text-slate-500 max-w-2xl">{subject.description}</p>
          )}
          {subject.professor && (
            <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
              <User className="w-4 h-4" />
              {subject.professor}
            </p>
          )}
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <FileText className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhuma aula publicada nesta disciplina.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-5 text-sm text-slate-500">
            <span className="font-medium">{lessons.length}</span>
            {lessons.length === 1 ? 'aula publicada' : 'aulas publicadas'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={{ ...lesson, subjects: { id: subject.id, name: subject.name, slug: subject.slug } }}
                thumbnail={thumbnails[lesson.id]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
