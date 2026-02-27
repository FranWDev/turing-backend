import os
import zipfile

repo_dir = os.path.expanduser('~/.m2/repository/org/springframework/boot/')
found = []

for root, dirs, files in os.walk(repo_dir):
    for file in files:
        if file.endswith('.jar'):
            jar_path = os.path.join(root, file)
            try:
                with zipfile.ZipFile(jar_path, 'r') as jar:
                    for name in jar.namelist():
                        if 'AutoConfigureMockMvc.class' in name:
                            found.append((jar_path, name))
            except Exception:
                pass

for jar, name in found:
    print(f"Found in {jar}: {name}")
