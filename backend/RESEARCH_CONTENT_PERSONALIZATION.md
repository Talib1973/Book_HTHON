# Content Personalization Patterns for Documentation Sites

## Research Summary: Client-Side Approaches for Docusaurus

This document synthesizes research on lightweight, non-SSR personalization strategies for static documentation sites, with focus on Docusaurus architecture.

---

## 1. Client-Side Content Manipulation Strategies

### 1.1 Show/Hide Section Patterns

**Vanilla JavaScript Approach:**
```javascript
// Basic visibility toggle using DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('[data-personalization-level]');
  sections.forEach(section => {
    const level = section.dataset.personalizationLevel;
    if (shouldShowSection(level)) {
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });
});

// Class-based toggle (preferred over inline styles)
function toggleSection(elementId, show) {
  const element = document.getElementById(elementId);
  if (show) {
    element.classList.add('visible');
    element.classList.remove('hidden');
  } else {
    element.classList.remove('visible');
    element.classList.add('hidden');
  }
}
```

**React Component Patterns (Docusaurus Native):**
```javascript
// MDX wrapper component for conditional rendering
export default function PersonalizedWrapper({ children, level = 'beginner' }) {
  const [userLevel, setUserLevel] = React.useState(() => {
    return localStorage.getItem('learningLevel') || 'beginner';
  });

  const shouldRender = (sectionLevel) => {
    const levels = ['beginner', 'intermediate', 'advanced'];
    return levels.indexOf(userLevel) >= levels.indexOf(sectionLevel);
  };

  return (
    <div className="personalized-content">
      {React.Children.map(children, (child) => {
        if (child.props['data-level'] && !shouldRender(child.props['data-level'])) {
          return null;
        }
        return child;
      })}
    </div>
  );
}
```

**Key Implementation Points:**
- Use `DOMContentLoaded` or React lifecycle to wait for DOM initialization
- Prefer CSS class toggling (`classList.add/remove`) over inline `style.display` modifications
- Target semantic `data-*` attributes for maintainability
- Consider fade-in animations for better UX:
  ```css
  .content-section {
    opacity: 0;
    max-height: 0;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  .content-section.visible {
    opacity: 1;
    max-height: 1000px;
  }
  ```

### 1.2 Content Injection Patterns

**Tip Injection Strategy:**
```javascript
function injectContextualTips() {
  const sections = document.querySelectorAll('[data-concept]');

  sections.forEach(section => {
    const concept = section.dataset.concept;
    const tip = getTipForConcept(concept);

    if (tip) {
      const tipElement = document.createElement('div');
      tipElement.className = 'contextual-tip';
      tipElement.setAttribute('data-tip-concept', concept);
      tipElement.innerHTML = `
        <div class="tip-header">💡 Tip</div>
        <p>${tip}</p>
      `;

      section.insertAdjacentElement('beforeend', tipElement);
    }
  });
}

// Call after DOM is ready and personalization preferences loaded
document.addEventListener('DOMContentLoaded', injectContextualTips);
```

**Content Annotation Patterns:**
```javascript
// Add difficulty badges or prereq warnings
function annotateContent() {
  const articles = document.querySelectorAll('article');

  articles.forEach(article => {
    const difficulty = article.dataset.difficulty;
    const prereqs = (article.dataset.prerequisites || '').split(',');

    // Add difficulty badge
    const badge = document.createElement('span');
    badge.className = `difficulty-badge difficulty-${difficulty}`;
    badge.textContent = difficulty.toUpperCase();
    article.querySelector('h1').insertAdjacentElement('afterend', badge);

    // Show prereq warnings
    if (prereqs.length > 0) {
      const warning = createPrereqWarning(prereqs);
      article.insertAdjacentElement('afterbegin', warning);
    }
  });
}
```

---

## 2. Adding Custom Buttons to Docusaurus Pages

### 2.1 Theme Overrides via Swizzling

Docusaurus provides component swizzling as the primary mechanism for adding custom UI elements.

**Safe Wrapping Approach (Recommended):**
```bash
yarn swizzle @docusaurus/theme-classic [component-name] -- --wrap
```

**Example: Custom DocItem Footer with Personalization Button**

