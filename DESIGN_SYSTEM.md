# DocVault Trust Console — Design System Specification

## VISUAL IDENTITY

### Default Theme: "Azure Enterprise Calm"
**Rationale**: Balances modern SaaS aesthetics with enterprise credibility. Cool, trustworthy palette with clear hierarchy.

### Color Palette (Semantic Tokens)

```css
/* Primary Palette */
--primary-50:  hsl(210, 100%, 97%)   /* Lightest primary tint */
--primary-100: hsl(210, 95%, 92%)
--primary-200: hsl(210, 90%, 85%)
--primary-400: hsl(210, 85%, 65%)
--primary-500: hsl(210, 80%, 50%)    /* Primary action color */
--primary-600: hsl(210, 85%, 42%)
--primary-700: hsl(210, 90%, 35%)

/* Semantic Colors */
--background:   hsl(220, 20%, 98%)   /* Page background */
--surface:      hsl(0, 0%, 100%)     /* Card/tile surfaces */
--surface-alt:  hsl(220, 15%, 96%)   /* Alternate surface */
--border:       hsl(220, 15%, 88%)   /* Dividers, outlines */
--border-hover: hsl(220, 20%, 75%)

/* Text Hierarchy */
--text-primary:    hsl(220, 20%, 15%)  /* Headings, key data */
--text-secondary:  hsl(220, 15%, 40%)  /* Supporting text */
--text-tertiary:   hsl(220, 10%, 55%)  /* Subtle labels */
--text-on-primary: hsl(0, 0%, 100%)    /* Text on primary bg */

/* Status Colors (reserved for actual statuses) */
--success-bg:   hsl(142, 76%, 95%)
--success-text: hsl(142, 76%, 36%)
--success-dark: hsl(142, 80%, 28%)

--warning-bg:   hsl(38, 92%, 95%)
--warning-text: hsl(38, 92%, 50%)
--warning-dark: hsl(38, 95%, 40%)

--critical-bg:   hsl(0, 84%, 96%)
--critical-text: hsl(0, 84%, 60%)
--critical-dark: hsl(0, 90%, 45%)

--info-bg:   hsl(210, 95%, 95%)
--info-text: hsl(210, 95%, 50%)
--info-dark: hsl(210, 100%, 40%)

/* Trust Signal Colors */
--authentic-green:  hsl(142, 76%, 36%)
--tampered-red:     hsl(0, 84%, 60%)
--invalid-orange:   hsl(38, 92%, 50%)
--signature-blue:   hsl(210, 95%, 50%)
```

### Alternate Theme: "Modern SaaS Calm"
```css
/* Warmer, slightly more vibrant option */
--primary-500: hsl(250, 75%, 60%)  /* Purple-blue primary */
--background:  hsl(240, 15%, 98%)
/* Rest follows same semantic structure */
```

### Typography Scale

```css
/* Font Family */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

/* Dashboard-Optimized Scale */
--text-xs:   0.75rem   /* 12px - Small labels, timestamps */
--text-sm:   0.875rem  /* 14px - Body text, table cells */
--text-base: 1rem      /* 16px - Default body */
--text-lg:   1.125rem  /* 18px - Section headers */
--text-xl:   1.25rem   /* 20px - Card titles */
--text-2xl:  1.5rem    /* 24px - Page headers */
--text-3xl:  2rem      /* 32px - Hero elements */

/* Weight Hierarchy */
--font-normal:    400  /* Body text */
--font-medium:    500  /* Emphasis, buttons */
--font-semibold:  600  /* Headings, strong labels */
--font-bold:      700  /* Primary headings */

/* Line Heights */
--leading-tight:  1.25  /* Headings */
--leading-normal: 1.5   /* Body text */
--leading-relaxed: 1.75 /* Dense tables */
```

### Elevation & Shadow Rules

```css
/* Subtle depth for cards */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Default card elevation */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07),
             0 2px 4px -2px rgb(0 0 0 / 0.06);

/* Elevated interactive elements */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08),
             0 4px 6px -4px rgb(0 0 0 / 0.05);

/* Drawers, modals */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1),
             0 8px 10px -6px rgb(0 0 0 / 0.08);
```

