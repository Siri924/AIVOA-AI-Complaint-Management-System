import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  result: null,
  error: "",
};

const complaintSlice = createSlice({
  name: "complaint",
  initialState,

  reducers: {
    startProcessing: (state) => {
      state.loading = true;
      state.error = "";
      state.result = null;
    },

    processingSuccess: (state, action) => {
      state.loading = false;
      state.result = action.payload;
      state.error = "";
    },

    processingFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  startProcessing,
  processingSuccess,
  processingFailure,
} = complaintSlice.actions;

export default complaintSlice.reducer;