#!/bin/bash
#
# Interactive setup script for ConductionNL Nextcloud App Template
#
# Replaces all template placeholders with your app's details.
# Run once after creating a new repository from this template.
#
# Usage: bash setup.sh
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE} ConductionNL App Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# --- Gather information ---

# Try to detect from git remote
DETECTED_NAME=""
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ -n "$REMOTE_URL" ]]; then
    DETECTED_NAME=$(echo "$REMOTE_URL" | sed -E 's|.*/([^/]+)(\.git)?$|\1|')
fi

# App name (kebab-case)
echo -e "${YELLOW}App name (kebab-case, e.g. 'my-cool-app'):${NC}"
if [[ -n "$DETECTED_NAME" && "$DETECTED_NAME" != "nextcloud-app-template" ]]; then
    echo -e "  Detected from git remote: ${GREEN}${DETECTED_NAME}${NC}"
    read -rp "  App name [$DETECTED_NAME]: " APP_NAME
    APP_NAME="${APP_NAME:-$DETECTED_NAME}"
else
    read -rp "  App name: " APP_NAME
fi

if [[ -z "$APP_NAME" ]]; then
    echo -e "${RED}Error: App name is required.${NC}"
    exit 1
fi

# Validate kebab-case
if [[ ! "$APP_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
    echo -e "${RED}Error: App name must be kebab-case (lowercase letters, numbers, hyphens).${NC}"
    exit 1
fi

# Description
echo ""
echo -e "${YELLOW}Short description (one line, for info.xml summary):${NC}"
read -rp "  Description: " APP_DESCRIPTION

if [[ -z "$APP_DESCRIPTION" ]]; then
    APP_DESCRIPTION="A Nextcloud app"
fi

# Dutch description
echo ""
echo -e "${YELLOW}Dutch description (leave empty to skip):${NC}"
read -rp "  Beschrijving: " APP_DESCRIPTION_NL

if [[ -z "$APP_DESCRIPTION_NL" ]]; then
    APP_DESCRIPTION_NL="Een Nextcloud-app"
fi

# Author
echo ""
echo -e "${YELLOW}Author name [Conduction]:${NC}"
read -rp "  Author: " APP_AUTHOR
APP_AUTHOR="${APP_AUTHOR:-Conduction}"

# Author email
echo ""
echo -e "${YELLOW}Author email [info@conduction.nl]:${NC}"
read -rp "  Email: " APP_EMAIL
APP_EMAIL="${APP_EMAIL:-info@conduction.nl}"

# --- Derive naming variants ---

# kebab-case: my-cool-app (already have this)
APP_KEBAB="$APP_NAME"

# snake_case: my_cool_app
APP_SNAKE=$(echo "$APP_KEBAB" | tr '-' '_')

# PascalCase: MyCoolApp
APP_PASCAL=$(echo "$APP_KEBAB" | sed -E 's/(^|-)([a-z])/\U\2/g')

# Display Name (from kebab, capitalize words)
APP_DISPLAY=$(echo "$APP_KEBAB" | sed -E 's/(^|-)([a-z])/\U\2/g; s/([A-Z])/ \1/g; s/^ //')

echo ""
echo -e "${BLUE}--- Naming variants ---${NC}"
echo -e "  kebab-case:  ${GREEN}${APP_KEBAB}${NC}"
echo -e "  snake_case:  ${GREEN}${APP_SNAKE}${NC}"
echo -e "  PascalCase:  ${GREEN}${APP_PASCAL}${NC}"
echo -e "  Display:     ${GREEN}${APP_DISPLAY}${NC}"
echo -e "  Description: ${GREEN}${APP_DESCRIPTION}${NC}"
echo -e "  Author:      ${GREEN}${APP_AUTHOR} <${APP_EMAIL}>${NC}"
echo ""

read -rp "Proceed with these values? [Y/n]: " CONFIRM
CONFIRM="${CONFIRM:-Y}"
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${BLUE}Replacing placeholders...${NC}"

# --- Replacement function ---
replace_in_file() {
    local file="$1"
    if [[ -f "$file" ]]; then
        # Template placeholders
        sed -i "s|app-template|${APP_KEBAB}|g" "$file"
        sed -i "s|app_template|${APP_SNAKE}|g" "$file"
        sed -i "s|AppTemplate|${APP_PASCAL}|g" "$file"
        sed -i "s|App Template|${APP_DISPLAY}|g" "$file"
        sed -i "s|APP_TEMPLATE|$(echo "$APP_SNAKE" | tr '[:lower:]' '[:upper:]')|g" "$file"
        # Also handle the nextcloud-app-template repo name
        sed -i "s|nextcloud-app-template|${APP_KEBAB}|g" "$file"
    fi
}

# --- Process all files ---

# Find all text files (skip .git, node_modules, vendor, build artifacts)
FILES=$(find . \
    -not -path './.git/*' \
    -not -path './node_modules/*' \
    -not -path './vendor/*' \
    -not -path './js/*' \
    -not -path './build/*' \
    -not -path './setup.sh' \
    -type f \
    \( -name '*.php' -o -name '*.js' -o -name '*.vue' -o -name '*.json' \
       -o -name '*.xml' -o -name '*.yml' -o -name '*.yaml' -o -name '*.md' \
       -o -name '*.css' -o -name '*.neon' -o -name '*.config.js' \))

for file in $FILES; do
    replace_in_file "$file"
    echo -e "  ${GREEN}✓${NC} $file"
done

# --- Rename the register JSON file ---
if [[ -f "lib/Settings/app_template_register.json" ]]; then
    mv "lib/Settings/app_template_register.json" "lib/Settings/${APP_SNAKE}_register.json"
    echo -e "  ${GREEN}✓${NC} Renamed register JSON to ${APP_SNAKE}_register.json"
    # Update the reference in SettingsService.php
    sed -i "s|${APP_SNAKE}_register.json|${APP_SNAKE}_register.json|g" "lib/Service/SettingsService.php"
fi

# --- Update descriptions in info.xml ---
if [[ -f "appinfo/info.xml" ]]; then
    sed -i "s|<summary lang=\"en\">.*</summary>|<summary lang=\"en\">${APP_DESCRIPTION}</summary>|" "appinfo/info.xml"
    sed -i "s|<summary lang=\"nl\">.*</summary>|<summary lang=\"nl\">${APP_DESCRIPTION_NL}</summary>|" "appinfo/info.xml"
    sed -i "s|<author mail=\"[^\"]*\" homepage=\"[^\"]*\">[^<]*</author>|<author mail=\"${APP_EMAIL}\" homepage=\"https://www.conduction.nl/\">${APP_AUTHOR}</author>|" "appinfo/info.xml"
    echo -e "  ${GREEN}✓${NC} Updated info.xml descriptions and author"
fi

# --- Update composer.json ---
if [[ -f "composer.json" ]]; then
    # The name replacement is already handled by the general replacements
    echo -e "  ${GREEN}✓${NC} Updated composer.json"
fi

# --- Update GitHub URLs ---
ORG="ConductionNL"
GITHUB_URLS_FILES=$(find . -type f \( -name '*.xml' -o -name '*.md' -o -name '*.yaml' -o -name '*.yml' \) \
    -not -path './.git/*' -not -path './node_modules/*' -not -path './vendor/*')
for file in $GITHUB_URLS_FILES; do
    if [[ -f "$file" ]]; then
        sed -i "s|ConductionNL/nextcloud-app-template|${ORG}/${APP_KEBAB}|g" "$file"
        sed -i "s|ConductionNL/app-template|${ORG}/${APP_KEBAB}|g" "$file"
    fi
done
echo -e "  ${GREEN}✓${NC} Updated GitHub URLs"

# --- Update settings mount point in templates ---
if [[ -f "templates/settings/admin.php" ]]; then
    sed -i "s|app-template-settings|${APP_KEBAB}-settings|g" "templates/settings/admin.php"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN} Setup complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Review the changes: ${BLUE}git diff${NC}"
echo -e "  2. Install dependencies: ${BLUE}composer install && npm install${NC}"
echo -e "  3. Build the frontend: ${BLUE}npm run build${NC}"
echo -e "  4. Update the register JSON with your schemas: ${BLUE}lib/Settings/${APP_SNAKE}_register.json${NC}"
echo -e "  5. Add your object types in: ${BLUE}src/store/store.js${NC}"
echo -e "  6. Add navigation items in: ${BLUE}src/navigation/MainMenu.vue${NC}"
echo -e "  7. Add routes in: ${BLUE}src/router/index.js${NC}"
echo -e "  8. Update translations in: ${BLUE}l10n/en.json${NC} and ${BLUE}l10n/nl.json${NC}"
echo -e "  9. Delete this setup script: ${BLUE}rm setup.sh${NC}"
echo ""
