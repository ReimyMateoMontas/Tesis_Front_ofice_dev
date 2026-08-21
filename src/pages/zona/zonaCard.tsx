import { getZoneColor } from "../../components/ZonaConstants";
import type { Zona } from "../../types/index";

interface Props {
  zona: Zona;
  colorIdx: number;
  isSelected: boolean;
  onClick: () => void;
}

export function ZonaCard({ zona, colorIdx, isSelected, onClick }: Props) {
  const c = getZoneColor(zona.name, colorIdx);
  const pct =
    zona.maxCapacity > 0
      ? Math.round((zona.currentCapacity / zona.maxCapacity) * 100)
      : 0;

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md bg-white ${
        isSelected
          ? `${c.border} shadow-md`
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center mb-4`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      </div>

      <h3 className="font-semibold text-gray-900 mb-0.5">{zona.name}</h3>
      <p className="text-xs text-gray-400 mb-4">{zona.description ?? ""}</p>

      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-500">Ocupación</span>
        <span className="font-medium text-gray-900">
          {zona.currentCapacity} / {zona.maxCapacity}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">{pct}% de capacidad</p>
    </div>
  );
}
