import React, { useState } from 'react'
import SourceSelector from './components/SourceSelector'
import PDFViewer from './components/PDFViewer'
import { MessageCircle } from 'lucide-react'

function App() {
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">BeyondChats</h1>
            <span className="text-sm text-gray-500 hidden sm:inline">
              AI-Powered Learning Companion
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Source Selector - Left Sidebar */}
          <div className="lg:col-span-1">
            <SourceSelector
              selectedPDF={selectedPDF}
              onSelectPDF={setSelectedPDF}
              uploadedFile={uploadedFile}
              onUploadFile={setUploadedFile}
            />
          </div>

          {/* PDF Viewer - Main Content */}
          <div className="lg:col-span-2">
            <PDFViewer
              selectedPDF={selectedPDF}
              uploadedFile={uploadedFile}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

