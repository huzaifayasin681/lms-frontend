// Simple connection test
import apiService from './services/api.js';

async function testConnection() {
  console.log('Testing API connection...');
  
  try {
    // Test health endpoint (doesn't require auth)
    const health = await fetch('http://127.0.0.1:6543/api/health');
    const healthData = await health.json();
    console.log('✅ Health check:', healthData);
    
    // Test courses endpoint (requires auth - should get 401)
    try {
      await apiService.getCourses();
    } catch (error) {
      console.log('✅ Error handling working:', error.message);
      console.log('✅ Error code:', error.code);
      console.log('✅ Error status:', error.status);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  testConnection();
}

export default testConnection;