### Glass Usage Rule
**CRITICAL**: Glass effects (backdrop-blur, transparency) are ONLY used for:
- Navigation overlays (command palette, mobile menu)
- Temporary alert drawers that overlay content
- Modal backdrops

**NEVER use glass for**:
- Tables with dense data
- Audit logs
- Any surface containing small text (< 14px)
- Primary content areas

**Glass Recipe** (when permitted):
```css
background: hsla(0, 0%, 100%, 0.85);
backdrop-filter: blur(12px);
border: 1px solid hsla(220, 15%, 88%, 0.6);
```

---

## LAYOUT SYSTEM

### Grid Foundation

**Desktop (≥1024px)**: 12-column grid, 24px gutters
**Tablet (768-1023px)**: 6-column grid, 20px gutters  
**Mobile (<768px)**: 4-column grid, 16px gutters

### Bento Grid Rules (Dashboard)

**Purpose**: Create visual hierarchy through varied tile sizes, not color or decoration.

**Composition Rules**:
1. **Hero Tiles** (4-6 cols): Key metrics, primary actions
2. **Standard Tiles** (3-4 cols): Supporting stats, quick links
3. **Compact Tiles** (2-3 cols): Status indicators, badges

**Layout Formula**:
- Row 1: 6 + 3 + 3 (Hero metric + 2 supporting)
- Row 2: 4 + 4 + 4 (3 equal actions)
- Row 3: 8 + 4 (Wide table preview + sidebar info)

**Visual Consistency**:
- Corner radius: 12px (all tiles)
- Tile spacing: 20px
- Internal padding: 24px (hero), 20px (standard), 16px (compact)
- Hover: Subtle lift (2px translateY + shadow-lg)

### App Shell Structure

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] Search (⌘K)              [Alerts] [User] [Theme]│ ← Top Bar (64px)
├────────┬────────────────────────────────────────────────┤
│        │                                                 │
│  Nav   │          Main Content Area                     │
│ (240px)│          (12-col grid)                          │
│        │                                                 │
│ • Dash │                                                 │
│ • Veri │                                                 │
│ • Regi │                                                 │
│ • Audi │                                                 │
│ • Aler │                                                 │
│ • User │                                                 │
│        │                                                 │
│ [Logi] │                                                 │
└────────┴────────────────────────────────────────────────┘
```

**Left Sidebar** (collapsible):
- Width: 240px (expanded), 64px (collapsed)
- Background: surface (solid, no glass)
- Border: 1px solid border color
- Icons: 20px, aligned left with 16px padding
- Active state: primary-100 background, primary-600 text + left border accent (3px)

**Top Command Bar**:
- Height: 64px
- Background: surface with shadow-sm
- Search: Expands on focus, shows ⌘K hint
- Right actions: Alerts badge, user menu, theme toggle

**Right Alerts Drawer** (slide-in):
- Width: 400px
- Background: surface (solid)
- Shadow: shadow-xl
- Trigger: Alert icon with badge count
- Does NOT push content (overlay)

---

## KEY SCREENS

### 1. DASHBOARD (Bento Grid)

**Purpose**: At-a-glance system health, recent activity, quick actions.

**Layout**:
```
┌──────────────┬────────┬────────┐
│ Verification │ Alerts │ Users  │  Row 1: Hero + 2 compact
│    Status    │   (2)  │  (12)  │
│   1,247 docs │        │        │
├────────┬─────┴────────┴────────┤
│ Verify │ Register │ View Logs │  Row 2: 3 Quick Actions
│  New   │ Document │  & Audit  │
├────────┴──────────────┬────────┤
│ Recent Audit Events   │ System │  Row 3: Wide table + status
│ Table (5 rows)        │ Health │
└───────────────────────┴────────┘
```

**Tiles**:

1. **Verification Status** (6 cols, hero)
   - Large number: "1,247 Documents"
   - Trend: "+38 verified today" (success color)
   - Mini sparkline chart (optional)

2. **Open Alerts** (3 cols, compact)
   - Number badge: "2" (warning/critical color)
   - "View All" link

3. **Active Users** (3 cols, compact)
   - Number: "12"
   - Role breakdown pills

4-6. **Quick Action Tiles** (4 cols each)
   - Icon (32px) + Label + Arrow
   - Hover: lift + primary tint

7. **Recent Audit Events** (8 cols, wide table)
   - 5 most recent rows
   - Columns: Action, User, Document, Result, Time
   - "View All" footer link

8. **System Health** (4 cols, sidebar)
   - Status chips: "Database: OK", "Storage: OK", "Auth: OK"
   - Last check timestamp

**Satisfying Feel**:
- Clear visual weight hierarchy (hero tiles anchor the page)
- Generous whitespace between tiles
- Hover feedback on all interactive elements
- Fast, scannable metrics

---

### 2. VERIFY (Hero Workflow)

**Purpose**: Primary document verification flow. Must feel authoritative and clear.

**Layout**:
```
┌─────────────────────────────────────┐
│  Verify Document Authenticity       │  Header
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐  │
│   │  [Drop Zone]                │  │  Upload Area (centered)
│   │  Drag file or click         │  │
│   │  to browse                  │  │
│   └─────────────────────────────┘  │
│                                     │
│      [Verify Document] Button       │  Primary CTA
│                                     │
└─────────────────────────────────────┘

