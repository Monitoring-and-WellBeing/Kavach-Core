"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CategoryPieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F1629] border border-[#1E2A45] rounded-xl p-3 text-xs shadow-xl">
        <p className="font-semibold text-white">{payload[0].name}</p>
        <p className="text-[#94A3B8]">{payload[0].value}% of total</p>
      </div>
    );
  }
  return null;
};

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: item.color }}
            />
            <span className="text-xs text-[#94A3B8]">{item.name}</span>
            <span className="text-xs text-white font-medium ml-auto pl-4">
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
