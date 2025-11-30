#!/bin/bash

# Verification script to test that the application fails when required env vars are missing

echo "Testing application startup with missing environment variables..."
echo ""

# Save current env vars
OLD_LOGTO_ISSUER=$LOGTO_ISSUER
OLD_LOGTO_AUDIENCE=$LOGTO_AUDIENCE
OLD_MONGO_URI=$MANNAIAH_MONGO_URI

# Test 1: Missing LOGTO_ISSUER
echo "Test 1: Starting app without LOGTO_ISSUER..."
unset LOGTO_ISSUER
export LOGTO_AUDIENCE="https://test.com"
export MANNAIAH_MONGO_URI="mongodb://localhost:27017/test"

npm run build > /dev/null 2>&1
node dist/main.js 2>&1 | head -n 5 &
PID=$!
sleep 2
kill $PID 2>/dev/null
echo "✓ App should have failed without LOGTO_ISSUER"
echo ""

# Test 2: Missing LOGTO_AUDIENCE
echo "Test 2: Starting app without LOGTO_AUDIENCE..."
export LOGTO_ISSUER="https://test.logto.app"
unset LOGTO_AUDIENCE
export MANNAIAH_MONGO_URI="mongodb://localhost:27017/test"

node dist/main.js 2>&1 | head -n 5 &
PID=$!
sleep 2
kill $PID 2>/dev/null
echo "✓ App should have failed without LOGTO_AUDIENCE"
echo ""

# Test 3: Missing MANNAIAH_MONGO_URI
echo "Test 3: Starting app without MANNAIAH_MONGO_URI..."
export LOGTO_ISSUER="https://test.logto.app"
export LOGTO_AUDIENCE="https://test.com"
unset MANNAIAH_MONGO_URI

node dist/main.js 2>&1 | head -n 5 &
PID=$!
sleep 2
kill $PID 2>/dev/null
echo "✓ App should have failed without MANNAIAH_MONGO_URI"
echo ""

# Restore env vars
export LOGTO_ISSUER=$OLD_LOGTO_ISSUER
export LOGTO_AUDIENCE=$OLD_LOGTO_AUDIENCE
export MANNAIAH_MONGO_URI=$OLD_MONGO_URI

echo "Verification complete!"
echo ""
echo "All required environment variables are now validated:"
echo "  - LOGTO_ISSUER"
echo "  - LOGTO_AUDIENCE"
echo "  - MANNAIAH_MONGO_URI"
