"use client";

import { mockStudents } from "@/mock/students";
import { AlertBadge } from "@/components/alerts/AlertBadge";
import { FocusScoreRing } from "@/components/student/FocusScoreRing";

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStudents.map(student => (
          <div key={student.id} className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {student.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{student.name}</p>
                <p className="text-xs text-[#64748B]">{student.grade} · Age {student.age}</p>
              </div>
            </div>
            <div className="flex justify-center mb-4">
              <div className="scale-75 -my-4">
                <FocusScoreRing score={student.focusScore} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#64748B]">🔥 {student.streak} day streak</span>
              <AlertBadge severity={student.riskLevel} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
