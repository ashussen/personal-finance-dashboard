# CSS Architecture

This directory contains modular CSS files organized by purpose and component.

## File Structure

### Core Styles
- **base.css** - Global styles, CSS variables, resets, and layout containers
  - CSS custom properties (colors, fonts)
  - Global resets and box-sizing
  - Body and container styles
  - Main content layout

### Component Styles
- **header.css** - Header component styles
  - Logo
  - Navigation pills and items
  - Search bar
  - User profile and avatar

- **footer.css** - Footer/floating action bar styles
  - Floating action bar
  - Action buttons
  - Input fields

### Page-Specific Styles
- **index-page.css** - Homepage dashboard styles
  - Balance header
  - Time filters
  - Chart container and bars
  - Metrics grid and cards
  - Transactions table
  - Pagination

- **expenses-page.css** - Expenses tracker page styles
  - Expenses grid layout
  - Expense cards
  - Chart sections (bar and donut)
  - Chart legends
  - Detail buttons

## Usage

### For Index Page (index.html)
```html
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/header.css">
<link rel="stylesheet" href="css/footer.css">
<link rel="stylesheet" href="css/index-page.css">
```

### For Expenses Page (expenses.html)
```html
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/header.css">
<link rel="stylesheet" href="css/footer.css">
<link rel="stylesheet" href="css/expenses-page.css">
```

## Benefits

1. **Modular** - Each file has a single, clear purpose
2. **Maintainable** - Easy to find and modify specific styles
3. **Efficient** - AI only needs to read relevant files for changes
4. **Scalable** - Easy to add new pages or components
5. **Reusable** - Common components (header, footer) are shared across pages

## Adding New Pages

When creating a new page:
1. Include `base.css`, `header.css`, and `footer.css` (if needed)
2. Create a new page-specific CSS file (e.g., `newpage-page.css`)
3. Include only the styles specific to that page
