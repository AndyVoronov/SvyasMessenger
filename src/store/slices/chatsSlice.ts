import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase, TABLES } from '../../services/supabase';
import { Chat } from '../../types';

interface ChatsState {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatsState = {
  chats: [],
  activeChat: null,
  isLoading: false,
  error: null,
};

export const fetchChats = createAsyncThunk(
  'chats/fetchAll',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHATS)
        .select(`
          *,
          chat_participants!inner(userId)
        `)
        .contains('participants', [userId])
        .order('updatedAt', { ascending: false });

      if (error) throw error;
      return data as Chat[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createChat = createAsyncThunk(
  'chats/create',
  async ({ type, participants, name }: { type: 'individual' | 'group'; participants: string[]; name?: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHATS)
        .insert({
          type,
          participants,
          name,
          createdBy: participants[0],
          isArchived: false,
          unreadCount: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Chat;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const archiveChat = createAsyncThunk(
  'chats/archive',
  async (chatId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHATS)
        .update({ isArchived: true })
        .eq('id', chatId)
        .select()
        .single();

      if (error) throw error;
      return data as Chat;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteChat = createAsyncThunk(
  'chats/delete',
  async (chatId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from(TABLES.CHATS)
        .delete()
        .eq('id', chatId);

      if (error) throw error;
      return chatId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<Chat | null>) => {
      state.activeChat = action.payload;
    },
    updateChatUnreadCount: (state, action: PayloadAction<{ chatId: string; count: number }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.unreadCount = action.payload.count;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Chats
    builder
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Chat
    builder
      .addCase(createChat.fulfilled, (state, action) => {
        state.chats.unshift(action.payload);
      });

    // Archive Chat
    builder
      .addCase(archiveChat.fulfilled, (state, action) => {
        const index = state.chats.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.chats[index] = action.payload;
        }
      });

    // Delete Chat
    builder
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.chats = state.chats.filter(c => c.id !== action.payload);
      });
  },
});

export const { setActiveChat, updateChatUnreadCount } = chatsSlice.actions;
export default chatsSlice.reducer;
