"""
Script to generate comprehensive mock data for Sahara
Generates 5+ providers for each service category with unique identities
"""

# Medical Specialists Data
doctors_by_specialty = {
    "General Physician": [
        ("Dr. Rajesh Sharma", "Patan Hospital", "Lalitpur", 500, 15, "4.8"),
        ("Dr. Anita Thapa", "City Hospital", "Lazimpat", 600, 12, "4.7"),
        ("Dr. Mohan Karki", "Mediciti Hospital", "Bhaisepati", 550, 18, "4.9"),
        ("Dr. Sunita Rai", "Om Hospital", "Chabahil", 500, 10, "4.6"),
        ("Dr. Keshav Adhikari", "B&B Hospital", "Gwarko", 450, 8, "4.5"),
    ],
    "Cardiologist": [
        ("Dr. Bikram Thapa", "Heart Care Center", "Tinkune", 1500, 20, "4.9"),
        ("Dr. Sapana Shrestha", "Grande International", "Dhapasi", 1800, 22, "5.0"),
        ("Dr. Ramesh Poudel", "Norvic Hospital", "Thapathali", 1600, 18, "4.8"),
        ("Dr. Sita Magar", "TU Teaching Hospital", "Maharajgunj", 1200, 25, "4.7"),
        ("Dr. Prakash Joshi", "Nepal Mediciti", "Lal

itpur", 1700, 15, "4.9"),
    ],
    "Urologist": [
        ("Dr. Bikash Shrestha", "Grande International", "Dhapasi", 1200, 12, "4.7"),
        ("Dr. Ramesh Adhikari", "Norvic Hospital", "Thapathali", 1400, 15, "4.8"),
        ("Dr. Sunita Thapa", "B&B Hospital", "Gwarko", 1100, 10, "4.6"),
        ("Dr. Prabin Karki", "Star Hospital", "Sanepa", 1300, 14, "4.9"),
        ("Dr. Anita Rai", "Om Hospital", "Chabahil", 1250, 11, "4.7"),
    ],
    # ... and so on for all specialties
}

# Home Services Data
home_services = {
    "Salon": [
        ("Glow & Style", "Rohan Kumar", "New Baneshwor", 500, "4.5"),
        ("Chhaya Beauty Parlour", "Sita Devi", "Putalisadak", 450, "4.7"),
        ("Men's Den Salon", "Arjun Rai", "Lazimpat", 600, "4.8"),
        ("Royal Cuts", "Bijay Thapa", "Thamel", 550, "4.6"),
        ("Elegance Studio", "Maya Gurung", "Kupondole", 700, "4.9"),
    ],
    # ... and so on
}

print("This script would generate the full mock data")
print("Run this to see the complete structure")
