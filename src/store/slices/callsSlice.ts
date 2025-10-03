import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase, TABLES } from '../../services/supabase';
import { Call, CallParticipant } from '../../types';

interface CallsState {
  activeCall: Call | null;
  callHistory: Call[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CallsState = {
  activeCall: null,
  callHistory: [],
  isLoading: false,
  error: null,
};

export const initiateCall = createAsyncThunk(
  'calls/initiate',
  async ({ type, chatId, initiatorId }: { type: 'voice' | 'video'; chatId: string; initiatorId: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CALLS)
        .insert({
          type,
          chatId,
          initiatorId,
          status: 'ringing',
          participants: [],
          isRecorded: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Call;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const endCall = createAsyncThunk(
  'calls/end',
  async ({ callId, duration }: { callId: string; duration: number }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CALLS)
        .update({
          status: 'ended',
          endedAt: new Date().toISOString(),
          duration,
        })
        .eq('id', callId)
        .select()
        .single();

      if (error) throw error;
      return data as Call;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCallHistory = createAsyncThunk(
  'calls/fetchHistory',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CALLS)
        .select('*')
        .or(`initiatorId.eq.${userId}`)
        .order('startedAt', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Call[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const callsSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {
    setActiveCall: (state, action: PayloadAction<Call | null>) => {
      state.activeCall = action.payload;
    },
    updateCallStatus: (state, action: PayloadAction<{ callId: string; status: Call['status'] }>) => {
      if (state.activeCall?.id === action.payload.callId) {
        state.activeCall.status = action.payload.status;
      }
    },
    addParticipant: (state, action: PayloadAction<{ callId: string; participant: CallParticipant }>) => {
      if (state.activeCall?.id === action.payload.callId) {
        state.activeCall.participants.push(action.payload.participant);
      }
    },
    removeParticipant: (state, action: PayloadAction<{ callId: string; userId: string }>) => {
      if (state.activeCall?.id === action.payload.callId) {
        state.activeCall.participants = state.activeCall.participants.filter(
          p => p.userId !== action.payload.userId
        );
      }
    },
  },
  extraReducers: (builder) => {
    // Initiate Call
    builder
      .addCase(initiateCall.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initiateCall.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeCall = action.payload;
      })
      .addCase(initiateCall.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // End Call
    builder
      .addCase(endCall.fulfilled, (state, action) => {
        state.activeCall = null;
        state.callHistory.unshift(action.payload);
      });

    // Fetch Call History
    builder
      .addCase(fetchCallHistory.fulfilled, (state, action) => {
        state.callHistory = action.payload;
      });
  },
});

export const { setActiveCall, updateCallStatus, addParticipant, removeParticipant } = callsSlice.actions;
export default callsSlice.reducer;
