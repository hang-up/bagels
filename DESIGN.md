# Intentional Dashboard — Design System

> Machine-readable design tokens for AI-generated UI components. Based on Tailwind CSS + shadcn/ui patterns.

---

## Brand Philosophy

**Intentional** — Every element serves a purpose. Clean, functional, no visual noise. Content-first hierarchy with subtle affordances.

---

## Color Palette

### Semantic Colors (HSL)

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--background` | `0 0% 100%` (#ffffff) | `0 0% 3.9%` (#0a0a0a) | Page background |
| `--foreground` | `0 0% 3.9%` (#0a0a0a) | `0 0% 98%` (#fafafa) | Primary text |
| `--card` | `0 0% 100%` (#ffffff) | `0 0% 3.9%` (#0a0a0a) | Card backgrounds |
| `--card-foreground` | `0 0% 3.9%` (#0a0a0a) | `0 0% 98%` (#fafafa) | Card text |
| `--popover` | `0 0% 100%` (#ffffff) | `0 0% 3.9%` (#0a0a0a) | Dropdown/popover bg |
| `--primary` | `0 0% 9%` (#171717) | `0 0% 98%` (#fafafa) | Primary buttons, links |
| `--primary-foreground` | `0 0% 98%` (#fafafa) | `0 0% 9%` (#171717) | Text on primary |
| `--secondary` | `0 0% 96.1%` (#f5f5f5) | `0 0% 14.9%` (#262626) | Secondary buttons, tags |
| `--secondary-foreground` | `0 0% 9%` (#171717) | `0 0% 98%` (#fafafa) | Text on secondary |
| `--muted` | `0 0% 96.1%` (#f5f5f5) | `0 0% 14.9%` (#262626) | Muted backgrounds |
| `--muted-foreground` | `0 0% 45.1%` (#737373) | `0 0% 63.9%` (#a3a3a3) | Secondary text, placeholders |
| `--accent` | `0 0% 96.1%` (#f5f5f5) | `0 0% 14.9%` (#262626) | Hover states, highlights |
| `--accent-foreground` | `0 0% 9%` (#171717) | `0 0% 98%` (#fafafa) | Text on accent |
| `--destructive` | `0 84.2% 60.2%` (#ef4444) | `0 62.8% 30.6%` (#7f1d1d) | Error states, delete |
| `--destructive-foreground` | `0 0% 98%` (#fafafa) | `0 0% 98%` (#fafafa) | Text on destructive |
| `--border` | `0 0% 89.8%` (#e5e5e5) | `0 0% 14.9%` (#262626) | Borders, dividers |
| `--input` | `0 0% 89.8%` (#e5e5e5) | `0 0% 14.9%` (#262626) | Input borders |
| `--ring` | `0 0% 3.9%` (#0a0a0a) | `0 0% 83.1%` (#d4d4d4) | Focus rings |

### Chart Colors (Data Visualization)

| Token | Light | Dark |
|-------|-------|------|
| `--chart-1` | `12 76% 61%` (orange) | `220 70% 50%` (blue) |
| `--chart-2` | `173 58% 39%` (teal) | `160 60% 45%` (green) |
| `--chart-3` | `197 37% 24%` (slate) | `30 80% 55%` (orange) |
| `--chart-4` | `43 74% 66%` (yellow) | `280 65% 60%` (purple) |
| `--chart-5` | `27 87% 67%` (amber) | `340 75% 55%` (pink) |

### Sidebar Colors

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar-background` | `0 0% 98%` (#fafafa) | `240 5.9% 10%` (#18181b) |
| `--sidebar-foreground` | `240 5.3% 26.1%` (#3f3f46) | `240 4.8% 95.9%` (#f1f5f9) |
| `--sidebar-primary` | `240 5.9% 10%` (#18181b) | `224.3 76.3% 48%` (#3b82f6) |
| `--sidebar-accent` | `240 4.8% 95.9%` (#f1f5f9) | `240 3.7% 15.9%` (#27272a) |
| `--sidebar-border` | `220 13% 91%` (#e2e8f0) | `240 3.7% 15.9%` (#27272a) |

---

## Typography

### Font Stack

```
system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Page Title | `text-2xl` (24px) | 600 | tight (1.25) | -0.025em |
| Card Title | `text-lg` (18px) | 600 | tight (1.25) | -0.025em |
| Section Heading | `text-base` (16px) | 600 | normal | 0 |
| Body | `text-sm` (14px) | 400 | relaxed (1.625) | 0 |
| Small/Caption | `text-xs` (12px) | 400 | normal | 0 |
| Badge | `text-xs` (12px) | 600 | normal | 0 |
| Button | `text-sm` (14px) | 500 | normal | 0 |

### Font Weights Used

- **400** — Regular body text
- **500** — Buttons, emphasized text
- **600** — Headings, card titles, badges

---

## Spacing

### Base Unit

`0.25rem` (4px) — Tailwind's default spacing scale

### Common Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight internal spacing |
| `space-1.5` | 6px | Compact gaps |
| `space-2` | 8px | Small gaps |
| `space-3` | 12px | Component padding |
| `space-4` | 16px | Card padding |
| `space-6` | 24px | Section padding |
| `p-6` | 24px | Card internal padding |

### Layout Spacing

- **Card padding**: `p-6` (24px) all sides
- **Card header/footer**: `p-6` with `space-y-1.5` for vertical rhythm
- **Form inputs**: `h-10` (40px) height, `px-3` (12px) horizontal padding
- **Sidebar width**: 16rem (256px) collapsed, expands on hover

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.5rem` (8px) | Base radius |
| `rounded-lg` | `0.5rem` (8px) | Cards, buttons, inputs |
| `rounded-md` | `0.375rem` (6px) | Smaller elements, badges |
| `rounded-full` | 9999px | Pills, avatars |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle elevation |
| `shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1)` | Cards, buttons |
| Dialog overlay | `var(--shadow-6)` (from Radix) | Modal backdrop |

---

## Components

### Buttons

**Base Styles:**
- Height: `h-9` (36px) default, `h-8` (32px) sm, `h-10` (40px) lg
- Padding: `px-4 py-2` default, `px-3` sm, `px-8` lg
- Border radius: `rounded-md` (6px)
- Font: `text-sm font-medium`
- Focus: `ring-2 ring-ring ring-offset-2`

**Variants:**

| Variant | Background | Text | Border | Hover |
|---------|------------|------|--------|-------|
| `default` | `--primary` | `--primary-foreground` | none | `bg-primary/90` |
| `destructive` | `--destructive` | `--destructive-foreground` | none | `bg-destructive/90` |
| `outline` | `--background` | `--foreground` | `--input` | `bg-accent text-accent-foreground` |
| `secondary` | `--secondary` | `--secondary-foreground` | none | `bg-secondary/80` |
| `ghost` | transparent | `--foreground` | none | `bg-accent text-accent-foreground` |
| `link` | transparent | `--primary` | none | `underline` |

**Sizes:**
- `default`: `h-9 px-4 py-2`
- `sm`: `h-8 rounded-md px-3 text-xs`
- `lg`: `h-10 rounded-md px-8`
- `icon`: `h-9 w-9` (square)

### Cards

**Structure:**
```
Card (rounded-lg border bg-card shadow-sm)
  ├── CardHeader (flex flex-col space-y-1.5 p-6)
  │     ├── CardTitle (text-2xl font-semibold tracking-tight)
  │     └── CardDescription (text-sm text-muted-foreground)
  ├── CardContent (p-6 pt-0)
  └── CardFooter (flex items-center p-6 pt-0)
```

**Visual:**
- Background: `--card`
- Border: `border` (1px solid `--border`)
- Border radius: `rounded-lg` (8px)
- Shadow: `shadow-sm`

### Badges

**Base:**
- Display: `inline-flex items-center`
- Shape: `rounded-full`
- Padding: `px-2.5 py-0.5`
- Font: `text-xs font-semibold`

**Variants:**

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| `default` | `--primary` | `--primary-foreground` | transparent |
| `secondary` | `--secondary` | `--secondary-foreground` | transparent |
| `destructive` | `--destructive` | `--destructive-foreground` | transparent |
| `outline` | transparent | `--foreground` | `--border` |

### Inputs

**Text Input:**
- Height: `h-10` (40px)
- Border: `border border-input rounded-md`
- Background: `--background`
- Padding: `px-3 py-2`
- Font: `text-sm`
- Placeholder: `text-muted-foreground`
- Focus: `ring-2 ring-ring`

**Textarea:**
- Min height: `min-h-[80px]`
- Same styling as text input

### Status Badges (Task Status)

Task statuses have semantic colors:

| Status | Background | Text |
|--------|------------|------|
| `backlog` | muted | muted-foreground |
| `todo` | secondary | secondary-foreground |
| `in_progress` | primary | primary-foreground |
| `in_review` | accent | accent-foreground |
| `done` | success green | white |
| `blocked` | destructive | destructive-foreground |

### Sidebar

**Layout:**
- Width: 16rem (256px) default, collapses to icons
- Background: `--sidebar-background`
- Border: right border with `--sidebar-border`

**Menu Items:**
- Padding: `px-3 py-2`
- Border radius: `rounded-md`
- Active: `--sidebar-accent` background
- Hover: subtle background shift

### Dialog/Modal

**Overlay:**
- Background: `var(--black-a9)` (black with alpha)
- Animation: fade in 150ms

**Content:**
- Background: `--background`
- Border radius: `rounded-lg`
- Shadow: `var(--shadow-6)`
- Position: fixed, centered
- Width: `90vw` max `500px`

### Toast Notifications

- Position: bottom-right
- Background: `--background`
- Border: `border`
- Shadow: `shadow-lg`
- Animation: slide in from right

---

## Patterns & Guidelines

### Do

- Use `muted-foreground` for secondary text, timestamps, metadata
- Apply `shadow-sm` to cards and elevated surfaces
- Keep borders subtle with `--border` color
- Use `space-y-1.5` for tight vertical spacing in headers
- Prefer `gap-2` (8px) for flex/grid gaps

### Don't

- Don't use pure black (`#000000`) — use `--foreground` (#0a0a0a)
- Don't use pure white (`#ffffff`) — use `--background` (#ffffff in light, #0a0a0a in dark)
- Don't override border-radius — stick to the scale
- Don't mix border styles (outline vs filled) arbitrarily

### Accessibility

- Focus visible: `ring-2 ring-ring ring-offset-2`
- Disabled state: `opacity-50 pointer-events-none`
- Minimum touch target: 44×44px (buttons are 36px+ padding)
- Color contrast: All text meets WCAG AA (foreground on backgrounds)

---

## Markdown Content (Comments)

Comments use `.comment-markdown` class with these styles:

| Element | Style |
|---------|-------|
| Base | `text-sm text-foreground` |
| Headings | `text-base font-semibold` (h1-h3) |
| Paragraphs | `leading-relaxed` with `mt-3` spacing |
| Lists | `list-disc pl-5` with `mb-1` items |
| Blockquotes | `border-l-2 border-border pl-3 text-muted-foreground` |
| Tables | `w-full border-collapse text-xs` with `border border-border` cells |
| Table headers | `bg-muted/60 text-xs font-semibold` |

---

## Animation

### Dialog
- Overlay fade: 150ms `cubic-bezier(0.16, 1, 0.3, 1)`
- Content scale: 96% → 100% with opacity

### Toast
- Slide in from right: 300ms ease-out
- Auto-dismiss: 5000ms default

### Hover Transitions
- Duration: 150ms default for `transition-colors`
- Easing: default ease

---

## Grid & Layout

### Page Layout
```
Sidebar (fixed, 16rem) | Main Content (flex-1, overflow-auto)
```

### Task List
- Two-column on large screens: List | Detail
- Single column on mobile
- Gap between items: `space-y-2` (8px)

### Forms
- Labels above inputs
- Stack with `space-y-4` (16px) between fields
- Full-width inputs within containers

---

## Dark Mode Notes

The system uses CSS variables that flip in `.dark` class:
- Light surfaces become dark
- Dark text becomes light
- Accent colors shift for readability
- Charts use different palette for visibility

Always test both modes when generating components.

---

## File Structure Convention

```
components/
  ui/           # shadcn/ui primitives (Button, Card, Input, etc.)
  Shared/       # Dashboard-specific shared components
  [Feature]/    # Feature-specific components (TaskView, ProjectsView, etc.)
```

---

*Generated from codebase analysis: April 3, 2026*
*Framework: React + Tailwind CSS + shadcn/ui*
