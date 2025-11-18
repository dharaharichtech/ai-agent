import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import leadReducer from './slices/leadSlice'
import pdfReducer from './slices/pdfSlice'
import assistantReducer from './slices/assistantSlice'
import callReducer from './slices/callSlice'
import projectReducer from './slices/projectSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    leads: leadReducer,
    pdf: pdfReducer,
    assistants: assistantReducer,
    calls: callReducer,
    projects: projectReducer,
  },
})