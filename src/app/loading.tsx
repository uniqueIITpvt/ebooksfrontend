export default function Loading() {
  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.16)] ring-1 ring-blue-100">
        <div className="flex h-9 items-end gap-1.5">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className="block w-2 rounded-full bg-gradient-to-t from-blue-700 via-cyan-500 to-orange-400 animate-[global-loading-wave_0.82s_ease-in-out_infinite]"
              style={{ animationDelay: `${index * 0.09}s` }}
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
