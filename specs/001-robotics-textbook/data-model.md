# Data Model: Physical AI & Humanoid Robotics Textbook

**Date**: 2026-01-15
**Phase**: 1 (Design & Contracts)
**Purpose**: Define content entities, relationships, and validation rules for the robotics textbook

---

## Entity Definitions

### 1. Module

A thematic grouping of weeks representing a major topic area in the robotics curriculum.

**Fields**:
- `id` (string, required): Unique identifier (e.g., "module-1-ros2")
- `title` (string, required): Display title (e.g., "Module 1: The Robotic Nervous System (ROS 2)")
- `description` (string, required): Brief overview of module content (1-2 sentences)
- `weeks` (array of Week IDs, required): Ordered list of weeks in this module

**Example**:
```json
{
  "id": "module-1-ros2",
  "title": "Module 1: The Robotic Nervous System (ROS 2)",
  "description": "Learn the fundamentals of ROS 2 architecture, publisher-subscriber patterns, and service-action communication for building modular robot software.",
  "weeks": ["week-3-ros2-architecture", "week-4-pub-sub", "week-5-services-actions"]
}
```

**Relationships**:
- **Has Many**: Week entities (1 Module → N Weeks)
- **Stored As**: Docusaurus category in `sidebars.ts`

**Validation Rules**:
- `id` must be unique across all modules
- `title` must start with "Module {N}:"
- `weeks` array must contain at least 1 week

---

### 2. Week

A single chapter of content corresponding to one week of the course.

**Fields**:
- `id` (string, required): Unique identifier (e.g., "week-3-ros2-architecture")
- `title` (string, required): Display title (e.g., "Week 3: ROS 2 Architecture")
- `sidebar_position` (number, required): Order in sidebar (1-indexed, sequential)
- `keywords` (array of strings, required): RAG indexing keywords (minimum 3, maximum 10)
- `dependencies` (array of Week IDs, required): Prerequisite weeks (empty array if none)
- `module` (Module ID, implied): Parent module (derived from directory structure, not in front matter)

**Content Sections** (not in front matter, part of MD body):
- `learning_objectives` (array of strings): 3-5 action-based objectives
- `prerequisites` (markdown section): Links to dependency weeks + hardware/software requirements
- `conceptual_explanation` (markdown sections): Theory, architecture, workflow
- `hands_on_lab` (markdown section): Code examples with expected outputs
- `code_snippets` (array of CodeSnippet): Embedded in hands-on lab section
- `diagrams` (array of Diagram): Embedded in conceptual explanation or lab sections
- `common_errors` (markdown section): Troubleshooting guide
- `external_resources` (markdown list): Official docs, tutorials, forums
- `assessment_questions` (markdown list): 5-10 multiple choice or short answer
- `further_reading` (markdown list): Research papers, advanced topics

**Example Front Matter**:
```yaml
---
id: week-3-ros2-architecture
title: "Week 3: ROS 2 Architecture"
sidebar_position: 1
keywords: [ROS 2, architecture, nodes, topics, services, actions, DDS, middleware]
dependencies: []
---
```

**Relationships**:
- **Belongs To**: Module entity (N Weeks → 1 Module)
- **Has Many**: CodeSnippet, Diagram, ExternalResource, AssessmentQuestion (embedded in MD body)
- **References**: Other Week entities via `dependencies` field
- **Stored As**: MD file in `/docs/module-{N}-{name}/week-{N}-{topic}.md`

**Validation Rules**:
- `id` must match filename (e.g., `week-3-ros2-architecture.md`)
- `title` must start with "Week {N}:"
- `sidebar_position` must be sequential within module (no gaps, no duplicates)
- `keywords` array must have 3-10 items
- `dependencies` must reference valid Week IDs
- Content must include:
  - At least 3 learning objectives
  - At least 2 code snippets (CodeSnippet entities)
  - At least 1 diagram with alt text (Diagram entity)
  - 5-10 assessment questions (AssessmentQuestion entities)

---

### 3. CodeSnippet

Runnable example code embedded in a Week's hands-on lab section.

**Fields**:
- `language` (string, required): Programming language (e.g., "python", "bash", "yaml", "xml")
- `code` (string, required): Full source code (includes imports, self-contained)
- `filename` (string, optional): Title attribute for code block (e.g., "publisher.py")
- `description` (string, required): Docstring or comment explaining purpose (what it demonstrates)

