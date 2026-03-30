# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Summon, please report it responsibly.

**Do NOT open a public issue.** Instead, use [GitHub's private vulnerability reporting](https://github.com/summon-dev/summon/security/advisories/new).

You should receive a response within 48 hours. We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Scope

Summon is a template framework composed of markdown files and a thin CLI scaffolder. The primary security concerns are:

- **Supply chain**: The `summon-team` npm package and its dependencies
- **Template injection**: User input rendered into generated project files
- **Prompt injection**: Malicious content in agent definitions or CLAUDE.md that could alter AI behavior

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
