import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrate } from '@/db/database';
import { HelpButton } from '@/ui/components/HelpButton';
import { useTheme } from '@/ui/theme';

function Loading() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg,
      }}
    >
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

function Navigation() {
  const { colors, dark } = useTheme();

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          // Help is reachable from every screen in the app, without exception.
          headerRight: () => <HelpButton />,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="crisis"
          options={{
            title: 'Get help now',
            presentation: 'modal',
            headerRight: undefined,
          }}
        />
        <Stack.Screen name="hard-moment" options={{ title: 'A hard moment' }} />
        <Stack.Screen name="safety-plan" options={{ title: 'Safety plan' }} />
        <Stack.Screen name="reasons" options={{ title: 'Reasons to stay' }} />
        <Stack.Screen name="check-in" options={{ title: 'Check in' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="journal/[id]" options={{ title: 'Journal entry' }} />
        <Stack.Screen name="coping/[id]" options={{ title: 'Coping skill' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Suspense fallback={<Loading />}>
        <SQLiteProvider
          databaseName={DATABASE_NAME}
          onInit={migrate}
          useSuspense
        >
          <Navigation />
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
