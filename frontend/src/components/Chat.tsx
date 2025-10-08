import React, { useState, useEffect, useRef } from 'react'
import { Upload, Send, Loader2, CheckCircle, AlertCircle, Home, FileText, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import PDFViewer from './PDFViewer'
import API_ENDPOINTS from '../config'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface Namespace {
  name: string
  displayName: string
  vectorCount?: number
}


interface Conversation {
  id: string
  title: string
  namespace: string
  filename: string
  cloudinaryUrl?: string
  localFileId?: string
  messageCount: number
  lastMessage?: Message
  createdAt: string
  updatedAt: string
}

const Chat = () => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null)
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null)
  const [cloudinaryPdfUrl, setCloudinaryPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [namespaces, setNamespaces] = useState<Namespace[]>([])
  const [selectedNamespace, setSelectedNamespace] = useState<string>('')
  const [loadingNamespaces, setLoadingNamespaces] = useState(false)
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [querying, setQuerying] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch namespaces and conversations on component mount
  useEffect(() => {
    fetchNamespaces()
    fetchConversations()
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (selectedFileUrl) {
        URL.revokeObjectURL(selectedFileUrl)
      }
    }
  }, [selectedFileUrl])

  const fetchNamespaces = async () => {
    setLoadingNamespaces(true)
    try {
      const response = await fetch(API_ENDPOINTS.CHAT_NAMESPACES)
      const data = await response.json()
      if (data.success && data.namespaces) {
        setNamespaces(data.namespaces)
      }
    } catch (err) {
      console.error('Error fetching namespaces:', err)
    } finally {
      setLoadingNamespaces(false)
    }
  }

  const fetchConversations = async () => {
    setLoadingConversations(true)
    try {
      const response = await fetch(API_ENDPOINTS.CHAT_CONVERSATIONS)
      const data = await response.json()
      if (data.success && data.conversations) {
        setConversations(data.conversations)
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadConversationHistory = async (namespace: string) => {
    try {
      console.log('Loading conversation history for:', namespace)
      setLoadingHistory(true)
      setMessages([]) // Clear current messages first
      setCurrentConversation(null)
      setCloudinaryPdfUrl(null) // Clear previous PDF URL
      
      // Load conversation history
      const response = await fetch(API_ENDPOINTS.CHAT_CONVERSATION_BY_NAMESPACE(namespace))
      const data = await response.json()
      
      console.log('Conversation history response:', data)
      
      if (data.success) {
        if (data.messages && data.messages.length > 0) {
          // Convert MongoDB messages to frontend format
          const formattedMessages: Message[] = data.messages.map((msg: any) => ({
            id: msg._id || msg.id,
            type: msg.type,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          }))
          
          setMessages(formattedMessages)
          setCurrentConversation(data.conversation)
          console.log('Loaded', formattedMessages.length, 'messages')
        } else {
          setMessages([])
          setCurrentConversation(data.conversation)
          console.log('No messages found, but conversation exists')
        }
      } else {
        setMessages([])
        setCurrentConversation(null)
        console.log('Failed to load conversation:', data.error)
      }

      // Load PDF URL - Priority: Cloudinary > Local File
      if (data.conversation) {
        // First try Cloudinary URL
        if (data.conversation.cloudinaryUrl) {
          setCloudinaryPdfUrl(data.conversation.cloudinaryUrl)
          console.log('✅ Using Cloudinary URL:', data.conversation.cloudinaryUrl)
        } 
        // Fallback to local file
        else if (data.conversation.localFileId) {
          const localUrl = API_ENDPOINTS.UPLOADS(data.conversation.localFileId)
          setCloudinaryPdfUrl(localUrl)
          console.log('📁 Using local file URL:', localUrl)
        }
        // Last resort: try API endpoint
        else {
          try {
            const pdfResponse = await fetch(API_ENDPOINTS.CHAT_PDF_URL(namespace))
            const pdfData = await pdfResponse.json()
            
            if (pdfData.success && pdfData.pdfUrl) {
              setCloudinaryPdfUrl(pdfData.pdfUrl)
              console.log(`📄 Loaded PDF from ${pdfData.source}:`, pdfData.pdfUrl)
            } else {
              console.log('⚠️ No PDF found for namespace:', namespace)
            }
          } catch (pdfError) {
            console.error('❌ Error loading PDF URL:', pdfError)
          }
        }
      }
      
    } catch (err) {
      console.error('Error loading conversation history:', err)
      setMessages([])
      setCurrentConversation(null)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError(null)
      setUploadSuccess(false)
      
      // Create URL for immediate PDF viewing
      const fileUrl = URL.createObjectURL(selectedFile)
      console.log('Created PDF URL:', fileUrl)
      setSelectedFileUrl(fileUrl)
    } else {
      setError('Please select a valid PDF file')
      setSelectedFileUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first')
      return
    }

    setUploading(true)
    setError(null)
    setUploadSuccess(false)

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const response = await fetch(API_ENDPOINTS.CHAT_UPLOAD, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setUploadSuccess(true)
        setUploadedFilename(data.filename)
        setUploadedFileId(data.fileId) // Use the actual file ID from backend
        setSelectedNamespace(data.namespace)
        
        // Clear previous PDF URL and set new one
        setCloudinaryPdfUrl(null)
        
        // Priority: Cloudinary URL > Local File URL
        if (data.cloudinaryUrl) {
          setCloudinaryPdfUrl(data.cloudinaryUrl)
          console.log('✅ Stored Cloudinary URL:', data.cloudinaryUrl)
        } else if (data.fileId) {
          // Fallback to local file
          const localUrl = API_ENDPOINTS.UPLOADS(data.fileId)
          setCloudinaryPdfUrl(localUrl)
          console.log('📁 Using local file URL:', localUrl)
        }
        
        // Clear the selected file URL (object URL) since we now have server URL
        if (selectedFileUrl) {
          URL.revokeObjectURL(selectedFileUrl)
          setSelectedFileUrl(null)
        }
        
        // Refresh namespaces
        await fetchNamespaces()
        
        // Add welcome message
        const welcomeMsg: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: `✅ Successfully processed "${data.filename}"! I've analyzed ${data.chunks} chunks from your document. You can now ask me questions about it.`,
          timestamp: new Date()
        }
        setMessages([welcomeMsg])
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload PDF')
      console.error('Error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim() || !selectedNamespace) {
      setError('Please enter a question and select a document')
      return
    }

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setQuerying(true)
    setError(null)

    try {
      const response = await fetch(API_ENDPOINTS.CHAT_QUERY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          namespace: selectedNamespace
        }),
      })

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Format bot response with Gemini's intelligent answer
        let botResponse = data.answer
        
        // Add sources (clean format without technical metrics)
        if (data.sources && data.sources.length > 0) {
          botResponse += `\n\n---\n📚 **Sources:**\n${data.sources.map((source: string, idx: number) => `${idx + 1}. ${source}`).join('\n')}`
        }

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: botResponse,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMsg])
        
        // Refresh conversations to show updated message count
        await fetchConversations()
      } else {
        throw new Error(data.error || 'Query failed')
      }
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `❌ Error: ${err instanceof Error ? err.message : 'Failed to process query'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
      console.error('Error:', err)
    } finally {
      setQuerying(false)
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
                RAG Chat
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-full w-full mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden">
        {/* Left Sidebar - Upload & Settings */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-3 sm:space-y-4 overflow-y-auto lg:max-h-full max-h-64 lg:max-h-none">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
              Upload PDF
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors mb-3">
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <span className="text-sm font-medium text-blue-600 hover:text-blue-700 block">
                  Click to upload
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
                <div className="mt-2 text-xs text-green-600 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {file.name}
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center text-sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Process
                </>
              )}
            </button>

            {uploadSuccess && uploadedFilename && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                ✅ {uploadedFilename} uploaded successfully!
              </div>
            )}
          </div>

          {/* Document Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <h2 className="text-lg font-semibold mb-3">Select Document</h2>
            
            <div className="space-y-2">
              <select
                value={selectedNamespace}
                onChange={(e) => {
                  setSelectedNamespace(e.target.value)
                  if (e.target.value) {
                    loadConversationHistory(e.target.value)
                  } else {
                    setMessages([])
                    setCurrentConversation(null)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                disabled={loadingNamespaces}
              >
                <option value="">Choose a document...</option>
                {namespaces.map((ns) => (
                  <option key={ns.name} value={ns.name}>
                    {ns.displayName} {ns.vectorCount ? `(${ns.vectorCount} chunks)` : ''}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchNamespaces}
                disabled={loadingNamespaces}
                className="w-full text-sm text-blue-600 hover:text-blue-700 py-1"
              >
                {loadingNamespaces ? 'Refreshing...' : '↻ Refresh list'}
              </button>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hidden lg:block">
            <h2 className="text-lg font-semibold mb-3">Recent Conversations</h2>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {loadingConversations ? (
                <div className="text-center text-sm text-gray-500">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="text-center text-sm text-gray-500">No conversations yet</div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-2 rounded cursor-pointer text-sm border ${
                      currentConversation?.id === conv.id
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      if (!loadingHistory) {
                        setSelectedNamespace(conv.namespace)
                        loadConversationHistory(conv.namespace)
                      }
                    }}
                  >
                    <div className="font-medium truncate">{conv.title}</div>
                    <div className="text-xs text-gray-500">
                      {conv.messageCount} messages • {new Date(conv.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-semibold mb-1">💡 How to use:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Upload a PDF document</li>
              <li>Wait for processing to complete</li>
              <li>Ask questions about the content</li>
              <li>Get AI-powered answers with sources</li>
            </ol>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-w-0 overflow-hidden h-96 lg:h-auto">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingHistory ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                  <p className="text-lg">Loading conversation...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No messages yet</p>
                  <p className="text-sm">Upload a PDF and start asking questions!</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-lg px-4 py-2 ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.type === 'bot' ? (
                      <div className="text-sm prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    )}
                    <div
                      className={`text-xs mt-1 ${
                        msg.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            {querying && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleQuery} className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  selectedNamespace
                    ? 'Ask a question about the document...'
                    : 'Please select a document first...'
                }
                disabled={!selectedNamespace || querying}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={!query.trim() || !selectedNamespace || querying}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                {querying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* PDF Viewer - Right Side */}
        <div className="w-full lg:w-96 flex-shrink-0 overflow-hidden hidden lg:block">
          <PDFViewer 
            pdfUrl={(() => {
              // Priority: Cloudinary URL > Selected file URL > Uploaded file ID
              const url = cloudinaryPdfUrl || selectedFileUrl || (uploadedFileId ? API_ENDPOINTS.UPLOADS(uploadedFileId) : null)
              console.log('PDF URL being passed to viewer:', url)
              console.log('Cloudinary URL:', cloudinaryPdfUrl)
              console.log('Selected file URL:', selectedFileUrl)
              console.log('Uploaded file ID:', uploadedFileId)
              return url
            })()}
            filename={currentConversation?.filename || file?.name || uploadedFilename}
          />
        </div>
      </div>
    </div>
  )
}

export default Chat

