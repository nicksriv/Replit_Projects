// Test data creator for RAG system - using tsx to handle TypeScript imports
import { storage } from "./server/storage";

async function createTestData() {
  console.log("Creating test video analysis with embeddings...");
  
  // Create a test analysis
  const testAnalysis = {
    videoId: "test123",
    videoTitle: "Machine Learning Fundamentals Explained",
    channelName: "TechEducation",
    videoUrl: "https://youtube.com/watch?v=test123",
    transcript: `
Welcome to this comprehensive introduction to machine learning fundamentals. 
In this video, we'll explore the core concepts that every data scientist should know.

Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed for every task. There are three main types of machine learning:

Supervised learning uses labeled training data to learn patterns. For example, if we want to predict house prices, we would train our model on historical data that includes house features like size, location, and number of bedrooms, along with their actual sale prices. Common supervised learning algorithms include linear regression, decision trees, and neural networks.

Unsupervised learning finds patterns in data without labeled examples. This is useful for clustering customers based on their behavior, or reducing the dimensionality of complex datasets. K-means clustering and principal component analysis are popular unsupervised methods.

Reinforcement learning trains agents through trial and error using a reward system. This approach has achieved remarkable success in game playing, like AlphaGo, and robotics applications where the agent learns optimal actions through interaction with the environment.

The machine learning workflow typically follows these steps: data collection, data preprocessing, feature engineering, model selection, training, evaluation, and deployment. Each step is crucial for building effective models.

Data preprocessing involves cleaning the data, handling missing values, and transforming features into suitable formats. Feature engineering is the art of selecting and creating meaningful input variables that help the model make better predictions.

Model evaluation is essential to ensure our model generalizes well to new, unseen data. We use techniques like cross-validation and metrics such as accuracy, precision, recall, and F1-score to assess performance.

Overfitting is a common problem where the model learns the training data too well but fails to generalize. Techniques like regularization, dropout, and early stopping help prevent overfitting.

Deep learning, a subset of machine learning using neural networks with multiple layers, has revolutionized fields like computer vision and natural language processing. Convolutional neural networks excel at image recognition, while recurrent neural networks and transformers are powerful for sequential data like text and time series.

The choice of algorithm depends on your specific problem, data size, and requirements. Start simple with baseline models before moving to complex solutions. Remember that more data often beats better algorithms, and domain expertise is invaluable in feature engineering and model interpretation.
`
  };
  
  const userId = 1;
  const analysis = await storage.createYoutubeAnalysis(testAnalysis, userId);
  console.log(`Created analysis with ID: ${analysis.id}`);
  
  // Create chunks with mock embeddings
  const chunks = [
    "Welcome to this comprehensive introduction to machine learning fundamentals. In this video, we'll explore the core concepts that every data scientist should know. Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed for every task.",
    
    "There are three main types of machine learning: Supervised learning uses labeled training data to learn patterns. For example, if we want to predict house prices, we would train our model on historical data that includes house features like size, location, and number of bedrooms, along with their actual sale prices.",
    
    "Unsupervised learning finds patterns in data without labeled examples. This is useful for clustering customers based on their behavior, or reducing the dimensionality of complex datasets. K-means clustering and principal component analysis are popular unsupervised methods.",
    
    "Reinforcement learning trains agents through trial and error using a reward system. This approach has achieved remarkable success in game playing, like AlphaGo, and robotics applications where the agent learns optimal actions through interaction with the environment.",
    
    "The machine learning workflow typically follows these steps: data collection, data preprocessing, feature engineering, model selection, training, evaluation, and deployment. Each step is crucial for building effective models.",
    
    "Data preprocessing involves cleaning the data, handling missing values, and transforming features into suitable formats. Feature engineering is the art of selecting and creating meaningful input variables that help the model make better predictions.",
    
    "Deep learning, a subset of machine learning using neural networks with multiple layers, has revolutionized fields like computer vision and natural language processing. Convolutional neural networks excel at image recognition, while recurrent neural networks and transformers are powerful for sequential data."
  ];
  
  // Generate embeddings for each chunk
  const { generateEmbedding } = await import("./server/openai");
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);
    try {
      const embedding = await generateEmbedding(chunks[i]);
      
      await storage.createYoutubeChunk({
        analysisId: analysis.id,
        chunkIndex: i,
        content: chunks[i],
        embedding: JSON.stringify(embedding)
      });
      
      console.log(`Created chunk ${i + 1} with embedding`);
    } catch (error) {
      console.error(`Error creating chunk ${i + 1}:`, error);
    }
  }
  
  console.log("Test data creation completed!");
  console.log(`Analysis ID: ${analysis.id}`);
  
  return analysis.id;
}

// Run the test data creation
createTestData().then(analysisId => {
  console.log(`\nTest data ready! You can now test Q&A with analysis ID: ${analysisId}`);
  console.log(`Try asking: "What are the main types of machine learning?"`);
  console.log(`Or: "Explain the machine learning workflow"`);
  process.exit(0);
}).catch(error => {
  console.error("Error creating test data:", error);
  process.exit(1);
});