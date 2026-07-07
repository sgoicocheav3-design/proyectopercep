import { useRef, useState } from 'react';
import { Camera, ChevronDown, History, Image as ImageIcon, Leaf, Loader2, HeartPulse } from 'lucide-react';
import { identifyPlant, formatPrediction } from '../lib/api';

// El modelo (ver src/common/config.py) solo distingue estos 3 cultivos, asi
// que el selector de "tipo de planta" del diseno original se adapta a ellos
// en lugar de categorias genericas (Flowering, Succulent, etc.).
const CROP_OPTIONS = [
  { value: 'auto', label: 'Todos los cultivos' },
  { value: 'tomato', label: 'Tomate' },
  { value: 'potato', label: 'Papa' },
  { value: 'pepper', label: 'Pimiento' },
];

export default function PlantIdentifier() {
  const [cropType, setCropType] = useState('auto');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | analyzing | done | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
      setResult(formatPrediction(raw));
      setStatus('done');
    } catch (error) {
      setErrorMessage(error.message);
      setStatus('error');
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-8 pt-5 lg:max-w-none lg:px-0 lg:pt-0">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-bold text-forest-700 lg:text-2xl">AI Plant Identifier</h1>
        <button
          type="button"
          className="rounded-full p-2 text-forest-600 transition-colors hover:bg-forest-50"
          aria-label="Ver historial"
        >
          <History size={20} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Columna izquierda: entrada */}
        <div className="space-y-5">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Identify Your Plant</h2>

            <label htmlFor="crop-type" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">
              Select Plant Type
            </label>
            <div className="relative">
              <Leaf size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-500" />
              <select
                id="crop-type"
                value={cropType}
                onChange={(event) => setCropType(event.target.value)}
                className="w-full appearance-none rounded-xl border border-forest-200 bg-white py-3 pl-10 pr-10 text-sm font-medium text-gray-700 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-100"
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

          <div className="aspect-square w-full overflow-hidden rounded-2xl border border-forest-100 bg-forest-50/60 lg:aspect-[4/3]">
            {previewUrl ? (
              <img src={previewUrl} alt="Vista previa de la planta" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-forest-300">
                <Leaf size={40} strokeWidth={1.5} />
                <p className="text-sm text-gray-400">Sube o toma una foto para comenzar</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-forest-50 py-3 text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-100"
            >
              <ImageIcon size={18} />
              Gallery
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-forest-50 py-3 text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-100"
            >
              <Camera size={18} />
              Camera
            </button>
            <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>

          <button
            type="button"
            onClick={handleIdentify}
            disabled={!imageFile || status === 'analyzing'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-600 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {status === 'analyzing' && <Loader2 size={18} className="animate-spin" />}
            {status === 'analyzing' ? 'Analizando...' : 'Identify Plant'}
          </button>
        </div>

        {/* Columna derecha: resultados */}
        <div className="lg:pt-[3.35rem]">
          {status === 'error' && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {result ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
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

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                  <span>Confidence</span>
                  <span>{result.confidencePct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-forest-500" style={{ width: `${result.confidencePct}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 lg:block">
              Los resultados del analisis apareceran aqui.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
