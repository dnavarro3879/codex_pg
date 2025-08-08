#!/usr/bin/env python3
"""
Quick test script for authentication flow.
Run the backend server first: uvicorn app.main:app --reload
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth_flow():
    # Test data
    test_user = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123"
    }
    
    print("1. Testing Registration...")
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=test_user)
        if response.status_code == 201:
            print("✓ Registration successful")
            user_data = response.json()
            print(f"  User ID: {user_data['id']}")
            print(f"  Username: {user_data['username']}")
        elif response.status_code == 400:
            print("✓ User already exists (expected if running test multiple times)")
        else:
            print(f"✗ Registration failed: {response.status_code}")
            print(f"  Response: {response.text}")
    except Exception as e:
        print(f"✗ Registration error: {e}")
    
    print("\n2. Testing Login...")
    try:
        # OAuth2 expects form data with username field (but we send email)
        login_data = {
            "username": test_user["email"],  # OAuth2PasswordRequestForm expects 'username'
            "password": test_user["password"]
        }
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            print("✓ Login successful")
            tokens = response.json()
            access_token = tokens["access_token"]
            refresh_token = tokens["refresh_token"]
            print(f"  Access token: {access_token[:50]}...")
            print(f"  Refresh token: {refresh_token[:50]}...")
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return
    except Exception as e:
        print(f"✗ Login error: {e}")
        return
    
    print("\n3. Testing Get Current User...")
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            print("✓ Got current user")
            user_info = response.json()
            print(f"  Email: {user_info['email']}")
            print(f"  Username: {user_info['username']}")
            print(f"  Created: {user_info['created_at']}")
        else:
            print(f"✗ Get user failed: {response.status_code}")
            print(f"  Response: {response.text}")
    except Exception as e:
        print(f"✗ Get user error: {e}")
    
    print("\n4. Testing Protected Bird Endpoint...")
    try:
        # Test with auth (should save search history)
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {"lat": 37.7749, "lng": -122.4194}  # San Francisco
        response = requests.get(f"{BASE_URL}/birds/rare", params=params, headers=headers)
        if response.status_code == 200:
            print("✓ Protected endpoint accessible")
            birds = response.json()
            print(f"  Found {len(birds)} rare birds")
        else:
            print(f"✗ Protected endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Protected endpoint error: {e}")
    
    print("\n5. Testing Add Favorite...")
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        favorite_data = {
            "species_name": "Bald Eagle",
            "location": "San Francisco Bay",
            "lat": 37.7749,
            "lng": -122.4194
        }
        response = requests.post(f"{BASE_URL}/auth/favorites", json=favorite_data, headers=headers)
        if response.status_code == 201:
            print("✓ Favorite added")
            fav = response.json()
            print(f"  Favorite ID: {fav['id']}")
            print(f"  Species: {fav['species_name']}")
        elif response.status_code == 400:
            print("✓ Favorite already exists (expected if running test multiple times)")
        else:
            print(f"✗ Add favorite failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Add favorite error: {e}")
    
    print("\n✅ Authentication flow test complete!")

if __name__ == "__main__":
    print("=" * 50)
    print("AUTHENTICATION FLOW TEST")
    print("=" * 50)
    print(f"Testing against: {BASE_URL}")
    print("Make sure the backend server is running!\n")
    
    test_auth_flow()