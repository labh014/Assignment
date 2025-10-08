import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import InteractiveQuiz from './InteractiveQuiz'

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

const TakeQuiz = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  useEffect(() => {
    // Get questions from navigation state
    if (location.state && location.state.questions) {
      setQuestions(location.state.questions)
    } else {
      // No questions provided, redirect back
      navigate('/quiz')
    }
  }, [location.state, navigate])

  const handleClose = () => {
    navigate('/quiz')
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/quiz')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Back to Generator</span>
            <span className="sm:hidden">Back</span>
          </button>
          <h1 className="text-base sm:text-xl font-bold text-gray-900">Quiz Session</h1>
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm sm:text-base"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <InteractiveQuiz questions={questions} onClose={handleClose} />
      </div>
    </div>
  )
}

export default TakeQuiz


