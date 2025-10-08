// API Configuration
// Uses environment variable if available, otherwise defaults to localhost
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API Endpoints
export const API_ENDPOINTS = {
  // Quiz endpoints
  QUIZ_GENERATE: `${API_URL}/api/quiz/generate`,
  
  // Chat endpoints
  CHAT_UPLOAD: `${API_URL}/api/chat/upload`,
  CHAT_QUERY: `${API_URL}/api/chat/query`,
  CHAT_NAMESPACES: `${API_URL}/api/chat/namespaces`,
  CHAT_CONVERSATIONS: `${API_URL}/api/chat/conversations`,
  CHAT_CONVERSATION_BY_NAMESPACE: (namespace: string) => `${API_URL}/api/chat/conversations/${namespace}`,
  CHAT_PDF_URL: (namespace: string) => `${API_URL}/api/chat/pdf/${namespace}`,
  
  // Utility endpoints
  HEALTH: `${API_URL}/api/health`,
  UPLOADS: (fileId: string) => `${API_URL}/uploads/${fileId}`,
};

export default API_ENDPOINTS;

