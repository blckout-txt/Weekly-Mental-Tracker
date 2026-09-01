import { Text, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';

import { HelpButton } from '@/ui/components/HelpButton';
import { useTheme } from '@/ui/theme';

/**
 * Text-glyph tab icons keep the app free of an icon-font dependency and stay
 * legible at any system font size.
 */
function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 18, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        headerRight: () => <HelpButton />,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <TabIcon glyph="◉" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Mood',
          tabBarIcon: ({ color }) => <TabIcon glyph="◔" color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => <TabIcon glyph="✎" color={color} />,
        }}
      />
      <Tabs.Screen
        name="coping"
        options={{
          title: 'Skills',
          tabBarIcon: ({ color }) => <TabIcon glyph="❖" color={color} />,
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: 'Week',
          tabBarIcon: ({ color }) => <TabIcon glyph="▤" color={color} />,
        }}
      />
    </Tabs>
  );
}