After verification:

┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │  Verdict Chip: AUTHENTIC ✓    │  │  Hero Result Card
│  ├───────────────────────────────┤  │
│  │  Hash Match: ✓ Verified       │  │
│  │  Signature: ✓ Valid            │  │
│  │  Signed by: admin@docvault    │  │
│  │  Algorithm: RSA-2048 + SHA256 │  │
│  │  Timestamp: 2026-01-10 18:45  │  │
│  ├───────────────────────────────┤  │
│  │  ▸ Why this verdict?          │  │  Expandable
│  │  ▸ View full audit timeline   │  │
│  └───────────────────────────────┘  │
│                                     │
│  [Verify Another]  [Print Proof]   │  Actions
└─────────────────────────────────────┘
```

**Verdict Chip** (prominent):
- AUTHENTIC: Large, success-dark, with checkmark icon
- TAMPERED: Large, critical-dark, with X icon
- INVALID_SIGNATURE: warning-dark, with alert icon

**Hash Display**:
- Monospace font
- Copy-to-clipboard icon on hover
- Stored hash vs. Uploaded hash comparison (if mismatch)

**Signature Section** (if present):
- Badge: "Digitally Signed"
- Signer identity
- Algorithm badge (e.g., "RSA-2048")
- Timestamp with timezone

**Expandable Explanations**:
- "Why this verdict?" → Shows reason codes:
  - "HASH_MATCH: Document content is unchanged"
  - "SIGNATURE_VALID: Digital signature verified against trusted key"
  - Or "HASH_MISMATCH: Document has been altered since registration"

**Satisfying Feel**:
- Instant, confident verdict display (no spinner delay after result)
- Clear visual distinction between success/failure
- All technical details accessible but not overwhelming
- Copy affordances for forensic data

---

### 3. REGISTER

**Purpose**: Upload and sign a new document for future verification.

**Layout**:
```
┌─────────────────────────────────────┐
│  Register New Document              │
├─────────────────────────────────────┤
│  Upload File                        │
│  ┌─────────────────────────────┐   │
│  │  [Drop Zone]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  Document Name: [Input]             │
│  Description: [Textarea]            │
│  Tags: [Multi-select]               │
│                                     │
│  ☐ Generate digital signature       │
│                                     │
│  [Register Document]                │
├─────────────────────────────────────┤
│  After registration:                │
│  ┌───────────────────────────────┐ │
│  │ ✓ Document Registered         │ │
│  │                               │ │
│  │ SHA-256: abc123...            │ │ (copyable)
│  │ Storage: Azure Blob           │ │
│  │ Signed by: current-user       │ │
│  │ Proof generated at: timestamp │ │
│  │                               │ │
│  │ [Download Proof] [View Audit] │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Satisfying Feel**:
- Clear step-by-step flow
- Instant feedback after registration (success card)
- Copy-to-clipboard for hash value
- Download proof option for external verification

---

### 4. AUDIT LOGS

**Purpose**: Dense, searchable table for compliance and investigation.

