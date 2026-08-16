import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  Maximize,
  RotateCcw,
} from 'lucide-react';
import { pdfjsLib } from '@/lib/pdf';

interface PdfViewerProps {
  url: string;
  fileName: string;
  downloadUrl: string;
}

export function PdfViewer({ url, fileName, downloadUrl }: PdfViewerProps) {
  const [pdf, setPdf] = useState<import('pdfjs-dist').PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<import('pdfjs-dist').RenderTask | null>(null);

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    pdfjsLib
      .getDocument({ url })
      .promise.then((doc) => {
        if (cancelled) return;
        setPdf(doc);
        setNumPages(doc.numPages);
        setPageNum(1);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error loading PDF:', err);
        setError('Não foi possível carregar o PDF.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [url]);

  // Render page
  const renderPage = useCallback(
    async (num: number, currentScale: number) => {
      if (!pdf || !canvasRef.current) return;
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }
        const page = await pdf.getPage(num);
        const viewport = page.getViewport({ scale: currentScale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;
        const renderTask = page.render({
          canvasContext: context,
          viewport,
          transform,
        } as any);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      }
    },
    [pdf],
  );

  useEffect(() => {
    if (pdf && !loading) {
      renderPage(pageNum, scale);
    }
  }, [pdf, pageNum, scale, loading, renderPage]);

  const goPrevPage = () => {
    if (pageNum > 1) setPageNum(pageNum - 1);
  };
  const goNextPage = () => {
    if (pageNum < numPages) setPageNum(pageNum + 1);
  };
  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const resetZoom = () => setScale(1.2);

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1 && val <= numPages) {
      setPageNum(val);
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500 mb-4">{error}</p>
        <a
          href={downloadUrl}
          download={fileName}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
        >
          <Download className="w-4 h-4" />
          Baixar arquivo
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-slate-200 bg-slate-50 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={goPrevPage}
            disabled={pageNum <= 1 || loading}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            <input
              type="number"
              value={pageNum}
              onChange={handlePageInput}
              min={1}
              max={numPages}
              className="w-12 text-center text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <span className="text-sm text-slate-400">/ {numPages || '...'}</span>
          </div>
          <button
            onClick={goNextPage}
            disabled={pageNum >= numPages || loading}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Próxima página"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={loading}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-xs font-medium text-slate-500 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={loading}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={resetZoom}
            disabled={loading}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors hidden sm:block"
            title="Restaurar zoom"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <a
            href={downloadUrl}
            download={fileName}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
            title="Baixar PDF"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center min-h-[400px] p-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            <p className="text-sm text-slate-400">Carregando PDF...</p>
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-lg rounded-sm max-w-full" />
        )}
      </div>
    </div>
  );
}
