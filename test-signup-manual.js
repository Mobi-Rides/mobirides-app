// Manual Signup Test Script for Browser Console
// Copy and paste this entire script into the browser console on http://localhost:8081/signup

console.log('🚀 Starting Mobirides Signup Test...');

// Test credentials
const testData = {
  fullName: 'Arnold Test',
  email: 'arnold@gmail.com',
  password: 'sesco11234U',
  confirmPassword: 'sesco11234U',
  phoneNumber: '71234567',
  countryCode: '+267'
};

// Helper function to wait for elements
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Helper function to simulate user input
function simulateInput(element, value) {
  element.focus();
  element.value = value;
  
  // Trigger React events
  const inputEvent = new Event('input', { bubbles: true });
  const changeEvent = new Event('change', { bubbles: true });
  
  element.dispatchEvent(inputEvent);
  element.dispatchEvent(changeEvent);
  
  console.log(`✅ Filled ${element.name || element.id || 'field'} with: ${value}`);
}

// Network monitoring
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 Network Request:', args[0]);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('📡 Network Response:', response.status, response.statusText, args[0]);
      return response;
    })
    .catch(error => {
      console.error('❌ Network Error:', error, args[0]);
      throw error;
    });
};

// Main test function
async function runSignupTest() {
  try {
    console.log('🔍 Looking for signup form elements...');
    
    // Wait for and fill full name
    const fullNameInput = await waitForElement('input[name="fullName"], input[placeholder*="full name" i], input[placeholder*="name" i]');
    simulateInput(fullNameInput, testData.fullName);
    
    // Wait for and fill email
    const emailInput = await waitForElement('input[name="email"], input[type="email"], input[placeholder*="email" i]');
    simulateInput(emailInput, testData.email);
    
    // Wait for and fill phone number
    const phoneInput = await waitForElement('input[name="phoneNumber"], input[placeholder*="phone" i], input[type="tel"]');
    simulateInput(phoneInput, testData.phoneNumber);
    
    // Try to set country code if there's a select element
    try {
      const countrySelect = await waitForElement('select[name="countryCode"], select[placeholder*="country" i]', 2000);
      countrySelect.value = testData.countryCode;
      const changeEvent = new Event('change', { bubbles: true });
      countrySelect.dispatchEvent(changeEvent);
      console.log(`✅ Set country code to: ${testData.countryCode}`);
    } catch (e) {
      console.log('ℹ️ Country code selector not found or not needed');
    }
    
    // Wait for and fill password
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length >= 2) {
      simulateInput(passwordInputs[0], testData.password);
      simulateInput(passwordInputs[1], testData.confirmPassword);
    } else {
      console.error('❌ Could not find password fields');
      return;
    }
    
    console.log('⏳ Waiting 2 seconds before submission...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find and click submit button
    const submitButton = await waitForElement('button[type="submit"], button:contains("Sign Up"), button:contains("Create Account")');
    
    console.log('🚀 Submitting signup form...');
    submitButton.click();
    
    // Monitor for success/error messages
    console.log('👀 Monitoring for response messages...');
    
    // Wait for potential success/error messages
    setTimeout(() => {
      const successMessages = document.querySelectorAll('[class*="success"], [class*="toast"], .alert-success');
      const errorMessages = document.querySelectorAll('[class*="error"], [class*="danger"], .alert-error, .alert-danger');
      
      if (successMessages.length > 0) {
        console.log('🎉 SUCCESS MESSAGES FOUND:');
        successMessages.forEach(msg => console.log('✅', msg.textContent));
      }
      
      if (errorMessages.length > 0) {
        console.log('❌ ERROR MESSAGES FOUND:');
        errorMessages.forEach(msg => console.log('🚨', msg.textContent));
      }
      
      if (successMessages.length === 0 && errorMessages.length === 0) {
        console.log('ℹ️ No obvious success/error messages found. Check network tab and console for API responses.');
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Start the test
runSignupTest();

console.log('📋 Test script loaded. Monitor the console for results...');