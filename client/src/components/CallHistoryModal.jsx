import React, { useState, useRef } from 'react'
import { X, Play, Pause, Download, Clock, DollarSign, Phone, User, MessageCircle, Calendar } from 'lucide-react'

const CallHistoryModal = ({ callHistory, isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  if (!isOpen || !callHistory) return null

  const { bolnaCallData } = callHistory
  const {
    transcript,
    recordingUrl,
    stereoRecordingUrl,
    summary,
    cost,
    duration: callDuration,
    messages = [],
    startedAt,
    endedAt,
    analysis
  } = bolnaCallData

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatCallDuration = () => {
    // Try to calculate from startedAt and endedAt first
    if (startedAt && endedAt) {
      const start = new Date(startedAt);
      const end = new Date(endedAt);
      const durationMs = end - start;
      const durationSeconds = Math.floor(durationMs / 1000);
      return formatTime(durationSeconds);
    }
    
    // Fallback to bolnaCallData duration
    return formatTime(callDuration || 0);
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(4)}`
  }

  // Parse transcript into messages if available
  const parseTranscript = (transcript) => {
    if (!transcript) return []
    
    const lines = transcript.split('\n').filter(line => line.trim())
    return lines.map((line, index) => {
      const [role, ...messageParts] = line.split(': ')
      return {
        role: role === 'AI' ? 'assistant' : 'user',
        message: messageParts.join(': '),
        id: index,
        secondsFromStart: index * 10 // Fallback timing
      }
    })
  }

  // Get conversation messages with proper timing
  const conversationMessages = messages.length > 0 ? 
    messages.filter(msg => msg.role !== 'system').map((msg, index) => ({
      role: msg.role === 'bot' ? 'assistant' : msg.role,
      message: msg.message,
      secondsFromStart: msg.secondsFromStart || 0,
      id: msg.id || index
    })) : 
    parseTranscript(transcript)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Call History Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Call with {callHistory.phoneNumber} • {formatDate(startedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Call Summary */}
          <div className="px-6 py-4 bg-blue-50 border-b">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Call Summary</h3>
            <p className="text-sm text-blue-800">
              {summary || analysis?.summary || 'No summary available'}
            </p>
          </div>

          {/* Call Stats */}
          <div className="px-6 py-4 border-b">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-medium">{formatCallDuration()}</p>
                </div>
              </div>
              {/* <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Cost</p>
                  <p className="text-sm font-medium">{formatCurrency(cost || 0)}</p>
                </div>
              </div> */}
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm font-medium capitalize">{callHistory.status || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium">{formatDate(startedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Player */}
          {recordingUrl && (
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                Call Recording
              </h3>
              
              <div className="bg-white p-4 rounded-lg border">
                <audio
                  ref={audioRef}
                  src={recordingUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePlayPause}
                    className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <a
                    href={recordingUrl}
                    download
                    className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Download Recording"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                {stereoRecordingUrl && (
                  <div className="mt-2">
                    <a
                      href={stereoRecordingUrl}
                      download
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Download Stereo Version
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversation */}
          <div className="px-6 py-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              Conversation Transcript
            </h3>
            
            <div className="space-y-3">
              {conversationMessages.map((msg, index) => (
                <div 
                  key={msg.id || index}
                  className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.role === 'assistant' 
                        ? 'bg-blue-100 text-gray-900' 
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {msg.role === 'assistant' ? (
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      <span className={`text-xs font-medium ${
                        msg.role === 'assistant' ? 'text-blue-800' : 'text-blue-100'
                      }`}>
                        {msg.role === 'assistant' ? 'AI' : 'Customer'}
                      </span>
                      {msg.secondsFromStart !== undefined && (
                        <span className={`text-xs ${
                          msg.role === 'assistant' ? 'text-blue-600' : 'text-blue-200'
                        }`}>
                          {formatTime(msg.secondsFromStart)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Raw Transcript Fallback */}
            {transcript && conversationMessages.length === 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {transcript}
                </pre>
              </div>
            )}
          </div>

          {/* Technical Details */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Technical Details
              </summary>
              <div className="mt-3 space-y-2 text-xs text-gray-600">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Call ID:</strong> {callHistory.callId}
                  </div>
                  <div>
                    <strong>Assistant:</strong> {callHistory.assistantId?.name || 'Unknown'}
                  </div>
                  <div>
                    <strong>Phone Number:</strong> {callHistory.phoneNumber}
                  </div>
                  <div>
                    <strong>Started:</strong> {formatDate(startedAt)}
                  </div>
                  {endedAt && (
                    <div>
                      <strong>Ended:</strong> {formatDate(endedAt)}
                    </div>
                  )}
                  <div>
                    <strong>Source:</strong> {callHistory.metadata?.source || 'Unknown'}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallHistoryModal