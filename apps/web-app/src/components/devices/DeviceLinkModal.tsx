"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/uiStore";
import { devicesApi, Device } from "@/lib/devices";

interface DeviceLinkModalProps {
  open: boolean;
  onClose: () => void;
  onLinked?: (device: Device) => void;
}

export function DeviceLinkModal({ open, onClose, onLinked }: DeviceLinkModalProps) {
  const [code, setCode]           = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [step, setStep]           = useState<"enter" | "success">("enter");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [linked, setLinked]       = useState<Device | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const handleLink = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const device = await devicesApi.link(code, deviceName || undefined, assignedTo || undefined);
      setLinked(device);
      setStep("success");
      addToast({ title: "Device linked successfully!", type: "success" });
      onLinked?.(device);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Invalid or expired code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("enter");
    setCode("");
    setDeviceName("");
    setAssignedTo("");
    setError("");
    setLinked(null);
    onClose();
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:border-blue-500 transition-colors text-sm";

  return (
    <Modal open={open} onClose={handleClose} title="Link New Device" size="sm">
      {step === "enter" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[#94A3B8]">
            Open the KAVACH desktop agent on the target device. It will display a
            6-character code. Enter it below to link the device.
          </p>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-[#94A3B8] block mb-2">
              Device Code *
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="KV3X9A"
              autoFocus
              className="w-full text-center text-2xl font-mono tracking-[0.5em] px-4 py-3 bg-[#0A0F1E] border border-[#1E2A45] rounded-xl text-white uppercase focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#94A3B8] block mb-2">
              Device Name <span className="text-[#475569]">(optional)</span>
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Ananya's Laptop"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#94A3B8] block mb-2">
              Assigned To <span className="text-[#475569]">(optional)</span>
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Ananya Sharma"
              className={inputClass}
            />
          </div>

          <Button
            loading={loading}
            onClick={handleLink}
            disabled={code.length !== 6}
          >
            Link Device
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-14 h-14 bg-green-500/15 rounded-full flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-white font-semibold">Device Linked!</p>
          <p className="text-sm text-[#64748B] text-center">
            <span className="font-medium text-white">{linked?.name || code}</span> has been
            successfully linked to your account. Monitoring will begin shortly.
          </p>
          <Button onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
