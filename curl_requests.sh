#!/bin/bash

echo "=== STEP 1: Stream conversational proposal (SSE) ==="
echo "Running POST /api/prd/propose..."
curl -X POST "http://localhost:5000/api/prd/propose" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "I want a user login service using token authentication."
  }'
echo -e "\n\n"

echo "=== STEP 2: Generate final structured PRD JSON ==="
echo "Running POST /api/prd/generate..."
curl -X POST "http://localhost:5000/api/prd/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "I want a user login service using token authentication.",
    "proposal": "For the user login service, we will implement token-based authentication using JWT (JSON Web Tokens). The core requirements will include user registration, secure password hashing using bcrypt, a login endpoint returning a JWT, and error handling for expired or invalid tokens."
  }'
echo -e "\n"
