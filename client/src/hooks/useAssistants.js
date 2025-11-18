import { useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  fetchUserAssistants,
  createCall,
  clearError,
  clearLastCallResult,
  setSelectedAssistant,
  clearSelectedAssistant,
  selectAssistants,
  selectSelectedAssistant,
  selectAssistantsLoading,
  selectAssistantsError,
  selectCallLoading,
  selectCallError,
  selectLastCallResult
} from '../redux/slices/assistantSlice'

/**
 * Custom hook for managing assistant-related state and operations
 */
export const useAssistants = () => {
  const dispatch = useDispatch()

  // Redux selectors
  const assistants = useSelector(selectAssistants)
  const selectedAssistant = useSelector(selectSelectedAssistant)
  const isLoading = useSelector(selectAssistantsLoading)
  const error = useSelector(selectAssistantsError)
  const callLoading = useSelector(selectCallLoading)
  const callError = useSelector(selectCallError)
  const lastCallResult = useSelector(selectLastCallResult)

  // Actions
  const loadAssistants = useCallback((filters = {}) => {
    dispatch(fetchUserAssistants(filters))
  }, [dispatch])

  const selectAssistant = useCallback((assistant) => {
    dispatch(setSelectedAssistant(assistant))
  }, [dispatch])

  const clearSelectedAssist = useCallback(() => {
    dispatch(clearSelectedAssistant())
  }, [dispatch])

  const makeCall = useCallback((callData) => {
    dispatch(createCall(callData))
  }, [dispatch])

  const clearErrors = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  const clearCallResult = useCallback(() => {
    dispatch(clearLastCallResult())
  }, [dispatch])

  // Auto-load assistants on mount
  useEffect(() => {
    if (assistants.length === 0 && !isLoading) {
      loadAssistants()
    }
  }, [assistants.length, isLoading, loadAssistants])

  return {
    // State
    assistants,
    selectedAssistant,
    isLoading,
    error,
    callLoading,
    callError,
    lastCallResult,
    
    // Actions
    loadAssistants,
    selectAssistant,
    clearSelectedAssist,
    makeCall,
    clearErrors,
    clearCallResult,
    
    // Computed values
    hasAssistants: assistants.length > 0,
    isCallReady: assistants.length > 0 && !isLoading,
  }
}

export default useAssistants