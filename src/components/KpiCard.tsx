import { BuildingOfficeIcon, UserIcon } from "@heroicons/react/24/solid";

interface KpiProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: "green" | "blue" | "yellow" | "red";
}

export default function KpiCard({ title, value, icon: Icon, color }: KpiProps) {
  const colorMap = {
    green: "bg-emerald-100 text-emerald-600",
    blue:  "bg-blue-100 text-blue-600",
    yellow:"bg-yellow-100 text-yellow-600",
    red:   "bg-red-100 text-red-600",
  }[color];

  return (
    <div className="flex items-center gap-4 bg-white rounded-xl ring-1 ring-black/5 shadow-sm p-6">
      <span className={`rounded-full p-3 ${colorMap}`}>
        <Icon className="h-6 w-6"/>
      </span>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-semibold text-primary">{value}</p>
      </div>
    </div>
  );
} 