**Layout**:
```
┌─────────────────────────────────────┐
│  Audit Logs                         │
├─────────────────────────────────────┤
│  [Search] [Filter: All ▾] [Export] │  Toolbar
├─────────────────────────────────────┤
│  Table (SOLID SURFACE):             │
│  ┌───┬──────┬────────┬────────────┐ │
│  │ T │Action│User    │Document│Res││ │
│  ├───┼──────┼────────┼────────────┤ │
│  │18:│VERIFY│admin   │doc.pdf │✓ ││ │
│  │45 │      │        │        │  ││ │
│  ├───┼──────┼────────┼────────────┤ │
│  │   │ ...  │        │        │  ││ │
│  └───┴──────┴────────┴────────────┘ │
│                                     │
│  [Pagination: 1 2 3 ... 10 >]      │
└─────────────────────────────────────┘

Click row → Right drawer opens:
┌────────────────────┐
│ Audit Detail       │
│ ─────────────────  │
│ Action: VERIFY     │
│ User: admin        │
│ Document: doc.pdf  │
│ Result: SUCCESS    │
│ Timestamp: ...     │
│ IP: 127.0.0.1      │
│                    │
│ Timeline:          │
│ • Uploaded         │
│ • Hash computed    │
│ • Signature check  │
│ • Result stored    │
│                    │
│ [Close]            │
└────────────────────┘
```

**Table Styling** (CRITICAL):
- Background: surface (solid white/light gray)
- NO transparency or blur
- Row hover: surface-alt background (subtle)
- Borders: 1px solid border color
- Text: text-sm, leading-relaxed
- Zebra stripes optional (use surface-alt for alternating rows)

**Filters**:
- Date range picker
- Action type (VERIFY, REGISTER, etc.)
- Result (SUCCESS, FAILED)
- User dropdown

