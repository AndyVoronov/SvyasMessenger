import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setLanguage,
  setTheme,
  updateNotificationSettings,
  updateSecuritySettings,
} from '../../../store/slices/settingsSlice';

const SettingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Общие</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Язык</Text>
          <Text style={styles.settingValue}>
            {settings.language === 'ru' ? 'Русский' : 'English'}
          </Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Тема</Text>
          <Text style={styles.settingValue}>
            {settings.theme === 'light'
              ? 'Светлая'
              : settings.theme === 'dark'
              ? 'Темная'
              : 'Системная'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Уведомления</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Уведомления включены</Text>
          <Switch
            value={settings.notifications.enabled}
            onValueChange={value =>
              dispatch(updateNotificationSettings({ enabled: value }))
            }
            trackColor={{ false: '#767577', true: '#007AFF' }}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Уведомления о сообщениях</Text>
          <Switch
            value={settings.notifications.messages}
            onValueChange={value =>
              dispatch(updateNotificationSettings({ messages: value }))
            }
            trackColor={{ false: '#767577', true: '#007AFF' }}
            disabled={!settings.notifications.enabled}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Уведомления о звонках</Text>
          <Switch
            value={settings.notifications.calls}
            onValueChange={value =>
              dispatch(updateNotificationSettings({ calls: value }))
            }
            trackColor={{ false: '#767577', true: '#007AFF' }}
            disabled={!settings.notifications.enabled}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Уведомления об упоминаниях</Text>
          <Switch
            value={settings.notifications.mentions}
            onValueChange={value =>
              dispatch(updateNotificationSettings({ mentions: value }))
            }
            trackColor={{ false: '#767577', true: '#007AFF' }}
            disabled={!settings.notifications.enabled}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Безопасность</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Двухфакторная аутентификация</Text>
          <Switch
            value={settings.security.twoFactorEnabled}
            onValueChange={value =>
              dispatch(updateSecuritySettings({ twoFactorEnabled: value }))
            }
            trackColor={{ false: '#767577', true: '#007AFF' }}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Биометрическая аутентификация</Text>
          <Switch
            value={settings.security.biometricEnabled}
            onValueChange={value =>
              dispatch(updateSecuritySettings({ biometricEnabled: value }))
            }
            trackColor={{ false: '#767577', true: '#007AFF' }}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>PIN-код</Text>
          <Switch
            value={settings.security.pinLockEnabled}
            onValueChange={value =>
              dispatch(updateSecuritySettings({ pinLockEnabled: value }))
            }
            trackColor={{ false: '#767577', true: '#007AFF' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>О приложении</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Политика конфиденциальности</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Условия использования</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});

export default SettingsScreen;