**Example**:
```json
{
  "language": "python",
  "filename": "publisher.py",
  "code": "#!/usr/bin/env python3\n\"\"\"ROS 2 publisher node that publishes string messages to the 'chatter' topic.\n\nThis example demonstrates:\n- Minimal ROS 2 publisher setup\n- Timer-based message publishing\n- Node lifecycle management\n\"\"\"\n\nimport rclpy\nfrom rclpy.node import Node\nfrom std_msgs.msg import String\n\nclass MinimalPublisher(Node):\n    def __init__(self):\n        super().__init__('minimal_publisher')\n        self.publisher_ = self.create_publisher(String, 'chatter', 10)\n        self.timer = self.create_timer(0.5, self.timer_callback)\n        self.i = 0\n\n    def timer_callback(self):\n        msg = String()\n        msg.data = f'Hello World: {self.i}'\n        self.publisher_.publish(msg)\n        self.get_logger().info(f'Publishing: \"{msg.data}\"')\n        self.i += 1\n\ndef main(args=None):\n    rclpy.init(args=args)\n    minimal_publisher = MinimalPublisher()\n    rclpy.spin(minimal_publisher)\n    minimal_publisher.destroy_node()\n    rclpy.shutdown()\n\nif __name__ == '__main__':\n    main()",
  "description": "ROS 2 publisher node that publishes string messages to the 'chatter' topic"
}
```

**Markdown Representation**:
````markdown
```python title="publisher.py"
#!/usr/bin/env python3
"""
ROS 2 publisher node that publishes string messages to the 'chatter' topic.

This example demonstrates:
- Minimal ROS 2 publisher setup
- Timer-based message publishing
- Node lifecycle management
"""

import rclpy
from rclpy.node import Node
from std_msgs.msg import String

# ... rest of code
```
````

**Relationships**:
- **Embedded In**: Week entity (N CodeSnippets → 1 Week)
- **Stored As**: Markdown code block within Week MD file

**Validation Rules**:
- `language` must be one of: "python", "bash", "yaml", "xml", "cpp", "javascript"
- `code` must be non-empty and syntactically valid (linted during build)
- `description` must explain *why* code exists, not just *what* it does
- Code must include all necessary imports (self-contained per Principle II)

---

### 4. Diagram

Visual representation of concepts (architecture diagrams, workflow charts).

**Fields**:
- `src` (string, required): Image file path relative to `/static` (e.g., "/img/ros2-architecture.png")
- `alt` (string, required): Descriptive alt text (2-3 sentences) explaining diagram content
- `caption` (string, optional): Figure caption (e.g., "Figure 1: ROS 2 Communication Architecture")

**Example**:
```json
{
  "src": "/img/ros2-architecture.png",
  "alt": "ROS 2 architecture diagram showing multiple nodes communicating via topics and services. The DDS middleware layer sits between nodes and handles message transport. Services use request-reply pattern while topics use publish-subscribe.",
  "caption": "Figure 1: ROS 2 Communication Architecture"
}
```

**Markdown Representation**:
```markdown
<img src="/img/ros2-architecture.png" alt="ROS 2 architecture diagram showing multiple nodes communicating via topics and services. The DDS middleware layer sits between nodes and handles message transport. Services use request-reply pattern while topics use publish-subscribe." />

*Figure 1: ROS 2 Communication Architecture*
```

**Relationships**:
- **Embedded In**: Week entity (N Diagrams → 1 Week)
- **Stored As**: HTML `<img>` tag within Week MD file + image file in `/static/img/`

**Validation Rules**:
- `src` must point to existing file in `/static/img/` directory
- `alt` text must be 2-3 sentences (minimum 20 words, maximum 100 words)
- `alt` text must describe what diagram shows (architecture flow, components, relationships)
- Image file should be PNG or SVG (web-optimized, < 500KB recommended)

---

### 5. ExternalResource

Link to official documentation, research paper, or tutorial.

