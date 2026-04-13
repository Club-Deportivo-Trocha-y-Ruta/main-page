---
name: brainstorm
description: "Interactive requirements discovery through Socratic dialogue, multi-persona analysis, and systematic exploration"
category: orchestration
complexity: advanced
mcp-servers: [sequential, context7, serena]
personas: [architect, analyzer, frontend, backend, security, devops, project-manager]
---

# /brainstorm - Interactive Requirements Discovery

## When to Use

**Use this command when you need to:**
- Explore a vague idea and turn it into concrete requirements
- Evaluate feasibility of a feature from multiple angles (frontend, backend, security, etc.)
- Discover requirements you haven't thought of through guided questioning
- Compare implementation approaches with trade-off analysis
- Plan a new feature/module before writing code

**Do NOT use this command for:**
- Business strategy analysis (use `/sc:business-panel`)
- Analyzing existing code quality (use `/sc:analyze`)
- Understanding existing code (use `/sc:explain`)
- Documenting already-decided features (use `/sc:document`)
- Implementation (brainstorm outputs a plan, not code)

## Usage
```
/sc:brainstorm [topic/idea] [--strategy systematic|agile|quick] [--depth shallow|normal|deep] [--focus area]
```

### Parameters
| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `topic/idea` | text description | required | What to explore |
| `--strategy` | `systematic`, `agile`, `quick` | `systematic` | Exploration approach |
| `--depth` | `shallow`, `normal`, `deep` | `normal` | How thorough |
| `--focus` | `frontend`, `backend`, `security`, `data`, `ux`, `infra` | all | Specific angle |

### Strategy Differences
| Strategy | Duration | Output | Best For |
|----------|----------|--------|----------|
| `quick` | Brief | Key decisions + risks | Small features, time-constrained |
| `agile` | Moderate | User stories + acceptance criteria | Feature development, sprint planning |
| `systematic` | Thorough | Full spec + architecture | New modules, complex features |

## Behavioral Flow

### Phase 1: EXPLORE (Socratic Dialogue)
Ask targeted questions to uncover requirements. Do NOT assume - ASK.

**Question Categories:**
| Category | Example Questions |
|----------|-------------------|
| **Users** | Who uses this? What's their context? What problem does this solve for them? |
| **Scope** | What's in scope? What's explicitly out? What's the MVP? |
| **Data** | What data is needed? Where does it come from? What's the schema? |
| **Integration** | What systems does this touch? What APIs exist? What's the contract? |
| **Constraints** | Timeline? Budget? Tech stack limitations? Compliance requirements? |
| **Edge Cases** | What happens when X fails? What about concurrent users? Offline mode? |

**Rules for questioning:**
- Ask 3-5 questions at a time, not 20
- Wait for answers before asking more
- Build on answers - don't repeat themes already covered
- Flag assumptions explicitly: "I'm assuming X - correct?"

### Phase 2: ANALYZE (Multi-Persona Assessment)
Activate relevant personas based on the topic:

| Persona | Evaluates | Typical Output |
|---------|-----------|----------------|
| **Architect** | System design, data flow, integration points | Component diagram, sequence flow |
| **Frontend** | UI/UX complexity, state management, accessibility | Screen flow, component breakdown |
| **Backend** | API design, database schema, business logic | Endpoint spec, data model |
| **Security** | Auth/authz, data protection, attack surface | Threat model, security requirements |
| **DevOps** | Deployment, monitoring, scaling | Infrastructure needs, observability |
| **Project Manager** | Scope, timeline, dependencies, risks | Task breakdown, risk register |

Not all personas are needed every time. Select 2-4 based on the topic.

### Phase 3: VALIDATE (Feasibility Check)
- Check technical feasibility against the existing codebase (use Serena to inspect)
- Identify dependencies on other teams/services
- Estimate complexity: simple / moderate / complex / needs-spike
- Flag risks with mitigation strategies

### Phase 4: SPECIFY (Concrete Output)
Generate actionable specification based on strategy:

