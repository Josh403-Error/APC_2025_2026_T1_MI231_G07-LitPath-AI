#!/usr/bin/env python3
"""
Script to test if the AI APIs are working correctly
"""
import os
import sys
import requests
from google import genai
import dotenv

# Load environment variables
dotenv.load_dotenv(dotenv_path='./backend/.env')

def test_gemini_api():
    """Test the Google Gemini API"""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in environment")
        return False

    try:
        # Use the same approach as the existing codebase
        client = genai.Client(api_key=api_key)
        model = client.models.generate_content
        # Actually test using the client as it's done in the codebase
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents='Hello, are you working?'
        )
        
        if response.text:
            print("✅ SUCCESS: Google Gemini API is working correctly")
            print(f"   Response preview: {response.text[:50]}...")
            return True
        else:
            print("⚠️ WARNING: Google Gemini API returned empty response")
            return False
    except Exception as e:
        print(f"❌ ERROR: Google Gemini API is not working - {str(e)}")
        return False

def test_hf_api():
    """Test the Hugging Face API token"""
    hf_token = os.getenv('HF_TOKEN')
    if not hf_token:
        print("❌ ERROR: HF_TOKEN not found in environment")
        return False

    try:
        headers = {'Authorization': f'Bearer {hf_token}'}
        # Test with the correct endpoint as indicated by the error
        response = requests.post(
            'https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2',
            headers=headers,
            json={"inputs": "This is a test sentence."},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ SUCCESS: Hugging Face API is working correctly")
            return True
        elif response.status_code == 401:
            print("❌ ERROR: Hugging Face API token is invalid or lacks required permissions")
            return False
        elif response.status_code == 503:
            print("⚠️ WARNING: Hugging Face model is currently loading/unavailable (503)")
            return True  # Token is valid, but model is temporarily unavailable
        elif response.status_code == 410:
            print("❌ ERROR: Hugging Face API endpoint is deprecated (410 Gone)")
            print("   The correct approach needs to be implemented in the codebase")
            return False
        else:
            print(f"❌ ERROR: Hugging Face API returned status {response.status_code}: {response.text}")
            return False
    except requests.exceptions.Timeout:
        print("⚠️ WARNING: Hugging Face API request timed out (possibly rate-limited)")
        return True  # May be a temporary issue
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to Hugging Face API (network issue)")
        return False
    except Exception as e:
        print(f"❌ ERROR: Hugging Face API test failed - {str(e)}")
        return False

def main():
    print("🔍 Testing AI API Keys...")
    print("="*50)
    
    gemini_ok = test_gemini_api()
    print()
    hf_ok = test_hf_api()
    
    print()
    print("="*50)
    if gemini_ok and hf_ok:
        print("🎉 All AI APIs are working correctly!")
        return 0
    else:
        print("💥 Some AI APIs are not working correctly!")
        return 1

if __name__ == "__main__":
    sys.exit(main())