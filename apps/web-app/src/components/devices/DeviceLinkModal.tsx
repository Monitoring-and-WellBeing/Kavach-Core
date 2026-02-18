"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/uiStore";

interface DeviceLinkModalProps {
  open: boolean;
  onClose: () => void;
}

export function DeviceLinkModal({ open, onClose }: DeviceLinkModalProps) {
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"enter" | "success">("enter");
  const [loading, setLoading] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const handleLink = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep("success");
    addToast({ title: "Device linked successfully!", type: "success" });
  };

  const handleClose = () => {
    setStep("enter");
    setCode("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Link New Device" size="sm">
      {step === "enter" ? (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-[#94A3B8]">
            Open the KAVACH desktop agent on the target device. It will display a 6-character code.
            Enter it below to link the device.
          </p>
          <div>
            <label className="text-sm font-medium text-[#94A3B8] block mb-2">
              Device Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="KV3X9A"
              className="w-full text-center text-2xl font-mono tracking-[0.5em] px-4 py-3 bg-[#0A0F1E] border border-[#1E2A45] rounded-xl text-white uppercase focus:outline-none focus:border-blue-500"
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
            The device with code <span className="font-mono text-blue-400">{code}</span> has been
            successfully linked to your account.
          </p>
          <Button onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
