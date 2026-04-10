# Depends - Software Composition Analysis Scanner

## Original Problem Statement
Build a cloud-based software composition analysis scanner called "Depends" based on Trivy open source. Build it so users can add it as a GitHub action, a post-build step that scans repos in GitHub and finds vulnerabilities.

## User Choices
- **Name**: Depends
- **Dashboard Features**: Full dashboard with severity charts, trends, filtering, and project/repo management
- **GitHub Integration**: Both GitHub Action YAML generation + webhook integration for real-time results
- **Scan Types**: Dependencies + Containers + IaC misconfigurations
- **Authentication**: Google OAuth via Emergent Auth
- **Design**: Inspired by Endor Labs (dark green theme, technical control room aesthetic)

## User Personas
1. **Security Engineer**: Needs to monitor vulnerabilities across multiple repositories
2. **DevOps Engineer**: Wants to integrate scanning into CI/CD pipelines via GitHub Actions
3. **Developer**: Needs to understand vulnerability impact and remediation steps

## Core Requirements (Static)
- Trivy-based vulnerability scanning
- GitHub Action generation with webhook callback
- Real-time scan results dashboard
- Severity classification (Critical, High, Medium, Low)
- Multi-scan type support (dependencies, containers, IaC)
- Google OAuth authentication

## Architecture
### Backend (FastAPI)
- MongoDB for data persistence
- Google OAuth via Emergent Auth
- REST API with `/api` prefix

### Frontend (React)
- Shadcn UI components
- Recharts for visualizations
- Tailwind CSS with custom theme

### Collections
- `users` - User accounts (Google OAuth)
- `user_sessions` - Session management
- `projects` - Repository/project configurations
- `scans` - Scan results and history

## What's Been Implemented (April 2026)
### MVP Complete
- [x] Google OAuth authentication
- [x] Dashboard with severity metrics, trend charts, pie charts
- [x] Project CRUD (create, read, update, delete)
- [x] GitHub Action YAML generator
- [x] Webhook endpoint for receiving scan results
- [x] Scan history and detail views
- [x] Vulnerability filtering and search
- [x] Settings page with profile and notifications
- [x] Endor Labs-inspired dark theme

## Prioritized Backlog

### P0 (Critical)
- All MVP features implemented ✓

### P1 (Important)
- [ ] Email notifications for critical vulnerabilities
- [ ] Scheduled scans via GitHub Action cron
- [ ] Team/organization support
- [ ] API rate limiting

### P2 (Nice to Have)
- [ ] Vulnerability remediation suggestions
- [ ] Export reports (PDF, CSV)
- [ ] Slack/Discord notifications
- [ ] SBOM generation
- [ ] Comparison between scans

### P3 (Future)
- [ ] AI-powered vulnerability prioritization
- [ ] Custom scanning rules
- [ ] Self-hosted runner support
- [ ] Enterprise SSO (SAML/OIDC)

## Next Action Items
1. Test real GitHub Action workflow with a sample repository
2. Add email notification system for critical findings
3. Implement organization/team features
4. Add API documentation (OpenAPI/Swagger)
