# BeyondChats - AI-Powered Learning Companion

A fully functional, responsive web application that helps school students revise from their coursebooks using LLMs.

## Features

### Implemented (Phase 1)
- ✅ **Source Selector**: Choose between all uploaded PDFs or a specific PDF
- ✅ **PDF Upload**: Upload your own PDF coursebooks
- ✅ **PDF Viewer**: Display selected PDFs with navigation and zoom controls
- ✅ **Responsive Design**: Works seamlessly on desktop and mobile devices
- ✅ **Modern UI**: Clean, ChatGPT-inspired interface

### Coming Soon (Phase 2)
- 🔄 **Quiz Generator Engine**: Generate MCQs, SAQs, and LAQs from PDFs
- 🔄 **Chat UI**: Virtual teacher/teaching companion interface
- 🔄 **Progress Tracking**: Dashboard to track learning journey
- 🔄 **RAG with Citations**: AI answers with page numbers and quotes
- 🔄 **YouTube Recommendations**: Relevant educational videos

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **PDF Rendering**: react-pdf (PDF.js)
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd beyondchats
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Adding Sample PDFs

Place your NCERT Class XI Physics PDF files in the `public/pdfs/` directory:
- `chapter1.pdf` - Physical World
- `chapter2.pdf` - Units and Measurements
- `chapter3.pdf` - Motion in a Straight Line
- `chapter4.pdf` - Motion in a Plane
- `chapter5.pdf` - Laws of Motion

You can download these from [NCERT Official Website](https://ncert.nic.in/).

## Project Structure

```
beyondchats/
├── public/
│   ├── pdfs/           # Sample PDF files
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── SourceSelector.tsx
│   │   └── PDFViewer.tsx
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Code Quality

- TypeScript strict mode enabled
- ESLint configured for code quality
- Responsive design with Tailwind CSS
- Component-based architecture
- Clean, maintainable code structure

## License

MIT

## Author

Built for BeyondChats Assignment

