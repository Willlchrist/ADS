import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Bell, Calendar, FileText, User, TrendingUp, Sparkles, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LessonWithSubject, Announcement, SubjectWithCount } from '@/lib/types';
import { formatDate } from '@/lib/pdf';
import { LessonCard } from '@/components/LessonCard';

export function HomePage() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectWithCount[]>([]);
  const [recentLessons, setRecentLessons] = useState<LessonWithSubject[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [subjectsRes, lessonsRes, announcementsRes] = await Promise.all([
          supabase
            .from('subjects')
            .select('*, lessons!inner(count)')
            .eq('is_published', true)
            .order('display_order', { ascending: true }),
          supabase
            .from('lessons')
            .select('*, subjects!inner(id, name, slug)')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(6),
          supabase
            .from('announcements')
            .select('*')
            .eq('is_published', true)
            .order('is_important', { ascending: false })
            .order('announcement_date', { ascending: false })
            .limit(3),
        ]);

        if (subjectsRes.data) setSubjects(subjectsRes.data as SubjectWithCount[]);
        if (lessonsRes.data) {
          setRecentLessons(lessonsRes.data as LessonWithSubject[]);
          // Load thumbnails for recent lessons
          const lessonIds = lessonsRes.data.map((l) => l.id);
          if (lessonIds.length > 0) {
            const { data: files } = await supabase
              .from('lesson_files')
              .select('lesson_id, thumbnail_url, is_primary')
              .in('lesson_id', lessonIds)
              .order('is_primary', { ascending: false });
            if (files) {
              const thumbMap: Record<string, string | null> = {};
              for (const f of files) {
                if (f.thumbnail_url && !thumbMap[f.lesson_id]) {
                  thumbMap[f.lesson_id] = f.thumbnail_url;
                }
              }
              setThumbnails(thumbMap);
            }
          }
        }
        if (announcementsRes.data) setAnnouncements(announcementsRes.data as Announcement[]);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const subjectCount = subjects.length;
  const lessonCount = subjects.reduce((sum, s) => sum + (s.lessons[0]?.count || 0), 0);
  const announcementCount = announcements.length;

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium text-white/90">ADS — Turma B · 2º semestre</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Hub para postar os slides e outras coisas das aulas
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
              Um espaço da nossa turma para compartilhar e organizar slides, exercícios e outros materiais das aulas. Tudo separado por disciplina e por data, para facilitar o acesso e encontrar conteúdos antigos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/disciplinas"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-colors group"
              >
                Acessar disciplinas
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/avisos"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 text-white font-semibold text-sm hover:bg-white/15 transition-colors"
              >
                <Bell className="w-4 h-4" />
                Ver avisos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={BookOpen}
            label="Disciplinas cadastradas"
            value={loading ? null : subjectCount}
            emptyText="Ainda não há disciplinas cadastradas."
            color="text-sky-600 bg-sky-50"
          />
          <StatCard
            icon={FileText}
            label="Últimas aulas"
            value={loading ? null : lessonCount}
            emptyText="Nenhuma aula publicada ainda."
            color="text-emerald-600 bg-emerald-50"
          />
          <StatCard
            icon={Bell}
            label="Avisos"
            value={loading ? null : announcementCount}
            emptyText="Nenhum aviso publicado."
            color="text-amber-600 bg-amber-50"
          />
        </div>
      </section>

      {/* Recent Lessons + Announcements */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Lessons */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-slate-400" />
                Últimas aulas adicionadas
              </h2>
              <Link to="/disciplinas" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-slate-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 w-20 bg-slate-100 rounded" />
                      <div className="h-4 w-full bg-slate-100 rounded" />
                      <div className="h-3 w-32 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLessons.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Nenhuma aula publicada ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    thumbnail={thumbnails[lesson.id]}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          {/* Announcements Sidebar */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-slate-400" />
                Avisos
              </h2>
              <Link to="/avisos" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
                    <div className="h-4 w-3/4 bg-slate-100 rounded mb-2" />
                    <div className="h-3 w-full bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Nenhum aviso publicado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className={`bg-white rounded-2xl border p-4 ${
                      a.is_important
                        ? 'border-amber-300 ring-1 ring-amber-100'
                        : 'border-slate-200'
                    }`}
                  >
                    {a.is_important && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-semibold mb-2">
                        <Info className="w-3 h-3" />
                        Importante
                      </div>
                    )}
                    <h3 className="font-semibold text-slate-900 text-sm mb-1.5 line-clamp-1">{a.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">{a.content}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(a.announcement_date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Future Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-700">Em breve</h2>
          </div>
          <p className="text-slate-500 text-sm max-w-2xl">
            Estamos preparando novas funcionalidades para a plataforma, como busca avançada, favoritos e mais. Fique de olho nos avisos para novidades.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  emptyText,
  color,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number | null;
  emptyText: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          {value === null ? (
            <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
          ) : value > 0 ? (
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">{emptyText}</p>
          )}
        </div>
      </div>
    </div>
  );
}
