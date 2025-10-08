import React, { useState, useEffect } from 'react'
import { Upload, Loader2, CheckCircle, AlertCircle, Home, FileText, PlayCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import API_ENDPOINTS from '../config'

interface QuizQuestion {
  id: string
  type: 'mcq' | 'saq' | 'laq'
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  pageNumbers: number[]
  difficulty: string
  topic: string
}

interface QuizResponse {
  success: boolean
  totalQuestions: number
  totalPages: number
  batchesProcessed: number
  questions: QuizQuestion[]
  breakdown: {
    mcq: number
    saq: number
    laq: number
  }
}

interface UploadedPDF {
  id: string
  title: string
  filename: string
  namespace: string
  cloudinaryUrl?: string
  localFileId?: string
}

const QuizGenerator = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuizResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [questionsPerPage, setQuestionsPerPage] = useState(2)
  const [batchSize, setBatchSize] = useState(3)
  const [uploadedPDFs, setUploadedPDFs] = useState<UploadedPDF[]>([])
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null)
  const [loadingPDFs, setLoadingPDFs] = useState(false)
  const [useUploadedFile, setUseUploadedFile] = useState(false)

  // Fetch uploaded PDFs on component mount
  useEffect(() => {
    fetchUploadedPDFs()
  }, [])

  const fetchUploadedPDFs = async () => {
    setLoadingPDFs(true)
    try {
      const response = await fetch(API_ENDPOINTS.CHAT_CONVERSATIONS)
      const data = await response.json()
      
      if (data.success && data.conversations) {
        setUploadedPDFs(data.conversations)
      }
    } catch (err) {
      console.error('Error fetching uploaded PDFs:', err)
    } finally {
      setLoadingPDFs(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError(null)
      setResult(null)
    } else {
      setError('Please select a valid PDF file')
    }
  }

  const handleGenerateQuiz = async () => {
    // Check if using uploaded file or new file
    if (useUploadedFile) {
      if (!selectedPDF) {
        setError('Please select a PDF from the list')
        return
      }
      await generateFromUploadedPDF()
    } else {
      if (!file) {
        setError('Please select a PDF file first')
        return
      }
      await generateFromNewPDF()
    }
  }

  const generateFromNewPDF = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('questionsPerPage', questionsPerPage.toString())
    formData.append('batchSize', batchSize.toString())

    try {
      const response = await fetch(API_ENDPOINTS.QUIZ_GENERATE, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
      }

      const data: QuizResponse = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateFromUploadedPDF = async () => {
    if (!selectedPDF) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Get the PDF URL from the selected conversation
      const pdf = uploadedPDFs.find(p => p.id === selectedPDF)
      if (!pdf) {
        throw new Error('PDF not found')
      }

      // Get PDF URL (Cloudinary or local)
      const pdfUrl = pdf.cloudinaryUrl || (pdf.localFileId ? API_ENDPOINTS.UPLOADS(pdf.localFileId) : null)
      
      if (!pdfUrl) {
        throw new Error('PDF file not available')
      }

      // Download the PDF file
      const pdfResponse = await fetch(pdfUrl)
      if (!pdfResponse.ok) {
        throw new Error('Failed to download PDF')
      }
      
      const pdfBlob = await pdfResponse.blob()
      const pdfFile = new File([pdfBlob], pdf.filename, { type: 'application/pdf' })

      // Now generate quiz with the downloaded file
      const formData = new FormData()
      formData.append('pdf', pdfFile)
      formData.append('questionsPerPage', questionsPerPage.toString())
      formData.append('batchSize', batchSize.toString())

      const response = await fetch(API_ENDPOINTS.QUIZ_GENERATE, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
      }

      const data: QuizResponse = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quiz Generator</h1>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Select PDF</h2>
          
          {/* Tab Selection */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setUseUploadedFile(false)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                !useUploadedFile
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upload New PDF
            </button>
            <button
              onClick={() => setUseUploadedFile(true)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                useUploadedFile
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Use Uploaded PDF ({uploadedPDFs.length})
            </button>
          </div>

          {/* New PDF Upload */}
          {!useUploadedFile && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Click to upload PDF
                </span>
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && (
                <div className="mt-4 text-sm text-green-600 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {file.name}
                </div>
              )}
            </div>
          )}

          {/* Uploaded PDFs Selection */}
          {useUploadedFile && (
            <div>
              {loadingPDFs ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Loading PDFs...</p>
                </div>
              ) : uploadedPDFs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No PDFs uploaded yet</p>
                  <p className="text-sm mt-2">Upload a PDF in the Chat section first</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {uploadedPDFs.map((pdf) => (
                    <div
                      key={pdf.id}
                      onClick={() => setSelectedPDF(pdf.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPDF === pdf.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start">
                        <FileText className={`w-5 h-5 mt-0.5 mr-3 ${
                          selectedPDF === pdf.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{pdf.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{pdf.filename}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {pdf.cloudinaryUrl && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                ☁️ Cloud
                              </span>
                            )}
                            {pdf.localFileId && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                📁 Local
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedPDF === pdf.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600 ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          <div className="mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">🤖 AI-Powered Generation:</span>
                <br />
                Our AI will intelligently analyze your content and generate the optimal number of questions based on content depth and complexity. Quality over quantity!
              </p>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Size (pages processed together)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 3 pages per batch for better context
              </p>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateQuiz}
            disabled={loading || (useUploadedFile ? !selectedPDF : !file)}
            className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Quiz... (This may take 30-60 seconds)
              </>
            ) : (
              'Generate Quiz'
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-green-600 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2" />
                Quiz Generated Successfully!
              </h2>
              <button
                onClick={() => navigate('/take-quiz', { state: { questions: result.questions } })}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PlayCircle className="w-6 h-6" />
                Start Interactive Quiz
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.breakdown.mcq}</div>
                <div className="text-sm text-gray-600">MCQs</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{result.breakdown.saq}</div>
                <div className="text-sm text-gray-600">SAQs</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{result.breakdown.laq}</div>
                <div className="text-sm text-gray-600">LAQs</div>
              </div>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              Processed {result.totalPages} pages in {result.batchesProcessed} batches
            </div>

            {/* Questions List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {result.questions.map((q, idx) => (
                <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">Q{idx + 1}.</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        q.type === 'mcq' ? 'bg-green-100 text-green-700' :
                        q.type === 'saq' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {q.type.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        q.difficulty === 'easy' ? 'bg-blue-100 text-blue-700' :
                        q.difficulty === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Pages: {q.pageNumbers.join(', ')}
                    </span>
                  </div>

                  <p className="font-medium text-gray-900 mb-2">{q.question}</p>

                  {q.options && (
                    <div className="space-y-1 mb-2 ml-4">
                      {q.options.map((opt, i) => (
                        <div key={i} className="text-sm text-gray-700">{opt}</div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-sm">
                      <span className="font-semibold text-green-600">Answer: </span>
                      {q.correctAnswer}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-semibold text-gray-600">Explanation: </span>
                      {q.explanation}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Topic: {q.topic}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizGenerator

