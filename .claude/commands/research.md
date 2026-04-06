---
name: research
description: "Deep web research with adaptive planning, multi-hop search, evidence synthesis, and structured reports"
category: command
complexity: advanced
mcp-servers: [tavily, sequential, serena]
personas: [deep-research-agent]
---

# /sc:research - Deep Research Command

> Performs **web research with adaptive depth**, multi-hop reasoning, and evidence-based synthesis. Produces structured reports with citations and confidence levels. For codebase analysis, use `/sc:analyze`. For framework documentation, use Context7 directly.

## When to Use

**Use this command when you need to:**
- Answer questions beyond the model's knowledge cutoff
- Research current events, recent releases, or up-to-date best practices
- Perform competitive analysis or technology comparisons
- Investigate security vulnerabilities (CVEs, advisories)
- Find implementation patterns for unfamiliar libraries or frameworks
- Validate architectural decisions with industry evidence

**Do NOT use this command for:**
- Looking up specific library API docs → use Context7 MCP directly
- Analyzing existing codebase → use `/sc:analyze`
- Designing architecture → use `/sc:design`
- General knowledge questions within the model's training data → just ask directly

## Usage
```
/sc:research "[query]" [--depth quick|standard|deep|exhaustive] [--output report|summary|bullets]
```

## Behavioral Flow

### 1. Understand Query (5-10% effort)
**What it assesses:**
- Query complexity: single-fact vs. multi-faceted vs. comparative
- Temporal requirements: historical, current, or evolving topic
- Required evidence level: casual reference vs. validated facts
- Output format expectations

**Decision matrix:**
| Query Type | Depth | Hops | Example |
|-----------|-------|------|---------|
| Simple fact | quick | 1 | "What's the latest Node.js LTS version?" |
| How-to | standard | 2-3 | "How to implement rate limiting in Express?" |
| Comparison | deep | 3-4 | "Redis vs Memcached for session storage in 2025" |
| Investigation | exhaustive | 4-5+ | "Complete analysis of WebSocket scaling strategies" |

### 2. Plan Search Strategy (10-15% effort)
**Uses Sequential Thinking MCP for complex queries:**
- Decompose query into sub-questions
- Identify search terms and variations
- Plan parallel vs. sequential search order
- Define what "sufficient evidence" looks like

**Search decomposition example:**
```
Query: "Best practices for migrating from REST to GraphQL in 2025"
Sub-questions:
  1. Current GraphQL adoption trends and tooling (parallel)
  2. Common migration strategies and patterns (parallel)
  3. Performance implications and trade-offs (parallel)
  4. Case studies from production migrations (depends on 1-3 for focused terms)
```

### 3. Execute Searches (50-60% effort)

**Search tools and when to use them:**

| Tool | Best For | Example |
|------|----------|---------|
| **Tavily Search** | General web search, current info, broad topics | Technology comparisons, recent releases |
| **Tavily Extract** | Deep content from specific URLs | Blog posts, documentation pages, research papers |
| **Context7** | Library/framework documentation | API references, migration guides |

**Execution rules:**
- **Parallel-first**: Batch all independent searches in a single tool call
- **Multi-hop**: Use results from initial searches to refine follow-up queries
- **Source diversity**: Don't rely on a single source — cross-reference
- **Recency bias**: Prefer recent sources; flag outdated information explicitly

**Evidence tracking per source:**
- URL and access date
- Key claims extracted
- Confidence: High (official docs, peer-reviewed) / Medium (reputable blog, Stack Overflow with consensus) / Low (single opinion, old post)

### 4. Synthesize (15-20% effort)
- Merge findings from multiple sources
- Resolve contradictions (note disagreements explicitly)
- Identify gaps: what couldn't be found or confirmed
- Apply Sequential Thinking for complex reasoning chains

### 5. Validate (5-10% effort)
- Cross-check key claims across multiple sources
- Flag any claim supported by only one source
- Note recency: "as of [date]" for time-sensitive information
- Distinguish between facts, consensus opinions, and minority views

## Output Structure

