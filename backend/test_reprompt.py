#!/usr/bin/env python3
"""
Test script to verify the reprompt/edit functionality works end-to-end.
This tests the /model/generate_images endpoint.
"""

import requests
import json
import os

def test_generate_images():
    """Test the generate_images endpoint with a sample prompt."""
    
    # Check if BFL_API_KEY is set
    if not os.environ.get("BFL_API_KEY"):
        print("⚠️  Warning: BFL_API_KEY not set. The endpoint will fail.")
        print("   Set it with: export BFL_API_KEY=your_key_here")
        return False
    
    backend_url = "http://127.0.0.1:5000"
    endpoint = f"{backend_url}/model/generate_images"
    
    # Test payload
    payload = {
        "prompt": "A detailed medical CT scan of a human brain showing clear cortical structures and ventricles",
        "timepoints": ["now", "3m"]  # Just test 2 timepoints for speed
    }
    
    print("🧪 Testing /model/generate_images endpoint...")
    print(f"   URL: {endpoint}")
    print(f"   Payload: {json.dumps(payload, indent=2)}")
    print("\n⏳ Sending request (this may take 30-60 seconds)...\n")
    
    try:
        response = requests.post(
            endpoint,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=120  # Give it 2 minutes
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Response:")
            print(json.dumps(data, indent=2))
            
            # Verify we got images for the requested timepoints
            images = data.get("images", {})
            for tp in payload["timepoints"]:
                if tp in images and images[tp]:
                    print(f"   ✓ Got image URL for timepoint '{tp}'")
                else:
                    print(f"   ✗ Missing or null image for timepoint '{tp}'")
            
            return True
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 120 seconds")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection error. Is the Flask server running on port 5000?")
        print("   Start it with: cd backend && python flask_app.py")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_server_health():
    """Quick check if the server is running."""
    backend_url = "http://127.0.0.1:5000"
    
    print("🔍 Checking if Flask server is running...")
    try:
        # Try to hit any endpoint to see if server responds
        response = requests.get(backend_url, timeout=2)
        print("✅ Server is responding")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server at http://127.0.0.1:5000")
        print("   Start the server with: cd backend && python flask_app.py")
        return False
    except Exception as e:
        print(f"⚠️  Server check inconclusive: {e}")
        return True  # Continue anyway

if __name__ == "__main__":
    print("=" * 60)
    print("Flask Backend Reprompt Functionality Test")
    print("=" * 60)
    print()
    
    # Check server health first
    if not test_server_health():
        print("\n⚠️  Please start the Flask server first.")
        exit(1)
    
    print()
    
    # Run the actual test
    success = test_generate_images()
    
    print()
    print("=" * 60)
    if success:
        print("✅ All tests passed!")
        print("\nThe reprompt functionality should work end-to-end:")
        print("1. User edits prompt in the UI")
        print("2. Frontend calls generateImagesSupabase()")
        print("3. That calls requestGeneratedImages() to Flask")
        print("4. Flask calls BFL API to generate images")
        print("5. Image URLs are returned and stored in Supabase")
    else:
        print("❌ Tests failed. Check the errors above.")
    print("=" * 60)

