.PHONY: server test stop status help
.DEFAULT_GOAL: help

default: help

help: ## Output available commands
	@echo "Available commands:"
	@echo
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

server: ## Run the webhook docker
	@docker-compose up -d --build web

test: ## Run the current test suite
	@docker-compose build test
	@docker-compose run --rm test

stop: ## Stop webhook docker
		@docker-compose stop

status: ## Show docker status
		@docker-compose ps

