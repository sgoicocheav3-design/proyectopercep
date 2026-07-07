/** Placeholder para pestanas de navegacion aun no implementadas (History, Progress, etc.). */
export default function ComingSoon({ label }) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-6 text-center lg:max-w-none">
      <h2 className="text-lg font-semibold text-gray-700">{label}</h2>
      <p className="mt-1 text-sm text-gray-400">Esta seccion todavia no esta implementada.</p>
    </div>
  );
}
