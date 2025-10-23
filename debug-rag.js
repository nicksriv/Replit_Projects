// Debug script to test RAG functionality
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function debugRAG() {
  console.log('🔍 Debugging RAG System...\n');

  try {
    // 1. Get existing analyses
    console.log('1️⃣ Fetching analyses...');
    const analysesResponse = await fetch(`${BASE_URL}/api/youtube/analyses`);
    const analyses = await analysesResponse.json();
    console.log(`📊 Found ${analyses.length} analyses`);
    
    if (analyses.length === 0) {
      console.log('❌ No analyses found. Please analyze a video first.');
      return;
    }

    const testAnalysis = analyses[0];
    console.log(`🎯 Testing with analysis ID: ${testAnalysis.id}`);
    console.log(`📹 Video: "${testAnalysis.videoTitle}"`);

    // 2. Test enhanced Q&A with detailed logging
    console.log('\n2️⃣ Testing enhanced Q&A...');
    const question = "What is this video about?";
    
    const enhancedResponse = await fetch(`${BASE_URL}/api/youtube/${testAnalysis.id}/ask-enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question,
        conversationHistory: []
      })
    });
    
    console.log(`📡 Response status: ${enhancedResponse.status}`);
    const enhancedResult = await enhancedResponse.json();
    
    if (enhancedResponse.ok && enhancedResult.success) {
      console.log('✅ Enhanced Q&A working');
      console.log(`❓ Question: ${question}`);
      console.log(`💬 Answer: ${enhancedResult.data.answer}`);
      console.log(`🎯 Confidence: ${enhancedResult.data.confidence}%`);
    } else {
      console.log('❌ Enhanced Q&A failed:');
      console.log(`📋 Full response:`, JSON.stringify(enhancedResult, null, 2));
    }

    // 3. Test semantic search
    console.log('\n3️⃣ Testing semantic search...');
    const searchResponse = await fetch(`${BASE_URL}/api/youtube/${testAnalysis.id}/semantic-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'main topic',
        limit: 3
      })
    });
    
    console.log(`📡 Search response status: ${searchResponse.status}`);
    const searchResult = await searchResponse.json();
    
    if (searchResponse.ok && searchResult.success) {
      console.log('✅ Semantic search working');
      console.log(`🔍 Found ${searchResult.data.length} relevant chunks`);
      if (searchResult.data.length > 0) {
        console.log(`📋 Top result score: ${(searchResult.data[0].relevanceScore * 100).toFixed(1)}%`);
        console.log(`📄 Sample text: ${searchResult.data[0].chunk.content.substring(0, 100)}...`);
      }
    } else {
      console.log('❌ Semantic search failed:');
      console.log(`📋 Full response:`, JSON.stringify(searchResult, null, 2));
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugRAG();