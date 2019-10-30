.PHONY: web test help
.DEFAULT_GOAL: help

default: help

help: ## Output available commands
	@echo "Available commands:"
	@echo
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

web:  ## Run a webhook docker
	@docker-compose build web
	@docker-compose up -d web

test: ## Run the current test suite
	@docker-compose build test
	@docker-compose run --rm test
