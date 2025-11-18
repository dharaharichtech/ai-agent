import React, { useState } from 'react';
import { X, Bot, Mic, Brain, Settings, Save, AlertCircle, Check } from 'lucide-react';

const CreateAssistantModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    voiceProvider: '11labs',
    voiceId: 'default',
    firstMessage: '',
    firstMessageMode: 'assistant-speaks-first',
    recordingEnabled: true,
    maxDuration: 1800,
    metadata: {
      type: 'general',
      purpose: '',
      tags: [],
      industry: '',
      language: 'en',
      timezone: 'UTC'
    },
    status: 'testing'
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Configuration options
  const providers = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-3-sonnet', 'claude-3-haiku'] },
    { value: 'google', label: 'Google', models: ['gemini-pro', 'gemini-pro-vision'] }
  ];

  const voiceProviders = [
    { value: '11labs', label: 'ElevenLabs', voices: ['default', 'alloy', 'echo', 'fable'] },
    { value: 'playht', label: 'PlayHT', voices: ['default', 'sarah', 'michael', 'emma'] },
    { value: 'deepgram', label: 'Deepgram', voices: ['default', 'aura-asteria', 'aura-luna'] },
    { value: 'azure', label: 'Azure', voices: ['default', 'en-US-JennyNeural', 'en-US-AriaNeural'] },
    { value: 'openai', label: 'OpenAI', voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] }
  ];

  const assistantTypes = [
    { value: 'sales', label: 'Sales Assistant', description: 'Handles sales inquiries and lead qualification', icon: '💼' },
    { value: 'support', label: 'Customer Support', description: 'Provides customer service and technical support', icon: '🎧' },
    { value: 'lead-capture', label: 'Lead Capture', description: 'Captures leads and collects contact information', icon: '🎯' },
    { value: 'follow-up', label: 'Follow-up', description: 'Follows up with prospects and customers', icon: '📞' },
    { value: 'survey', label: 'Survey', description: 'Conducts surveys and collects feedback', icon: '📊' },
    { value: 'appointment', label: 'Appointment Booking', description: 'Schedules appointments and meetings', icon: '📅' },
    { value: 'general', label: 'General Assistant', description: 'General purpose AI assistant', icon: '🤖' }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Real Estate', 'Education', 
    'Retail', 'Manufacturing', 'Consulting', 'Marketing', 'Other'
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'hi', label: 'Hindi' },
    { value: 'zh', label: 'Chinese' }
  ];

  // Get available models for selected provider
  const getAvailableModels = () => {
    const provider = providers.find(p => p.value === formData.provider);
    return provider ? provider.models : [];
  };

  // Get available voices for selected voice provider
  const getAvailableVoices = () => {
    const provider = voiceProviders.find(p => p.value === formData.voiceProvider);
    return provider ? provider.voices : [];
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Assistant name is required';
    if (!formData.systemPrompt.trim()) newErrors.systemPrompt = 'System prompt is required';
    if (formData.systemPrompt.length > 5000) newErrors.systemPrompt = 'System prompt must be under 5000 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        name: '',
        description: '',
        systemPrompt: '',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        voiceProvider: '11labs',
        voiceId: 'default',
        firstMessage: '',
        firstMessageMode: 'assistant-speaks-first',
        recordingEnabled: true,
        maxDuration: 1800,
        metadata: {
          type: 'general',
          purpose: '',
          tags: [],
          industry: '',
          language: 'en',
          timezone: 'UTC'
        },
        status: 'testing'
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Error creating assistant:', error);
      setErrors({ submit: 'Failed to create assistant. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create AI Assistant</h2>
              <p className="text-sm text-gray-600 mt-1">Step {currentStep} of 3 - Build your voice AI assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-sm transition-all duration-300 ${
                  step < currentStep 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : step === currentStep
                    ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <Check className="h-6 w-6" /> : step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-2 mx-4 rounded-full transition-all duration-300 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span className={`transition-colors ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
              Basic Information
            </span>
            <span className={`transition-colors ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
              AI Configuration
            </span>
            <span className={`transition-colors ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>
              Voice & Settings
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Assistant Basic Information</h3>
                  <p className="text-gray-600">Let's start by setting up your assistant's identity and purpose</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Assistant Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter assistant name (e.g., Sales Assistant)"
                      className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all ${
                        errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Brief description of what this assistant does"
                      rows={3}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Assistant Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {assistantTypes.map((type) => (
                        <div
                          key={type.value}
                          onClick={() => handleInputChange('metadata.type', type.value)}
                          className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${
                            formData.metadata.type === type.value
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">{type.icon}</div>
                            <div className="font-semibold text-gray-900 mb-1">{type.label}</div>
                            <div className="text-xs text-gray-600">{type.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Industry
                      </label>
                      <select
                        value={formData.metadata.industry}
                        onChange={(e) => handleInputChange('metadata.industry', e.target.value)}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all"
                      >
                        <option value="">Select industry</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Language
                      </label>
                      <select
                        value={formData.metadata.language}
                        onChange={(e) => handleInputChange('metadata.language', e.target.value)}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all"
                      >
                        {languages.map((lang) => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: AI Configuration */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI Configuration</h3>
                  <p className="text-gray-600">Configure your assistant's AI model and behavior</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      System Prompt *
                    </label>
                    <div className="relative">
                      <textarea
                        value={formData.systemPrompt}
                        onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                        placeholder="Define how your assistant should behave and respond..."
                        rows={8}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none ${
                          errors.systemPrompt ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      />
                      <div className="absolute bottom-3 right-3 text-sm text-gray-400">
                        {formData.systemPrompt.length}/5000
                      </div>
                    </div>
                    {errors.systemPrompt ? (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.systemPrompt}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">
                        Define the personality, role, and behavior of your assistant
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        AI Provider
                      </label>
                      <select
                        value={formData.provider}
                        onChange={(e) => {
                          handleInputChange('provider', e.target.value);
                          // Reset model when provider changes
                          const newProvider = providers.find(p => p.value === e.target.value);
                          if (newProvider && newProvider.models.length > 0) {
                            handleInputChange('model', newProvider.models[0]);
                          }
                        }}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all"
                      >
                        {providers.map((provider) => (
                          <option key={provider.value} value={provider.value}>
                            {provider.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        AI Model
                      </label>
                      <select
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all"
                      >
                        {getAvailableModels().map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      First Message
                    </label>
                    <textarea
                      value={formData.firstMessage}
                      onChange={(e) => handleInputChange('firstMessage', e.target.value)}
                      placeholder="What should the assistant say when the call starts?"
                      rows={3}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all resize-none"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      This message will be spoken when the call connects
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      First Message Mode
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        onClick={() => handleInputChange('firstMessageMode', 'assistant-speaks-first')}
                        className={`p-5 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.firstMessageMode === 'assistant-speaks-first'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">Assistant Speaks First</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Assistant starts the conversation
                        </div>
                      </div>
                      <div
                        onClick={() => handleInputChange('firstMessageMode', 'wait-for-user')}
                        className={`p-5 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.firstMessageMode === 'wait-for-user'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">Wait for User</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Wait for user to speak first
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Voice & Settings */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                  <Mic className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Voice & Settings</h3>
                  <p className="text-gray-600">Configure voice and call settings for your assistant</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Voice Provider
                      </label>
                      <select
                        value={formData.voiceProvider}
                        onChange={(e) => {
                          handleInputChange('voiceProvider', e.target.value);
                          // Reset voice when provider changes
                          const newProvider = voiceProviders.find(p => p.value === e.target.value);
                          if (newProvider && newProvider.voices.length > 0) {
                            handleInputChange('voiceId', newProvider.voices[0]);
                          }
                        }}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all"
                      >
                        {voiceProviders.map((provider) => (
                          <option key={provider.value} value={provider.value}>
                            {provider.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Voice
                      </label>
                      <select
                        value={formData.voiceId}
                        onChange={(e) => handleInputChange('voiceId', e.target.value)}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all"
                      >
                        {getAvailableVoices().map((voice) => (
                          <option key={voice} value={voice}>{voice}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Max Call Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.maxDuration}
                      onChange={(e) => handleInputChange('maxDuration', parseInt(e.target.value))}
                      min="30"
                      max="3600"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Maximum duration for calls (30 seconds to 1 hour)
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">
                        Recording Enabled
                      </label>
                      <p className="text-sm text-gray-500 mt-1">
                        Record calls for quality and training purposes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.recordingEnabled}
                        onChange={(e) => handleInputChange('recordingEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300 transition-all"
                    >
                      <option value="testing">Testing</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-500">
                      Start with "Testing" to try it out before making it active
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="px-6 py-4 bg-red-50 border-t border-red-200">
              <p className="text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-xl">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Assistant
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CreateAssistantModal;