const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO_OWNER = 'AslakFAVREAU';
const REPO_NAME = 'IPX800-Companion';

// Lire la version depuis manifest.json
const manifestPath = path.join(__dirname, 'companion', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const VERSION = manifest.version;
const TAG_NAME = VERSION;

// Nom du fichier .tgz à uploader
const TGZ_FILE = `companion-module-ipx800-${VERSION}.tgz`;
const TGZ_PATH = path.join(__dirname, TGZ_FILE);

// Fonction pour faire une requête HTTPS
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });
        
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

// Fonction pour uploader un fichier
function uploadAsset(uploadUrl, filePath) {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath);
        const fileSize = fs.statSync(filePath).size;
        const fileStream = fs.createReadStream(filePath);
        
        // Construire l'URL d'upload (remplacer {?name,label} par le nom du fichier)
        const url = uploadUrl.replace('{?name,label}', `?name=${fileName}`);
        const urlParts = new URL(url);
        
        const options = {
            hostname: urlParts.hostname,
            path: urlParts.pathname + urlParts.search,
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/gzip',
                'Content-Length': fileSize,
                'User-Agent': 'Node.js'
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });
        
        req.on('error', reject);
        fileStream.pipe(req);
    });
}

async function createRelease() {
    try {
        console.log(`📦 Création de la release ${TAG_NAME}...`);
        
        // Créer la release
        const releaseData = JSON.stringify({
            tag_name: TAG_NAME,
            name: `${TAG_NAME}`,
            body: `## Changes in ${TAG_NAME}\n\n- Simplified documentation (removed icons and AI-generated tone)\n- GitHub integration for automatic updates\n- Improved clarity in HELP.md and README.md\n\n## Installation\n\nDownload the \`${TGZ_FILE}\` file and import it into Companion.`,
            draft: false,
            prerelease: false
        });
        
        const createOptions = {
            hostname: 'api.github.com',
            path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'Node.js',
                'Content-Type': 'application/json',
                'Content-Length': releaseData.length
            }
        };
        
        const release = await makeRequest(createOptions, releaseData);
        console.log(`✅ Release créée: ${release.html_url}`);
        
        // Uploader le fichier .tgz
        console.log(`📤 Upload du fichier ${TGZ_FILE}...`);
        const asset = await uploadAsset(release.upload_url, TGZ_PATH);
        console.log(`✅ Fichier uploadé: ${asset.browser_download_url}`);
        
        console.log('\n🎉 Release créée avec succès!');
        console.log(`\nLien de la release: ${release.html_url}`);
        console.log(`Lien de téléchargement: ${asset.browser_download_url}`);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

// Vérifications avant création
if (!GITHUB_TOKEN) {
    console.error('❌ Erreur: GITHUB_TOKEN non défini');
    console.log('\nPour créer un token GitHub:');
    console.log('1. Allez sur https://github.com/settings/tokens');
    console.log('2. Cliquez sur "Generate new token" > "Generate new token (classic)"');
    console.log('3. Donnez un nom au token (ex: "Companion Release")');
    console.log('4. Cochez les permissions: "repo" (Full control of private repositories)');
    console.log('5. Cliquez sur "Generate token" et copiez le token');
    console.log('\nPuis définissez la variable d\'environnement:');
    console.log('$env:GITHUB_TOKEN="votre_token_ici"');
    process.exit(1);
}

if (!fs.existsSync(TGZ_PATH)) {
    console.error(`❌ Erreur: Le fichier ${TGZ_FILE} n'existe pas`);
    console.log('Exécutez d\'abord: node create-companion-package.js');
    process.exit(1);
}

console.log(`📦 Version détectée: ${VERSION}`);
createRelease();
