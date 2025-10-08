#!/usr/bin/env python3
"""
Backend API Testing for Articard Security Shift Management System
Tests all CRUD operations for shifts and incidents management
"""

import requests
import sys
import json
from datetime import datetime, date, time
from typing import Dict, List, Any

class ArticardAPITester:
    def __init__(self, base_url="https://securelog-system.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_shift_id = None
        self.created_template_id = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test_name": name,
            "status": "PASS" if success else "FAIL",
            "details": details
        }
        self.test_results.append(result)
        print(f"{status} - {name}: {details}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Dict = None, headers: Dict = None) -> tuple:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    details = f"Status: {response.status_code}, Response: {json.dumps(response_data, indent=2)[:200]}..."
                except:
                    details = f"Status: {response.status_code}, Response: {response.text[:200]}..."
            else:
                details = f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}..."

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            details = f"Error: {str(e)}"
            self.log_test(name, False, details)
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_create_shift(self):
        """Test creating a new shift"""
        shift_data = {
            "date": "2024-12-20",
            "object_name": "Test Kaubanduskeskus",
            "guard_name": "Test Turvamees",
            "start_time": "08:00:00",
            "end_time": "16:00:00"
        }
        
        success, response = self.run_test(
            "Create Shift",
            "POST",
            "shifts",
            200,
            data=shift_data
        )
        
        if success and 'id' in response:
            self.created_shift_id = response['id']
            print(f"   Created shift ID: {self.created_shift_id}")
        
        return success, response

    def test_get_all_shifts(self):
        """Test getting all shifts"""
        return self.run_test(
            "Get All Shifts",
            "GET",
            "shifts",
            200
        )

    def test_get_shift_by_id(self):
        """Test getting a specific shift by ID"""
        if not self.created_shift_id:
            self.log_test("Get Shift by ID", False, "No shift ID available from create test")
            return False, {}
        
        return self.run_test(
            "Get Shift by ID",
            "GET",
            f"shifts/{self.created_shift_id}",
            200
        )

    def test_update_shift(self):
        """Test updating a shift"""
        if not self.created_shift_id:
            self.log_test("Update Shift", False, "No shift ID available from create test")
            return False, {}
        
        update_data = {
            "guard_name": "Updated Turvamees",
            "object_name": "Updated Objekt"
        }
        
        return self.run_test(
            "Update Shift",
            "PUT",
            f"shifts/{self.created_shift_id}",
            200,
            data=update_data
        )

    def test_add_general_incident(self):
        """Test adding a general incident to a shift"""
        if not self.created_shift_id:
            self.log_test("Add General Incident", False, "No shift ID available from create test")
            return False, {}
        
        incident_data = {
            "shift_id": self.created_shift_id,
            "incident_data": {
                "type": "general",
                "description": "Test üldine intsident - kahtlane isik objekti läheduses"
            }
        }
        
        return self.run_test(
            "Add General Incident",
            "POST",
            f"shifts/{self.created_shift_id}/incidents",
            200,
            data=incident_data
        )

    def test_add_theft_incident(self):
        """Test adding a theft incident to a shift"""
        if not self.created_shift_id:
            self.log_test("Add Theft Incident", False, "No shift ID available from create test")
            return False, {}
        
        incident_data = {
            "shift_id": self.created_shift_id,
            "incident_data": {
                "type": "theft",
                "description": "Test vargus - kaup poe riiulilt",
                "gender": "mees",
                "amount": 25.50,
                "special_tools_used": False,
                "outcome": "maksis_vabastatud"
            }
        }
        
        return self.run_test(
            "Add Theft Incident",
            "POST",
            f"shifts/{self.created_shift_id}/incidents",
            200,
            data=incident_data
        )

    def test_remove_incident(self):
        """Test removing an incident from a shift"""
        if not self.created_shift_id:
            self.log_test("Remove Incident", False, "No shift ID available from create test")
            return False, {}
        
        # Try to remove the first incident (index 0)
        return self.run_test(
            "Remove Incident",
            "DELETE",
            f"shifts/{self.created_shift_id}/incidents/0",
            200
        )

    def test_get_shifts_by_month(self):
        """Test getting shifts by month"""
        return self.run_test(
            "Get Shifts by Month",
            "GET",
            "shifts/by-month/2024/12",
            200
        )

    def test_delete_shift(self):
        """Test deleting a shift"""
        if not self.created_shift_id:
            self.log_test("Delete Shift", False, "No shift ID available from create test")
            return False, {}
        
        return self.run_test(
            "Delete Shift",
            "DELETE",
            f"shifts/{self.created_shift_id}",
            200
        )

    def test_delete_nonexistent_shift(self):
        """Test deleting a non-existent shift"""
        return self.run_test(
            "Delete Non-existent Shift",
            "DELETE",
            "shifts/nonexistent-id",
            404
        )

    def test_nonexistent_shift(self):
        """Test getting a non-existent shift"""
        return self.run_test(
            "Get Non-existent Shift",
            "GET",
            "shifts/nonexistent-id",
            404
        )

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Articard Security API Tests")
        print("=" * 60)
        
        # Test basic connectivity
        self.test_root_endpoint()
        
        # Test shift CRUD operations
        self.test_create_shift()
        self.test_get_all_shifts()
        self.test_get_shift_by_id()
        self.test_update_shift()
        
        # Test incident management
        self.test_add_general_incident()
        self.test_add_theft_incident()
        self.test_remove_incident()
        
        # Test additional endpoints
        self.test_get_shifts_by_month()
        self.test_nonexistent_shift()
        
        # Test delete functionality (should be last since it removes the test shift)
        self.test_delete_nonexistent_shift()
        self.test_delete_shift()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed!")
            return 1

def main():
    """Main test execution"""
    tester = ArticardAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())