const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

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

// Function to get commits since last tag
function getChangelogFromGit() {
    try {
        // Get the last tag
        const lastTag = execSync('git describe --tags --abbrev=0 2>$null', { encoding: 'utf8' }).trim();
        
        if (lastTag) {
            // Get commits since last tag
            const commits = execSync(`git log ${lastTag}..HEAD --pretty=format:"- %s"`, { encoding: 'utf8' }).trim();
            
            if (commits) {
                return `## Changes since ${lastTag}\n\n${commits}`;
            }
        }
        
        // If no previous tag, get the last 10 commits
        const recentCommits = execSync('git log -10 --pretty=format:"- %s"', { encoding: 'utf8' }).trim();
        return `## Recent changes\n\n${recentCommits}`;
        
    } catch (error) {
        console.log('⚠️  Unable to retrieve git history, using default message');
        return `## Changes in ${VERSION}\n\nSee commits on GitHub for more details.`;
    }
}

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
        console.log(`📦 Creating release ${TAG_NAME}...`);
        
        // Generate changelog from git
        const changelog = getChangelogFromGit();
        
        // Create the release
        const releaseData = JSON.stringify({
            tag_name: TAG_NAME,
            name: `${TAG_NAME}`,
            body: `# Release ${TAG_NAME}\n\n${changelog}\n\n## Installation\n\nDownload the \`${TGZ_FILE}\` file and import it into Companion.`,
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
        console.log(`✅ Release created: ${release.html_url}`);
        
        // Upload the .tgz file
        console.log(`📤 Uploading file ${TGZ_FILE}...`);
        const asset = await uploadAsset(release.upload_url, TGZ_PATH);
        console.log(`✅ File uploaded: ${asset.browser_download_url}`);
        
        console.log('\n🎉 Release created successfully!');
        console.log(`\nRelease URL: ${release.html_url}`);
        console.log(`Download URL: ${asset.browser_download_url}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Checks before creation
if (!GITHUB_TOKEN) {
    console.error('❌ Error: GITHUB_TOKEN not defined');
    console.log('\nTo create a GitHub token:');
    console.log('1. Go to https://github.com/settings/tokens');
    console.log('2. Click "Generate new token" > "Generate new token (classic)"');
    console.log('3. Give the token a name (e.g., "Companion Release")');
    console.log('4. Check permissions: "repo" (Full control of private repositories)');
    console.log('5. Click "Generate token" and copy the token');
    console.log('\nThen set the environment variable:');
    console.log('$env:GITHUB_TOKEN="your_token_here"');
    process.exit(1);
}

if (!fs.existsSync(TGZ_PATH)) {
    console.error(`❌ Error: File ${TGZ_FILE} does not exist`);
    console.log('Run first: node create-companion-package.js');
    process.exit(1);
}

console.log(`📦 Version detected: ${VERSION}`);
createRelease();
