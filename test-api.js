#!/usr/bin/env node

async function testAPI() {
  try {
    console.log('Testing server...');
    
    // Test 1: Check if server is responding
    const healthResponse = await fetch('http://localhost:5000/health');
    console.log('Health check:', healthResponse.status);
    
    // Test 2: Check analyses
    const analysesResponse = await fetch('http://localhost:5000/api/youtube/analyses');
    const analyses = await analysesResponse.json();
    console.log('Analyses:', analyses);
    
    // Test 3: If we have analyses, test Q&A
    if (analyses.length > 0) {
      const analysisId = analyses[0].id;
      console.log(`Testing Q&A with analysis ID ${analysisId}...`);
      
      const qaResponse = await fetch(`http://localhost:5000/api/youtube/${analysisId}/ask-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'What is this video about?',
          conversationHistory: []
        })
      });
      
      const qaResult = await qaResponse.json();
      console.log('Q&A Result:', JSON.stringify(qaResult, null, 2));
    } else {
      console.log('No analyses found to test Q&A');
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAPI();