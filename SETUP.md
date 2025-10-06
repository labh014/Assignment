# Setup Instructions

Follow these steps to get the BeyondChats application running on your machine.

## Prerequisites

Make sure you have the following installed:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

## Installation Steps

### 1. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including:
- React and React DOM
- Vite (build tool)
- Tailwind CSS (styling)
- react-pdf (PDF rendering)
- lucide-react (icons)
- TypeScript and type definitions

### 2. Add Sample PDFs (Optional)

For testing with NCERT Class XI Physics textbooks:

1. Visit [NCERT Official Website](https://ncert.nic.in/textbook.php?keph1=0-8)
2. Download the Physics textbook chapters
3. Place them in the `public/pdfs/` directory with these names:
   - `chapter1.pdf` - Physical World
   - `chapter2.pdf` - Units and Measurements
   - `chapter3.pdf` - Motion in a Straight Line
   - `chapter4.pdf` - Motion in a Plane
   - `chapter5.pdf` - Laws of Motion

**Note:** You can also test the app by uploading any PDF file using the upload feature!

### 3. Start Development Server

```bash
npm run dev
```

The application will start and you'll see output like:
```
VITE v6.0.1  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 4. Open in Browser

Open your web browser and navigate to:
```
http://localhost:5173
```

## Project Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Troubleshooting

### Dependencies not installing?
- Make sure you have a stable internet connection
- Try deleting `node_modules` folder and `package-lock.json`, then run `npm install` again

### Port 5173 already in use?
- Vite will automatically use the next available port
- Or you can stop the process using port 5173

### PDF not loading?
- Make sure the PDF file is valid
- Check browser console for specific errors
- Try uploading a different PDF

### Build errors?
- Make sure all dependencies are installed: `npm install`
- Check that you're using Node.js version 18 or higher: `node --version`

## Next Steps

Once the app is running:
1. Try uploading a PDF file using the "Upload Your PDF" button
2. Or select a sample PDF from the list (if you've added them)
3. Navigate through the PDF using the viewer controls
4. Try zooming in and out

## Features Implemented

✅ Source selector with "All PDFs" and "Specific PDF" modes
✅ PDF upload functionality
✅ PDF viewer with navigation controls
✅ Zoom in/out functionality
✅ Responsive design for mobile and desktop
✅ Clean, modern UI

## Support

If you encounter any issues, please check:
1. Browser console for JavaScript errors
2. Terminal for build errors
3. README.md for additional information

