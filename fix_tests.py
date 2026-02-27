import os
import re

TEST_DIR = "src/test/java/com/economato/inventory/controller/"
TEST_FILES = [
    "StockLedgerControllerIntegrationTest.java",
    "RecipeAuditControllerIntegrationTest.java",
    "OrderAuditControllerIntegrationTest.java",
    "InventoryAuditControllerIntegrationTest.java"
]

def process_file(file_path):
    with open(file_path, "r") as f:
        content = f.read()

    # Match @WithMockUser(username = "X", roles = { "Y" }) and capture username and roles
    # We will remove this line, and then we need to insert the .with() inside the very next mockMvc.perform(get(X)...)
    
    # We can do this block by block: split by @Test
    parts = content.split("@Test")
    new_content = parts[0]
    
    for part in parts[1:]:
        # Find WithMockUser
        m = re.search(r'@WithMockUser\(\s*username\s*=\s*"([^"]+)"\s*,\s*roles\s*=\s*\{\s*"([^"]+)"\s*\}\s*\)', part)
        if m:
            username = m.group(1)
            role = m.group(2)
            
            # Remove the annotation
            part = part[:m.start()] + part[m.end():]
            
            # Find mockMvc.perform(get(...)   or post(...) etc
            # and inject .with(...) after the parenthesis enclosing the HTTP method call
            
            # This regex finds mockMvc.perform(get("something")
            # and replaces it with mockMvc.perform(get("something").with(...)
            perform_regex = r'(mockMvc\.perform\(\s*(?:get|post|put|delete|patch)\([^)]+\))'
            
            replace_str = r'\g<1>.with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("' + username + r'").roles("' + role + r'"))'
            
            part = re.sub(perform_regex, replace_str, part, count=1)
            
        new_content += "@Test" + part
        
    # Remove import org.springframework.security.test.context.support.WithMockUser;
    new_content = new_content.replace('import org.springframework.security.test.context.support.WithMockUser;\n', '')
    
    # Let me make sure we remove the already modified one from my manual test:
    new_content = new_content.replace('.with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))', '')
    # Then apply it again via the script (it was already removed the @WithMockUser from that test? No, I only added the .with)
    # Ah, I need to clean up the double .with() if it happens.
    
    # Let's fix the fact that I manually added it to getAllMovements_WithAdminRole_ShouldReturnList but kept @WithMockUser!
    # The script will remove @WithMockUser and add .with() again. So it will have two .with(). 
    # That's why I am first stripping out the manual .with() string I added!
    
    with open(file_path, "w") as f:
        f.write(new_content)

for filename in TEST_FILES:
    full_path = os.path.join(TEST_DIR, filename)
    print("Processing", full_path)
    process_file(full_path)
