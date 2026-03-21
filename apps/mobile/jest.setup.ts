// Extend Jest matchers with react-native testing utilities
import '@testing-library/jest-native/extend-expect'

// ── AsyncStorage mock ─────────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// ── Expo module mocks ─────────────────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}))

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-id'),
}))

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn().mockResolvedValue(undefined),
  deactivateKeepAwake: jest.fn(),
}))

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
}))

jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
  BackgroundFetchResult: { NewData: 'newData', NoData: 'noData', Failed: 'failed' },
}))

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}))

// ── Navigation mock ───────────────────────────────────────────────────────────
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    NavigationContainer: ({ children }: { children: any }) => children,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ params: {} }),
  }
})

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Navigator: ({ children }: { children: any }) => children,
    Screen: () => null,
  }),
}))

// ── react-native-safe-area-context mock ───────────────────────────────────────
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 }
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SafeAreaProvider: ({ children }: { children: any }) => children,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SafeAreaView: ({ children }: { children: any }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  }
})

// ── react-native-screens mock ─────────────────────────────────────────────────
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}))

// ── react-native-svg mock ─────────────────────────────────────────────────────
jest.mock('react-native-svg', () => {
  const RN = require('react-native')
  return {
    __esModule: true,
    default: RN.View,
    Svg: RN.View,
    Circle: RN.View,
    G: RN.View,
    Path: RN.View,
    Rect: RN.View,
    Text: RN.Text,
    Line: RN.View,
  }
})

// ── @expo/vector-icons mock ───────────────────────────────────────────────────
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialIcons: () => null,
}))

// ── Silence React Native's act() warnings in tests ────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}
