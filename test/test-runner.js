// Import the test functions from test.js
import './test.js';

// Initialize test results element
const resultsElement = document.getElementById('test-results');
resultsElement.innerHTML = 'Click a button to run tests';

// Test results storage
let testResults = {
  lastRun: null,
  tests: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// Set up test buttons
document.getElementById('run-all-tests').addEventListener('click', runAllTests);
document.getElementById('run-string-tests').addEventListener('click', () => runTest('testStringNodeCreationAndEdit'));
document.getElementById('run-number-tests').addEventListener('click', () => runTest('testNumberNodeCreationAndEdit'));
document.getElementById('run-array-tests').addEventListener('click', () => runTest('testArrayNodeCreationAndEdit'));
document.getElementById('run-object-tests').addEventListener('click', () => runTest('testObjectNodeCreationAndEdit'));
document.getElementById('run-nested-tests').addEventListener('click', () => runTest('testNestedNodeCreation'));

// Clear results and run a single test
function runTest(testName) {
  clearResults();
  
  // Initialize test results for this test
  testResults.lastRun = new Date().toISOString();
  testResults.tests[testName] = {
    results: [],
    passed: 0,
    failed: 0
  };
  
  if (typeof window[testName] === 'function') {
    // Set up test result capture
    window.captureTestResult = (passed, message) => {
      testResults.tests[testName].results.push({
        passed,
        message
      });
      
      if (passed) {
        testResults.tests[testName].passed++;
      } else {
        testResults.tests[testName].failed++;
      }
    };
    
    // Run the test
    window[testName]();
    window.reportResults();
    
    // Save test results
    saveTestResults();
  } else {
    resultsElement.innerHTML = `<div class="test-fail">Test function ${testName} not found</div>`;
  }
}

// Run all tests
function runAllTests() {
  clearResults();
  
  // Initialize test results for all tests
  testResults = {
    lastRun: new Date().toISOString(),
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };
  
  // Set up test result capture
  window.captureTestResult = (passed, message, testName) => {
    if (!testResults.tests[testName]) {
      testResults.tests[testName] = {
        results: [],
        passed: 0,
        failed: 0
      };
    }
    
    testResults.tests[testName].results.push({
      passed,
      message
    });
    
    if (passed) {
      testResults.tests[testName].passed++;
    } else {
      testResults.tests[testName].failed++;
    }
  };
  
  // Run all tests
  const testFunctions = [
    'testStringNodeCreationAndEdit',
    'testNumberNodeCreationAndEdit',
    'testArrayNodeCreationAndEdit',
    'testObjectNodeCreationAndEdit',
    'testNestedNodeCreation'
  ];
  
  testFunctions.forEach(testName => {
    if (typeof window[testName] === 'function') {
      window[testName]();
    }
  });
  
  window.reportResults();
  
  // Save test results
  saveTestResults();
}

// Clear test results
function clearResults() {
  resultsElement.innerHTML = '';
  window.testsRun = 0;
  window.testsPassed = 0;
}

// Save test results to localStorage and console
function saveTestResults() {
  // Update summary
  testResults.summary.total = window.testsRun;
  testResults.summary.passed = window.testsPassed;
  testResults.summary.failed = window.testsRun - window.testsPassed;
  
  // Save to localStorage
  localStorage.setItem('testResults', JSON.stringify(testResults));
  
  // Log to console for easy access
  console.log('TEST RESULTS:', testResults);
  
  // Create a downloadable file
  const resultsBlob = new Blob([JSON.stringify(testResults, null, 2)], {type: 'application/json'});
  const resultsUrl = URL.createObjectURL(resultsBlob);
  
  // Add download link to the page
  const downloadLink = document.createElement('a');
  downloadLink.href = resultsUrl;
  downloadLink.download = `test-results-${new Date().toISOString().replace(/:/g, '-')}.json`;
  downloadLink.textContent = 'Download Test Results';
  downloadLink.className = 'download-link';
  downloadLink.style.display = 'block';
  downloadLink.style.marginTop = '10px';
  
  // Remove any existing download links
  const existingLinks = document.querySelectorAll('.download-link');
  existingLinks.forEach(link => link.remove());
  
  // Add the new download link
  resultsElement.appendChild(downloadLink);
}