Create: `src/theme/DocItem/Footer/index.js`
```javascript
import React from 'react';
import DocItemFooterOriginal from '@theme-original/DocItem/Footer';
import PersonalizationButton from '@site/src/components/PersonalizationButton';

export default function DocItemFooter(props) {
  return (
    <>
      <PersonalizationButton docId={props.docId} />
      <DocItemFooterOriginal {...props} />
    </>
  );
}
```

**Example: Custom Layout with Personalization Controls**

Create: `src/theme/DocPage/index.js`
```javascript
import React from 'react';
import DocPageOriginal from '@theme-original/DocPage';
import PersonalizationPanel from '@site/src/components/PersonalizationPanel';

export default function DocPage(props) {
  return (
    <div className="doc-page-with-personalization">
      <PersonalizationPanel />
      <DocPageOriginal {...props} />
    </div>
  );
}
```

### 2.2 MDX Wrapper Components

**Global MDX Wrapper for Content Enhancement:**

Create: `src/theme/MDXComponents/index.js`
```javascript
import MDXComponentsOriginal from '@theme-original/MDXComponents';
import EnhancedWrapper from '@site/src/components/EnhancedWrapper';

const MDXComponents = {
  ...MDXComponentsOriginal,
  wrapper: (props) => (
    <EnhancedWrapper>
      <MDXComponentsOriginal.wrapper {...props} />
    </EnhancedWrapper>
  ),
};

export default MDXComponents;
```

### 2.3 Plugin Approach for Button Integration

**Custom Plugin to Inject Button:**

Create: `plugins/personalization-button-plugin.js`
```javascript
module.exports = function PersonalizationButtonPlugin() {
  return {
    name: 'personalization-button-plugin',
    injectHtmlTags() {
      return {
        postBodyTags: [
          {
            tagName: 'div',
            attributes: {
              id: 'personalization-button-root',
            },
            innerHTML: '',
          },
          {
            tagName: 'script',
            attributes: {
              async: true,
            },
            innerHTML: `
              (function() {
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', initPersonalizationButton);
                } else {
                  initPersonalizationButton();
                }

                function initPersonalizationButton() {
                  const root = document.getElementById('personalization-button-root');
                  // Initialize React component or mount framework
                  if (window.__PersonalizationUI) {
                    window.__PersonalizationUI.mount(root);
                  }
                }
              })();
            `,
          },
        ],
      };
    },
  };
};
```

**Register in docusaurus.config.js:**
```javascript
module.exports = {
  plugins: [
    './plugins/personalization-button-plugin.js',
  ],
};
```

### 2.4 Styling Consistency with Infima

Docusaurus uses Infima CSS framework. Maintain consistency:

```css
/* src/css/personalization.css */

.personalization-button {
  /* Use Infima color system */
  background-color: var(--ifm-color-primary);
  color: var(--ifm-color-white);
  padding: var(--ifm-spacing-horizontal);
  border-radius: var(--ifm-global-radius);
  font-size: var(--ifm-font-size-base);
  font-weight: var(--ifm-font-weight-semibold);
  transition: background-color 0.2s ease;
  border: none;
  cursor: pointer;
}

.personalization-button:hover {
  background-color: var(--ifm-color-primary-dark);
}

.personalization-panel {
  background-color: var(--ifm-color-background-secondary);
  border: 1px solid var(--ifm-color-gray-200);
  border-radius: var(--ifm-global-radius);
  padding: var(--ifm-spacing-vertical);
  margin: var(--ifm-spacing-vertical) 0;
}

@media (prefers-color-scheme: dark) {
  .personalization-button {
    background-color: var(--ifm-color-primary);
  }

  .personalization-panel {
    background-color: var(--ifm-color-background-secondary);
    border-color: var(--ifm-color-gray-700);
  }
}
```

---

## 3. DOM Manipulation Patterns for Content Tone/Depth Adjustment

### 3.1 Content Tone Adjustment

**Simplification Pattern (Beginner Mode):**
```javascript
function simplifyContent() {
  const technicalTerms = {
    'asynchronous': 'non-blocking',
    'idempotent': 'safe to repeat',
    'ephemeral': 'temporary',
  };

  document.querySelectorAll('p, li, h1, h2, h3').forEach(elem => {
    let text = elem.textContent;
    Object.entries(technicalTerms).forEach(([term, simple]) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      text = text.replace(regex, (match) => {
        if (shouldSimplify(match)) {
          return `<abbr title="${match}">${simple}</abbr>`;
        }
        return match;
      });
    });
    elem.innerHTML = text;
  });
}

// Or using data attributes to mark complex sections
function adjustDepth(targetLevel) {
  document.querySelectorAll('[data-depth]').forEach(elem => {
    const elementDepth = parseInt(elem.dataset.depth);
    if (elementDepth > targetLevel) {
      elem.classList.add('collapsed');
      elem.setAttribute('aria-expanded', 'false');
    } else {
      elem.classList.remove('collapsed');
      elem.setAttribute('aria-expanded', 'true');
    }
  });
}
```

