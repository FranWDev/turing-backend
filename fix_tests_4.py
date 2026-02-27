import os
import re
import subprocess

TEST_DIR = "src/test/java/com/economato/inventory/controller/"
TEST_FILES = [
    "StockLedgerControllerIntegrationTest.java",
    "RecipeAuditControllerIntegrationTest.java",
    "OrderAuditControllerIntegrationTest.java",
    "InventoryAuditControllerIntegrationTest.java"
]

for filename in TEST_FILES:
    file_path = os.path.join(TEST_DIR, filename)
    
    # Get the original file content from git HEAD
    result = subprocess.run(["git", "show", f"HEAD:{file_path}"], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Failed to get {file_path} from git")
        continue
        
    content = result.stdout
    
    parts = content.split("@Test")
    new_content = parts[0]
    
    # We also need to fix the BaseControllerMockTest imports if they are in these files? No, they are separate.
    for part in parts[1:]:
        m = re.search(r'@WithMockUser\(\s*username\s*=\s*"([^"]+)"\s*,\s*roles\s*=\s*\{\s*"([^"]+)"\s*\}\s*\)', part)
        if m:
            username = m.group(1)
            role = m.group(2)
            
            # Remove @WithMockUser
            part = part[:m.start()] + part[m.end():]
            
            # Find the FIRST mockMvc.perform(get("...")) or similar
            # A more robust regex: look for mockMvc.perform( and the HTTP method (get, post, etc.)
            # and append the .with() right before the first .contentType or .param or whatever chained method is next.
            # Actually, standard Spring MockMvc tests look like:
            # mockMvc.perform(get("/url")
            #           .contentType(...)
            
            # Let's just find `mockMvc.perform(get("X")` and literally replace it!
            # We can use a simpler regex that matches up to the closing parenthesis of get(...)
            perform_match = re.search(r'(mockMvc\.perform\(\s*(?:get|post|put|delete|patch)\([^)]+\))', part)
            if perform_match:
                # The exact string matched: e.g. 'mockMvc.perform(get("/api/inventory-audits")'
                matched_str = perform_match.group(1)
                replace_str = f'{matched_str}.with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("{username}").roles("{role}"))'
                part = part.replace(matched_str, replace_str, 1)
        
        new_content += "@Test" + part
        
    new_content = new_content.replace('import org.springframework.security.test.context.support.WithMockUser;\n', '')
    
    with open(file_path, "w") as f:
        f.write(new_content)
        
print("Replacement script completed.")
