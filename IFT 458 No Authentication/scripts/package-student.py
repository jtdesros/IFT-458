#!/usr/bin/env python3
"""Build the student ZIP from an explicit list; exclude private/local files."""
from pathlib import Path
import argparse
import hashlib
import zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=root.parent / '2.1-Level-1-Simple-DB-Authentication.zip')
args = parser.parse_args()
files = [root / name for name in [
    'README.md', 'START-HERE.html', 'config.env.example', '.gitignore', '.dockerignore',
    'package.json', 'package-lock.json', 'app.js', 'server.js', 'SwaggerTFT458.js',
    'requests.http', 'Dockerfile', 'scripts/package-student.py',
    'Assignment instructions/START-HERE.md', 'Assignment instructions/ASSIGNMENT.md',
    'Assignment instructions/SWAGGER-GUIDE.md', 'Assignment instructions/SUBMISSION-CHECKLIST.md'
]]
for directory in ['controllers', 'models', 'routes', 'middleware', 'utils', 'tests', 'dev-data']:
    files.extend(p for p in (root / directory).rglob('*') if p.is_file() and p.suffix in {'.js', '.json'})
files = sorted(set(files))
for p in files:
    if not p.is_file() or p.is_symlink():
        raise SystemExit(f'Missing or linked release file: {p.relative_to(root)}')
manifest = ''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(root).as_posix()}\n' for p in files)
args.output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(args.output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for p in files:
        archive.write(p, 'IFT_Level1/' + p.relative_to(root).as_posix())
    archive.writestr('IFT_Level1/PACKAGE-MANIFEST.sha256', manifest)
with zipfile.ZipFile(args.output) as archive:
    assert archive.testzip() is None
checksum = hashlib.sha256(args.output.read_bytes()).hexdigest()
args.output.with_suffix('.zip.sha256').write_text(f'{checksum}  {args.output.name}\n')
print(f'{args.output}\n{len(files) + 1} files, {args.output.stat().st_size:,} bytes\nSHA256 {checksum}')
