import { Link } from 'react-router-dom';
import { Calendar, User, FileText, BookOpen } from 'lucide-react';
import type { LessonWithSubject } from '@/lib/types';
import { formatDate } from '@/lib/pdf';

interface LessonCardProps {
  lesson: LessonWithSubject;
  thumbnail?: string | null;
  compact?: boolean;
}

export function LessonCard({ lesson, thumbnail, compact = false }: LessonCardProps) {
  const lessonUrl = `/disciplinas/${lesson.subjects.slug}/aula/${lesson.id}`;

  return (
    <Link
      to={lessonUrl}
      className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200"
    >
      <div className={`${compact ? 'aspect-video' : 'aspect-[4/3]'} bg-slate-100 relative overflow-hidden`}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={lesson.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
        )}
        {lesson.number != null && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white text-xs font-semibold">
            Aula {lesson.number}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-500 truncate">{lesson.subjects.name}</span>
        </div>

        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-3 line-clamp-2 group-hover:text-slate-700">
          {lesson.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
          {lesson.lesson_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(lesson.lesson_date)}
            </span>
          )}
          {lesson.professor && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {lesson.professor}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
