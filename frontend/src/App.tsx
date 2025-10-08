import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import QuizGenerator from './components/QuizGenerator'
import Chat from './components/Chat'
import TakeQuiz from './components/TakeQuiz'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<QuizGenerator />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/take-quiz" element={<TakeQuiz />} />
      </Routes>
    </Router>
  )
}

export default App

