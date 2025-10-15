const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Créer le dossier pkg
const pkgDir = path.join(__dirname, 'pkg');
if (fs.existsSync(pkgDir)) {
    fs.rmSync(pkgDir, { recursive: true, force: true });
}
fs.mkdirSync(pkgDir, { recursive: true });

// Créer le dossier companion dans pkg
const companionDir = path.join(pkgDir, 'companion');
fs.mkdirSync(companionDir, { recursive: true });

// Copier les fichiers nécessaires
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
    console.log(`Copié: ${file}`);
});

// Copier les fichiers du dossier companion
fs.copyFileSync(
    path.join(__dirname, 'companion', 'manifest.json'),
    path.join(companionDir, 'manifest.json')
);
console.log('Copié: companion/manifest.json');

fs.copyFileSync(
    path.join(__dirname, 'companion', 'HELP.md'),
    path.join(companionDir, 'HELP.md')
);
console.log('Copié: companion/HELP.md');

// Copier node_modules
console.log('\nCopie de node_modules...');
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
console.log('✅ node_modules copié');

// Lire package.json pour obtenir le nom et la version
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const archiveName = `${packageJson.name}-${packageJson.version}.tgz`;

// Créer l'archive tar.gz avec le dossier pkg
console.log('\nCréation de l\'archive...');
try {
    execSync(`tar -czf ${archiveName} pkg`, { cwd: __dirname });
    console.log(`\n✅ Archive créée: ${archiveName}`);
    
    // Nettoyer le dossier pkg
    fs.rmSync(pkgDir, { recursive: true, force: true });
    console.log('✅ Dossier temporaire nettoyé');
} catch (error) {
    console.error('❌ Erreur lors de la création de l\'archive:', error.message);
    process.exit(1);
}
