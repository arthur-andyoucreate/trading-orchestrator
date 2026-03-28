# Trading Orchestrator Design System

A comprehensive design system built with shadcn/ui, providing consistent, accessible, and beautiful components for trading applications.

## 🎨 Design Principles

### Visual Hierarchy
- **Clear information hierarchy** for critical trading data
- **High contrast** for readability in various lighting conditions
- **Purposeful color coding** for trading states (profit/loss, buy/sell)

### Accessibility
- **WCAG 2.1 AA compliant** color contrasts
- **Keyboard navigation** for all interactive elements
- **Screen reader friendly** with proper ARIA labels

### Performance
- **Optimized components** for real-time data updates
- **Minimal re-renders** for smooth trading interfaces
- **Tree-shakeable** for optimal bundle sizes

### Trading-Specific
- **Color-coded directions** (green for long, red for short)
- **Confidence indicators** with visual feedback
- **Risk-aware styling** with appropriate visual warnings

## 🏗️ Architecture

### Design Tokens
Centralized design tokens provide consistency across all components:

```typescript
import { colors, typography, spacing, shadows } from '@/lib/design-system/tokens';
```

### Component Categories
1. **Foundation**: Colors, typography, spacing, shadows
2. **Base Components**: Button, input, card, badge
3. **Trading Components**: Signal cards, portfolio widgets, risk meters
4. **Layout Components**: Dashboard grids, responsive containers

## 🎯 Trading Color System

### Primary Actions
- **Long/Buy**: `#22c55e` (Green) - Represents profit opportunity
- **Short/Sell**: `#ef4444` (Red) - Represents selling action  
- **Neutral/Hold**: `#64748b` (Gray) - Represents neutral stance

### Performance Indicators
- **Profit**: Green variants for positive performance
- **Loss**: Red variants for negative performance
- **Breakeven**: Gray variants for neutral performance

### Risk Levels
- **Low Risk**: Green tones
- **Medium Risk**: Amber/Yellow tones
- **High Risk**: Red tones with glow effects

## 📦 Component Library

### Buttons
Trading-optimized buttons with multiple variants:

```tsx
import { Button, LongButton, ShortButton } from '@/components/ui/button';

// Standard button
<Button variant="primary">Execute Trade</Button>

// Trading-specific buttons
<LongButton>BUY</LongButton>
<ShortButton>SELL</ShortButton>
```

### Badges
Status and direction indicators:

```tsx
import { 
  LongBadge, 
  ShortBadge, 
  StrongBadge,
  ProfitBadge 
} from '@/components/ui/badge';

<LongBadge />              {/* Green with up arrow */}
<StrongBadge>STRONG</StrongBadge>  {/* Purple for strong signals */}
<ProfitBadge>+15.2%</ProfitBadge>  {/* Green for profits */}
```

### Progress Indicators
Specialized meters for trading metrics:

```tsx
import { 
  HeatMeter, 
  ConfidenceMeter, 
  RiskGauge 
} from '@/components/ui/progress';

<HeatMeter value={75} />          {/* Portfolio heat */}
<ConfidenceMeter value={87} />    {/* Signal confidence */}
<RiskGauge value={35} />          {/* Risk level */}
```

## 🎨 Typography Scale

### Font Families
- **Sans Serif**: Inter (primary interface font)
- **Monospace**: JetBrains Mono (for numbers, code)
- **Display**: Cal Sans (for headings, marketing)

### Size Scale
```css
font-size: 0.75rem;   /* xs - 12px - small labels */
font-size: 0.875rem;  /* sm - 14px - body text */
font-size: 1rem;      /* base - 16px - default */
font-size: 1.125rem;  /* lg - 18px - emphasis */
font-size: 1.25rem;   /* xl - 20px - headings */
font-size: 1.5rem;    /* 2xl - 24px - large headings */
```

## 🌈 Color Palette

### Primary Palette
```css
--primary-50: #f0f9ff;
--primary-500: #0ea5e9;  /* Main brand color */
--primary-900: #0c4a6e;
```

### Trading Palette
```css
--trading-long: #22c55e;    /* Buy/Long green */
--trading-short: #ef4444;   /* Sell/Short red */
--trading-neutral: #64748b; /* Neutral gray */
--trading-volume: #8b5cf6;  /* Volume purple */
--trading-price: #f59e0b;   /* Price amber */
```

### Performance Palette
```css
--profit: #22c55e;      /* Profit green */
--loss: #ef4444;        /* Loss red */
--breakeven: #64748b;   /* Neutral gray */
```

## 📐 Spacing System

Based on 4px grid for consistent spacing:

```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-4: 1rem;      /* 16px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
```

## 🎭 Animation & Interactions

### Duration Scale
- **Fast**: 150ms - Hover states, small transitions
- **Normal**: 300ms - Standard transitions
- **Slow**: 500ms - Large state changes
- **Slower**: 1000ms - Loading states

### Easing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Special Effects
- **Glow Effects**: For high-importance actions (risk alerts, profits)
- **Pulse Animation**: For pending states and live updates
- **Gradient Backgrounds**: For progress indicators and heat maps

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small desktops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Trading Dashboard Optimizations
- **Mobile**: Single column layout, essential metrics only
- **Tablet**: Two-column layout, condensed charts
- **Desktop**: Multi-column layout, full dashboard
- **Ultrawide**: Extended layout with additional panels

## 🧪 Testing & Quality

### Storybook Documentation
All components are documented in Storybook with:
- **Interactive examples** with live props editing
- **Accessibility testing** with a11y addon
- **Visual regression testing** for consistent rendering
- **Usage guidelines** and best practices

### Accessibility Standards
- **Color contrast**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard navigation**: Full keyboard access
- **Screen readers**: Proper ARIA labels and descriptions
- **Focus management**: Clear focus indicators

### Browser Support
- **Modern browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile browsers**: iOS Safari, Chrome Mobile
- **Performance**: 60fps animations, minimal reflows

## 📋 Usage Guidelines

### Do's
✅ Use semantic component names (LongButton vs red button)
✅ Follow the color system for trading states
✅ Implement proper loading states for real-time data
✅ Use consistent spacing from the design system
✅ Test components with real trading data

### Don'ts
❌ Override component styles directly
❌ Use arbitrary colors outside the design system
❌ Create new components without following patterns
❌ Ignore accessibility requirements
❌ Skip responsive design considerations

## 🔗 Resources

- **[Storybook](http://localhost:6006)** - Interactive component library
- **[Design Tokens](./tokens.md)** - Complete token reference
- **[Component API](./components.md)** - Detailed component documentation
- **[Trading Patterns](./trading-patterns.md)** - Trading-specific UI patterns

---

*The design system is continuously evolving. For questions or contributions, please refer to our component guidelines.*