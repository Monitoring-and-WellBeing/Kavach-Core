"use client";

import { useState } from "react";
import { useDevices } from "@/hooks/useDevices";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { DeviceLinkModal } from "@/components/devices/DeviceLinkModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUIStore } from "@/store/uiStore";
import { DeviceStatus } from "@kavach/shared-types";
import { Plus, Search } from "lucide-react";
import { clsx } from "clsx";

const statusFilters = ["All", "Online", "Offline", "Paused", "Focus"] as const;
type StatusFilter = typeof statusFilters[number];

export default function DevicesPage() {
  const { devices, pauseDevice, resumeDevice, setFocusMode } = useDevices();
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const addToast = useUIStore((s) => s.addToast);

  const filtered = devices.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.assignedTo || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "All" ||
      (statusFilter === "Online" && d.status === DeviceStatus.ONLINE) ||
      (statusFilter === "Offline" && d.status === DeviceStatus.OFFLINE) ||
      (statusFilter === "Paused" && d.status === DeviceStatus.PAUSED) ||
      (statusFilter === "Focus" && d.status === DeviceStatus.FOCUS_MODE);
    return matchSearch && matchStatus;
  });

  const handleSync = (id: string) => {
    addToast({ title: "Device synced", type: "success" });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search devices or students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button onClick={() => setLinkModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Link New Device
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={clsx(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              statusFilter === filter
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-[#1E2A45] text-[#64748B] hover:text-white"
            )}
          >
            {filter}
          </button>
        ))}
        <span className="text-sm text-[#64748B] self-center ml-2">
          {filtered.length} device{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onPause={pauseDevice}
            onResume={resumeDevice}
            onFocus={setFocusMode}
            onSync={handleSync}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-[#64748B]">
            No devices match your search.
          </div>
        )}
      </div>

      <DeviceLinkModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} />
    </div>
  );
}
