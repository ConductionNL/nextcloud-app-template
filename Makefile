# Makefile for nextcloud-app-template development

# Create a relative symlink in the parent directory so Nextcloud can find the
# app by its ID (apptemplate) even though the repo is cloned as nextcloud-app-template.
# Nextcloud requires the directory name to match the <id> in appinfo/info.xml.
dev-link:
	@if [ -L ../apptemplate ]; then \
		echo "Symlink ../apptemplate already exists."; \
	else \
		ln -s nextcloud-app-template ../apptemplate && \
		echo "Created symlink: apps-extra/apptemplate -> nextcloud-app-template"; \
	fi

dev-unlink:
	@if [ -L ../apptemplate ]; then \
		rm ../apptemplate && echo "Removed symlink ../apptemplate"; \
	else \
		echo "No symlink found at ../apptemplate."; \
	fi

.PHONY: dev-link dev-unlink
