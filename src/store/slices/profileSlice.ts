import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase, TABLES, BUCKETS } from '../../services/supabase';
import { Profile, PrivacySettings } from '../../types';

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'profile/fetch',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('userId', userId)
        .single();

      if (error) throw error;
      return data as Profile;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'profile/update',
  async ({ userId, updates }: { userId: string; updates: Partial<Profile> }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update(updates)
        .eq('userId', userId)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'profile/uploadAvatar',
  async ({ userId, file }: { userId: string; file: any }, { rejectWithValue }) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKETS.AVATARS)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKETS.AVATARS)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePrivacySettings = createAsyncThunk(
  'profile/updatePrivacy',
  async ({ userId, settings }: { userId: string; settings: PrivacySettings }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update({ privacySettings: settings })
        .eq('userId', userId)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null;
    },
    setProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Profile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Upload Avatar
    builder
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.avatar = action.payload;
        }
      });

    // Update Privacy Settings
    builder
      .addCase(updatePrivacySettings.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { clearProfile, setProfile } = profileSlice.actions;
export default profileSlice.reducer;
