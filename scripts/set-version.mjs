import { readFileSync, writeFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'));
const envPath = './src/environment/environment.dev.ts';
let content = readFileSync(envPath, 'utf-8');
content = content.replace(/version: '[^']*'/, `version: '${version}'`);
writeFileSync(envPath, content);
console.log(`Version set to ${version}`);
