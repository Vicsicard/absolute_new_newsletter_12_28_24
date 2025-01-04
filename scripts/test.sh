#!/bin/bash

# Ensure the dev server is running
echo "Ensuring development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Starting development server..."
    npm run dev &
    sleep 5  # Wait for server to start
fi

# Run the tests
echo "Running tests..."
npx ts-node scripts/test-onboarding.ts
