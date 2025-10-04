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
  chat_id: string;
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
  const [screen, setScreen] = useState<'auth' | 'register' | 'chatList' | 'chat' | 'newChat' | 'profile'>('auth');
  const [isRegister, setIsRegister] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [profileName, setProfileName] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');

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

  useEffect(() => {
    if (user && screen === 'profile') {
      loadProfile();
    }
  }, [user, screen]);

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
        const newMessage = payload.new as Message;
        // Проверяем, нет ли уже сообщения с таким ID (избегаем дубликатов)
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;

    setSearching(true);
    setError('');
    console.log('Searching for:', searchEmail);

    try {
      // Ищем по email
      const { data: emailData, error: emailError } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', `%${searchEmail}%`)
        .neq('id', user.id)
        .limit(10);

      // Ищем по телефону в profiles
      const { data: phoneData, error: phoneError } = await supabase
        .from('profiles')
        .select('id, phone')
        .ilike('phone', `%${searchEmail}%`)
        .neq('id', user.id)
        .limit(10);

      console.log('Email search result:', { emailData, emailError });
      console.log('Phone search result:', { phoneData, phoneError });

      // Собираем уникальные ID пользователей
      const userIds = new Set<string>();

      if (emailData) {
        emailData.forEach(u => userIds.add(u.id));
      }

      if (phoneData) {
        phoneData.forEach(p => userIds.add(p.id));
      }

      if (userIds.size === 0) {
        setError(`Пользователи не найдены`);
        setFoundUsers([]);
        return;
      }

      // Получаем полную информацию о найденных пользователях
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', Array.from(userIds));

      if (usersError) throw usersError;

      setFoundUsers(usersData || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Ошибка поиска');
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

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      chat_id: selectedChat.id,
      sender_id: user.id,
      content: messageText,
      created_at: new Date().toISOString(),
    };

    // Оптимистичное обновление - добавляем сообщение сразу в UI
    setMessages(prev => [...prev, tempMessage]);
    const currentMessageText = messageText;
    setMessageText('');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: user.id,
          type: 'text',
          content: currentMessageText,
        })
        .select()
        .single();

      if (error) throw error;

      // Заменяем временное сообщение на реальное с правильным ID
      setMessages(prev =>
        prev.map(msg => msg.id === tempMessage.id ? data : msg)
      );

      // Обновляем время последнего сообщения в чате
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedChat.id);

    } catch (err: any) {
      // Если ошибка - убираем временное сообщение
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setMessageText(currentMessageText);
      setError(err.message);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      if (!email || !phone || !password) {
        throw new Error('Заполните все поля');
      }

      if (password !== confirmPassword) {
        throw new Error('Пароли не совпадают');
      }

      if (password.length < 6) {
        throw new Error('Пароль должен быть минимум 6 символов');
      }

      // Регистрация пользователя в Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!data.user) throw new Error('Ошибка создания пользователя');

      // Создаем профиль сразу (не полагаемся на триггер)
      console.log('Creating profile for user:', data.user.id, 'with phone:', phone);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          phone: phone,
          name: email.split('@')[0],
          privacy_settings: {
            onlineVisibility: 'everyone',
            statusVisibility: 'everyone',
            profilePhotoVisibility: 'everyone'
          }
        })
        .select();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Не бросаем ошибку, т.к. пользователь уже создан
        // Пробуем обновить если профиль уже существует
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ phone })
          .eq('id', data.user.id)
          .select();

        if (updateError) {
          console.error('Profile update error:', updateError);
        } else {
          console.log('Profile updated:', updateData);
        }
      } else {
        console.log('Profile created successfully:', profileData);
      }

      setUser(data.user);
      setScreen('chatList');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      let userEmail = email;

      // Если вход по телефону, найдем email по телефону
      if (loginMethod === 'phone') {
        if (!phone) throw new Error('Введите номер телефона');

        console.log('Looking for profile with phone:', phone);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', phone)
          .single();

        console.log('Profile search result:', { profileData, profileError });

        if (profileError || !profileData) {
          throw new Error('Пользователь с таким телефоном не найден');
        }

        // Получаем email пользователя
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', profileData.id)
          .single();

        console.log('User search result:', { userData, userError });

        if (userError || !userData) {
          throw new Error('Ошибка получения данных пользователя');
        }

        userEmail = userData.email;
        console.log('Found email:', userEmail);
      } else {
        if (!email) throw new Error('Введите email');
      }

      if (!password) throw new Error('Введите пароль');

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
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

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setProfileName(data.name || '');
        setProfileStatus(data.status || '');
        setProfileAvatar(data.avatar || '');
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileName,
          status: profileStatus,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, name: profileName, status: profileStatus });
      setScreen('chatList');
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Загружаем файл в Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Обновляем профиль с новым avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfileAvatar(publicUrl);
      setProfile({ ...profile, avatar: publicUrl });
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки фото');
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
            placeholder="Введите email или телефон"
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

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

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

  // Profile screen
  if (screen === 'profile') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('chatList')}>
            <Text style={styles.backButton}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Профиль</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.profileContainer}>
          <View style={styles.avatarSection}>
            {profileAvatar ? (
              <img src={profileAvatar} alt="Avatar" style={{ width: 120, height: 120, borderRadius: 60 }} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>📷</Text>
              </View>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload" style={{ marginTop: 16 }}>
              <View style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>Загрузить фото</Text>
              </View>
            </label>
          </View>

          <View style={styles.profileFields}>
            <Text style={styles.fieldLabel}>Имя</Text>
            <TextInput
              style={styles.input}
              placeholder="Ваше имя"
              value={profileName}
              onChangeText={setProfileName}
            />

            <Text style={styles.fieldLabel}>Статус</Text>
            <TextInput
              style={styles.input}
              placeholder="Ваш статус (как в ICQ)"
              value={profileStatus}
              onChangeText={setProfileStatus}
              maxLength={100}
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{user?.email || ''}</Text>

            <Text style={styles.fieldLabel}>Телефон</Text>
            <Text style={styles.fieldValue}>{profile?.phone || 'Не указан'}</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleProfileUpdate}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Chat list screen
  if (screen === 'chatList') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Svyas Messenger</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => setScreen('profile')} style={styles.profileButton}>
              <Text style={styles.profileButtonText}>👤</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Выйти</Text>
            </TouchableOpacity>
          </View>
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
        <Text style={styles.subtitle}>{isRegister ? 'Регистрация' : 'Вход в систему'}</Text>

        {!isRegister && (
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, loginMethod === 'email' && styles.toggleButtonActive]}
              onPress={() => setLoginMethod('email')}
            >
              <Text style={[styles.toggleText, loginMethod === 'email' && styles.toggleTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, loginMethod === 'phone' && styles.toggleButtonActive]}
              onPress={() => setLoginMethod('phone')}
            >
              <Text style={[styles.toggleText, loginMethod === 'phone' && styles.toggleTextActive]}>
                Телефон
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {(isRegister || loginMethod === 'email') && (
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        )}

        {(isRegister || loginMethod === 'phone') && (
          <TextInput
            style={styles.input}
            placeholder="Телефон (например: +79991234567)"
            value={phone}
            onChangeText={setPhone}
            autoCapitalize="none"
            keyboardType="phone-pad"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {isRegister && (
          <TextInput
            style={styles.input}
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={isRegister ? handleRegister : handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Загрузка...' : (isRegister ? 'Зарегистрироваться' : 'Войти')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
        >
          <Text style={styles.linkText}>
            {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </Text>
        </TouchableOpacity>

        {!isRegister && (
          <Text style={styles.hint}>
            Тестовые аккаунты:{'\n'}
            user1@example.com / password123{'\n'}
            user2@example.com / password123
          </Text>
        )}
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
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderBottomWidth: 1,
    borderBottomColor: '#ffcdd2',
  },
  hint: {
    marginTop: 20,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 12,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: 8,
    marginRight: 8,
  },
  profileButtonText: {
    fontSize: 24,
  },
  profileContainer: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
  },
  uploadButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  profileFields: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});
