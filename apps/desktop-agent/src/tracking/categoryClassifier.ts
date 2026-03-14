// Maps process names and window titles to app categories
// This runs locally on the device — no network call needed

export type AppCategory =
  | 'EDUCATION'
  | 'SOCIAL_MEDIA'
  | 'GAMING'
  | 'ENTERTAINMENT'
  | 'PRODUCTIVITY'
  | 'COMMUNICATION'
  | 'OTHER'

interface CategoryRule {
  processes?: string[]
  titleKeywords?: string[]
  category: AppCategory
}

const RULES: CategoryRule[] = [
  // ── Gaming ──────────────────────────────────────────────────────────────────
  {
    processes: [
      'freefire.exe','pubg.exe','valorant.exe','minecraft.exe',
      'robloxplayerbeta.exe','steam.exe','epicgameslauncher.exe',
      'leagueoflegends.exe','gta5.exe','csgo.exe','gameoverlayui.exe'
    ],
    category: 'GAMING'
  },
  // ── Social Media ─────────────────────────────────────────────────────────────
  {
    processes: ['instagram.exe','twitter.exe','snapchat.exe','tiktok.exe','facebook.exe'],
    titleKeywords: ['instagram','twitter','snapchat','tiktok','facebook','x.com'],
    category: 'SOCIAL_MEDIA'
  },
  // ── Communication ────────────────────────────────────────────────────────────
  {
    processes: ['whatsapp.exe','telegram.exe','slack.exe','discord.exe','zoom.exe','teams.exe','skype.exe'],
    category: 'COMMUNICATION'
  },
  // ── Entertainment — browser titles ───────────────────────────────────────────
  {
    processes: ['vlc.exe','netflix.exe','spotify.exe','wmplayer.exe','mpc-hc.exe'],
    titleKeywords: ['youtube','netflix','prime video','hotstar','zee5','sonyliv','jiocinema','spotify'],
    category: 'ENTERTAINMENT'
  },
  // ── Education ────────────────────────────────────────────────────────────────
  {
    processes: [
      'code.exe','devenv.exe','pycharm64.exe','idea64.exe',
      'notepad++.exe','eclipse.exe','winword.exe','powerpnt.exe',
      'excel.exe','acrobat.exe','sumatrapdf.exe','onenote.exe'
    ],
    titleKeywords: [
      'stackoverflow','github','coursera','udemy','khan academy',
      'google classroom','moodle','byju','unacademy','vedantu',
      'ncert','cbse','learn','tutorial','lecture','notes'
    ],
    category: 'EDUCATION'
  },
]

// Process name → friendly app name lookup
const FRIENDLY_NAMES: Record<string, string> = {
  'chrome.exe': 'Google Chrome',
  'firefox.exe': 'Mozilla Firefox',
  'msedge.exe': 'Microsoft Edge',
  'code.exe': 'VS Code',
  'winword.exe': 'Microsoft Word',
  'excel.exe': 'Microsoft Excel',
  'powerpnt.exe': 'PowerPoint',
  'freefire.exe': 'Free Fire',
  'pubg.exe': 'PUBG',
  'valorant.exe': 'Valorant',
  'robloxplayerbeta.exe': 'Roblox',
  'whatsapp.exe': 'WhatsApp',
  'telegram.exe': 'Telegram',
  'discord.exe': 'Discord',
  'zoom.exe': 'Zoom',
  'teams.exe': 'Microsoft Teams',
  'spotify.exe': 'Spotify',
  'vlc.exe': 'VLC',
  'steam.exe': 'Steam',
  'explorer.exe': 'File Explorer',
  'notepad.exe': 'Notepad',
  'calc.exe': 'Calculator',
}

export function classifyApp(processName: string, windowTitle: string): {
  category: AppCategory
  friendlyName: string
} {
  const proc = processName.toLowerCase()
  const title = windowTitle.toLowerCase()

  for (const rule of RULES) {
    const matchesProcess = rule.processes?.some(p => proc.includes(p.toLowerCase()))
    const matchesTitle = rule.titleKeywords?.some(k => title.includes(k))

    if (matchesProcess || matchesTitle) {
      return {
        category: rule.category,
        friendlyName: FRIENDLY_NAMES[proc] || formatProcessName(processName),
      }
    }
  }

  return {
    category: 'PRODUCTIVITY',
    friendlyName: FRIENDLY_NAMES[proc] || formatProcessName(processName),
  }
}

// "chrome.exe" → "Chrome" | "notepad++.exe" → "Notepad++"
function formatProcessName(proc: string): string {
  return proc
    .replace(/\.exe$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}
