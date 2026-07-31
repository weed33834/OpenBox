.PHONY: install test cov update verify discover validate lint check clean secrets health site health

install:
	pip install -r requirements.txt

test:
	python -m pytest tests/ -q

cov:
	python -m pytest --cov=scripts --cov-report=term-missing

update:
	python scripts/update.py

verify:
	FREENODE_VERIFY_NODES=true python scripts/update.py --verify

discover:
	python scripts/discover_sources.py

validate:
	python scripts/validate.py

lint:
	python -m ruff check scripts tests

# Pre-push gate: lint + test
check: lint test

# Site data builder
site:
	python scripts/site_builder.py

# Health check API server (default :9000)
health:
	python scripts/health_api.py

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Scan the repo for leaked secrets
secrets:
	bash scripts/check_secrets.sh
