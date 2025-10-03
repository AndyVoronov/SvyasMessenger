import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCallHistory } from '../../../store/slices/callsSlice';
import { Call } from '../../../types';

const CallsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { callHistory, isLoading } = useAppSelector(state => state.calls);
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchCallHistory(user.id));
    }
  }, [user, dispatch]);

  const renderCallItem = ({ item }: { item: Call }) => {
    const isMissed = item.status === 'missed';
    const isIncoming = item.initiatorId !== user?.id;

    return (
      <View style={styles.callItem}>
        <View style={[styles.callIcon, isMissed && styles.missedIcon]}>
          <Text style={styles.callIconText}>
            {item.type === 'video' ? '📹' : '📞'}
          </Text>
        </View>
        <View style={styles.callInfo}>
          <Text style={styles.callName}>
            {isIncoming ? 'Входящий' : 'Исходящий'}
          </Text>
          <Text style={[styles.callStatus, isMissed && styles.missedText]}>
            {isMissed ? 'Пропущенный' : item.status}
          </Text>
        </View>
        <View style={styles.callMeta}>
          <Text style={styles.callTime}>
            {item.startedAt
              ? new Date(item.startedAt).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Не начат'}
          </Text>
          {item.duration && (
            <Text style={styles.callDuration}>
              {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading && callHistory.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {callHistory.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Нет истории звонков</Text>
          <Text style={styles.emptySubtext}>
            Ваши звонки будут отображаться здесь
          </Text>
        </View>
      ) : (
        <FlatList
          data={callHistory}
          renderItem={renderCallItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingVertical: 8,
  },
  callItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  callIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  missedIcon: {
    backgroundColor: '#FF3B30',
  },
  callIconText: {
    fontSize: 20,
  },
  callInfo: {
    flex: 1,
  },
  callName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  callStatus: {
    fontSize: 14,
    color: '#666',
  },
  missedText: {
    color: '#FF3B30',
  },
  callMeta: {
    alignItems: 'flex-end',
  },
  callTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  callDuration: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default CallsScreen;