**For `--strategy quick`:**
```markdown
## Feature: [Name]
### Decision Summary
- [Key decisions made]
### Risks
- [Top risks with mitigation]
### Next Steps
- [Immediate action items]
```

**For `--strategy agile`:**
```markdown
## Feature: [Name]
### User Stories
- As a [user], I want [action] so that [benefit]
### Acceptance Criteria
- Given [context], when [action], then [result]
### Technical Notes
- [Implementation considerations]
### Estimated Complexity
- [Simple/Moderate/Complex]
```

**For `--strategy systematic`:**
```markdown
## Feature Specification: [Name]
### Problem Statement
### Requirements (Functional)
### Requirements (Non-Functional)
### Architecture
- [Component diagram or data flow]
### API Contract
- [Endpoints, request/response]
### Data Model
- [Schema changes needed]
### Security Considerations
### Testing Strategy
### Implementation Plan
- [Phased approach with milestones]
### Risks & Mitigations
### Open Questions
```

## MCP Integration

- **Sequential MCP**: Structures multi-phase reasoning. Auto-activated for `--strategy systematic` or `--depth deep` to ensure thorough, non-skipping exploration.
- **Context7**: Validates framework patterns and feasibility. Used when the brainstorm involves specific frameworks (e.g., "can Angular do X?", "is this possible with Capacitor?").
- **Serena**: Inspects existing codebase to ground the brainstorm in reality. Used to check: "does this module exist?", "what's the current API?", "how is this done elsewhere in the project?".

## Tool Coordination
| Tool | Purpose |
|------|---------|
| **Sequential Thinking** | Structure complex multi-phase exploration |
| **Serena find_symbol** | Check existing implementations for reference |
| **Serena get_symbols_overview** | Understand current architecture |
| **Context7 query-docs** | Verify framework capabilities |
| **Read/Write** | Read existing specs, write new spec output |
| **WebSearch** | Research external services or market patterns |

## Integration with Other SC Commands

| SC Command | Relationship |
|------------|-------------|
| `/sc:analyze` | Analyze existing code before brainstorming improvements |
| `/sc:explain` | Explain current behavior before brainstorming changes |
| `/sc:business-panel` | Business-panel evaluates strategy; brainstorm plans implementation |
| `/sc:document` | After brainstorming, document the decided spec |
| `/sc:save` | Save brainstorm results and decisions to Serena memory |

## Examples

### Quick feature exploration
```
/brainstorm "add push notification preferences to user profile" --strategy quick
# 3-5 targeted questions about scope and constraints
# Quick feasibility check against existing push module
# Output: decision summary + risks + next steps
```

### Agile sprint planning
```
/sc:brainstorm "implement order tracking real-time updates" --strategy agile --focus backend
# Explore: what triggers updates, what data, what channels
# Analyze: backend persona evaluates WebSocket vs polling vs SSE
# Output: user stories + acceptance criteria + tech notes
```

### Systematic new module design
```
/sc:brainstorm "loyalty program gamification system" --strategy systematic --depth deep
# Full Socratic exploration: users, scope, data, integration
# Multi-persona analysis: architect + backend + frontend + security
# Codebase inspection via Serena for integration points
# Output: complete feature specification with architecture
```

### Focused security brainstorm
```
/sc:brainstorm "external API for third-party integrations" --focus security --depth deep
# Security persona leads: auth, rate limiting, data exposure
# Architect supports: API design, versioning, contracts
# Context7 validates OAuth/JWT patterns
# Output: spec with security requirements emphasized
```

## Boundaries

**Will:**
- Transform vague ideas into concrete, actionable specifications
- Coordinate multiple personas for comprehensive analysis
- Ground brainstorms in codebase reality via Serena
- Generate output calibrated to the chosen strategy level
- Ask questions and wait for answers (interactive, not prescriptive)

**Will Not:**
- Make implementation decisions without user input during exploration
- Override user vision with prescriptive solutions
- Write actual code (brainstorm outputs specs, not implementations)
- Skip the questioning phase for complex topics
- Provide timeline estimates (focus on complexity, not duration)
