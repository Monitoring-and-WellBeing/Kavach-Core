'use client'
import { useState } from 'react'
import { CheckCircle, Circle, Calendar } from 'lucide-react'

const weeklySchedule = {
  'Monday': [
    { id: 1, time: '10:00 AM', task: 'Complete Math Chapter 5', done: true },
    { id: 2, time: '2:00 PM', task: 'Science Lab Report', done: true },
    { id: 3, time: '4:00 PM', task: 'English Essay Draft', done: false },
    { id: 4, time: '6:00 PM', task: 'Coding Practice - Arrays', done: false },
  ],
  'Tuesday': [
    { id: 5, time: '9:00 AM', task: 'Math Homework', done: false },
    { id: 6, time: '3:00 PM', task: 'Science Project', done: false },
  ],
  'Wednesday': [
    { id: 7, time: '10:00 AM', task: 'Complete Math Chapter 5', done: true },
    { id: 8, time: '2:00 PM', task: 'Science Lab Report', done: true },
    { id: 9, time: '4:00 PM', task: 'English Essay Draft', done: false },
  ],
  'Thursday': [
    { id: 10, time: '11:00 AM', task: 'History Assignment', done: false },
    { id: 11, time: '5:00 PM', task: 'Coding Challenge', done: false },
  ],
  'Friday': [
    { id: 12, time: '10:00 AM', task: 'Math Quiz Prep', done: false },
  ],
  'Saturday': [],
  'Sunday': [],
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(today)
  const [tasks, setTasks] = useState(weeklySchedule)

  const toggleTask = (day: string, taskId: number) => {
    setTasks(prev => ({
      ...prev,
      [day]: prev[day as keyof typeof prev].map(t => t.id === taskId ? { ...t, done: !t.done } : t)
    }))
  }

  return (
    <div className="p-6 space-y-6 fade-up">
      <div>
        <h2 className="text-gray-900 font-bold text-xl">Schedule</h2>
        <p className="text-gray-500 text-sm">Your weekly task schedule</p>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              selectedDay === day
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Tasks for Selected Day */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">{selectedDay}'s Tasks</h3>
        </div>
        {tasks[selectedDay as keyof typeof tasks].length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No tasks scheduled for {selectedDay}</div>
        ) : (
          <div className="space-y-2">
            {tasks[selectedDay as keyof typeof tasks].map(task => (
              <button
                key={task.id}
                onClick={() => toggleTask(selectedDay, task.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                {task.done ? (
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                ) : (
                  <Circle size={20} className="text-gray-300 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className={`text-sm font-medium ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {task.task}
                  </div>
                  <div className="text-xs text-gray-400">{task.time}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
