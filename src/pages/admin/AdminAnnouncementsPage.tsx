import { useEffect, useState } from 'react';
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Loader2,
  Info,
  Pin,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/lib/types';
import { formatDate } from '@/lib/pdf';
import { useToast } from '@/lib/toast';

export function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    announcement_date: new Date().toISOString().split('T')[0],
    is_important: false,
    is_published: false,
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_important', { ascending: false })
        .order('announcement_date', { ascending: false });
      if (error) throw error;
      setAnnouncements(data as Announcement[]);
    } catch (err) {
      console.error('Error loading announcements:', err);
      toast('Erro ao carregar avisos.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({
      title: '',
      content: '',
      announcement_date: new Date().toISOString().split('T')[0],
      is_important: false,
      is_published: false,
    });
    setShowModal(true);
  }

  function openEdit(announcement: Announcement) {
    setEditing(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      announcement_date: announcement.announcement_date,
      is_important: announcement.is_important,
      is_published: announcement.is_published,
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('Título é obrigatório.', 'error');
      return;
    }
    if (!form.content.trim()) {
      toast('Conteúdo é obrigatório.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        announcement_date: form.announcement_date,
        is_important: form.is_important,
        is_published: form.is_published,
      };
      if (editing) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast('Aviso atualizado com sucesso!', 'success');
      } else {
        const { error } = await supabase.from('announcements').insert(payload);
        if (error) throw error;
        toast('Aviso criado com sucesso!', 'success');
      }
      setShowModal(false);
      await loadAnnouncements();
    } catch (err) {
      console.error('Error saving announcement:', err);
      toast('Erro ao salvar aviso.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(announcement: Announcement) {
    if (!confirm('Excluir este aviso?')) return;
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', announcement.id);
      if (error) throw error;
      toast('Aviso excluído.', 'success');
      await loadAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      toast('Erro ao excluir aviso.', 'error');
    }
  }

  async function togglePublish(announcement: Announcement) {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_published: !announcement.is_published })
        .eq('id', announcement.id);
      if (error) throw error;
      toast(announcement.is_published ? 'Aviso despublicado.' : 'Aviso publicado!', 'success');
      await loadAnnouncements();
    } catch (err) {
      console.error('Error toggling publish:', err);
      toast('Erro ao alterar publicação.', 'error');
    }
  }

  async function toggleImportant(announcement: Announcement) {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_important: !announcement.is_important })
        .eq('id', announcement.id);
      if (error) throw error;
      await loadAnnouncements();
    } catch (err) {
      console.error('Error toggling important:', err);
      toast('Erro ao marcar como importante.', 'error');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Avisos</h1>
          <p className="text-sm text-slate-500">Gerencie os avisos da plataforma.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo aviso
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Bell className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Nenhum aviso criado ainda.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro aviso
          </button>
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
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  a.is_important ? 'bg-amber-100' : 'bg-slate-100'
                }`}>
                  <Bell className={`w-5 h-5 ${a.is_important ? 'text-amber-600' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-900 text-sm">{a.title}</h3>
                    {a.is_important && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-semibold">
                        <Info className="w-2.5 h-2.5" />
                        Importante
                      </span>
                    )}
                    {a.is_published ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                        Publicado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold">
                        Rascunho
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{formatDate(a.announcement_date)}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{a.content}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleImportant(a)}
                    className={`p-2 rounded-lg transition-colors ${
                      a.is_important
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-slate-400 hover:bg-slate-100'
                    }`}
                    title={a.is_important ? 'Remover importante' : 'Marcar como importante'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => togglePublish(a)}
                    className={`p-2 rounded-lg transition-colors ${
                      a.is_published
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-400 hover:bg-slate-100'
                    }`}
                    title={a.is_published ? 'Despublicar' : 'Publicar'}
                  >
                    {a.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-bold text-slate-900">{editing ? 'Editar aviso' : 'Novo aviso'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="Aula cancelada"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Conteúdo *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  rows={5}
                  placeholder="A aula do dia 15/08 foi cancelada..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Data</label>
                <input
                  type="date"
                  value={form.announcement_date}
                  onChange={(e) => setForm({ ...form, announcement_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_important: !form.is_important })}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    form.is_important
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-50 text-slate-500 border border-slate-200'
                  }`}
                >
                  {form.is_important ? 'Importante' : 'Normal'}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_published: !form.is_published })}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    form.is_published
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-50 text-slate-500 border border-slate-200'
                  }`}
                >
                  {form.is_published ? 'Publicado' : 'Rascunho'}
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