**Fields**:
- `url` (string, required): Full URL (https://)
- `title` (string, required): Link text (descriptive, not "click here")
- `description` (string, required): What this resource provides (1 sentence)

**Example**:
```json
{
  "url": "https://docs.ros.org/en/humble/",
  "title": "ROS 2 Humble Documentation",
  "description": "Official ROS 2 documentation covering all packages, tutorials, and concepts"
}
```

**Markdown Representation**:
```markdown
- [ROS 2 Humble Documentation](https://docs.ros.org/en/humble/) - Official ROS 2 documentation covering all packages, tutorials, and concepts
```

**Relationships**:
- **Embedded In**: Week entity (N ExternalResources → 1 Week)
- **Stored As**: Markdown list item within "External Resources" or "Further Reading" sections

**Validation Rules**:
- `url` must be valid HTTPS URL
- `url` must be accessible (no 404s, checked during build if possible)
- `title` must be descriptive (not generic like "Documentation" or "Tutorial")
- `description` must add context beyond title

---

### 6. AssessmentQuestion

Question to test student understanding at the end of each week.

**Fields**:
- `question` (string, required): Question text
- `type` (enum, required): "multiple-choice" | "short-answer"
- `options` (array of strings, required if multiple-choice): Answer choices (A, B, C, D)
- `correct_answer` (string, optional): Correct answer (for future auto-grading, not displayed in MVP)

**Example (Multiple Choice)**:
```json
{
  "question": "What is the default middleware in ROS 2?",
  "type": "multiple-choice",
  "options": ["DDS", "TCP", "UDP", "MQTT"],
  "correct_answer": "DDS"
}
```

**Example (Short Answer)**:
```json
{
  "question": "Explain the difference between a ROS 2 topic and a service.",
  "type": "short-answer",
  "correct_answer": null
}
```

**Markdown Representation**:
```markdown
## Assessment Questions

1. **What is the default middleware in ROS 2?**
   - A) DDS
   - B) TCP
   - C) UDP
   - D) MQTT

   *Answer: A (DDS)* <!-- Hidden in MVP, shown in future enhancement -->

2. **Explain the difference between a ROS 2 topic and a service.** (Short answer)
```

**Relationships**:
- **Embedded In**: Week entity (5-10 AssessmentQuestions → 1 Week)
- **Stored As**: Markdown list within "Assessment Questions" section

**Validation Rules**:
- Each Week must have 5-10 assessment questions (per FR-006)
- Multiple choice questions must have exactly 4 options
- Short answer questions have no `options` or `correct_answer` fields (not auto-gradable)
- Questions must test conceptual understanding, not memorization

---

## Entity Relationships Diagram

```text
Module (1) ──Has Many──→ Week (N)

Week (1) ──Embeds Many──→ CodeSnippet (N)
Week (1) ──Embeds Many──→ Diagram (N)
Week (1) ──Embeds Many──→ ExternalResource (N)
Week (1) ──Embeds Many──→ AssessmentQuestion (5-10)

Week (1) ──References──→ Week (N) [dependencies field]
```

**Storage Strategy**:
- **Modules**: Defined in `sidebars.ts` as Docusaurus categories
- **Weeks**: MD files in `/docs/module-{N}-{name}/` directories
- **CodeSnippets**: Markdown code blocks within Week MD files
- **Diagrams**: HTML `<img>` tags + image files in `/static/img/`
- **ExternalResources**: Markdown links within Week MD files
- **AssessmentQuestions**: Markdown lists within Week MD files

**No Database Required**: All entities stored as static MD files and configuration (Docusaurus philosophy: filesystem as database)

---

## Validation Rules Summary

| Entity                | Rule                                                   |
|-----------------------|--------------------------------------------------------|
| **Module**            | Unique `id`, at least 1 week                           |
| **Week**              | 3+ objectives, 2+ code snippets, 1+ diagrams, 5-10 questions |
| **CodeSnippet**       | Self-contained (includes imports), has docstring       |
| **Diagram**           | Alt text 2-3 sentences (20-100 words)                  |
| **ExternalResource**  | Valid HTTPS URL, descriptive title                     |
| **AssessmentQuestion**| 5-10 per week, multiple-choice has 4 options           |

**Validation Enforcement**:
- Manual review during content creation (checklist in `quickstart.md`)
- Docusaurus build warnings for broken links (automatic)
- Future: Automated linting script to check front matter completeness

---

## State Transitions

Not applicable - this is static content with no state changes. All entities are read-only once deployed (content updates require redeployment).

Future enhancements (out of scope for MVP):
- User progress tracking (which weeks completed)
- Assessment answer submission and grading
- Personalized content versions (requires backend)

---

## Data Model Completion

All entities defined with fields, relationships, validation rules, and storage strategy. Ready for contract generation (content template, sidebar config, Docusaurus config).
