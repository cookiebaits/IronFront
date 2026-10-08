import { useState } from 'react';
import { COS } from '../game/data';

export default function Portrait({ id, size = 64, className = '' }: { id: string; size?: number; className?: string }) {
  const [err, setErr] = useState(false);
  const co = COS[id];
  if (id === 'narrator' || !co) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-slate-800 border-2 border-slate-600 ${className}`} style={{ width: size, height: size, fontSize: size * 0.5 }}>📻</div>
    );
  }
  return (
    <div
      className={`relative overflow-hidden rounded-lg border-2 shrink-0 ${className}`}
      style={{ width: size, height: size, borderColor: co.color, background: `linear-gradient(135deg, ${co.color}55, #0f172a)` }}
    >
      {!err ? (
        <img src={`./portraits/${id}.jpg`} alt={co.name} className="w-full h-full object-cover object-[50%_30%]" onError={() => setErr(true)} draggable={false} />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ fontSize: size * 0.5 }}>{co.emoji}</div>
      )}
    </div>
  );
}
