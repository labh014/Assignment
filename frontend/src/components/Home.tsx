import React from 'react'
import { Link } from 'react-router-dom'
import { FileQuestion, BookOpen, Sparkles, MessageSquare } from 'lucide-react'

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Quiz Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your PDFs into interactive quizzes powered by AI. 
            Generate MCQs, Short Answer, and Long Answer questions automatically.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Link to="/quiz" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500">
            <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
              <FileQuestion className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Quiz Generator
            </h3>
            <p className="text-gray-600 mb-4">
              Transform your PDFs into interactive quizzes. Generate MCQs, SAQs, and LAQs with AI-powered intelligence, complete with answers and explanations.
            </p>
            <div className="text-blue-600 font-semibold flex items-center">
              Get Started →
            </div>
          </Link>

          <Link to="/chat" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-green-500">
            <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              RAG Chat
            </h3>
            <p className="text-gray-600 mb-4">
              Chat with your documents! Upload PDFs and ask questions to get intelligent, context-aware answers powered by RAG technology.
            </p>
            <div className="text-green-600 font-semibold flex items-center">
              Start Chatting →
            </div>
          </Link>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">AI-Powered</h4>
            <p className="text-sm text-gray-600">
              Powered by Google Gemini AI for intelligent content analysis
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">PDF Support</h4>
            <p className="text-sm text-gray-600">
              Upload any PDF and extract knowledge instantly
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="bg-pink-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <FileQuestion className="w-5 h-5 text-pink-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Smart Analysis</h4>
            <p className="text-sm text-gray-600">
              Context-aware processing with page references
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-x-4">
          <Link
            to="/quiz"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Generate Quiz
          </Link>
          <Link
            to="/chat"
            className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Chat with PDFs
          </Link>
        </div>

        {/* How it Works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          
          {/* Quiz Flow */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-blue-600 mb-4 text-center">Quiz Generator</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  1
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Upload PDF</h4>
                <p className="text-xs text-gray-600">Select your document</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  2
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Configure</h4>
                <p className="text-xs text-gray-600">Set preferences</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  3
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Generate</h4>
                <p className="text-xs text-gray-600">AI creates questions</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  4
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Review</h4>
                <p className="text-xs text-gray-600">Get quiz with answers</p>
              </div>
            </div>
          </div>

          {/* Chat Flow */}
          <div>
            <h3 className="text-xl font-semibold text-green-600 mb-4 text-center">RAG Chat</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  1
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Upload PDF</h4>
                <p className="text-xs text-gray-600">Upload your document</p>
              </div>
              <div className="text-center">
                <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  2
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Process</h4>
                <p className="text-xs text-gray-600">AI analyzes content</p>
              </div>
              <div className="text-center">
                <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  3
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Ask Questions</h4>
                <p className="text-xs text-gray-600">Chat naturally</p>
              </div>
              <div className="text-center">
                <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  4
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Get Answers</h4>
                <p className="text-xs text-gray-600">Intelligent responses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

