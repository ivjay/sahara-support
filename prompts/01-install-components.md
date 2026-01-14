# Prompt 01: Install Additional Shadcn Components

## Objective
Install the UI components needed for the chat interface using shadcn CLI.

---

## Components to Install

| Component | Purpose |
|-----------|---------|
| `avatar` | User and bot avatars in chat messages |
| `scroll-area` | Smooth scrolling for chat message container |
| `skeleton` | Loading animation while waiting for responses |
| `tooltip` | Helpful hints on buttons and interactive elements |

---

## Execution Steps

### Step 1: Run the shadcn CLI command

```powershell
npx shadcn@latest add avatar scroll-area skeleton tooltip
```

When prompted, accept the default options.

---

### Step 2: Verify Installation

After installation, check that these files exist in `components/ui/`:

```
components/ui/
├── avatar.tsx      ✓
├── scroll-area.tsx ✓
├── skeleton.tsx    ✓
├── tooltip.tsx     ✓
```

---

## Expected Output

The terminal should show something like:

```
✔ Done. Installed avatar, scroll-area, skeleton, tooltip.
```

---

## Important Rules

> ⚠️ **DO NOT** modify any existing component files
> ⚠️ **DO NOT** change any colors in `globals.css`
> ⚠️ **DO NOT** manually create these components - only use shadcn CLI

---

## Current Components After This Step

After completing this prompt, you will have these UI components:

**Previously Installed:**
- button, card, input, textarea, badge
- dropdown-menu, alert-dialog, separator
- select, label, field, combobox, input-group

**Newly Installed:**
- avatar, scroll-area, skeleton, tooltip

---

## Next Step

→ Proceed to **Prompt 02: PWA Setup**
