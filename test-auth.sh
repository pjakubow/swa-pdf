#!/bin/bash

# Test script for API authentication
API_KEY="your-secret-api-key-here"
HTTP_BASIC_USERNAME="admin"
HTTP_BASIC_PASSWORD="password"
BASE_URL="http://localhost:3000"

echo "🧪 Testing PDF Processing API Authentication"
echo "=============================================="
echo

# Test 1: Health check without API key (should fail)
echo "Test 1: Health check without API key"
echo "Expected: 401 Unauthorized"
curl -s -w "\nStatus: %{http_code}\n" \
  -X GET "$BASE_URL/health" | jq . 2>/dev/null || echo "Response: $(curl -s -X GET "$BASE_URL/health")"
echo

# Test 2: Health check with wrong API key (should fail)
echo "Test 2: Health check with wrong credentials"
echo "Expected: 403 Forbidden"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Authorization: Basic abcd" \
  -X GET "$BASE_URL/health" | jq . 2>/dev/null || echo "Response: $(curl -s -H "Authorization: Basic abcd" -X GET "$BASE_URL/health")"
echo

# Test 3: Health check with correct API key (should succeed)
echo "Test 3: Health check with correct credentials"
echo "Expected: 200 OK"
curl -s -w "\nStatus: %{http_code}\n" \
  -u "admin:password" \
  -X GET "$BASE_URL/health" | jq . 2>/dev/null || echo "Response: $(curl -s -u "admin:password" -X GET "$BASE_URL/health")"
echo

# Test 4: PDF processing without API key (should fail)
echo "Test 4: PDF processing without API key"
echo "Expected: 401 Unauthorized"
curl -s -w "\nStatus: %{http_code}\n" \
  -X POST "$BASE_URL/process-pdf" | jq . 2>/dev/null || echo "Response: $(curl -s -X POST "$BASE_URL/process-pdf")"
echo

# Test 5: PDF processing with wrong Bearer format (should fail)
echo "Test 5: PDF processing with malformed Authorization header"
echo "Expected: 401 Unauthorized"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Authorization: $API_KEY" \
  -X POST "$BASE_URL/process-pdf" | jq . 2>/dev/null || echo "Response: $(curl -s -H "Authorization: $API_KEY" -X POST "$BASE_URL/process-pdf")"
echo

echo "🏁 Authentication tests completed!"
echo
echo "To test PDF processing with a real file:"
echo "curl -H \"Authorization: Bearer $API_KEY\" -F \"pdf=@your-file.pdf\" -o output.pdf $BASE_URL/process-pdf"