### 3.2 Progressive Content Disclosure

**Expandable Details Pattern:**
```javascript
function makeContentProgressive() {
  document.querySelectorAll('[data-depth="advanced"]').forEach(elem => {
    if (!elem.querySelector('details')) {
      const details = document.createElement('details');
      details.className = 'advanced-details';
      details.setAttribute('data-personalization-toggle', 'true');

      const summary = document.createElement('summary');
      summary.textContent = 'Advanced details ▸';
      summary.className = 'advanced-summary';

      details.appendChild(summary);
      details.appendChild(elem.cloneNode(true));

      elem.replaceWith(details);
    }
  });
}
```

**CSS for Progressive Disclosure:**
```css
details.advanced-details {
  margin: var(--ifm-spacing-vertical) 0;
  padding: var(--ifm-spacing-horizontal);
  background-color: var(--ifm-color-gray-100);
  border-left: 4px solid var(--ifm-color-info);
  border-radius: var(--ifm-global-radius);
}

details.advanced-details[open] > summary {
  margin-bottom: var(--ifm-spacing-vertical);
}

summary.advanced-summary {
  cursor: pointer;
  color: var(--ifm-color-info);
  font-weight: var(--ifm-font-weight-semibold);
  user-select: none;
}

summary.advanced-summary:hover {
  opacity: 0.8;
}
```

### 3.3 Complexity Indicators

```javascript
function addComplexityIndicators() {
  document.querySelectorAll('p[data-complexity]').forEach(elem => {
    const complexity = elem.dataset.complexity; // 'basic', 'intermediate', 'advanced'
    const complexityMap = {
      'basic': '●',
      'intermediate': '●●',
      'advanced': '●●●',
    };

    const indicator = document.createElement('span');
    indicator.className = `complexity-indicator complexity-${complexity}`;
    indicator.textContent = complexityMap[complexity];
    indicator.title = `Complexity: ${complexity}`;
    indicator.setAttribute('aria-label', `Complexity: ${complexity}`);

    elem.insertBefore(indicator, elem.firstChild);
  });
}
```

---

## 4. Caching Strategies for Personalization Preferences

### 4.1 LocalStorage-Based Preferences

**Robust Preference Management:**
```javascript
class PersonalizationPreferences {
  constructor() {
    this.STORAGE_KEY = 'doc-personalization-prefs';
    this.PREFERENCES_VERSION = 1;
    this.CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
  }

  set(preferences) {
    try {
      const data = {
        version: this.PREFERENCES_VERSION,
        timestamp: Date.now(),
        preferences: {
          learningLevel: preferences.learningLevel || 'beginner',
          showAdvanced: preferences.showAdvanced !== false,
          showTips: preferences.showTips !== false,
          theme: preferences.theme || 'auto',
          fontSize: preferences.fontSize || 'medium',
          contentTone: preferences.contentTone || 'technical',
        },
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded');
        return false;
      }
      throw e;
    }
  }

  get() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return this.getDefaults();

      const data = JSON.parse(stored);

      // Validate version and expiry
      if (data.version !== this.PREFERENCES_VERSION) {
        this.clear();
        return this.getDefaults();
      }

      if (Date.now() - data.timestamp > this.CACHE_TTL) {
        this.clear();
        return this.getDefaults();
      }

      return data.preferences;
    } catch (e) {
      console.error('Error reading preferences:', e);
      return this.getDefaults();
    }
  }

  getDefaults() {
    return {
      learningLevel: 'beginner',
      showAdvanced: true,
      showTips: true,
      theme: 'auto',
      fontSize: 'medium',
      contentTone: 'technical',
    };
  }

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  update(key, value) {
    const current = this.get();
    current[key] = value;
    this.set(current);
  }
}
```

### 4.2 Cache Invalidation Strategy

