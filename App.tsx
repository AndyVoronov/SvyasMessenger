import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { supabase } from './src/services/supabase';
import { setSession } from './src/store/slices/authSlice';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Check for existing session on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      store.dispatch(
        setSession({
          session,
          user: session?.user as any,
        })
      );
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      store.dispatch(
        setSession({
          session,
          user: session?.user as any,
        })
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <AppNavigator />
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
