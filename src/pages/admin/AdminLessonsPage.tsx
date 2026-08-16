import { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Loader2,
  Upload,
  Download,
  Star,
  FileUp,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Subject, Lesson, LessonFile } from '@/lib/types';
import { formatDate, formatFileSize, slugify, generateThumbnail } from '@/lib/pdf';
import { useToast } from '@/lib/toast';

export function AdminLessonsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [showFiles, setShowFiles] = useState<Lesson | null>(null);
  const [form, setForm] = useState({
    subject_id: '',
    number: '',
    title: '',
    professor: '',
    description: '',
    lesson_date: '',
    is_published: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [subjectsRes, lessonsRes] = await Promise.all([
        supabase.from('subjects').select('*').order('display_order', { ascending: true }),
        supabase.from('lessons').select('*').order('created_at', { ascending: false }),
      ]);
      if (subjectsRes.data) setSubjects(subjectsRes.data as Subject[]);
      if (lessonsRes.data) setLessons(lessonsRes.data as Lesson[]);
    } catch (err) {
      console.error('Error loading data:', err);
      toast('Erro ao carregar dados.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({
      subject_id: subjects[0]?.id || '',
      number: '',
      title: '',
      professor: '',
      description: '',
      lesson_date: new Date().toISOString().split('T')[0],
      is_published: false,
    });
    setShowModal(true);
  }

  function openEdit(lesson: Lesson) {
    setEditing(lesson);
    setForm({
      subject_id: lesson.subject_id,
      number: lesson.number?.toString() || '',
      title: lesson.title,
      professor: lesson.professor || '',
      description: lesson.description || '',
      lesson_date: lesson.lesson_date || '',
      is_published: lesson.is_published,
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject_id) {
      toast('Selecione uma disciplina.', 'error');
      return;
    }
    if (!form.title.trim()) {
      toast('Título da aula é obrigatório.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        subject_id: form.subject_id,
        number: form.number ? parseInt(form.number) : null,
        title: form.title,
        professor: form.professor || null,
        description: form.description || null,
        lesson_date: form.lesson_date || null,
        is_published: form.is_published,
      };
      if (editing) {
        const { error } = await supabase.from('lessons').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast('Aula atualizada com sucesso!', 'success');
      } else {
        const { error } = await supabase.from('lessons').insert(payload);
        if (error) throw error;
        toast('Aula criada com sucesso!', 'success');
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error('Error saving lesson:', err);
      toast('Erro ao salvar aula.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lesson: Lesson) {
    if (!confirm('Excluir esta aula? Todos os arquivos serão removidos.')) return;
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', lesson.id);
      if (error) throw error;
      toast('Aula excluída.', 'success');
      await loadData();
    } catch (err) {
      console.error('Error deleting lesson:', err);
      toast('Erro ao excluir aula.', 'error');
    }
  }

  async function togglePublish(lesson: Lesson) {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ is_published: !lesson.is_published })
        .eq('id', lesson.id);
      if (error) throw error;
      toast(lesson.is_published ? 'Aula despublicada.' : 'Aula publicada!', 'success');
      await loadData();
    } catch (err) {
      console.error('Error toggling publish:', err);
      toast('Erro ao alterar publicação.', 'error');
    }
  }

  const filteredLessons = selectedSubject === 'all'
    ? lessons
    : lessons.filter((l) => l.subject_id === selectedSubject);

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name || '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Aulas</h1>
          <p className="text-sm text-slate-500">Gerencie as aulas e seus arquivos.</p>
        </div>
        <button
          onClick={openCreate}
          disabled={subjects.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova aula
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <FileText className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-2">Você precisa criar uma disciplina primeiro.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Subject filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedSubject === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todas
            </button>
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSubject === s.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {filteredLessons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <FileText className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhuma aula criada ainda.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-3 px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {lesson.number != null ? `Aula ${lesson.number}: ` : ''}{lesson.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {subjectName(lesson.subject_id)} · {formatDate(lesson.lesson_date)}
                        {lesson.professor ? ` · ${lesson.professor}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowFiles(lesson)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0"
                      title="Gerenciar arquivos"
                    >
                      <FileUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => togglePublish(lesson)}
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                        lesson.is_published
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={lesson.is_published ? 'Despublicar' : 'Publicar'}
                    >
                      {lesson.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(lesson)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(lesson)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Lesson Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-bold text-slate-900">{editing ? 'Editar aula' : 'Nova aula'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Disciplina *</label>
                <select
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Número da aula</label>
                  <input
                    type="number"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="1"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Data</label>
                  <input
                    type="date"
                    value={form.lesson_date}
                    onChange={(e) => setForm({ ...form, lesson_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="Introdução a banco de dados"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
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

      {/* Files Manager Modal */}
      {showFiles && (
        <FilesManager lesson={showFiles} subjectSlug={slugify(subjectName(showFiles.subject_id))} onClose={() => { setShowFiles(null); loadData(); }} />
      )}
    </div>
  );
}

// ============================================================
// FILES MANAGER COMPONENT
// ============================================================
function FilesManager({ lesson, subjectSlug, onClose }: { lesson: Lesson; subjectSlug: string; onClose: () => void }) {
  const { toast } = useToast();
  const [files, setFiles] = useState<LessonFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [lesson.id]);

  async function loadFiles() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_files')
        .select('*')
        .eq('lesson_id', lesson.id)
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true });
      if (error) throw error;
      setFiles(data as LessonFile[]);
    } catch (err) {
      console.error('Error loading files:', err);
      toast('Erro ao carregar arquivos.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const subject = await supabase.from('subjects').select('slug').eq('id', lesson.subject_id).maybeSingle();
      const subjSlug = subject.data?.slug || subjectSlug;
      const lessonFolder = `disciplinas/${subjSlug}/aula-${lesson.number || lesson.id}`;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${i}-${file.name}`;
        const filePath = `${lessonFolder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('lesson-files')
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const publicUrl = supabase.storage.from('lesson-files').getPublicUrl(filePath).data.publicUrl;

        // Generate thumbnail
        let thumbnailUrl: string | null = null;
        if (fileExt?.toLowerCase() === 'pdf') {
          thumbnailUrl = await generateThumbnail(publicUrl);
        }

        const isFirst = files.length === 0 && i === 0;
        const { error: dbError } = await supabase.from('lesson_files').insert({
          lesson_id: lesson.id,
          name: file.name,
          storage_path: filePath,
          file_size: file.size,
          is_primary: isFirst,
          thumbnail_url: thumbnailUrl,
          display_order: files.length + i,
        });
        if (dbError) throw dbError;
      }

      toast(`${selectedFiles.length} arquivo(s) enviado(s) com sucesso!`, 'success');
      await loadFiles();
    } catch (err) {
      console.error('Error uploading files:', err);
      toast('Erro no upload do arquivo.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemove(file: LessonFile) {
    if (!confirm(`Remover "${file.name}"?`)) return;
    try {
      const { error: storageError } = await supabase.storage
        .from('lesson-files')
        .remove([file.storage_path]);
      if (storageError) console.warn('Storage remove error:', storageError);

      const { error: dbError } = await supabase.from('lesson_files').delete().eq('id', file.id);
      if (dbError) throw dbError;

      toast('Arquivo removido.', 'success');
      await loadFiles();
    } catch (err) {
      console.error('Error removing file:', err);
      toast('Erro ao remover arquivo.', 'error');
    }
  }

  async function handleSetPrimary(file: LessonFile) {
    try {
      await supabase.from('lesson_files').update({ is_primary: false }).eq('lesson_id', lesson.id);
      const { error } = await supabase.from('lesson_files').update({ is_primary: true }).eq('id', file.id);
      if (error) throw error;
      toast('Arquivo principal definido.', 'success');
      await loadFiles();
    } catch (err) {
      console.error('Error setting primary:', err);
      toast('Erro ao definir arquivo principal.', 'error');
    }
  }

  async function handleRename(file: LessonFile) {
    if (!renameValue.trim()) return;
    try {
      const { error } = await supabase.from('lesson_files').update({ name: renameValue }).eq('id', file.id);
      if (error) throw error;
      toast('Nome atualizado.', 'success');
      setRenamingId(null);
      await loadFiles();
    } catch (err) {
      console.error('Error renaming:', err);
      toast('Erro ao renomear arquivo.', 'error');
    }
  }

  function getFileUrl(path: string) {
    return supabase.storage.from('lesson-files').getPublicUrl(path).data.publicUrl;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div>
            <h2 className="font-bold text-slate-900">Arquivos da aula</h2>
            <p className="text-xs text-slate-400 mt-0.5">{lesson.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors mb-6"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                <p className="text-sm text-slate-500">Enviando arquivos...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">Clique para enviar arquivos</p>
                <p className="text-xs text-slate-400">PDF, DOC, PPT e outros formatos</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              onChange={handleUpload}
              className="hidden"
            />
          </div>

          {/* Files List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhum arquivo disponível.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  {file.thumbnail_url ? (
                    <img src={file.thumbnail_url} alt={file.name} className="w-10 h-12 object-cover rounded-md flex-shrink-0 border border-slate-200" />
                  ) : (
                    <div className="w-10 h-12 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {renamingId === file.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(file)}
                          className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                          autoFocus
                        />
                        <button onClick={() => handleRename(file)} className="px-2 py-1 text-xs bg-slate-900 text-white rounded-lg">OK</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                          {file.is_primary && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-semibold flex-shrink-0">
                              <Star className="w-2.5 h-2.5" />
                              Principal
                            </span>
                          )}
                        </div>
                        {file.file_size && (
                          <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(file.file_size)}</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!file.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(file)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                        title="Definir como principal"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => { setRenamingId(file.id); setRenameValue(file.name); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      title="Renomear"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <a
                      href={getFileUrl(file.storage_path)}
                      download={file.name}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      title="Baixar"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleRemove(file)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
