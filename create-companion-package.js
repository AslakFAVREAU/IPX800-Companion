const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read version from manifest.json
const manifestPath = path.join(__dirname, 'companion', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const VERSION = manifest.version;

// Create pkg folder
const pkgDir = path.join(__dirname, 'pkg');
if (fs.existsSync(pkgDir)) {
    fs.rmSync(pkgDir, { recursive: true, force: true });
}
fs.mkdirSync(pkgDir, { recursive: true });

// Create companion folder in pkg
const companionDir = path.join(pkgDir, 'companion');
fs.mkdirSync(companionDir, { recursive: true });

// Copy required files
const filesToCopy = [
    'main.js',
    'actions.js',
    'feedbacks.js',
    'upgrades.js',
    'variables.js',
    'README.md',
    'package.json'
];

filesToCopy.forEach(file => {
    fs.copyFileSync(
        path.join(__dirname, file),
        path.join(pkgDir, file)
    );
    console.log(`Copied: ${file}`);
});

// Copy companion folder files
fs.copyFileSync(
    path.join(__dirname, 'companion', 'manifest.json'),
    path.join(companionDir, 'manifest.json')
);
console.log('Copied: companion/manifest.json');

fs.copyFileSync(
    path.join(__dirname, 'companion', 'HELP.md'),
    path.join(companionDir, 'HELP.md')
);
console.log('Copied: companion/HELP.md');

// Copy node_modules
console.log('\nCopying node_modules...');
const nodeModulesSource = path.join(__dirname, 'node_modules');
const nodeModulesDest = path.join(pkgDir, 'node_modules');

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

copyRecursiveSync(nodeModulesSource, nodeModulesDest);
console.log('✅ node_modules copied');

// Use version from manifest.json to create archive
const archiveName = `companion-module-ipx800-${VERSION}.tgz`;

// Create tar.gz archive with pkg folder
console.log('\nCreating archive...');
try {
    execSync(`tar -czf ${archiveName} pkg`, { cwd: __dirname });
    console.log(`\n✅ Archive created: ${archiveName}`);
    
    // Clean up pkg folder
    fs.rmSync(pkgDir, { recursive: true, force: true });
    console.log('✅ Temporary folder cleaned up');
} catch (error) {
    console.error('❌ Error creating archive:', error.message);
    process.exit(1);
}
