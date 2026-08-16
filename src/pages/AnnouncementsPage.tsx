import { useEffect, useState } from 'react';
import { Calendar, Bell, Info, Pin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/lib/types';
import { formatDate } from '@/lib/pdf';

export function AnnouncementsPage() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_published', true)
          .order('is_important', { ascending: false })
          .order('announcement_date', { ascending: false });

        if (error) throw error;
        setAnnouncements(data as Announcement[]);
      } catch (err) {
        console.error('Error loading announcements:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Avisos</h1>
          <p className="text-sm text-slate-500">Comunicados e informações importantes da turma.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="h-5 w-3/4 bg-slate-100 rounded mb-3" />
              <div className="h-4 w-full bg-slate-100 rounded mb-2" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Bell className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum aviso publicado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`bg-white rounded-2xl border p-6 ${
                a.is_important
                  ? 'border-amber-300 ring-1 ring-amber-100'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                {a.is_important && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-semibold flex-shrink-0">
                    <Info className="w-3.5 h-3.5" />
                    Importante
                  </div>
                )}
                <h2 className="font-bold text-slate-900 text-lg leading-snug flex-1">{a.title}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-4">{a.content}</p>
              <div className="flex items-center gap-1.5 text-sm text-slate-400 pt-3 border-t border-slate-100">
                <Calendar className="w-4 h-4" />
                {formatDate(a.announcement_date)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
