RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Configuring Git...${NC}"

echo -e "${BLUE}Type Git Email:${NC}"
read git_email

echo -e "${BLUE}Type Git Username:${NC}"
read git_username

git config --global user.email $git_email
git config --global user.name $git_username

echo -e "${BLUE}npm install...${NC}"
npm install

echo -e "${BLUE}npm run start:devcontainer...${NC}"
npm run start:devcontainer