import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, FileText, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SubjectWithCount, Lesson } from '@/lib/types';
import { formatDate } from '@/lib/pdf';

export function DisciplinesPage() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectWithCount[]>([]);
  const [lastLessons, setLastLessons] = useState<Record<string, Lesson | null>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*, lessons!inner(count)')
          .eq('is_published', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setSubjects(data as SubjectWithCount[]);

        // Get last lesson date for each subject
        if (data && data.length > 0) {
          const lastLessonMap: Record<string, Lesson | null> = {};
          await Promise.all(
            data.map(async (s) => {
              const { data: lastLesson } = await supabase
                .from('lessons')
                .select('*')
                .eq('subject_id', s.id)
                .eq('is_published', true)
                .order('lesson_date', { ascending: false })
                .limit(1)
                .maybeSingle();
              lastLessonMap[s.id] = lastLesson as Lesson | null;
            })
          );
          setLastLessons(lastLessonMap);
        }
      } catch (err) {
        console.error('Error loading subjects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="h-8 w-48 bg-slate-100 rounded animate-pulse mb-3" />
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-xl mb-4" />
              <div className="h-5 w-32 bg-slate-100 rounded mb-2" />
              <div className="h-4 w-20 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Disciplinas</h1>
        <p className="text-slate-500">Escolha uma disciplina para ver as aulas e materiais disponíveis.</p>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhuma disciplina cadastrada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subject) => {
            const lessonCount = subject.lessons[0]?.count || 0;
            const lastLesson = lastLessons[subject.id];
            return (
              <Link
                key={subject.id}
                to={`/disciplinas/${subject.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>

                <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-slate-700">
                  {subject.name}
                </h3>

                {subject.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                    {subject.description}
                  </p>
                )}

                {subject.professor && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
                    <User className="w-4 h-4" />
                    {subject.professor}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <FileText className="w-4 h-4" />
                    {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}
                  </span>
                  {lastLesson?.lesson_date && (
                    <span className="flex items-center gap-1.5 text-sm text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(lastLesson.lesson_date)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
