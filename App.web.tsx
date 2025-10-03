import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { supabase } from './src/services/supabase';

interface Chat {
  id: string;
  name: string | null;
  type: 'individual' | 'group';
  participants: string[];
  updated_at: string;
  otherUserEmail?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
}

export default function App() {
  const [screen, setScreen] = useState<'auth' | 'chatList' | 'chat' | 'newChat'>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Chat state
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');

  // New chat state
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUsers, setFoundUsers] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (user && screen === 'chatList') {
      loadChats();
    }
  }, [user, screen]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      const unsubscribe = subscribeToMessages(selectedChat.id);
      return unsubscribe;
    }
  }, [selectedChat]);

  const loadChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Получаем email других участников для индивидуальных чатов
      const chatsWithEmails = await Promise.all(
        (data || []).map(async (chat) => {
          if (chat.type === 'individual') {
            const otherUserId = chat.participants.find((p: string) => p !== user.id);
            if (otherUserId) {
              const { data: userData } = await supabase
                .from('users')
                .select('email')
                .eq('id', otherUserId)
                .single();

              return { ...chat, otherUserEmail: userData?.email };
            }
          }
          return chat;
        })
      );

      setChats(chatsWithEmails);
    } catch (err: any) {
      console.error('Error loading chats:', err);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error('Error loading messages:', err);
    }
  };

  const subscribeToMessages = (chatId: string) => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', `%${searchEmail}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;
      setFoundUsers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const createChatWithUser = async (otherUser: UserProfile) => {
    try {
      // Проверяем, существует ли уже чат с этим пользователем
      const { data: existingChats } = await supabase
        .from('chats')
        .select('*')
        .eq('type', 'individual')
        .contains('participants', [user.id, otherUser.id]);

      if (existingChats && existingChats.length > 0) {
        // Чат уже существует, открываем его
        const chat = { ...existingChats[0], otherUserEmail: otherUser.email };
        setSelectedChat(chat);
        setScreen('chat');
        setSearchEmail('');
        setFoundUsers([]);
        return;
      }

      // Создаём новый чат
      const { data, error } = await supabase
        .from('chats')
        .insert({
          type: 'individual',
          participants: [user.id, otherUser.id],
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newChat = { ...data, otherUserEmail: otherUser.email };
      setChats([newChat, ...chats]);
      setSelectedChat(newChat);
      setScreen('chat');
      setSearchEmail('');
      setFoundUsers([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: user.id,
          type: 'text',
          content: messageText,
        });

      if (error) throw error;

      // Обновляем время последнего сообщения в чате
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedChat.id);

      setMessageText('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      setUser(data.user);
      setScreen('chatList');
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setScreen('auth');
    setEmail('');
    setPassword('');
    setChats([]);
    setSelectedChat(null);
    setMessages([]);
  };

  // New chat screen
  if (screen === 'newChat') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setScreen('chatList'); setSearchEmail(''); setFoundUsers([]); }}>
            <Text style={styles.backButton}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Новый чат</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Введите email пользователя"
            value={searchEmail}
            onChangeText={setSearchEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchUsers}
            disabled={searching}
          >
            <Text style={styles.searchButtonText}>
              {searching ? '...' : 'Найти'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.userList}>
          {foundUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>👤 Поиск пользователей</Text>
              <Text style={styles.emptyHint}>Введите email для поиска</Text>
            </View>
          ) : (
            foundUsers.map((foundUser) => (
              <TouchableOpacity
                key={foundUser.id}
                style={styles.userItem}
                onPress={() => createChatWithUser(foundUser)}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {foundUser.email[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{foundUser.email}</Text>
                  <Text style={styles.userHint}>Нажмите для создания чата</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // Chat screen
  if (screen === 'chat' && selectedChat) {
    const chatName = selectedChat.type === 'individual'
      ? selectedChat.otherUserEmail || 'Пользователь'
      : selectedChat.name || 'Групповой чат';

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setScreen('chatList'); setSelectedChat(null); }}>
            <Text style={styles.backButton}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{chatName}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.messagesContainer}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.sender_id === user.id ? styles.myMessage : styles.otherMessage
              ]}
            >
              <Text style={[
                styles.messageText,
                msg.sender_id === user.id && { color: '#fff' }
              ]}>
                {msg.content}
              </Text>
              <Text style={[
                styles.messageTime,
                msg.sender_id === user.id && { color: '#e0e0e0' }
              ]}>
                {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Введите сообщение..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Chat list screen
  if (screen === 'chatList') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Svyas Messenger</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => setScreen('newChat')}
        >
          <Text style={styles.newChatButtonText}>+ Новый чат</Text>
        </TouchableOpacity>

        <ScrollView style={styles.chatList}>
          {chats.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>📭 Нет чатов</Text>
              <Text style={styles.emptyHint}>Создайте первый чат</Text>
            </View>
          ) : (
            chats.map((chat) => {
              const chatName = chat.type === 'individual'
                ? chat.otherUserEmail || 'Пользователь'
                : chat.name || 'Групповой чат';

              return (
                <TouchableOpacity
                  key={chat.id}
                  style={styles.chatItem}
                  onPress={() => {
                    setSelectedChat(chat);
                    setScreen('chat');
                  }}
                >
                  <View style={styles.chatAvatar}>
                    <Text style={styles.chatAvatarText}>
                      {chatName[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>{chatName}</Text>
                    <Text style={styles.chatLastMessage}>
                      {new Date(chat.updated_at).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  // Auth screen
  return (
    <View style={styles.container}>
      <View style={styles.authContainer}>
        <Text style={styles.title}>Svyas Messenger</Text>
        <Text style={styles.subtitle}>Вход в систему</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Загрузка...' : 'Войти'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Тестовые аккаунты:{'\n'}
          user1@example.com / password123{'\n'}
          user2@example.com / password123
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    width: '100%',
    maxWidth: 400,
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
  },
  hint: {
    marginTop: 20,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  chatList: {
    flex: 1,
  },
  userList: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 24,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 16,
    color: '#999',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatLastMessage: {
    fontSize: 14,
    color: '#666',
  },
  userHint: {
    fontSize: 14,
    color: '#999',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
  },
});
