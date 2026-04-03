---
title: Meet the Team
description: 16 specialized agents, each with a clear role and boundaries.
---

Every agent knows its job, its boundaries, and when to call on the others.

## Core Team

### Cam — Human Interface
The first agent you'll talk to. Cam probes your vague idea with structured questions until the vision is concrete. She creates sacrificial concepts to validate direction and translates between you and the technical team.

**Trigger:** New feature request, vague requirement, or review session.

### Archie — Lead Architect
Designs system architecture, writes ADRs, and defines API contracts. Has authority over architectural decisions and can block implementation that doesn't have an approved design.

**Trigger:** Architectural decision, schema change, or work that crosses service boundaries.

### Sato — Principal Engineer
The builder. Writes production code that makes Tara's tests pass. Handles implementation, refactoring, and dependency updates. The most frequently invoked agent on the team.

**Trigger:** Implementation work after tests exist.

### Tara — Test Lead
Writes failing tests before implementation (TDD red phase). Reviews test coverage and maintains test quality. Has veto power on test coverage — if Tara says the tests aren't good enough, the work doesn't ship.

**Trigger:** New feature (writes tests first), code review (checks coverage).

### Vik — Code Reviewer
Veteran reviewer focused on simplicity and maintainability. Vik reads code and identifies problems — does not fix them. Enforces patterns and keeps the codebase clean.

**Trigger:** Code review, changes to core data models or critical paths.

### Grace — Sprint Manager
Tracks velocity, manages the project board, runs ceremonies, and coordinates handoffs. Grace keeps the team moving and knows what's in progress, what's blocked, and what's next.

**Trigger:** Sprint boundary, work distribution, board operations.

### Pat — Product Manager
Owns the backlog, writes acceptance criteria, and prioritizes ruthlessly. When you're unavailable, Pat answers product questions using documented context (proxy mode).

**Trigger:** Requirements definition, prioritization, stakeholder questions.

### Wei — Devil's Advocate
Deliberately challenges assumptions and comfortable consensus. Wei is invoked when the team converges too quickly or during architecture debates where groupthink might be setting in.

**Trigger:** Architecture debates, quick convergence, major decisions.

## Specialists

### Pierrot — Security & Compliance
Penetration testing, vulnerability scanning, license auditing, and regulatory compliance. Has veto power on security grounds — if Pierrot finds a critical issue, it blocks the merge.

### Ines — DevOps & SRE
Infrastructure, CI/CD, SLO design, alerting, and chaos engineering. Owns everything between `git push` and production traffic.

### Diego — Technical Writer
Documentation, API docs, changelogs, migration guides, and onboarding flows. If it's not documented, it doesn't exist.

### Dani — Design & UX
Design exploration, user flows, accessibility review, and frontend specialist review. Any frontend file change triggers Dani review.

### Debra — Data Scientist
Telemetry design, experimentation, model training, data analysis, and visualization. The only agent with Jupyter notebook access.

### Cloud — Cloud Specialist
Architecture, cost optimization, and network diagnostics for AWS, Azure, and GCP.

### Prof — Pedagogy
Explains architectural and implementation choices. Assumes developer competence. Offers Socratic follow-up questions and routes deeper topics to `/whatsit`.

### Code Reviewer (composite)
Not a single agent — an invocation pattern that runs Vik, Tara, Pierrot, and Archie in parallel for comprehensive code review.
