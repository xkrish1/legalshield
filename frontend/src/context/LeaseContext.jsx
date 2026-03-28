import React, { createContext, useContext, useState } from 'react'

const LeaseContext = createContext(null)

export function LeaseProvider({ children }) {
  const [analysisResult, setAnalysisResult]       = useState(null)
  const [isLoading, setIsLoading]                 = useState(false)
  const [error, setError]                         = useState(null)
  const [uploadedFileName, setUploadedFileName]   = useState('')

  const reset = () => {
    setAnalysisResult(null)
    setError(null)
    setUploadedFileName('')
  }

  return (
    <LeaseContext.Provider value={{
      analysisResult, setAnalysisResult,
      isLoading, setIsLoading,
      error, setError,
      uploadedFileName, setUploadedFileName,
      reset,
    }}>
      {children}
    </LeaseContext.Provider>
  )
}

export function useLease() {
  const ctx = useContext(LeaseContext)
  if (!ctx) throw new Error('useLease must be used inside LeaseProvider')
  return ctx
}
