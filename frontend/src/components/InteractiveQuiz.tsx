import React, { useState } from 'react'
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Send, TrendingUp, TrendingDown } from 'lucide-react'

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

interface UserAnswer {
  questionId: string
  answer: string
  isCorrect?: boolean
}

interface InteractiveQuizProps {
  questions: QuizQuestion[]
  onClose: () => void
}

const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({ questions, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState('')

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

  const handleAnswerChange = (answer: string) => {
    setCurrentAnswer(answer)
  }

  const saveAnswer = () => {
    const existingAnswerIndex = userAnswers.findIndex(
      a => a.questionId === currentQuestion.id
    )

    if (existingAnswerIndex >= 0) {
      const newAnswers = [...userAnswers]
      newAnswers[existingAnswerIndex] = {
        questionId: currentQuestion.id,
        answer: currentAnswer
      }
      setUserAnswers(newAnswers)
    } else {
      setUserAnswers([
        ...userAnswers,
        {
          questionId: currentQuestion.id,
          answer: currentAnswer
        }
      ])
    }
  }

  const goToNext = () => {
    if (currentAnswer.trim()) {
      saveAnswer()
      setCurrentAnswer('')
    }
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      // Load saved answer if exists
      const savedAnswer = userAnswers.find(a => a.questionId === questions[currentQuestionIndex + 1].id)
      setCurrentAnswer(savedAnswer?.answer || '')
    }
  }

  const goToPrevious = () => {
    if (currentAnswer.trim()) {
      saveAnswer()
    }
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      // Load saved answer
      const savedAnswer = userAnswers.find(a => a.questionId === questions[currentQuestionIndex - 1].id)
      setCurrentAnswer(savedAnswer?.answer || '')
    }
  }

  const handleSubmit = () => {
    // Include current answer in final submission
    let finalAnswers = [...userAnswers]
    
    // Add or update current answer
    if (currentAnswer.trim()) {
      const existingAnswerIndex = finalAnswers.findIndex(
        a => a.questionId === currentQuestion.id
      )
      
      if (existingAnswerIndex >= 0) {
        finalAnswers[existingAnswerIndex] = {
          questionId: currentQuestion.id,
          answer: currentAnswer
        }
      } else {
        finalAnswers.push({
          questionId: currentQuestion.id,
          answer: currentAnswer
        })
      }
    }

    // Calculate results with correct answers
    const answersWithCorrectness = finalAnswers.map(userAns => {
      const question = questions.find(q => q.id === userAns.questionId)
      if (!question) {
        console.error('Question not found for ID:', userAns.questionId)
        return { ...userAns, isCorrect: false }
      }

      if (!question.correctAnswer) {
        console.error('No correct answer for question:', question.id)
        return { ...userAns, isCorrect: false }
      }

      const userAnswerNormalized = (userAns.answer || '').trim().toLowerCase()
      const correctAnswerNormalized = (question.correctAnswer || '').trim().toLowerCase()
      
      const isCorrect = userAnswerNormalized === correctAnswerNormalized

      return {
        ...userAns,
        isCorrect
      }
    })

    setUserAnswers(answersWithCorrectness)
    setIsSubmitted(true)
  }

  // Calculate score and analytics
  const score = userAnswers.filter(a => a.isCorrect).length
  const percentage = (score / totalQuestions) * 100
  
  // Topic analysis
  const topicPerformance = questions.reduce((acc, q) => {
    const userAnswer = userAnswers.find(a => a.questionId === q.id)
    if (!userAnswer) return acc

    if (!acc[q.topic]) {
      acc[q.topic] = { correct: 0, total: 0 }
    }
    acc[q.topic].total++
    if (userAnswer.isCorrect) {
      acc[q.topic].correct++
    }
    return acc
  }, {} as Record<string, { correct: number; total: number }>)

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 80) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (percentage >= 60) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (percentage >= 40) return { level: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const performance = getPerformanceLevel(percentage)

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        {/* Results Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Quiz Results</h2>
          
          {/* Score Circle */}
          <div className="relative inline-block">
            <svg className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="20"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={percentage >= 80 ? '#10b981' : percentage >= 60 ? '#3b82f6' : percentage >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="20"
                strokeDasharray={`${(percentage / 100) * 502.4} 502.4`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{score}/{totalQuestions}</div>
              <div className="text-sm sm:text-base lg:text-lg text-gray-600">{percentage.toFixed(0)}%</div>
            </div>
          </div>

          {/* Performance Badge */}
          <div className={`inline-block px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-base sm:text-lg font-semibold mt-3 sm:mt-4 ${performance.bgColor} ${performance.color}`}>
            {performance.level}
          </div>
        </div>

        {/* Topic Performance */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Performance by Topic</h3>
          <div className="space-y-3">
            {Object.entries(topicPerformance).map(([topic, perf]) => {
              const topicPercentage = (perf.correct / perf.total) * 100
              const isStrong = topicPercentage >= 70
              
              return (
                <div key={topic} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{topic}</span>
                    <div className="flex items-center gap-2">
                      {isStrong ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`font-semibold ${isStrong ? 'text-green-600' : 'text-red-600'}`}>
                        {perf.correct}/{perf.total} ({topicPercentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${isStrong ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${topicPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isStrong ? '✅ Strong' : '⚠️ Needs Practice'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Question by Question Review */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Detailed Review</h3>
          <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-96 overflow-y-auto">
            {questions.map((q, idx) => {
              const userAnswer = userAnswers.find(a => a.questionId === q.id)
              const isCorrect = userAnswer?.isCorrect
              
              return (
                <div
                  key={q.id}
                  className={`border-2 rounded-lg p-4 ${
                    isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <span className="font-bold">Q{idx + 1}.</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      q.type === 'mcq' ? 'bg-blue-100 text-blue-700' :
                      q.type === 'saq' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {q.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="font-medium mb-3">{q.question}</p>
                  
                  {q.options && (
                    <div className="space-y-1 mb-3">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded ${
                            opt === q.correctAnswer ? 'bg-green-200 font-semibold' :
                            opt === userAnswer?.answer ? 'bg-red-200' : 'bg-white'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Your Answer: </span>
                      <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                        {userAnswer?.answer || 'No answer'}
                      </span>
                    </div>
                    {!isCorrect && q.correctAnswer && (
                      <div>
                        <span className="font-semibold text-gray-700">Correct Answer: </span>
                        <span className="text-green-700">{q.correctAnswer}</span>
                      </div>
                    )}
                    {q.explanation && (
                      <div className="bg-white bg-opacity-70 p-2 rounded">
                        <span className="font-semibold text-gray-700">Explanation: </span>
                        <span className="text-gray-600">{q.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md font-medium hover:bg-gray-700"
          >
            Close Quiz
          </button>
          <button
            onClick={() => {
              setIsSubmitted(false)
              setCurrentQuestionIndex(0)
              setUserAnswers([])
              setCurrentAnswer('')
            }}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    )
  }

  // Quiz taking mode
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Interactive Quiz</h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs sm:text-sm text-gray-600">Answered</div>
          <div className="text-base sm:text-lg font-bold text-blue-600">
            {userAnswers.length}/{totalQuestions}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold pr-2">Q{currentQuestionIndex + 1}. {currentQuestion.question}</h3>
          <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 ${
            currentQuestion.type === 'mcq' ? 'bg-blue-100 text-blue-700' :
            currentQuestion.type === 'saq' ? 'bg-yellow-100 text-yellow-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {currentQuestion.type.toUpperCase()}
          </span>
        </div>

        {/* MCQ Options */}
        {currentQuestion.type === 'mcq' && currentQuestion.options && (
          <div className="space-y-2">
            {currentQuestion.options.map((option, idx) => (
              <label
                key={idx}
                className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  currentAnswer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="mr-3"
                />
                {option}
              </label>
            ))}
          </div>
        )}

        {/* SAQ/LAQ Text Input */}
        {(currentQuestion.type === 'saq' || currentQuestion.type === 'laq') && (
          <textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            rows={currentQuestion.type === 'laq' ? 8 : 4}
            className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        )}

        {/* Metadata */}
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <span>📚 Topic: {currentQuestion.topic}</span>
          <span>📄 Page: {currentQuestion.pageNumbers.join(', ')}</span>
          <span>⭐ Difficulty: {currentQuestion.difficulty}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={userAnswers.length === 0 && !currentAnswer.trim()}
            className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Submit Quiz</span>
            <span className="sm:hidden">Submit</span>
            {(userAnswers.length + (currentAnswer.trim() ? 1 : 0)) < totalQuestions && (
              <span className="text-xs ml-2">
                ({totalQuestions - userAnswers.length - (currentAnswer.trim() ? 1 : 0)} unanswered)
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={goToNext}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default InteractiveQuiz

