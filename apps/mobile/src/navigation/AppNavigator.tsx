import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '../context/AuthContext'
import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import FocusScreen from '../screens/FocusScreen'
import AchievementsScreen from '../screens/AchievementsScreen'
import RewardsScreen from '../screens/RewardsScreen'
import StudyBuddyScreen from '../screens/StudyBuddyScreen'

// ── Tab param list ─────────────────────────────────────────────────────────────
export type RootTabParamList = {
  Home: undefined
  StudyBuddy: undefined
  Focus: undefined
  Achievements: undefined
  Rewards: undefined
}

const Tab = createBottomTabNavigator<RootTabParamList>()

const BLUE = '#2563EB'
const GRAY = '#9CA3AF'

// ── Icon map ───────────────────────────────────────────────────────────────────
type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

const TAB_ICONS: Record<
  keyof RootTabParamList,
  { active: IoniconsName; inactive: IoniconsName }
> = {
  Home:         { active: 'home',           inactive: 'home-outline' },
  StudyBuddy:   { active: 'school',         inactive: 'school-outline' },
  Focus:        { active: 'timer',          inactive: 'timer-outline' },
  Achievements: { active: 'trophy',         inactive: 'trophy-outline' },
  Rewards:      { active: 'gift',           inactive: 'gift-outline' },
}

// ── Navigator ─────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, loading } = useAuth()

  // Show a full-screen spinner while we restore the persisted session
  if (loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}
      >
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    )
  }

  // Unauthenticated — show login (no NavigationContainer needed here since
  // LoginScreen doesn't navigate internally)
  if (!user) {
    return <LoginScreen />
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: BLUE,
          tabBarInactiveTintColor: GRAY,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#F3F4F6',
            paddingBottom: 8,
            height: 64,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name as keyof RootTabParamList]
            const iconName = focused ? icons.active : icons.inactive
            return <Ionicons name={iconName} size={size} color={color} />
          },
        })}
      >
        <Tab.Screen name="Home" component={DashboardScreen} />
        <Tab.Screen
          name="StudyBuddy"
          component={StudyBuddyScreen}
          options={{ tabBarLabel: 'Study Buddy' }}
        />
        <Tab.Screen name="Focus" component={FocusScreen} />
        <Tab.Screen name="Achievements" component={AchievementsScreen} />
        <Tab.Screen name="Rewards" component={RewardsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
