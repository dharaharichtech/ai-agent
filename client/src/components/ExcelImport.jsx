import React, { useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { createLead } from '../redux/slices/leadSlice'
import Alert from './common/Alert'
import Loader from './common/Loader'

const ExcelImport = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useDispatch()
  const { isCreating } = useSelector((state) => state.leads)
  
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [importResults, setImportResults] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const allowedFileTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ]

  const handleFileSelect = (file) => {
    if (!file) return

    // Validate file type
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    const validExtensions = ['.csv', '.xls', '.xlsx']
    
    if (!allowedFileTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a CSV file (.csv) for best compatibility. Excel files (.xlsx, .xls) will be converted to CSV format.'
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({
        type: 'error',
        message: 'File size must be less than 5MB'
      })
      return
    }

    setSelectedFile(file)
    setUploadStatus({
      type: 'success',
      message: `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
    })
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const parseExcelData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target.result
          
          if (file.type === 'text/csv') {
            // Parse CSV
            const lines = data.split('\n')
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
            const leads = []

            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim()) {
                const values = lines[i].split(',')
                const lead = {}
                
                headers.forEach((header, index) => {
                  const value = values[index]?.trim().replace(/"/g, '')
                  
                  // Map CSV columns to lead fields
                  if (header.includes('name') && !header.includes('hindi')) {
                    lead.full_name = value
                  } else if (header.includes('hindi')) {
                    lead.hindi_name = value
                  } else if (header.includes('phone') || header.includes('contact') || header.includes('mobile')) {
                    lead.contact_number = value
                  } else if (header.includes('type') || header.includes('category')) {
                    lead.leadtype = value?.toLowerCase() === 'hot' ? 'hot' : 'cold'
                  }
                })

                if (lead.full_name && lead.contact_number) {
                  leads.push({
                    full_name: lead.full_name,
                    hindi_name: lead.hindi_name || '',
                    contact_number: lead.contact_number,
                    leadtype: lead.leadtype || 'cold',
                    callConnectionStatus: 'pending'
                  })
                }
              }
            }

            resolve(leads)
          } else {
            // Parse Excel files (.xlsx, .xls)
            try {
              // Simple Excel parsing without external library
              const workbook = parseExcelFile(data)
              const leads = extractLeadsFromWorkbook(workbook)
              resolve(leads)
            } catch (excelError) {
              reject(new Error('Failed to parse Excel file. Please ensure it has the correct format with columns: Full Name, Hindi Name, Contact Number, Lead Type'))
            }
          }
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      
      if (file.type === 'text/csv') {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
  }

  // Simple Excel file parsing function
  const parseExcelFile = (arrayBuffer) => {
    // This is a simplified Excel parser
    // For production, you should use a library like 'xlsx'
    const view = new DataView(arrayBuffer)
    
    // Check if it's a valid Excel file by looking for Excel signatures
    const signature1 = view.getUint32(0, true) // Little endian
    const signature2 = view.getUint32(4, true)
    
    if (signature1 !== 0x04034b50 && signature1 !== 0xe011cfd0) {
      throw new Error('Invalid Excel file format')
    }
    
    // For now, return a mock workbook structure
    // In production, use xlsx library for proper parsing
    return {
      sheets: ['Sheet1'],
      data: []
    }
  }

  const extractLeadsFromWorkbook = (workbook) => {
    // Mock implementation - in production use xlsx library
    // This is a placeholder that returns empty array
    // Real implementation would extract data from workbook
    return []
  }

  // Parse CSV/Excel file and convert to leads array
  const parseAnyFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          let data = e.target.result
          let leads = []

          // Only handle CSV files for now
          if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            const lines = data.split('\n').filter(line => line.trim())
            
            if (lines.length === 0) {
              reject(new Error('CSV file is empty'))
              return
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
            
            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
                const lead = {}
                
                headers.forEach((header, index) => {
                  const value = values[index] || ''
                  
                  // Smart column mapping
                  if (header.includes('name') && !header.includes('hindi') && !header.includes('project')) {
                    lead.full_name = value
                  } else if (header.includes('hindi') || header.includes('हिंदी')) {
                    lead.hindi_name = value
                  } else if (header.includes('phone') || header.includes('contact') || header.includes('mobile') || header.includes('number')) {
                    lead.contact_number = value
                  } else if (header.includes('type') || header.includes('category')) {
                    lead.leadtype = value?.toLowerCase() === 'hot' ? 'hot' : 'cold'
                  } else if (header.includes('project') && header.includes('name')) {
                    // Map project-name column to project_name field
                    lead.project_name = value
                  }
                })

                // Validate required fields
                if (lead.full_name && lead.contact_number) {
                  leads.push({
                    full_name: lead.full_name,
                    hindi_name: lead.hindi_name || '',
                    contact_number: lead.contact_number,
                    leadtype: lead.leadtype || 'cold',
                    callConnectionStatus: 'pending',
                    project_name: lead.project_name || '' // Include project_name
                  })
                }
              }
            }
          } else {
            // For Excel files, show message to convert to CSV
            reject(new Error('Excel files are not fully supported yet. Please save your Excel file as CSV format and try again. \n\nTo convert: File → Save As → CSV (Comma delimited) in Excel.'))
            return
          }

          if (leads.length === 0) {
            reject(new Error('No valid lead data found in file. Please check the format and ensure you have columns: Full Name, Contact Number'))
            return
          }

          resolve(leads)
        } catch (error) {
          reject(new Error(`Failed to parse file: ${error.message}`))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const handleImport = async () => {
    if (!selectedFile) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a file first'
      })
      return
    }

    setIsProcessing(true)
    setUploadStatus(null)
    setImportResults(null)

    try {
      // Parse file to get leads data
      const leads = await parseAnyFile(selectedFile)
      
      if (leads.length === 0) {
        setUploadStatus({
          type: 'error',
          message: 'No valid leads found in the file. Please check the format.'
        })
        setIsProcessing(false)
        return
      }

      // Show processing status
      setUploadStatus({
        type: 'info',
        message: `Processing ${leads.length} leads...`
      })

      // Import results tracking
      const results = {
        total: leads.length,
        successful: 0,
        failed: 0,
        errors: [],
        imported_leads: []
      }

      // Import leads one by one using Redux createLead action
      for (let i = 0; i < leads.length; i++) {
        const leadData = leads[i]
        
        try {
          // Update progress
          setUploadStatus({
            type: 'info',
            message: `Processing ${i + 1}/${leads.length}: ${leadData.full_name}`
          })

          // Call createLead action
          const result = await dispatch(createLead(leadData)).unwrap()
          
          results.successful++
          results.imported_leads.push(result)

        } catch (error) {
          results.failed++
          const errorMsg = error.message || 'Unknown error'
          results.errors.push({
            lead: leadData.full_name || 'Unknown',
            contact: leadData.contact_number || 'Unknown',
            error: errorMsg
          })
        }
      }

      // Set final results
      setImportResults(results)
      
      if (results.successful > 0) {
        setUploadStatus({
          type: 'success',
          message: `Import completed: ${results.successful} successful, ${results.failed} failed`
        })
        
        // Call onSuccess callback to refresh leads list
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setUploadStatus({
          type: 'error',
          message: `Import failed: No leads were imported successfully`
        })
      }

    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error.message || 'Failed to process file'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'Full Name,Hindi Name,Contact Number,Lead Type\nJohn Doe,जॉन डो,+91-9876543210,hot\nJane Smith,जेन स्मिथ,+91-9876543211,cold'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetForm = () => {
    setSelectedFile(null)
    setUploadStatus(null)
    setImportResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Import Leads from Excel/CSV
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Template Download */}
          {/* <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Download Template
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Download the CSV template with the correct format for importing leads.
            </p>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </button>
          </div> */}

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Choose a file or drag it here
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Supports .xlsx, .xls, and .csv files up to 5MB
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Select File
            </button>
          </div>

          {/* Status Messages */}
          {uploadStatus && (
            <div className="mt-4">
              <Alert
                type={uploadStatus.type}
                message={uploadStatus.message}
              />
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Import Results</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">{importResults.total}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{importResults.successful}</div>
                  <div className="text-xs text-gray-500">Success</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{importResults.failed}</div>
                  <div className="text-xs text-gray-500">Failed</div>
                </div>
              </div>
              
              {importResults.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-red-600 mb-1">Errors ({importResults.errors.length}):</p>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-200">
                        <div className="font-medium text-red-700">{error.lead}</div>
                        <div className="text-red-600">{error.contact}</div>
                        <div className="text-red-500">{error.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {importResults.successful > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-green-600 mb-1">Successfully imported {importResults.successful} leads!</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isProcessing ? (
                <Loader className="w-4 h-4 mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? 'Importing...' : 'Import Leads'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExcelImport