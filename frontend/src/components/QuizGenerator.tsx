import React, { useState } from 'react'
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

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

const QuizGenerator = () => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuizResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [questionsPerPage, setQuestionsPerPage] = useState(2)
  const [batchSize, setBatchSize] = useState(3)

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
    if (!file) {
      setError('Please select a PDF file first')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('questionsPerPage', questionsPerPage.toString())
    formData.append('batchSize', batchSize.toString())

    try {
      const response = await fetch('http://localhost:3000/api/quiz/generate', {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quiz Generator Test</h1>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Upload PDF</h2>
          
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

          {/* Settings */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Questions per Page
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={questionsPerPage}
                onChange={(e) => setQuestionsPerPage(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Size (pages)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateQuiz}
            disabled={!file || loading}
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
            <h2 className="text-xl font-semibold mb-4 text-green-600 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              Quiz Generated Successfully!
            </h2>

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

