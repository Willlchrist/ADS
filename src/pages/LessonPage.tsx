import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  User,
  Hash,
  FileText,
  Download,
  BookOpen,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Lesson, Subject, LessonFile } from '@/lib/types';
import { formatDate, formatFileSize } from '@/lib/pdf';
import { PdfViewer } from '@/components/PdfViewer';

export function LessonPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [files, setFiles] = useState<LessonFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<LessonFile | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!lessonId) return;
      setLoading(true);
      setError(false);
      try {
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .eq('is_published', true)
          .maybeSingle();

        if (lessonError || !lessonData) {
          setError(true);
          return;
        }
        setLesson(lessonData as Lesson);

        const { data: subjectData } = await supabase
          .from('subjects')
          .select('*')
          .eq('id', lessonData.subject_id)
          .maybeSingle();
        setSubject(subjectData as Subject);

        const { data: filesData } = await supabase
          .from('lesson_files')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true });

        if (filesData) {
          setFiles(filesData as LessonFile[]);
          if (filesData.length > 0) {
            setSelectedFile(filesData[0] as LessonFile);
          }
        }
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [lessonId]);

  const getFileUrl = (path: string) => {
    return supabase.storage.from('lesson-files').getPublicUrl(path).data.publicUrl;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="h-8 w-64 bg-slate-100 rounded animate-pulse mb-3" />
        <div className="h-4 w-96 bg-slate-100 rounded animate-pulse mb-8" />
        <div className="bg-white rounded-2xl border border-slate-200 h-[600px] animate-pulse" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to={slug ? `/disciplinas/${slug}` : (subject ? `/disciplinas/${subject.slug}` : '/disciplinas')} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <FileText className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Aula não encontrada ou não publicada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to={`/disciplinas/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        {subject ? subject.name : 'Voltar'}
      </Link>

      {/* Lesson header */}
      <div className="mb-8">
        {lesson.number != null && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium mb-3">
            <Hash className="w-3.5 h-3.5" />
            Aula {lesson.number}
          </div>
        )}
        <h1 className="text-3xl font-bold text-slate-900 mb-4">{lesson.title}</h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
          {subject && (
            <Link to={`/disciplinas/${subject.slug}`} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
              <BookOpen className="w-4 h-4" />
              {subject.name}
            </Link>
          )}
          {lesson.lesson_date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(lesson.lesson_date)}
            </span>
          )}
          {lesson.professor && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {lesson.professor}
            </span>
          )}
        </div>

        {lesson.description && (
          <p className="text-slate-600 mt-4 leading-relaxed">{lesson.description}</p>
        )}
      </div>

      {/* Files section */}
      {files.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum arquivo disponível.</p>
        </div>
      ) : files.length === 1 ? (
        <PdfViewer
          url={getFileUrl(files[0].storage_path)}
          fileName={files[0].name}
          downloadUrl={getFileUrl(files[0].storage_path)}
        />
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Arquivos da aula</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                    selectedFile?.id === file.id
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedFile?.id === file.id ? 'bg-slate-900' : 'bg-slate-100'
                  }`}>
                    <FileText className={`w-5 h-5 ${selectedFile?.id === file.id ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 text-sm truncate">{file.name}</p>
                      {file.is_primary && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold flex-shrink-0">
                          <CheckCircle className="w-2.5 h-2.5" />
                          Principal
                        </span>
                      )}
                    </div>
                    {file.file_size && (
                      <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(file.file_size)}</p>
                    )}
                  </div>
                  <a
                    href={getFileUrl(file.storage_path)}
                    download={file.name}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0"
                    title="Baixar"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </button>
              ))}
            </div>
          </div>

          {selectedFile && (
            <PdfViewer
              url={getFileUrl(selectedFile.storage_path)}
              fileName={selectedFile.name}
              downloadUrl={getFileUrl(selectedFile.storage_path)}
            />
          )}
        </div>
      )}
    </div>
  );
}
