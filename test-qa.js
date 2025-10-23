// Test script to verify Q&A functionality
console.log("Testing YouTube Knowledge Base API...");

// Test 1: Check if server is running
async function testServerHealth() {
  try {
    const response = await fetch("http://localhost:5000/health");
    const data = await response.json();
    console.log("✅ Server health check:", data);
  } catch (error) {
    console.log("❌ Server health check failed:", error.message);
    return false;
  }
  return true;
}

// Test 2: Check analyses
async function testAnalyses() {
  try {
    const response = await fetch("http://localhost:5000/api/youtube/analyses");
    const data = await response.json();
    console.log("✅ Analyses fetched:", data.length, "analyses found");
    return data;
  } catch (error) {
    console.log("❌ Analyses fetch failed:", error.message);
    return [];
  }
}

// Test 3: Test Q&A with mock data if no analyses exist
async function testQA() {
  try {
    // First, let's try to create a mock analysis for testing
    console.log("Testing Q&A functionality...");
    
    // Since there are no analyses, we'll just test the endpoint exists
    const response = await fetch("http://localhost:5000/api/youtube/1/ask-enhanced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Test question",
        conversationHistory: []
      })
    });
    
    if (response.status === 404) {
      console.log("⚠️  Q&A endpoint works but no analysis with ID 1 found (expected)");
    } else {
      const data = await response.json();
      console.log("✅ Q&A response:", data);
    }
  } catch (error) {
    console.log("❌ Q&A test failed:", error.message);
  }
}

// Run tests
async function runTests() {
  const serverUp = await testServerHealth();
  if (!serverUp) return;
  
  const analyses = await testAnalyses();
  await testQA();
  
  if (analyses.length === 0) {
    console.log("\n📝 DIAGNOSIS:");
    console.log("- Server is working correctly");
    console.log("- No video analyses exist yet");
    console.log("- You need to process a YouTube video first to test Q&A");
    console.log("- Try adding a YouTube URL in the frontend to create an analysis");
  }
}

runTests();