import React, { useState } from 'react'
import { FileText, Upload, ChevronRight } from 'lucide-react'

interface SourceSelectorProps {
  selectedPDF: string | null
  onSelectPDF: (pdf: string | null) => void
  uploadedFile: File | null
  onUploadFile: (file: File | null) => void
}

// Sample NCERT Class XI Physics PDFs
const samplePDFs = [
  { id: 'chapter1', name: 'Chapter 1: Physical World', url: '/pdfs/chapter1.pdf' },
  { id: 'chapter2', name: 'Chapter 2: Units and Measurements', url: '/pdfs/chapter2.pdf' },
  { id: 'chapter3', name: 'Chapter 3: Motion in a Straight Line', url: '/pdfs/chapter3.pdf' },
  { id: 'chapter4', name: 'Chapter 4: Motion in a Plane', url: '/pdfs/chapter4.pdf' },
  { id: 'chapter5', name: 'Chapter 5: Laws of Motion', url: '/pdfs/chapter5.pdf' },
]

const SourceSelector = ({
  selectedPDF,
  onSelectPDF,
  uploadedFile,
  onUploadFile,
}: SourceSelectorProps) => {
  const [sourceMode, setSourceMode] = useState<'all' | 'specific'>('all')

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      onUploadFile(file)
      onSelectPDF('uploaded')
      setSourceMode('specific')
    } else {
      alert('Please upload a valid PDF file')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
        <h2 className="text-lg font-semibold text-white">Source Selector</h2>
        <p className="text-sm text-blue-100 mt-1">Choose your study material</p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Source Mode Toggle */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Source Mode
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSourceMode('all')
                onSelectPDF(null)
              }}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                sourceMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All PDFs
            </button>
            <button
              onClick={() => setSourceMode('specific')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                sourceMode === 'specific'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Specific PDF
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
          <label
            htmlFor="pdf-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Upload Your PDF
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Click to browse or drag and drop
            </span>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {uploadedFile && (
            <div className="mt-3 flex items-center justify-center text-sm text-green-600">
              <FileText className="w-4 h-4 mr-1" />
              {uploadedFile.name}
            </div>
          )}
        </div>

        {/* Sample PDFs List */}
        {sourceMode === 'specific' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              NCERT Class XI Physics
            </label>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {samplePDFs.map((pdf) => (
                <button
                  key={pdf.id}
                  onClick={() => onSelectPDF(pdf.url)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedPDF === pdf.url
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-left">{pdf.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800">
            {sourceMode === 'all'
              ? '💡 All available PDFs will be used for generating questions and answers.'
              : '📚 Select a specific PDF to focus your study session.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default SourceSelector

