import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download,
  Eye,
  X,
  CheckCircle
} from 'lucide-react'
import { pdfService } from '../api/aiAgentService'
import {
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
} from '../redux/slices/pdfSlice'
import Loader from '../components/common/Loader'

const PdfUpload = () => {
  const dispatch = useDispatch()
  const { pdfs, isLoading, isUploading, error, uploadProgress } = useSelector((state) => state.pdf)
  
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchPdfs()
  }, [])

  const fetchPdfs = async () => {
    try {
      dispatch(fetchPdfsStart())
      const data = await pdfService.getPdfs()
      dispatch(fetchPdfsSuccess(data))
    } catch (error) {
      dispatch(fetchPdfsFailure(error.response?.data?.message || 'Failed to fetch PDFs'))
    }
  }

  const handleFileSelect = (files) => {
    const file = files[0]
    if (file && file.type === 'application/pdf') {
      uploadFile(file)
    } else {
      dispatch(uploadPdfFailure('Please select a valid PDF file'))
    }
  }

  const uploadFile = async (file) => {
    try {
      dispatch(uploadPdfStart())
      const formData = new FormData()
      formData.append('pdf', file)

      const data = await pdfService.uploadPdf(formData, (progress) => {
        dispatch(uploadPdfProgress(progress))
      })

      dispatch(uploadPdfSuccess(data))
    } catch (error) {
      dispatch(uploadPdfFailure(error.response?.data?.message || 'Failed to upload PDF'))
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this PDF?')) {
      try {
        dispatch(deletePdfStart())
        await pdfService.deletePdf(id)
        dispatch(deletePdfSuccess(id))
      } catch (error) {
        dispatch(deletePdfFailure(error.response?.data?.message || 'Failed to delete PDF'))
      }
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PDF Upload</h1>
          <p className="text-gray-600">Upload and manage your PDF documents</p>
        </div>
        <div className="text-sm text-gray-500">
          {pdfs.length} document{pdfs.length !== 1 ? 's' : ''} uploaded
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Loader size="lg" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Uploading PDF...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload size={48} className="text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your PDF here, or <span className="text-primary-600">browse</span>
                </p>
                <p className="text-sm text-gray-500">
                  Support for single PDF file upload. Max file size: 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Success/Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center space-x-2">
            <X size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* PDF List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Uploaded Documents</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" text="Loading documents..." />
          </div>
        ) : pdfs.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {pdfs.map((pdf) => (
              <div key={pdf._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText size={20} className="text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pdf.originalName}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-500">
                          {formatFileSize(pdf.size)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(pdf.uploadedAt)}
                        </p>
                        {pdf.processed && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle size={14} className="text-green-500" />
                            <span className="text-xs text-green-600">Processed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => window.open(pdf.fileUrl, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                      title="View PDF"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = pdf.fileUrl
                        link.download = pdf.originalName
                        link.click()
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                      title="Download PDF"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(pdf._id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                      title="Delete PDF"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
            <p className="text-gray-600 mb-4">
              Upload your first PDF document to get started
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              <Upload size={20} />
              <span>Upload PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Tips for PDF Upload</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Maximum file size: 10MB</li>
          <li>• Only PDF files are supported</li>
          <li>• Files are automatically processed for AI analysis</li>
          <li>• Processed documents can be used in AI conversations</li>
        </ul>
      </div>
    </div>
  )
}

export default PdfUpload