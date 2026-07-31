# Contributing

Thanks for helping improve FreeNode.

## How to contribute

Contributions (Issues and Pull Requests) are handled on **GitHub** by default:
<https://github.com/weed33834/freenode>.

1. **Fork** the repo on GitHub and create your branch from `main`.
2. Make your changes.
3. Run `make test` and `make lint` to verify nothing is broken.
4. If you added a new source, add its entry to `config/sources.json`.
5. If you added a new protocol parser, add corresponding unit tests under
   `tests/`.
6. **Never commit secrets.** Run `scripts/check_secrets.sh` before pushing.
7. Open a Pull Request on
   <https://github.com/weed33834/freenode/pulls> with a clear description
   of what you changed and why.

## Code style

- Python 3.12+, type hints required on all public functions.
- Use `ruff` for formatting and linting (`make lint`).
- Comments explain *why*, not *what* (the code should be self-documenting).
- Keep imports minimal and standard-library-first.

## Testing

- `make test` runs the full test suite.
- If you modify the pipeline, try a live run:
  `python scripts/update.py --no-verify`
- If you modify the verifier, also test with `--verify`.

## License

By contributing, you agree that your contributions will be licensed under the
same [MIT License](LICENSE).
