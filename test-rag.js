// Simple test script to verify RAG implementation
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testRAG() {
  console.log('🧪 Testing RAG Implementation...\n');

  try {
    // 1. Test if server is running
    console.log('1️⃣ Testing server connection...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error('Server not responding');
    }
    console.log('✅ Server is running\n');

    // 2. Get existing analyses
    console.log('2️⃣ Fetching existing analyses...');
    const analysesResponse = await fetch(`${BASE_URL}/api/youtube/analyses`);
    const analyses = await analysesResponse.json();
    console.log(`📊 Found ${analyses.length} existing analyses`);
    
    if (analyses.length === 0) {
      console.log('❌ No analyses found. Please analyze a YouTube video first.');
      return;
    }

    const testAnalysis = analyses[0];
    console.log(`🎯 Testing with: "${testAnalysis.videoTitle}"\n`);

    // 3. Test legacy Q&A endpoint
    console.log('3️⃣ Testing legacy Q&A...');
    const legacyResponse = await fetch(`${BASE_URL}/api/youtube/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisId: testAnalysis.id,
        question: 'What is this video about?'
      })
    });
    
    const legacyResult = await legacyResponse.json();
    if (legacyResponse.ok) {
      console.log('✅ Legacy Q&A working');
      console.log(`📝 Answer: ${legacyResult.answer.substring(0, 100)}...`);
    } else {
      console.log('❌ Legacy Q&A failed:', legacyResult.error);
    }

    // 4. Test enhanced Q&A endpoint
    console.log('\n4️⃣ Testing enhanced Q&A...');
    const enhancedResponse = await fetch(`${BASE_URL}/api/youtube/${testAnalysis.id}/ask-enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What are the main topics covered?',
        conversationHistory: []
      })
    });
    
    const enhancedResult = await enhancedResponse.json();
    if (enhancedResponse.ok && enhancedResult.success) {
      console.log('✅ Enhanced Q&A working');
      console.log(`📝 Answer: ${enhancedResult.data.answer.substring(0, 100)}...`);
      console.log(`🎯 Confidence: ${enhancedResult.data.confidence}%`);
    } else {
      console.log('❌ Enhanced Q&A failed:', enhancedResult.error || enhancedResult.message);
    }

    // 5. Test semantic search
    console.log('\n5️⃣ Testing semantic search...');
    const searchResponse = await fetch(`${BASE_URL}/api/youtube/${testAnalysis.id}/semantic-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'main topic',
        limit: 3
      })
    });
    
    const searchResult = await searchResponse.json();
    if (searchResponse.ok && searchResult.success) {
      console.log('✅ Semantic search working');
      console.log(`🔍 Found ${searchResult.data.length} relevant chunks`);
      if (searchResult.data.length > 0) {
        console.log(`📋 Top result score: ${(searchResult.data[0].relevanceScore * 100).toFixed(1)}%`);
      }
    } else {
      console.log('❌ Semantic search failed:', searchResult.error || searchResult.message);
    }

    console.log('\n🎉 RAG testing complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRAG();