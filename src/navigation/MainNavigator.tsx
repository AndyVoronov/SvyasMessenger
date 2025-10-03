import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import ChatsScreen from '../modules/chat/screens/ChatsScreen';
import CallsScreen from '../modules/calls/screens/CallsScreen';
import SettingsScreen from '../modules/settings/screens/SettingsScreen';
import ProfileScreen from '../modules/profile/screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{
          title: 'Чаты',
          tabBarLabel: 'Чаты',
        }}
      />
      <Tab.Screen
        name="Calls"
        component={CallsScreen}
        options={{
          title: 'Звонки',
          tabBarLabel: 'Звонки',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Настройки',
          tabBarLabel: 'Настройки',
        }}
      />
      <Tab.Screen
        name="UserProfile"
        component={ProfileScreen}
        options={{
          title: 'Профиль',
          tabBarLabel: 'Профиль',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
