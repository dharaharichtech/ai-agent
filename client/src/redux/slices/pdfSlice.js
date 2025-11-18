import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  pdfs: [],
  isLoading: false,
  isUploading: false,
  error: null,
  uploadProgress: 0,
}

const pdfSlice = createSlice({
  name: 'pdf',
  initialState,
  reducers: {
    // Fetch PDFs
    fetchPdfsStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchPdfsSuccess: (state, action) => {
      state.isLoading = false
      state.pdfs = action.payload
      state.error = null
    },
    fetchPdfsFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
    },
    
    // Upload PDF
    uploadPdfStart: (state) => {
      state.isUploading = true
      state.error = null
      state.uploadProgress = 0
    },
    uploadPdfProgress: (state, action) => {
      state.uploadProgress = action.payload
    },
    uploadPdfSuccess: (state, action) => {
      state.isUploading = false
      state.pdfs.push(action.payload)
      state.error = null
      state.uploadProgress = 0
    },
    uploadPdfFailure: (state, action) => {
      state.isUploading = false
      state.error = action.payload
      state.uploadProgress = 0
    },
    
    // Delete PDF
    deletePdfStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    deletePdfSuccess: (state, action) => {
      state.isLoading = false
      state.pdfs = state.pdfs.filter(pdf => pdf._id !== action.payload)
      state.error = null
    },
    deletePdfFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
    },
    
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  fetchPdfsStart,
  fetchPdfsSuccess,
  fetchPdfsFailure,
  uploadPdfStart,
  uploadPdfProgress,
  uploadPdfSuccess,
  uploadPdfFailure,
  deletePdfStart,
  deletePdfSuccess,
  deletePdfFailure,
  clearError,
} = pdfSlice.actions

export default pdfSlice.reducer