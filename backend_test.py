#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SIGEP Backend API Testing Suite
Tests all endpoints for PetroNac SIGEP system
"""

import requests
import sys
import json
from datetime import datetime

class SIGEPAPITester:
    def __init__(self, base_url="https://offshore-dashboard.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_login(self, username="admin", password="admin123"):
        """Test login and get token"""
        print(f"\n🔐 Testing login with {username}/{password}")
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and isinstance(response, dict) and 'token' in response:
            self.token = response['token']
            print(f"✅ Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test get current user info"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_pocos(self):
        """Test wells endpoints"""
        success, response = self.run_test("List Wells", "GET", "pocos", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} wells")
            if len(response) >= 15:
                print("✅ Expected 15+ wells found")
            else:
                print(f"⚠️  Expected 15+ wells, found {len(response)}")
        return success

    def test_producao_resumo(self):
        """Test production summary"""
        success, response = self.run_test("Production Summary", "GET", "producao/resumo", 200)
        if success and isinstance(response, dict):
            keys = ['total_barris_dia', 'total_gas_m3_dia', 'media_corte_agua', 'media_pressao_psi', 'registros']
            missing = [k for k in keys if k not in response]
            if not missing:
                print("✅ All expected fields present in production summary")
            else:
                print(f"⚠️  Missing fields: {missing}")
        return success

    def test_dutos(self):
        """Test pipelines endpoints"""
        success, response = self.run_test("List Pipelines", "GET", "dutos", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} pipelines")
            if len(response) >= 8:
                print("✅ Expected 8+ pipelines found")
            else:
                print(f"⚠️  Expected 8+ pipelines, found {len(response)}")
        return success

    def test_conformidade(self):
        """Test compliance endpoints"""
        success, response = self.run_test("List Compliance Reports", "GET", "conformidade", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} compliance reports")
            if len(response) >= 10:
                print("✅ Expected 10+ reports found")
                # Test PDF export with first report
                if response:
                    report_id = response[0].get('id')
                    if report_id:
                        pdf_success, _ = self.run_test(
                            "Export PDF", "GET", f"conformidade/{report_id}/pdf", 200
                        )
                        excel_success, _ = self.run_test(
                            "Export Excel", "GET", f"conformidade/{report_id}/excel", 200
                        )
                        return success and pdf_success and excel_success
            else:
                print(f"⚠️  Expected 10+ reports, found {len(response)}")
        return success

    def test_telemetria(self):
        """Test telemetry endpoints"""
        # Test docs endpoint (no auth required)
        docs_success, _ = self.run_test("Telemetry Docs", "GET", "telemetria/docs", 200)
        
        # Test API endpoint (no auth required)
        test_data = {
            "sensor_id": "TEST-SENSOR-001",
            "tipo": "pressao",
            "valor": 123.45,
            "unidade": "PSI",
            "duto_id": "test-duto"
        }
        api_success, response = self.run_test(
            "Send Telemetry Data", "POST", "telemetria/api", 200, 
            data=test_data, headers={}  # No auth header
        )
        
        if api_success and isinstance(response, dict):
            if response.get('status') == 'ok':
                print("✅ Telemetry data accepted successfully")
            else:
                print(f"⚠️  Unexpected response: {response}")
        
        return docs_success and api_success

    def test_fauna(self):
        """Test fauna CRUD endpoints"""
        # List fauna
        list_success, fauna_list = self.run_test("List Fauna", "GET", "fauna", 200)
        if list_success and isinstance(fauna_list, list):
            print(f"   Found {len(fauna_list)} fauna observations")
            if len(fauna_list) >= 25:
                print("✅ Expected 25+ observations found")
            else:
                print(f"⚠️  Expected 25+ observations, found {len(fauna_list)}")

        # Create new observation
        new_obs = {
            "especie": "Baleia Jubarte (Teste)",
            "data_observacao": "2024-08-15",
            "plataforma": "P-TEST",
            "coordenadas_lat": -22.5,
            "coordenadas_lon": -40.2,
            "observador": "Teste Automatizado",
            "notas": "Observacao criada durante teste automatizado"
        }
        create_success, created = self.run_test("Create Fauna", "POST", "fauna", 200, data=new_obs)
        
        if create_success and isinstance(created, dict) and 'id' in created:
            obs_id = created['id']
            print(f"✅ Created observation with ID: {obs_id}")
            
            # Update observation
            update_data = {"notas": "Observacao atualizada durante teste"}
            update_success, _ = self.run_test("Update Fauna", "PUT", f"fauna/{obs_id}", 200, data=update_data)
            
            # Delete observation
            delete_success, _ = self.run_test("Delete Fauna", "DELETE", f"fauna/{obs_id}", 200)
            
            return list_success and create_success and update_success and delete_success
        
        return list_success

    def test_usuarios(self):
        """Test users endpoint"""
        success, response = self.run_test("List Users", "GET", "usuarios", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} users")
            # Check if admin user exists
            admin_found = any(u.get('username') == 'admin' for u in response)
            if admin_found:
                print("✅ Admin user found in user list")
            else:
                print("⚠️  Admin user not found in user list")
        return success

    def run_all_tests(self):
        """Run complete test suite"""
        print("=" * 60)
        print("🚀 SIGEP Backend API Test Suite")
        print("=" * 60)
        
        # Test login first
        if not self.test_login():
            print("❌ Login failed - cannot continue with authenticated tests")
            return False
        
        # Test all endpoints
        test_results = {
            'auth_me': self.test_auth_me()[0],
            'pocos': self.test_pocos(),
            'producao_resumo': self.test_producao_resumo(),
            'dutos': self.test_dutos(),
            'conformidade': self.test_conformidade(),
            'telemetria': self.test_telemetria(),
            'fauna': self.test_fauna(),
            'usuarios': self.test_usuarios()
        }
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                error_msg = test.get('error', f'Expected {test.get("expected")}, got {test.get("actual")}')
                print(f"  - {test['name']}: {error_msg}")
        
        print("\n📋 ENDPOINT RESULTS:")
        for endpoint, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {endpoint}: {status}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SIGEPAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())