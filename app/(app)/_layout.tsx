import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useApp } from '@/context/AppContext';
import { useProtectedRoute } from '@/hooks/useAuthGuard';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, gradients } from '@/constants/theme';

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const { chatUnreadCount } = useApp();
  const { tabBarHeight, isTablet } = useResponsive();
  useProtectedRoute('member');

  const messageBadge = chatUnreadCount > 0 ? chatUnreadCount : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.teal[600],
        tabBarInactiveTintColor: colors.ink[400],
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: isTablet ? 12 : 11,
          marginTop: 2,
        },
        tabBarItemStyle: { paddingTop: isTablet ? 8 : 6 },
        tabBarStyle: {
          height: tabBarHeight + insets.bottom,
          paddingTop: isTablet ? 10 : 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingHorizontal: isTablet ? 24 : 6,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#0b2236',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 18,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} gradient={gradients.primary} name={focused ? 'home' : 'home-outline'} />
          ),
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: 'Program',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} gradient={gradients.primary} name={focused ? 'barbell' : 'barbell-outline'} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarBadge: messageBadge,
          tabBarBadgeStyle: { backgroundColor: colors.coral[500], fontFamily: fonts.bold, fontSize: 10 },
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              gradient={gradients.primary}
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Daha',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              gradient={gradients.primary}
              name={focused ? 'grid' : 'grid-outline'}
            />
          ),
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="call" options={{ href: null }} />
      <Tabs.Screen name="program" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="calorie" options={{ href: null }} />
      <Tabs.Screen name="health-test" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="library" options={{ href: null }} />
    </Tabs>
  );
}