### Report Format (default for standard/deep/exhaustive)
```markdown
# Research: [Topic]
Date: [timestamp]
Depth: [quick|standard|deep|exhaustive]
Sources consulted: [count]

## Executive Summary
[2-3 sentences with the key findings]

## Findings

### [Sub-topic 1]
[Evidence-based analysis with inline citations]
- **Key finding**: [statement] [Source: URL]
- **Confidence**: High/Medium/Low

### [Sub-topic 2]
...

## Contradictions & Nuances
[Where sources disagree or the answer is "it depends"]

## Gaps
[What couldn't be determined from available sources]

## Sources
1. [Title] - [URL] - [Confidence level] - [Access date]
2. ...

## Recommendations
[Actionable next steps based on findings]
- For implementation → `/sc:design` or `/sc:implement`
- For deeper analysis → specific follow-up queries
```

### Summary Format (--output summary)
```markdown
## [Topic] - Research Summary
[3-5 key findings with citations]
**Confidence**: [overall level]
**Sources**: [count] ([list URLs])
```

### Bullets Format (--output bullets)
```
- Finding 1 [Source]
- Finding 2 [Source]
- Finding 3 [Source]
```

## Depth Levels Detail

| Level | Searches | Hops | Time Budget | Output |
|-------|----------|------|-------------|--------|
| `quick` | 2-3 | 1 | Minimal | Bullets or summary |
| `standard` | 5-8 | 2-3 | Moderate | Structured report |
| `deep` | 10-15 | 3-4 | Substantial | Comprehensive report with analysis |
| `exhaustive` | 15-25 | 4-5+ | Maximum | Complete investigation with all sources |

## Tool Coordination

| Tool | Purpose |
|------|---------|
| **Tavily Search** | Primary web search engine — current information, broad queries |
| **Tavily Extract** | Deep content extraction from specific URLs found via search |
| **Context7** | Framework/library documentation — authoritative API references |
| **Sequential Thinking** | Query decomposition, multi-hop reasoning, synthesis |
| **Serena** | Persist research findings across sessions |
| **Write** | Save reports to `claudedocs/research_[topic]_[timestamp].md` |

## Integration with Other SC Commands

| After Research... | Use | For |
|-------------------|-----|-----|
| Found best practices | `/sc:design` | Design architecture following researched patterns |
| Compared technologies | `/sc:workflow` | Plan migration to chosen technology |
| Found vulnerability | `/sc:analyze` | Check if codebase is affected |
| Found implementation patterns | `/sc:implement` | Apply the researched approach |

## Examples

### Quick Fact Check
```
/sc:research "current Firebase Cloud Messaging quotas and limits 2025" --depth quick
# 2-3 searches → bullet list with official source links
# Output: quota numbers with link to Firebase docs
```

### Technology Comparison
```
/sc:research "Bun vs Node.js for production APIs in 2025" --depth deep
# Decomposes into: performance benchmarks, ecosystem maturity, production case studies
# Parallel searches for each dimension
# Output: structured comparison table + recommendation with evidence
```

### Security Investigation
```
/sc:research "CVE-2025-XXXXX impact and mitigation" --depth standard
# Searches: NVD, vendor advisories, security blogs
# Output: severity, affected versions, mitigation steps, patch links
```

### Best Practices Research
```
/sc:research "WebSocket scaling strategies for 100k+ concurrent connections" --depth exhaustive
# Multi-hop: architecture patterns → specific tools → production case studies → benchmarks
# Output: comprehensive report with architecture diagrams and tooling recommendations
```

## Boundaries

**Will:**
- Search the web for current, evidence-based information
- Synthesize findings from multiple sources with confidence ratings
- Provide citations for all claims
- Flag contradictions, gaps, and low-confidence findings
- Save reports for future reference

**Will Not:**
- Present speculation as fact — uncertain findings are explicitly marked
- Skip source validation — single-source claims are flagged
- Access paywalled or restricted content
- Replace domain expertise — research informs decisions, doesn't make them
- Perform codebase analysis (use `/sc:analyze` for that)
