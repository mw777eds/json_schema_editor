// Import the test functions from test.js
import './test.js';

// Initialize test results element
const resultsElement = document.getElementById('test-results');
resultsElement.innerHTML = 'Click a button to run tests';

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
  if (typeof window[testName] === 'function') {
    window[testName]();
    window.reportResults();
  } else {
    resultsElement.innerHTML = `<div class="test-fail">Test function ${testName} not found</div>`;
  }
}

// Run all tests
function runAllTests() {
  clearResults();
  window.testStringNodeCreationAndEdit();
  window.testNumberNodeCreationAndEdit();
  window.testArrayNodeCreationAndEdit();
  window.testObjectNodeCreationAndEdit();
  window.testNestedNodeCreation();
  window.reportResults();
}

// Clear test results
function clearResults() {
  resultsElement.innerHTML = '';
  window.testsRun = 0;
  window.testsPassed = 0;
}
