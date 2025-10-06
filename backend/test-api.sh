#!/bin/bash

# Simple test script for the BeyondChats API

echo "🧪 Testing BeyondChats API..."
echo ""

# Test 1: Health Check
echo "1️⃣ Testing health endpoint..."
curl -s http://localhost:3000/api/health | json_pp
echo ""
echo ""

# Test 2: Quiz Generation (you need to provide a PDF file)
echo "2️⃣ To test quiz generation, run:"
echo "curl -X POST http://localhost:3000/api/quiz/generate \\"
echo "  -F \"pdf=@your-file.pdf\" \\"
echo "  -F \"questionsPerPage=2\" \\"
echo "  -F \"batchSize=3\""
echo ""

