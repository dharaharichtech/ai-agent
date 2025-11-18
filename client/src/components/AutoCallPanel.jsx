import React, { useState, useEffect } from 'react';
import { Play, Square, Settings, Users, Phone } from 'lucide-react';
import autoCallService from '../api/autoCallService';
import Alert from './common/Alert';
import Loader from './common/Loader';

const AutoCallPanel = () => {
  const [status, setStatus] = useState({
    isRunning: false,
    callDelay: 30000,
    maxCallsPerBatch: 5
  });
  const [eligibleLeads, setEligibleLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    callDelay: 30000,
    maxCallsPerBatch: 5,
    statuses: ['pending', 'failed']
  });

  useEffect(() => {
    fetchStatus();
    fetchEligibleLeads();
  }, []);

  useEffect(() => {
    if (alert && alert.type === 'success') {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchStatus = async () => {
    try {
      console.log('Fetching auto call status...');
      const result = await autoCallService.getAutoCallStatus();
      console.log('Auto call status result:', result);
      if (result.success) {
        setStatus(result.data);
        setSettings(prev => ({
          ...prev,
          callDelay: result.data.callDelay,
          maxCallsPerBatch: result.data.maxCallsPerBatch
        }));
      } else {
        console.error('Failed to fetch status:', result.error);
      }
    } catch (error) {
      console.error('Error fetching auto call status:', error);
    }
  };

  const fetchEligibleLeads = async () => {
    try {
      console.log('Fetching eligible leads with settings:', settings.statuses);
      const result = await autoCallService.getEligibleLeads({
        statuses: settings.statuses,
        limit: 10
      });
      console.log('Eligible leads result:', result);
      if (result.success) {
        setEligibleLeads(result.data);
        console.log('Found eligible leads:', result.data.length);
      } else {
        console.error('Failed to fetch eligible leads:', result.error);
      }
    } catch (error) {
      console.error('Error fetching eligible leads:', error);
    }
  };

  const handleStartAutoCalling = async () => {
    setIsLoading(true);
    try {
      const options = {
        statuses: settings.statuses,
        callDelay: settings.callDelay,
        maxCallsPerBatch: settings.maxCallsPerBatch
      };
      
      const result = await autoCallService.startAutoCalling(options);
      if (result.success) {
        setStatus(result.data);
        setAlert({ type: 'success', message: 'Auto calling started successfully!' });
        fetchEligibleLeads();
      } else {
        setAlert({ type: 'error', message: result.error });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to start auto calling' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopAutoCalling = async () => {
    setIsLoading(true);
    try {
      const result = await autoCallService.stopAutoCalling();
      if (result.success) {
        setStatus(result.data);
        setAlert({ type: 'success', message: 'Auto calling stopped successfully!' });
      } else {
        setAlert({ type: 'error', message: result.error });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to stop auto calling' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const result = await autoCallService.updateSettings({
        callDelay: settings.callDelay,
        maxCallsPerBatch: settings.maxCallsPerBatch
      });
      if (result.success) {
        setStatus(result.data);
        setAlert({ type: 'success', message: 'Settings updated successfully!' });
        setShowSettings(false);
      } else {
        setAlert({ type: 'error', message: result.error });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update settings' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="mb-4"
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Phone className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Auto Calling</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status.isRunning 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {status.isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          {status.isRunning ? (
            <button
              onClick={handleStopAutoCalling}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? <Loader size="sm" /> : <Square className="w-4 h-4" />}
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleStartAutoCalling}
              disabled={isLoading || eligibleLeads.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <Loader size="sm" /> : <Play className="w-4 h-4" />}
              <span>Start</span>
            </button>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Auto Call Settings</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Call Delay (seconds)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={settings.callDelay / 1000}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  callDelay: parseInt(e.target.value) * 1000
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Calls per Batch</label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxCallsPerBatch}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maxCallsPerBatch: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Call Status Types</label>
            <div className="flex space-x-4">
              {['pending', 'failed'].map(statusType => (
                <label key={statusType} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.statuses.includes(statusType)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings(prev => ({
                          ...prev,
                          statuses: [...prev.statuses, statusType]
                        }));
                      } else {
                        setSettings(prev => ({
                          ...prev,
                          statuses: prev.statuses.filter(s => s !== statusType)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">{statusType}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleUpdateSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Save Settings
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>Eligible Leads: {eligibleLeads.length}</span>
        </div>
        <div>Delay: {status.callDelay / 1000}s</div>
        <div>Batch Size: {status.maxCallsPerBatch}</div>
      </div>

      {eligibleLeads.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Next Leads to Call:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {eligibleLeads.slice(0, 5).map(lead => (
              <div key={lead._id} className="flex justify-between items-center text-sm bg-gray-50 px-3 py-1 rounded">
                <span>{lead.full_name}</span>
                <span className="text-gray-500">{lead.contact_number}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  lead.callConnectionStatus === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {lead.callConnectionStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoCallPanel;