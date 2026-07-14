import { Tabs } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StaffForcePasswordChange } from '@/components/auth/StaffForcePasswordChange';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useApp } from '@/context/AppContext';
import { StaffDashboardProvider, useStaffDashboard } from '@/hooks/useStaffDashboard';
import { useProtectedRoute } from '@/hooks/useAuthGuard';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fonts, gradients } from '@/constants/theme';

function StaffTabs() {
  const insets = useSafeAreaInsets();
  const { tabBarHeight, isTablet } = useResponsive();
  const { unreadCount } = useStaffDashboard();

  const badge = unreadCount > 0 ? unreadCount : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal[600],
        tabBarInactiveTintColor: colors.ink[400],
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: isTablet ? 12 : 11,
          marginTop: 2,
        },
        tabBarStyle: {
          height: tabBarHeight + insets.bottom,
          paddingTop: isTablet ? 10 : 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingHorizontal: isTablet ? 24 : 6,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          elevation: 18,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Özet',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} gradient={gradients.primary} name={focused ? 'grid' : 'grid-outline'} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Danışanlar',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} gradient={gradients.primary} name={focused ? 'people' : 'people-outline'} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarBadge: badge,
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
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} gradient={gradients.primary} name={focused ? 'person' : 'person-outline'} />
          ),
        }}
      />
      <Tabs.Screen name="programs" options={{ href: null }} />
      <Tabs.Screen name="lists" options={{ href: null }} />
      <Tabs.Screen name="library" options={{ href: null }} />
      <Tabs.Screen name="payments" options={{ href: null }} />
      <Tabs.Screen name="call" options={{ href: null }} />
    </Tabs>
  );
}

export default function StaffLayout() {
  useProtectedRoute('staff');
  const { staff, refresh } = useApp();
  const [passwordChanged, setPasswordChanged] = useState(false);
  const mustChangePassword =
    Boolean(staff?.tempPasswordIssued) && !passwordChanged;

  return (
    <StaffDashboardProvider>
      {mustChangePassword && staff ? (
        <StaffForcePasswordChange
          staff={staff}
          onDone={() => {
            setPasswordChanged(true);
            void refresh();
          }}
        />
      ) : null}
      <StaffTabs />
    </StaffDashboardProvider>
  );
}
