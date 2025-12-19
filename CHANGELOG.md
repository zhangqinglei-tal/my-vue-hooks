# Changelog

## [1.0.4] - 2025-12-19

### Changed

- **Breaking Change**: Reordered generic parameters from `<TRequest, TResponse>` to `<TResponse, TRequest>` for better DX
- Allow `TRequest` type to be optional in most cases, with automatic inference
- Updated API documentation and usage examples to reflect new generic order
- Added Cursor development rules file (`.cursor/rules/to-await-fetch.mdc`) with comprehensive guidelines
- Improved error handling patterns in documentation and examples



All notable changes to this project will be documented in this file.

