# Ensure the dev server is running
Write-Host "Ensuring development server is running..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -ErrorAction Stop
} catch {
    Write-Host "Starting development server..."
    Start-Process npm -ArgumentList "run", "dev" -NoNewWindow
    Start-Sleep -Seconds 5  # Wait for server to start
}

# Run the tests
Write-Host "Running tests..."
node --loader ts-node/esm scripts/test-onboarding.ts
