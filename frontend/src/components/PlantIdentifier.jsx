import { useEffect, useRef, useState } from 'react';
import { Camera, ChevronDown, Image as ImageIcon, Leaf, Loader2, HeartPulse, UploadCloud, CheckCircle2 } from 'lucide-react';
import { identifyPlant, formatPrediction } from '../lib/api';
import { addHistoryEntry, fileToCompressedDataUrl } from '../lib/storage';

const CROP_OPTIONS = [
  { value: 'auto',   label: 'Todos los cultivos' },
  { value: 'tomato', label: 'Tomate'             },
  { value: 'potato', label: 'Papa'               },
  { value: 'pepper', label: 'Pimiento'           },
];

/** Skeleton for the results panel while analyzing */
function ResultsSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="skeleton mb-4 h-4 w-2/5 rounded" />
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="skeleton h-4 w-4 rounded-full" />
          <div className="skeleton h-3 w-1/4 rounded" />
          <div className="skeleton h-3 w-1/3 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="skeleton h-4 w-4 rounded-full" />
          <div className="skeleton h-3 w-1/4 rounded" />
          <div className="skeleton h-3 w-2/5 rounded" />
        </div>
        <div className="mt-2 space-y-2">
          <div className="flex justify-between">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-3 w-8 rounded" />
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="skeleton h-full w-3/4 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlantIdentifier() {
  const [cropType, setCropType]         = useState('auto');
  const [imageFile, setImageFile]       = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [status, setStatus]             = useState('idle'); // idle | analyzing | done | error
  const [result, setResult]             = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const galleryInputRef = useRef(null);
  const cameraInputRef  = useRef(null);

  // Revoca el object URL anterior al reemplazarlo o al desmontar, para no
  // acumular blobs en memoria.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function handleFileSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setErrorMessage('');
    setStatus('idle');
    event.target.value = '';
  }

  async function handleIdentify() {
    if (!imageFile) return;
    setStatus('analyzing');
    setErrorMessage('');
    try {
      const raw = await identifyPlant(imageFile);
      const parsed = formatPrediction(raw);
      setResult(parsed);
      setStatus('done');

      try {
        const imageDataUrl = await fileToCompressedDataUrl(imageFile);
        addHistoryEntry({
          id: crypto.randomUUID(),
          crop: parsed.crop,
          condition: parsed.condition,
          isHealthy: parsed.isHealthy,
          confidencePct: parsed.confidencePct,
          cropTypeSelected: cropType,
          imageUrl: imageDataUrl,
          date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
          timestamp: Date.now(),
        });
      } catch (storageError) {
        console.warn('No se pudo guardar el analisis en el historial:', storageError);
      }
    } catch (error) {
      setErrorMessage(error.message);
      setStatus('error');
    }
  }

  const canIdentify = !!imageFile && status !== 'analyzing';

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-8 pt-5 lg:max-w-none lg:px-0 lg:pt-0 page-enter">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-forest-700 lg:text-2xl">AI Plant Identifier</h1>
          <p className="text-xs text-gray-400 mt-0.5">Identifica enfermedades en tus cultivos</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ── Columna izquierda: entrada ─────────────────── */}
        <div className="space-y-5">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Identify Your Plant</h2>

            <label htmlFor="crop-type" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">
              Select Plant Type
            </label>
            <div className="relative">
              <Leaf size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-500" />
              <select
                id="crop-type"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-forest-200 bg-white py-3 pl-10 pr-10 text-sm font-medium text-gray-700 outline-none transition-all duration-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-100 hover:border-forest-300"
              >
                {CROP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Upload area */}
          <div
            className={`relative aspect-square w-full overflow-hidden rounded-2xl border-2 bg-forest-50/60 transition-all duration-300 lg:aspect-[4/3] ${
              previewUrl
                ? 'border-forest-200'
                : 'upload-pulse border-dashed hover:bg-forest-50 cursor-pointer'
            }`}
            onClick={() => !previewUrl && galleryInputRef.current?.click()}
            role={previewUrl ? undefined : 'button'}
            aria-label={previewUrl ? undefined : 'Seleccionar imagen'}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Vista previa de la planta" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-100">
                  <UploadCloud size={28} strokeWidth={1.5} className="text-forest-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-forest-600">Sube una foto</p>
                  <p className="text-xs text-gray-400 mt-0.5">o usa la cámara para capturar</p>
                </div>
              </div>
            )}
          </div>

          {/* Gallery / Camera buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="group flex items-center justify-center gap-2 rounded-xl bg-forest-50 py-3 text-sm font-semibold text-forest-700 transition-all duration-200 hover:bg-forest-100 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
            >
              <ImageIcon size={18} className="transition-transform duration-200 group-hover:scale-110" />
              Gallery
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="group flex items-center justify-center gap-2 rounded-xl bg-forest-50 py-3 text-sm font-semibold text-forest-700 transition-all duration-200 hover:bg-forest-100 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
            >
              <Camera size={18} className="transition-transform duration-200 group-hover:scale-110" />
              Camera
            </button>
            <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
            <input ref={cameraInputRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
          </div>

          {/* Identify button */}
          <button
            type="button"
            onClick={handleIdentify}
            disabled={!canIdentify}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-600 py-3.5 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-forest-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:translate-y-0"
          >
            {status === 'analyzing' && <Loader2 size={18} className="animate-spin" />}
            {status === 'analyzing' ? 'Analizando…' : 'Identify Plant'}
          </button>
        </div>

        {/* ── Columna derecha: resultados ────────────────── */}
        <div className="lg:pt-[3.35rem]">
          {status === 'error' && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {status === 'analyzing' && <ResultsSkeleton />}

          {status === 'done' && result && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm page-enter">
              <h3 className="mb-4 text-base font-bold text-forest-700">Plant Identification Results</h3>
              <dl className="space-y-3">
                <div className="flex items-center gap-2">
                  <Leaf size={16} className="shrink-0 text-forest-500" />
                  <dt className="text-sm text-gray-500">Species:</dt>
                  <dd className="text-sm font-semibold text-gray-800">{result.crop}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <HeartPulse size={16} className={`shrink-0 ${result.isHealthy ? 'text-forest-500' : 'text-amber-500'}`} />
                  <dt className="text-sm text-gray-500">Health:</dt>
                  <dd className={`text-sm font-semibold ${result.isHealthy ? 'text-forest-600' : 'text-amber-600'}`}>
                    {result.condition}
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
                  <span>Confidence</span>
                  <span className="font-semibold text-gray-600">{result.confidencePct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-forest-500 transition-all duration-700"
                    style={{ width: `${result.confidencePct}%` }}
                  />
                </div>
              </div>

              <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${result.isHealthy ? 'bg-forest-50 text-forest-700' : 'bg-amber-50 text-amber-700'}`}>
                <span>{result.isHealthy ? '✅' : '⚠️'}</span>
                <span>{result.isHealthy ? 'Planta saludable' : 'Se recomienda tratamiento'}</span>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                <CheckCircle2 size={13} className="text-forest-400" />
                Guardado en tu historial
              </div>
            </div>
          )}

          {(status === 'idle') && (
            <div className="hidden rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-50">
                <Leaf size={24} strokeWidth={1.5} className="text-forest-400" />
              </div>
              <p className="text-sm font-medium text-gray-400">Los resultados del análisis aparecerán aquí</p>
              <p className="text-xs text-gray-300">Sube una foto y pulsa "Identify Plant"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
