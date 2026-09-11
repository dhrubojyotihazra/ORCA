import unittest
import datetime
import os
import sys

# Add the project root to the python path so imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from data.tools import mosdac_tools
from data.tools import incois_tools
from data.tools import geofence_tools

class TestDataTools(unittest.TestCase):
    def setUp(self):
        self.test_date = datetime.date(2026, 9, 2)
        self.test_lat = 20.1
        self.test_lon = 70.2
        self.test_sector = "Gujarat"

    def test_mosdac_sst(self):
        result = mosdac_tools.get_sst(self.test_lat, self.test_lon, self.test_date)
        self.assertEqual(result["status"], "success")
        self.assertIn("sst", result["data"])
        self.assertEqual(result["data"]["unit"], "Celsius")

    def test_mosdac_chlorophyll(self):
        result = mosdac_tools.get_chlorophyll(self.test_lat, self.test_lon, self.test_date)
        self.assertEqual(result["status"], "success")
        self.assertIn("chlorophyll", result["data"])

    def test_incois_pfz(self):
        result = incois_tools.get_pfz_advisories(self.test_sector, self.test_date)
        self.assertEqual(result["status"], "success")
        self.assertIsInstance(result["data"]["pfz_zones"], list)

    def test_incois_alerts(self):
        result = incois_tools.get_hazard_alerts(self.test_lat, self.test_lon, self.test_date)
        self.assertEqual(result["status"], "success")
        self.assertIsInstance(result["data"]["alerts"], list)

    def test_geofence_check(self):
        result = geofence_tools.check_zone(self.test_lat, self.test_lon)
        self.assertEqual(result["status"], "success")
        self.assertIn("is_restricted", result["data"])

if __name__ == "__main__":
    unittest.main()
