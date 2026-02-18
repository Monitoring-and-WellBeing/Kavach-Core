'use client'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { TrendingUp, Target, Award } from 'lucide-react'

const weeklyScores = [
  { week: 'Week 1', focus: 75, tasks: 25, score: 78 },
  { week: 'Week 2', focus: 82, tasks: 28, score: 80 },
  { week: 'Week 3', focus: 88, tasks: 32, score: 85 },
  { week: 'Week 4', focus: 92, tasks: 35, score: 88 },
]

const subjectBreakdown = [
  { subject: 'Math', hours: 8.5, color: '#3B82F6' },
  { subject: 'Science', hours: 6.2, color: '#22C55E' },
  { subject: 'English', hours: 4.8, color: '#F59E0B' },
  { subject: 'Coding', hours: 5.5, color: '#8B5CF6' },
  { subject: 'History', hours: 3.1, color: '#EF4444' },
]

export default function ProgressPage() {
  return (
    <div className="p-6 space-y-6 fade-up">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
              <TrendingUp size={20} style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <div className="text-gray-400 text-xs">Total Focus Time</div>
              <div className="text-gray-900 text-xl font-bold">86h</div>
            </div>
          </div>
          <div className="text-green-600 text-xs font-medium">+15% this month</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F0FDF4' }}>
              <Target size={20} style={{ color: '#22C55E' }} />
            </div>
            <div>
              <div className="text-gray-400 text-xs">Tasks Completed</div>
              <div className="text-gray-900 text-xl font-bold">110</div>
            </div>
          </div>
          <div className="text-green-600 text-xs font-medium">+8% this month</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEF3C7' }}>
              <Award size={20} style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <div className="text-gray-400 text-xs">Avg Focus Score</div>
              <div className="text-gray-900 text-xl font-bold">78.5</div>
            </div>
          </div>
          <div className="text-red-600 text-xs font-medium">-2% this month</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Performance Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyScores}>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Line type="monotone" dataKey="focus" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} />
              <Line type="monotone" dataKey="tasks" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 4 }} />
              <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Subject Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectBreakdown}>
              <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                {subjectBreakdown.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Improvement Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
            <TrendingUp size={18} className="text-green-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-800">Focus time increased by 15% this month</div>
              <div className="text-xs text-gray-500">Keep up the excellent work!</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
            <Target size={18} className="text-blue-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-800">92% of weekly goals completed</div>
              <div className="text-xs text-gray-500">Just 2 more tasks to go!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
