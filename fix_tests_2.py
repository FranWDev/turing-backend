import os
import re

TEST_DIR = "src/test/java/com/economato/inventory/controller/"
TEST_FILES = [
    "StockLedgerControllerIntegrationTest.java",
    "RecipeAuditControllerIntegrationTest.java",
    "OrderAuditControllerIntegrationTest.java",
    "InventoryAuditControllerIntegrationTest.java"
]

for filename in TEST_FILES:
    file_path = os.path.join(TEST_DIR, filename)
    with open(file_path, "r") as f:
        content = f.read()
    
    parts = content.split("@Test")
    new_content = parts[0]
    
    for i, part in enumerate(parts[1:]):
        # Because we previously REMOVED @WithMockUser, we don't have it anymore!
        # D'oh! We already saved the file with @WithMockUser stripped out!
        pass
