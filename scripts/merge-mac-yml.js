import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

function mergeMacYml() {
  const releaseDir = path.join(process.cwd(), 'apps', 'admin', 'release');
  
  if (!fs.existsSync(releaseDir)) {
    console.error(`Release directory not found: ${releaseDir}`);
    process.exit(1);
  }

  // Find the version subdirectory (e.g. 0.0.1-alpha.21)
  const subdirs = fs.readdirSync(releaseDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (subdirs.length === 0) {
    console.error('No version subdirectories found in release directory.');
    process.exit(1);
  }

  for (const subdir of subdirs) {
    const targetDir = path.join(releaseDir, subdir);
    
    const arm64Path = path.join(targetDir, 'latest-mac-arm64.yml');
    const x64Path = path.join(targetDir, 'latest-mac-x64.yml');
    const outPath = path.join(targetDir, 'latest-mac.yml');

    if (!fs.existsSync(arm64Path) || !fs.existsSync(x64Path)) {
      console.log(`Skipping ${subdir}: Both arm64 and x64 yml files not found.`);
      continue;
    }

    try {
      const arm64Content = yaml.parse(fs.readFileSync(arm64Path, 'utf8'));
      const x64Content = yaml.parse(fs.readFileSync(x64Path, 'utf8'));

      // Start with the base content from one of them
      const mergedContent = { ...arm64Content };
      
      // Combine files array
      const files = [];
      if (arm64Content.files) {
        files.push(...arm64Content.files);
      }
      if (x64Content.files) {
        files.push(...x64Content.files);
      }
      
      mergedContent.files = files;

      // We retain the path and sha512 from the base content (which comes from one of the archs)
      // as a fallback for older electron-updater clients.

      fs.writeFileSync(outPath, yaml.stringify(mergedContent), 'utf8');
      console.log(`Successfully merged latest-mac.yml in ${subdir}`);
      
      // Optional: clean up the arch-specific files
      fs.unlinkSync(arm64Path);
      fs.unlinkSync(x64Path);
    } catch (err) {
      console.error(`Error merging files in ${subdir}:`, err);
      process.exit(1);
    }
  }
}

mergeMacYml();
