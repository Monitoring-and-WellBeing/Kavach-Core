'use client'
const badges = [
  { id: 1, icon: '🔥', label: '12-Day Streak', desc: 'Focus for 12 consecutive days', earned: true, earnedDate: 'Feb 15, 2026' },
  { id: 2, icon: '⏱️', label: 'Focus Master', desc: 'Complete 50 focus sessions', earned: true, earnedDate: 'Feb 10, 2026' },
  { id: 3, icon: '📚', label: 'Study Champion', desc: '100 hours of study time', earned: true, earnedDate: 'Feb 1, 2026' },
  { id: 4, icon: '🌙', label: 'Healthy Sleep', desc: 'No late-night usage for 7 days', earned: true, earnedDate: 'Jan 28, 2026' },
  { id: 5, icon: '🎯', label: 'Goal Crusher', desc: 'Complete all weekly goals', earned: false, progress: 72 },
  { id: 6, icon: '🏆', label: 'Top Performer', desc: 'Maintain 90%+ focus score for a week', earned: false, progress: 45 },
  { id: 7, icon: '📵', label: 'Distraction Free', desc: 'Zero blocked app attempts for 5 days', earned: false, progress: 60 },
  { id: 8, icon: '⚡', label: 'Speed Learner', desc: 'Complete 3 learning modules in a day', earned: false, progress: 33 },
]

export default function Achievements() {
  return (
    <div className="p-6 fade-up">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-gray-900 font-bold text-xl">Achievements</h2><p className="text-gray-500 text-sm">4 of 8 badges earned</p></div>
          <div className="h-2 w-48 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: '50%' }} /></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {badges.map(b => (
            <div key={b.id} className={`bg-white rounded-2xl p-5 shadow-sm text-center transition-all ${b.earned ? 'opacity-100' : 'opacity-60'}`}>
              <div className={`text-4xl mb-3 ${!b.earned ? 'grayscale' : ''}`}>{b.icon}</div>
              <div className="font-semibold text-gray-800 text-sm mb-1">{b.label}</div>
              <div className="text-gray-400 text-xs mb-3">{b.desc}</div>
              {b.earned ? (
                <div className="text-xs text-green-600 font-medium bg-green-50 rounded-full px-2 py-0.5">✓ Earned {b.earnedDate}</div>
              ) : (
                <div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1"><div className="h-full bg-purple-400 rounded-full" style={{ width: `${b.progress}%` }} /></div>
                  <div className="text-xs text-gray-400">{b.progress}% complete</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
