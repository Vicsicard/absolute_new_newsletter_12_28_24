import { test, expect } from '@playwright/test';

test.describe('Onboarding Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('Page loaded');

    // Enable console log capture
    page.on('console', msg => {
      console.log(`Browser console: ${msg.type()}: ${msg.text()}`);
    });

    // Log network requests
    page.on('request', request => {
      console.log(`Network request: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      console.log(`Network response: ${response.status()} ${response.url()}`);
    });
  });

  test('should successfully submit onboarding form', async ({ page }) => {
    console.log('Starting form submission test...');
    
    // Wait for form to be visible
    await page.waitForSelector('form', { state: 'visible' });
    
    // Fill in required fields
    console.log('Filling required fields...');
    await page.locator('input[name="company_name"]').click();
    await page.locator('input[name="company_name"]').fill('Test Company Inc.');
    await page.locator('input[name="company_name"]').press('Tab');
    
    await page.locator('input[name="industry"]').fill('Technology');
    await page.locator('input[name="industry"]').press('Tab');
    
    const testEmail = 'test@example.com';
    await page.locator('input[name="contact_email"]').fill(testEmail);
    await page.locator('input[name="contact_email"]').press('Tab');
    
    await page.locator('textarea[name="target_audience"]').fill('Small business owners and entrepreneurs looking to grow their online presence.');
    
    // Fill in optional fields
    console.log('Filling optional fields...');
    await page.locator('input[name="website_url"]').fill('https://testcompany.com');
    
    // Take screenshot before submission
    console.log('Taking pre-submission screenshot...');
    await page.screenshot({ path: 'tests/screenshots/before-submit.png' });

    // Submit form
    console.log('Submitting form...');
    const submitButton = await page.getByRole('button', { name: 'Generate Newsletter' });
    await expect(submitButton).toBeVisible();
    
    // Click the submit button
    await submitButton.click();
    console.log('Form submitted, waiting for loading state...');
    
    // Wait for loading state
    console.log('Checking loading state...');
    await page.waitForSelector('div[role="dialog"]:has-text("Setting up your newsletter")', {
      state: 'visible',
      timeout: 5000
    });
    
    // Wait for API calls to complete
    console.log('Waiting for API responses...');
    await page.waitForResponse(response => 
      response.url().includes('/rest/v1/companies') && 
      response.request().method() === 'POST'
    );
    await page.waitForResponse(response => 
      response.url().includes('/rest/v1/newsletters') && 
      response.request().method() === 'POST'
    );
    
    // Check for any error messages
    const errorDialog = page.locator('div[role="dialog"]:has-text("Error")');
    const isError = await errorDialog.isVisible();
    if (isError) {
      const errorText = await errorDialog.textContent();
      console.error('Error dialog found:', errorText);
      throw new Error(`Form submission failed: ${errorText}`);
    }
    
    // Wait for success modal
    console.log('Waiting for success modal...');
    await page.waitForSelector('div[role="dialog"]:has-text("Newsletter setup completed")', { 
      state: 'visible', 
      timeout: 30000 
    });
    
    // Check success message in modal
    const expectedMessage = `Newsletter setup completed! Your draft newsletter will be emailed to ${testEmail} within 24 hours. Please check your spam folder if you don't see it in your inbox.`;
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toContainText(expectedMessage, { timeout: 30000 });
    
    // Take screenshot after submission
    console.log('Taking post-submission screenshot...');
    await page.screenshot({ path: 'tests/screenshots/after-submit.png' });
  });

  test('should show validation errors for missing required fields', async ({ page }) => {
    console.log('Starting missing fields validation test...');
    
    // Wait for form to be visible
    await page.waitForSelector('form', { state: 'visible' });
    
    // Submit empty form
    const submitButton = await page.getByRole('button', { name: 'Generate Newsletter' });
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Check for validation messages
    await expect(page.getByText('Company name is required')).toBeVisible();
    await expect(page.getByText('Industry is required')).toBeVisible();
    await expect(page.getByText('Contact email is required')).toBeVisible();
    await expect(page.getByText('Target audience is required')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    console.log('Starting email validation test...');
    
    // Wait for form to be visible
    await page.waitForSelector('form', { state: 'visible' });
    
    // Fill in valid fields
    await page.locator('input[name="company_name"]').fill('Test Company');
    await page.locator('input[name="industry"]').fill('Technology');
    await page.locator('textarea[name="target_audience"]').fill('Small business owners');
    
    // Fill in invalid email
    await page.locator('input[name="contact_email"]').fill('invalid-email');
    
    // Submit form
    const submitButton = await page.getByRole('button', { name: 'Generate Newsletter' });
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Check for email validation message
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('should validate website URL format', async ({ page }) => {
    console.log('Starting URL validation test...');
    
    // Wait for form to be visible
    await page.waitForSelector('form', { state: 'visible' });
    
    // Fill in required fields
    await page.locator('input[name="company_name"]').fill('Test Company');
    await page.locator('input[name="industry"]').fill('Technology');
    await page.locator('input[name="contact_email"]').fill('test@example.com');
    await page.locator('textarea[name="target_audience"]').fill('Small business owners');
    
    // Fill in invalid URL
    await page.locator('input[name="website_url"]').fill('invalid-url');
    
    // Submit form
    const submitButton = await page.getByRole('button', { name: 'Generate Newsletter' });
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Check for URL validation message
    await expect(page.getByText('Please enter a valid URL')).toBeVisible();
  });
});
