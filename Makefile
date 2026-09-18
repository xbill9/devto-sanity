# Everything that can be verified without a Sanity login. Run: make check
SHELL := /bin/bash
ENV := source ./env.sh &&

.PHONY: install check typecheck test build-studio build-cabinet validate-workflow trials-fixture

install:
	@for d in studio workflows web cabinet agent; do echo "== $$d"; ($(ENV) cd $$d && npm install --no-audit --no-fund) || exit 1; done

typecheck:
	@for d in studio workflows web cabinet agent; do echo "== typecheck $$d"; ($(ENV) cd $$d && npx tsc --noEmit) || exit 1; done

test:
	@$(ENV) cd workflows && npx vitest run

validate-workflow:
	@$(ENV) cd workflows && SANITY_PROJECT_ID=$${SANITY_PROJECT_ID:-placeholder} npx sanity-workflows deploy --check

build-studio:
	@$(ENV) cd studio && npx sanity build --yes >/dev/null && echo "studio build ok"

build-cabinet:
	@$(ENV) cd cabinet && npx sanity build --yes >/dev/null && echo "cabinet build ok"

trials-fixture:
	@python3 trials/analyze.py trials/fixtures/runs.fixture.csv >/dev/null && echo "analyze.py ok"

# web/ is typechecked above; `next build` prerenders against the real dataset, so it needs a project.
check: typecheck test validate-workflow build-studio build-cabinet trials-fixture
	@echo "ALL CHECKS PASSED"
