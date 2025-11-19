RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[34m'
NC='\033[0m' # No Color

# transfer ownership of
sudo chown -R node:node package.json README.md node_modules src tsconfig.app.json tsconfig.json
sudo chmod -R 755 node_modules

echo -e "${BLUE}Configuring Git Repository...${NC}"
# Mark git repository as safe for VS-Code
git config --global --add safe.directory '*'

echo -e "${BLUE}Run npm install...${NC}"
npm install --legacy-peer-deps