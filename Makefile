.PHONY: up down logs migrate test-api test-worker lint mobile-install mobile-ios mobile-clean

# Docker commands
up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

# Database
migrate:
	docker-compose exec api alembic upgrade head

migrate-new:
	docker-compose exec api alembic revision --autogenerate -m "$(name)"

# Testing
test-api:
	docker-compose exec api pytest tests/ -v

test-worker:
	docker-compose exec worker pytest tests/ -v

lint:
	docker-compose exec api ruff check app/
	docker-compose exec worker ruff check worker/

lint-fix:
	docker-compose exec api ruff check app/ --fix
	docker-compose exec worker ruff check worker/ --fix

# Mobile commands
mobile-install:
	cd apps/mobile && npm install && cd ios && pod install

mobile-ios:
	cd apps/mobile && npm run ios

mobile-start:
	cd apps/mobile && npm start

mobile-clean:
	cd apps/mobile && rm -rf node_modules ios/Pods ios/build android/build
	cd apps/mobile/ios && pod deintegrate

# Development helpers
shell-api:
	docker-compose exec api /bin/bash

shell-worker:
	docker-compose exec worker /bin/bash

shell-db:
	docker-compose exec postgres psql -U postgres -d eaglai

# Full reset
reset:
	docker-compose down -v
	rm -rf local_s3/*
	docker-compose up -d
	sleep 3
	docker-compose exec api alembic upgrade head