```javascript
// Detect when preferences should be invalidated
class PreferencesCacheManager {
  constructor() {
    this.prefs = new PersonalizationPreferences();
    this.invalidationTriggers = [
      'doc-version-changed',
      'theme-override-detected',
      'user-settings-reset',
    ];
  }

  initInvalidationListeners() {
    // Listen for cache invalidation messages from server
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_INVALIDATE') {
          this.prefs.clear();
          window.location.reload();
        }
      });
    }

    // Listen for manual reset via button
    document.addEventListener('personalization:reset', () => {
      this.prefs.clear();
      window.__personalizationManager?.reinitialize();
    });

    // Periodic validation (optional)
    setInterval(() => {
      this.validatePreferences();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  validatePreferences() {
    const prefs = this.prefs.get();
    // Validate against current valid values
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(prefs.learningLevel)) {
      prefs.learningLevel = 'beginner';
      this.prefs.set(prefs);
    }
  }
}
```

### 4.3 Memory/Performance Optimization

```javascript
// Debounced preference updates to avoid thrashing
class DebouncedPreferenceUpdater {
  constructor(debounceMs = 500) {
    this.debounceMs = debounceMs;
    this.timerId = null;
    this.pendingUpdates = {};
    this.prefs = new PersonalizationPreferences();
  }

  update(key, value) {
    this.pendingUpdates[key] = value;

    clearTimeout(this.timerId);
    this.timerId = setTimeout(() => {
      this.prefs.set({
        ...this.prefs.get(),
        ...this.pendingUpdates,
      });
      this.pendingUpdates = {};
    }, this.debounceMs);
  }

  flushImmediately() {
    clearTimeout(this.timerId);
    if (Object.keys(this.pendingUpdates).length > 0) {
      this.prefs.set({
        ...this.prefs.get(),
        ...this.pendingUpdates,
      });
      this.pendingUpdates = {};
    }
  }
}

// Ensure preferences are flushed on page unload
window.addEventListener('beforeunload', () => {
  window.__preferenceUpdater?.flushImmediately();
});
```

---

## 5. Best Practices for Consistency with Docusaurus Styling

### 5.1 CSS Variable Usage

**Leverage Infima Design System:**
```css
/* Primary colors */
--ifm-color-primary
--ifm-color-primary-dark
--ifm-color-primary-darker
--ifm-color-primary-light
--ifm-color-primary-lighter

/* Semantic colors */
--ifm-color-success
--ifm-color-warning
--ifm-color-danger
--ifm-color-info

/* Typography */
--ifm-font-size-base
--ifm-font-weight-normal
--ifm-font-weight-semibold
--ifm-font-weight-bold

/* Spacing */
--ifm-spacing-horizontal
--ifm-spacing-vertical

/* Layout */
--ifm-global-radius
--ifm-code-background
--ifm-color-background-secondary
```

### 5.2 Dark Mode Support

**Automatic Dark Mode Detection:**
```javascript
function applyDarkModeStyles() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
});
```

### 5.3 Responsive Component Design

```css
/* Mobile-first approach */
.personalization-panel {
  display: block;
  width: 100%;
  margin-bottom: var(--ifm-spacing-vertical);
}

/* Tablet and up */
@media (min-width: 768px) {
  .personalization-panel {
    width: auto;
    float: right;
    margin-left: var(--ifm-spacing-horizontal);
  }
}

/* Desktop */
@media (min-width: 1440px) {
  .personalization-panel {
    position: sticky;
    top: var(--ifm-spacing-vertical);
  }
}
```

---

## 6. Performance Considerations for Client-Side Adjustments

### 6.1 Minimal Initial Payload

**Lazy-load personalization script:**
```html
<!-- In docusaurus.config.js scripts config -->
scripts: [
  {
    src: '/js/personalization-core.min.js',
    async: true,
    defer: true,
  },
]
```

**Keep core personalization minimal:**
```javascript
// personalization-core.min.js (~2-3KB gzipped)
(function() {
  const prefs = JSON.parse(localStorage.getItem('prefs') || '{}');
  const html = document.documentElement;

  // Apply only critical classes synchronously
  if (!prefs.showAdvanced) html.classList.add('hide-advanced');
  if (prefs.fontSize === 'large') html.classList.add('font-large');
})();
```

### 6.2 Paint Timing Optimization

**Avoid layout shifts:**
```css
/* Reserve space for personalization controls */
.doc-page {
  min-height: 100vh;
}

/* Prevent cumulative layout shift */
.personalization-button {
  width: auto;
  min-width: 100px;
  height: 40px;
}
```

### 6.3 DOM Query Optimization

```javascript
// Bad: Repeated DOM queries in loop
items.forEach(item => {
  const list = document.querySelector('.items'); // Queried each iteration
  list.appendChild(item);
});

// Good: Query once
const list = document.querySelector('.items');
items.forEach(item => {
  list.appendChild(item);
});

// Better: Batch DOM operations
const fragment = document.createDocumentFragment();
items.forEach(item => {
  fragment.appendChild(item);
});
document.querySelector('.items').appendChild(fragment);
```

### 6.4 Event Delegation

```javascript
// Instead of attaching listeners to many elements:
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', handler);
});

// Use delegation:
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('toggle-btn')) {
    handler(e);
  }
});
```

### 6.5 Performance Monitoring

```javascript
class PersonalizationMetrics {
  recordTiming(name, duration) {
    if ('performance' in window) {
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);

      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'personalization_timing', {
          name,
          duration,
        });
      }
    }
  }

  recordError(name, error) {
    if (window.gtag) {
      window.gtag('event', 'personalization_error', {
        name,
        message: error.message,
      });
    }
    console.error(`Personalization error in ${name}:`, error);
  }
}
```

---

## 7. Examples of Adaptive Documentation Platforms

### 7.1 Contextual Learning Implementations

**Whatfix Pattern (Contextual Support):**
- Delivers in-app guidance tied to user's current context
- Shows relevant tips when user interacts with specific features
- Applies to Docusaurus via floating help panels that activate on section scroll

**Khan Academy Pattern (Adaptive Sequencing):**
- Analyzes user responses to adjust content difficulty
- Skips already-mastered concepts
- Requires backend support but can simulate with localStorage persistence

**Duolingo Pattern (Adaptive Difficulty):**
- Tracks error rates on specific topics
- Increases frequency of challenging concepts
- Applicable to documentation with quiz/exercise sections

### 7.2 Lightweight Docusaurus Implementation

```javascript
class AdaptiveDocumentation {
  constructor() {
    this.userModel = this.loadUserModel();
    this.contentIndex = this.buildContentIndex();
  }

  buildContentIndex() {
    const index = {};
    document.querySelectorAll('[data-concept]').forEach(elem => {
      const concept = elem.dataset.concept;
      index[concept] = {
        element: elem,
        difficulty: elem.dataset.difficulty || 'beginner',
        prerequisites: (elem.dataset.prerequisites || '').split(','),
      };
    });
    return index;
  }

  loadUserModel() {
    const stored = localStorage.getItem('user-model');
    return stored ? JSON.parse(stored) : {
      masteredConcepts: [],
      attemptedConcepts: {},
      currentLevel: 'beginner',
    };
  }

  recordInteraction(concept, success) {
    if (!this.userModel.attemptedConcepts[concept]) {
      this.userModel.attemptedConcepts[concept] = { attempts: 0, successes: 0 };
    }

    this.userModel.attemptedConcepts[concept].attempts++;
    if (success) {
      this.userModel.attemptedConcepts[concept].successes++;
    }

    // Mastery threshold: 80% success rate over 5+ attempts
    const stats = this.userModel.attemptedConcepts[concept];
    if (stats.attempts >= 5 && stats.successes / stats.attempts >= 0.8) {
      if (!this.userModel.masteredConcepts.includes(concept)) {
        this.userModel.masteredConcepts.push(concept);
        this.updateContentVisibility();
      }
    }

    this.saveUserModel();
  }

  updateContentVisibility() {
    Object.entries(this.contentIndex).forEach(([concept, info]) => {
      // Skip if already mastered
      if (this.userModel.masteredConcepts.includes(concept)) {
        info.element.classList.add('mastered');
      }

      // Show/hide based on prerequisites
      const allPrereqsMet = info.prerequisites.every(prereq =>
        this.userModel.masteredConcepts.includes(prereq)
      );

      if (!allPrereqsMet) {
        info.element.classList.add('locked');
        this.addPrereqWarning(info.element, info.prerequisites);
      } else {
        info.element.classList.remove('locked');
      }
    });
  }

  addPrereqWarning(element, prerequisites) {
    const warning = document.createElement('div');
    warning.className = 'prereq-warning';
    warning.innerHTML = `
      <strong>Prerequisites:</strong>
      ${prerequisites.map(p => `<code>${p}</code>`).join(', ')}
    `;
    element.insertBefore(warning, element.firstChild);
  }

  saveUserModel() {
    localStorage.setItem('user-model', JSON.stringify(this.userModel));
  }
}
```

