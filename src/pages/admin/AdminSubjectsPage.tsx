import { useEffect, useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, X, GripVertical, Eye, EyeOff, Loader2, User, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Subject, SubjectWithCount } from '@/lib/types';
import { slugify, formatDate } from '@/lib/pdf';
import { useToast } from '@/lib/toast';

export function AdminSubjectsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectWithCount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: '',
    professor: '',
    display_order: 0,
    is_published: true,
  });
  const [lastLessonDates, setLastLessonDates] = useState<Record<string, string | null>>({});

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*, lessons(count)')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setSubjects(data as SubjectWithCount[]);
      // Load last lesson date for each subject
      if (data && data.length > 0) {
        const dateMap: Record<string, string | null> = {};
        await Promise.all(
          data.map(async (s) => {
            const { data: lastLesson } = await supabase
              .from('lessons')
              .select('lesson_date')
              .eq('subject_id', s.id)
              .order('lesson_date', { ascending: false })
              .limit(1)
              .maybeSingle();
            dateMap[s.id] = lastLesson?.lesson_date || null;
          })
        );
        setLastLessonDates(dateMap);
      }
    } catch (err) {
      console.error('Error loading subjects:', err);
      toast('Erro ao carregar disciplinas.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', icon: '', professor: '', display_order: subjects.length, is_published: true });
    setShowModal(true);
  }

  function openEdit(subject: Subject) {
    setEditing(subject);
    setForm({
      name: subject.name,
      description: subject.description || '',
      icon: subject.icon || '',
      professor: subject.professor || '',
      display_order: subject.display_order,
      is_published: subject.is_published,
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Nome da disciplina é obrigatório.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from('subjects')
          .update({
            name: form.name,
            description: form.description || null,
            icon: form.icon || null,
            professor: form.professor || null,
            display_order: form.display_order,
            is_published: form.is_published,
          })
          .eq('id', editing.id);
        if (error) throw error;
        toast('Disciplina atualizada com sucesso!', 'success');
      } else {
        const slug = slugify(form.name);
        const { error } = await supabase.from('subjects').insert({
          name: form.name,
          slug,
          description: form.description || null,
          icon: form.icon || null,
          professor: form.professor || null,
          display_order: form.display_order,
          is_published: form.is_published,
        });
        if (error) throw error;
        toast('Disciplina criada com sucesso!', 'success');
      }
      setShowModal(false);
      await loadSubjects();
    } catch (err) {
      console.error('Error saving subject:', err);
      toast('Erro ao salvar disciplina.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(subject: Subject) {
    if (!confirm(`Excluir "${subject.name}"? Todas as aulas e arquivos desta disciplina serão removidos.`)) return;
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
      if (error) throw error;
      toast('Disciplina excluída.', 'success');
      await loadSubjects();
    } catch (err) {
      console.error('Error deleting subject:', err);
      toast('Erro ao excluir disciplina.', 'error');
    }
  }

  async function togglePublish(subject: Subject) {
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ is_published: !subject.is_published })
        .eq('id', subject.id);
      if (error) throw error;
      toast(subject.is_published ? 'Disciplina despublicada.' : 'Disciplina publicada!', 'success');
      await loadSubjects();
    } catch (err) {
      console.error('Error toggling publish:', err);
      toast('Erro ao alterar publicação.', 'error');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Disciplinas</h1>
          <p className="text-sm text-slate-500">Gerencie as disciplinas da plataforma.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova disciplina
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Nenhuma disciplina cadastrada ainda.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            Criar primeira disciplina
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {subjects.map((subject) => {
              const lessonCount = subject.lessons[0]?.count || 0;
              return (
                <div key={subject.id} className="flex items-center gap-3 px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors">
                  <GripVertical className="w-5 h-5 text-slate-300 flex-shrink-0 hidden sm:block" />
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{subject.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                      <span>{lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}</span>
                      {subject.professor && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {subject.professor}
                        </span>
                      )}
                      {lastLessonDates[subject.id] && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(lastLessonDates[subject.id]!)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => togglePublish(subject)}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      subject.is_published
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-400 hover:bg-slate-100'
                    }`}
                    title={subject.is_published ? 'Despublicar' : 'Publicar'}
                  >
                    {subject.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(subject)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(subject)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">{editing ? 'Editar disciplina' : 'Nova disciplina'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Banco de Dados"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Disciplina de banco de dados do segundo semestre."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Professor</label>
                <input
                  type="text"
                  value={form.professor}
                  onChange={(e) => setForm({ ...form, professor: e.target.value })}
                  placeholder="Prof. João Silva"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Ordem de exibição</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_published: !form.is_published })}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      form.is_published
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {form.is_published ? 'Publicado' : 'Rascunho'}
                  </button>
                </div>
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
