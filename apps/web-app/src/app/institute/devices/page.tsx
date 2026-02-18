"use client";

import { useState } from "react";
import { useDevices } from "@/hooks/useDevices";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUIStore } from "@/store/uiStore";
import { formatMinutes } from "@kavach/shared-utils";
import { formatTime } from "@kavach/shared-utils";
import { Search, Download } from "lucide-react";

export default function InstituteDevicesPage() {
  const { devices, pauseDevice, setFocusMode } = useDevices();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const addToast = useUIStore(s => s.addToast);

  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.assignedTo || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleBulkPause = () => {
    selected.forEach(id => pauseDevice(id));
    addToast({ title: `${selected.length} device(s) paused`, type: "success" });
    setSelected([]);
  };

  const handleExportCSV = () => {
    addToast({ title: "CSV exported!", type: "success" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search devices or students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <>
              <Button size="sm" variant="danger" onClick={handleBulkPause}>
                Pause {selected.length} Selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                selected.forEach(id => setFocusMode(id));
                addToast({ title: "Focus mode applied", type: "success" });
                setSelected([]);
              }}>
                Force Focus
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-[#1E2A45]">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1629]">
            <tr className="text-left text-xs text-[#64748B]">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    setSelected(e.target.checked ? filtered.map(d => d.id) : []);
                  }}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Screen Time</th>
              <th className="px-4 py-3">Last Seen</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2A45]">
            {filtered.map(device => (
              <tr key={device.id} className="hover:bg-[#0F1629]/50 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(device.id)}
                    onChange={() => toggleSelect(device.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 text-white font-medium">{device.name}</td>
                <td className="px-4 py-3 text-[#94A3B8]">{device.assignedTo || "—"}</td>
                <td className="px-4 py-3"><DeviceStatusBadge status={device.status} /></td>
                <td className="px-4 py-3 text-[#94A3B8]">{formatMinutes(device.screenTimeToday)}</td>
                <td className="px-4 py-3 text-[#64748B]">{formatTime(device.lastSeen)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => pauseDevice(device.id)}>
                      Pause
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setFocusMode(device.id)}>
                      Focus
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