### 7.3 Personalization UI Component

```javascript
// React component for Docusaurus
import React, { useState, useEffect } from 'react';

export default function PersonalizationPanel() {
  const [level, setLevel] = useState('beginner');
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [showTips, setShowTips] = useState(true);

  useEffect(() => {
    // Load preferences
    const stored = localStorage.getItem('doc-prefs');
    if (stored) {
      const prefs = JSON.parse(stored);
      setLevel(prefs.level);
      setShowAdvanced(prefs.showAdvanced);
      setShowTips(prefs.showTips);
    }
  }, []);

  const handleLevelChange = (newLevel) => {
    setLevel(newLevel);
    localStorage.setItem('doc-prefs', JSON.stringify({
      level: newLevel,
      showAdvanced,
      showTips,
    }));
    window.dispatchEvent(new CustomEvent('personalization:changed', {
      detail: { level: newLevel },
    }));
  };

  return (
    <div className="personalization-panel">
      <h4>Learning Level</h4>
      <div className="level-buttons">
        {['beginner', 'intermediate', 'advanced'].map(lv => (
          <button
            key={lv}
            className={`level-btn ${level === lv ? 'active' : ''}`}
            onClick={() => handleLevelChange(lv)}
          >
            {lv.charAt(0).toUpperCase() + lv.slice(1)}
          </button>
        ))}
      </div>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={showAdvanced}
          onChange={(e) => setShowAdvanced(e.target.checked)}
        />
        Show Advanced Content
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={showTips}
          onChange={(e) => setShowTips(e.target.checked)}
        />
        Show Contextual Tips
      </label>
    </div>
  );
}
```

---

## 8. Integration Checklist for Docusaurus

- [ ] Create theme wrapper components (`src/theme/` directory)
- [ ] Implement preference storage class with localStorage
- [ ] Add personalization CSS variables file (honors Infima tokens)
- [ ] Create PersonalizationPanel React component
- [ ] Set up content markup with `data-*` attributes in MDX
- [ ] Add DOMContentLoaded listener for client-side DOM manipulation
- [ ] Implement responsive CSS for personalization controls
- [ ] Add dark mode media query support
- [ ] Set up event delegation for toggle controls
- [ ] Test performance with DevTools Lighthouse
- [ ] Validate LocalStorage quota handling
- [ ] Test on mobile viewports
- [ ] Add analytics/metrics collection (optional)
- [ ] Document content markup schema for content team

---

## 9. Key Takeaways

1. **Lightweight by design**: All approaches use vanilla JavaScript + localStorage, no extra dependencies
2. **React integration**: Docusaurus is React-based, so components scale naturally
3. **Static-site compatible**: No SSR required; personalization happens in browser after initial HTML load
4. **Styling consistency**: Use Infima CSS variables for automatic dark mode/theme support
5. **Performance-first**: Minimize initial payload; defer non-critical personalization logic
6. **Graceful degradation**: Site works without JavaScript; personalization enhances experience
7. **Cache management**: 30-day TTL with version checking prevents stale preferences
8. **User privacy**: All data stored locally; no external tracking required (unless explicitly added)

---

## Sources

- [Docusaurus Styling and Layout](https://docusaurus.io/docs/styling-layout)
- [MDN: Client-Side Storage](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Client-side_storage)
- [MDN: DOM Manipulation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Manipulating_documents)
- [Sitecore Personalize: Client-Side JavaScript](https://doc.sitecore.com/personalize/en/users/sitecore-personalize/using-client-side-javascript-in-personalization.html)
- [Docusaurus Component Swizzling](https://app.studyraid.com/en/read/12346/398578/swizzling-components-to-alter-core-functionality)
- [DEV Community: Docusaurus Customization](https://dev.to/joseph42a/building-stunning-docs-diving-deep-into-docusaurus-customization-33jp)
- [LogRocket: Static Site Generation with React](https://blog.logrocket.com/using-static-site-generation-modern-react-frameworks/)
- [Docusaurus Community: Custom Functionality](https://docusaurus.community/contributing/customisations/)