**Satisfying Feel**:
- Instant search/filter response
- Clear, readable rows even when dense
- Row click opens detailed drawer (doesn't navigate away)
- Export to CSV for external analysis

---

### 5. ALERTS CENTER

**Purpose**: Review and triage security/system alerts.

**Layout**:
```
┌─────────────────────────────────────┐
│  Alerts                             │
├─────────────────────────────────────┤
│  [All] [Unread] [Critical] [Warn]  │  Filter Chips
├─────────────────────────────────────┤
│  List:                              │
│  ┌─────────────────────────────────┤
│  │ 🔴 CRITICAL                     │
│  │ Suspicious verification attempt │
│  │ 2 hours ago                     │
│  ├─────────────────────────────────┤
│  │ 🟠 WARNING                      │
│  │ Signature expiring soon         │
│  │ 5 hours ago                     │
│  └─────────────────────────────────┘
│                                     │
│  Empty state (if no alerts):        │
│  ✓ No active alerts                 │
│  All systems operating normally     │
└─────────────────────────────────────┘

Click alert → Right drawer:
┌────────────────────┐
│ Alert Detail       │
│ ─────────────────  │
│ CRITICAL           │
│ Multiple failed... │
│                    │
│ Details:           │
│ • IP: 192.168...   │
│ • Document: x.pdf  │
│ • Attempts: 5      │
│                    │
│ Actions:           │
│ [Mark as Read]     │
│ [Block IP]         │
│ [View Audit Trail] │
│                    │
│ [Close]            │
└────────────────────┘
```

**Severity Colors** (used ONLY for status badges):
- CRITICAL: critical-dark (red)
- WARNING: warning-dark (orange)
- INFO: info-dark (blue)

**Satisfying Feel**:
- Clear unread indicator (badge on nav, bold text)
- One-click actions (mark as read, dismiss)
- Empty state feels calm and reassuring

---

### 6. LOGIN

**Purpose**: High-trust, minimal authentication entry point.

**Layout**:
```
┌─────────────────────────────────────┐
│                                     │
│             [Logo]                  │
│                                     │
│      DocVault Trust Console         │
│      Secure Document Verification   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Username: [Input]           │   │
│  │ Password: [Input]           │   │
│  │                             │   │
│  │ [Sign In]                   │   │  Primary button
│  │                             │   │
│  │ Don't have an account?      │   │
│  │ Sign up →                   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Styling**:
- Centered card (max-width: 400px)
- Simple, solid surface (no glass)
- Subtle shadow (shadow-lg)
- Brand color accent (primary-500) only on button
- No animations beyond button hover

**Satisfying Feel**:
- Minimal, fast to complete
- Clear focus states on inputs
- Error messages inline, not alerts
- "Loading..." state on button (spinner replaces text)

---

## COMPONENTS & STATES

### Button System

```css
/* Primary (Main CTAs) */
.btn-primary {
  background: var(--primary-500);
  color: var(--text-on-primary);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 150ms ease;
}
.btn-primary:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Secondary (Supporting actions) */
.btn-secondary {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn-secondary:hover {
  background: var(--surface-alt);
}

/* Ghost (Low-emphasis actions) */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover {
  background: var(--surface-alt);
}

/* Destructive (Delete, reject) */
.btn-destructive {
  background: var(--critical-dark);
  color: white;
}
```

### Badge System

**Role Badges**:
- Admin: primary-500 background
- Document Owner: info-dark
- Auditor: warning-dark
- Guest: text-tertiary (gray)

**Severity Badges**:
- CRITICAL: critical-bg + critical-text
- WARNING: warning-bg + warning-text
- INFO: info-bg + info-text
- SUCCESS: success-bg + success-text

**Verdict Badges** (larger, prominent):
- AUTHENTIC: success-dark, 16px padding, bold, checkmark icon
- TAMPERED: critical-dark, X icon
- INVALID_SIGNATURE: warning-dark, alert icon

**Styling**:
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: var(--text-xs);
  font-weight: 500;
  gap: 4px;
}
```

### Card System

**Solid Card** (default):
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
}
```

**Subtle Glass Card** (ONLY for overlays):
```css
.card-glass {
  background: hsla(0, 0%, 100%, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid hsla(220, 15%, 88%, 0.6);
  border-radius: 12px;
  padding: 24px;
}
/* Never use for tables or dense text */
```

### Table System

**Base Table** (MUST be on solid surface):
```css
.table {
  width: 100%;
  background: var(--surface); /* SOLID */
  border: 1px solid var(--border);
  border-radius: 8px;
}

.table th {
  background: var(--surface-alt);
  padding: 12px 16px;
  text-align: left;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}

.table td {
  padding: 12px 16px;
  font-size: var(--text-sm);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
}

.table tr:hover {
  background: var(--surface-alt); /* Subtle, maintains readability */
}

.table tr:last-child td {
  border-bottom: none;
}
```

**Zebra Stripes** (optional):
```css
.table-striped tr:nth-child(even) {
  background: var(--surface-alt);
}
```

### Drawer System

**Alert Drawer** (right-slide):
```css
.drawer {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 400px;
  background: var(--surface);
  box-shadow: var(--shadow-xl);
  transform: translateX(100%);
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
}

.drawer.open {
  transform: translateX(0);
}
```

### Empty States

**No Alerts**:
```
✓ No active alerts
All systems operating normally

Last check: 2 minutes ago
```

**No Audit Logs**:
```
📄 No audit events yet
Start by verifying or registering a document
```

### Loading States (Skeletons)

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-alt) 25%,
    var(--border) 50%,
    var(--surface-alt) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

**Usage**: Replace content with skeleton boxes during load (maintain layout)

### Error States

**Permission Denied**:
```
🔒 Access Denied
You don't have permission to view this resource.
Contact your administrator if you need access.
```

**Document Tampered**:
```
⚠️ Document Integrity Compromised
The uploaded document does not match the registered hash.
This document may have been altered since registration.

[View Details] [Report Issue]
```

**Invalid Signature**:
```
⚠️ Invalid Digital Signature
The signature could not be verified against the registered key.
Possible causes: expired certificate, wrong key, signature corruption.

[View Technical Details]
```

---

## MOTION & MICRO-INTERACTIONS

### Motion Rules

**Durations**:
- Instant (0ms): Focus outlines, text changes
- Fast (150ms): Hover states, button clicks
- Standard (250ms): Drawers, dropdowns
- Slow (400ms): Page transitions (if any)

**Easing**:
- `ease-out` (cubic-bezier(0, 0, 0.2, 1)): Entrances, expansions
- `ease-in-out` (cubic-bezier(0.4, 0, 0.2, 1)): Smooth transitions

### Micro-Interactions

**Tile Hover** (Dashboard):
```css
.tile {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}
.tile:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

**Verify Action Transition**:
- Click "Verify": Button shows spinner (150ms fade-in)
- Result arrives: Spinner fades out, hero card fades in (250ms)
- Verdict chip animates in with subtle scale (starts at 0.95, grows to 1.0)

**Alert Arrival**:
- New alert: Badge count increments with bounce animation
- Drawer highlight: Subtle pulse on alert icon (1 cycle, 500ms)

**Copy-to-Clipboard**:
- Click hash: Icon changes to checkmark (150ms)
- Tooltip: "Copied!" (fades in, holds 1s, fades out)

**Row Selection** (Tables):
- Click row: Smooth expand to show detail drawer (250ms slide from right)
- No jarring navigation away from current view

### Reduced Motion Mode

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Fallbacks**:
- Drawers: instant open/close
- Hover: color change only, no transform
- Loading: static spinner or text instead of animation

---

## ACCESSIBILITY & TRUST SIGNALS

### Accessibility Rules

**Focus Styles** (keyboard navigation):
```css
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Contrast Requirements**:
- Text on background: ≥ 4.5:1 (AA standard)
- Large text (≥18px): ≥ 3:1
- Interactive elements: ≥ 3:1 border/background contrast

**Keyboard Flows**:
- Tab order follows visual hierarchy (top-left to bottom-right)
- Escape key closes drawers/modals
- Enter activates buttons
- Arrow keys navigate dropdown menus
- Ctrl+K opens command palette
- Skip to main content link (hidden until focused)

**Screen Reader Support**:
- All icons have aria-labels
- Severity badges include hidden text (e.g., "Critical alert:")
- Table headers use `<th scope="col">`
- Live regions for alerts (`role="alert"`, `aria-live="polite"`)

**Color Independence**:
- Never rely on color alone (use icons + text)
- Verdict badges: icon + color + text label
- Severity: icon + text + color
- Charts: patterns or labels in addition to color

### Trust Signals

**Proof Chips** (verify result page):
```
[✓ Digitally Signed]  [RSA-2048]  [SHA-256]  [🔒 Key Vault]
```

**Signature Badge**:
```
┌─────────────────────────┐
│ ✓ Digitally Signed      │
│ Signed by: admin@doc... │ (truncated with tooltip)
│ Algorithm: RSA-2048     │
│ Verified: ✓             │
└─────────────────────────┘
```

**Hash Display** (copyable):
```
SHA-256: abc123def456...
         [Copy Icon] ← appears on hover
```

**Timestamp Formatting**:
```
2026-01-10 18:45:32 UTC
(2 hours ago)
```

**Copy-to-Clipboard Affordances**:
- All technical data (hashes, signatures, IDs) have copy icons
- Hover reveals icon
- Click shows "Copied!" feedback

**"Why" Explanations** (expandable sections):
```
▸ Why is this document AUTHENTIC?
  ├─ Hash Match: Document content unchanged
  ├─ Signature Valid: Verified against trusted key
  └─ Timestamp: Within expected range
```

**Reason Codes** (technical details):
```
Reason Codes:
• HASH_MATCH: SHA-256 hashes match exactly
• SIGNATURE_VALID: RSA-2048 signature verified
• TIMESTAMP_VALID: Signed within 24 hours of registration
```

### Preventing Glassmorphism Harm

**Rules**:
1. **Opacity Floor**: Never go below 85% opacity on any surface with text
2. **Solid Layers**: Always place a solid color behind text areas
3. **Blur Limit**: Max 12px blur; test legibility with smallest text size
4. **Fallback**: If glassmorphism causes any readability issue, use solid surface

**Test Checklist**:
- [ ] Can you read 12px text without squinting?
- [ ] Is table data instantly scannable?
- [ ] Do status badges maintain contrast?
- [ ] Does it work on both light and dark backgrounds?

If any answer is "no", remove glass effect and use solid surface.

---

## Implementation Priority

1. **Phase 1**: Core layout (app shell, grid, cards)
2. **Phase 2**: Dashboard bento grid + verify hero workflow
3. **Phase 3**: Tables, drawers, badges
4. **Phase 4**: Motion, micro-interactions
5. **Phase 5**: Dark mode (optional), advanced animations

**Design System Status**: ✅ Complete
**Ready for implementation**: Yes

---

*DocVault Trust Console Design System v1.0*
*Optimized for audit credibility, readability, and enterprise trust*
