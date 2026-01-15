# Responsive & Theming Fixes Summary

## 1. Stacked Card View for Tables
- **Mobile (< 768px)**: All tables (Audit Logs, Users, Dashboard Activity) now render as a list of styled "Stacked Cards". Each row is a separate card with `border-2` and `p-4`.
- **Desktop (>= 768px)**: Retains the standard table layout with `border-4` and scrollable overflow.
- **Implementation**: Updated `src/components/ui/Table.tsx` to toggle between `<table>` and `div` layout based on viewport.

## 2. Text & Content Overflow
- **Mobile**: Enabled text wrapping (`break-words`) and removed strict width constraints in table cell renderers to utilize vertical space efficiently.
- **Desktop**: Maintained `truncate` and `max-w` constraints to ensure neat tabular columns.
- **Files**: Updated `AuditLogs.tsx`, `Dashboard.tsx`, and `Other.tsx`.

## 3. Theming & Scaling
- **Headers**: Updated page titles to `text-2xl` (Mobile) / `text-4xl` (Desktop) hierarchy.
- **Padding**: Verified standard content padding is `p-4` (Mobile) / `p-8` (Desktop) via `AppShell`.
- **Borders**: Mobile elements generally use `border-2`, while Desktop uses `border-4`.

## 4. Layout Robustness
- **Cards**: Added `w-full max-w-full` global style to `src/components/ui/card.tsx` to prevent horizontal blowout in flex/grid containers.
- **Flexibility**: Verified layouts in `Other.tsx` use `flex-col md:flex-row` for headers.
