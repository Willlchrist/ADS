import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Bell, TrendingUp, Plus, Eye, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Subject, Lesson, Announcement } from '@/lib/types';
import { formatDate } from '@/lib/pdf';

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [draftLessons, setDraftLessons] = useState(0);
  const [draftAnnouncements, setDraftAnnouncements] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [subjectsRes, lessonsRes, announcementsRes] = await Promise.all([
          supabase.from('subjects').select('*').order('created_at', { ascending: false }),
          supabase.from('lessons').select('*').order('created_at', { ascending: false }),
          supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        ]);

        if (subjectsRes.data) setSubjects(subjectsRes.data as Subject[]);
        if (lessonsRes.data) {
          setLessons(lessonsRes.data as Lesson[]);
          setDraftLessons(lessonsRes.data.filter((l) => !l.is_published).length);
        }
        if (announcementsRes.data) {
          setAnnouncements(announcementsRes.data as Announcement[]);
          setDraftAnnouncements(announcementsRes.data.filter((a) => !a.is_published).length);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const publishedLessons = lessons.filter((l) => l.is_published).length;
  const publishedAnnouncements = announcements.filter((a) => a.is_published).length;
  const recentLessons = lessons.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
        <p className="text-sm text-slate-500">Visão geral da plataforma.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox icon={BookOpen} label="Disciplinas" value={loading ? null : subjects.length} color="bg-sky-50 text-sky-600" />
        <StatBox icon={FileText} label="Aulas publicadas" value={loading ? null : publishedLessons} sub={loading ? null : `${draftLessons} rascunho`} color="bg-emerald-50 text-emerald-600" />
        <StatBox icon={Bell} label="Avisos publicados" value={loading ? null : publishedAnnouncements} sub={loading ? null : `${draftAnnouncements} rascunho`} color="bg-amber-50 text-amber-600" />
        <StatBox icon={TrendingUp} label="Total de aulas" value={loading ? null : lessons.length} color="bg-slate-100 text-slate-600" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/disciplinas" className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Nova disciplina</p>
            <p className="text-xs text-slate-500">Criar e gerenciar</p>
          </div>
        </Link>
        <Link to="/admin/aulas" className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Nova aula</p>
            <p className="text-xs text-slate-500">Criar e publicar</p>
          </div>
        </Link>
        <Link to="/admin/avisos" className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Novo aviso</p>
            <p className="text-xs text-slate-500">Publicar comunicado</p>
          </div>
        </Link>
      </div>

      {/* Recent Lessons */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Aulas recentes
          </h2>
          <Link to="/admin/aulas" className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Ver todas
          </Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentLessons.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400">Nenhuma aula criada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLessons.map((lesson) => {
              const subject = subjects.find((s) => s.id === lesson.subject_id);
              return (
                <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {lesson.number != null ? `Aula ${lesson.number}: ` : ''}{lesson.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {subject?.name} · {formatDate(lesson.lesson_date)}
                    </p>
                  </div>
                  {lesson.is_published ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold flex-shrink-0">
                      <Eye className="w-3 h-3" />
                      Publicada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold flex-shrink-0">
                      Rascunho
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number | null;
  sub?: string | null;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      {value === null ? (
        <div className="h-7 w-12 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      )}
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
