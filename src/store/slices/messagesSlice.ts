import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase, TABLES } from '../../services/supabase';
import { Message } from '../../types';

interface MessagesState {
  messagesByChatId: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  messagesByChatId: {},
  isLoading: false,
  error: null,
};

export const fetchMessages = createAsyncThunk(
  'messages/fetch',
  async (chatId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .select('*')
        .eq('chatId', chatId)
        .order('createdAt', { ascending: true });

      if (error) throw error;
      return { chatId, messages: data as Message[] };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/send',
  async (message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .insert({
          ...message,
          isEdited: false,
          isDeleted: false,
          deliveredTo: [],
          readBy: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const editMessage = createAsyncThunk(
  'messages/edit',
  async ({ messageId, content }: { messageId: string; content: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .update({ content, isEdited: true })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messages/delete',
  async (messageId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .update({ isDeleted: true, content: '' })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const { chatId } = action.payload;
      if (!state.messagesByChatId[chatId]) {
        state.messagesByChatId[chatId] = [];
      }
      state.messagesByChatId[chatId].push(action.payload);
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      delete state.messagesByChatId[action.payload];
    },
  },
  extraReducers: (builder) => {
    // Fetch Messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messagesByChatId[action.payload.chatId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send Message
    builder
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { chatId } = action.payload;
        if (!state.messagesByChatId[chatId]) {
          state.messagesByChatId[chatId] = [];
        }
        state.messagesByChatId[chatId].push(action.payload);
      });

    // Edit Message
    builder
      .addCase(editMessage.fulfilled, (state, action) => {
        const { chatId, id } = action.payload;
        const messages = state.messagesByChatId[chatId];
        if (messages) {
          const index = messages.findIndex(m => m.id === id);
          if (index !== -1) {
            messages[index] = action.payload;
          }
        }
      });

    // Delete Message
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { chatId, id } = action.payload;
        const messages = state.messagesByChatId[chatId];
        if (messages) {
          const index = messages.findIndex(m => m.id === id);
          if (index !== -1) {
            messages[index] = action.payload;
          }
        }
      });
  },
});

export const { addMessage, clearMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
