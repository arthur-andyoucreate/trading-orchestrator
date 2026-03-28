# Storybook Documentation

Storybook provides an interactive playground for exploring and testing Trading Orchestrator's design system components.

## 🚀 Running Storybook

### Development Mode
```bash
npm run storybook
# Opens on http://localhost:6006
```

### Build Static Version
```bash
npm run build-storybook
# Creates storybook-static/ directory
```

### Serve Static Build
```bash
npm run storybook:serve
# Serves the built storybook
```

## 📚 Available Stories

### Foundation Components

#### Buttons
- **Basic variants**: Default, secondary, success, destructive, warning
- **Trading variants**: Long (buy), short (sell), neutral (hold)
- **Sizes**: Small, default, large, extra-large, icon variants
- **States**: Loading, disabled, with icons, glow effects

#### Badges
- **Direction badges**: Long/Short/Neutral with trend icons
- **Signal strength**: Strong/Moderate/Weak confidence levels  
- **Performance**: Profit/Loss/Breakeven with color coding
- **Status**: Active/Inactive/Pending with animations

#### Progress Indicators
- **Trading meters**: Portfolio heat, signal confidence, risk gauges
- **Performance**: Relative performance vs benchmarks
- **Variants**: Different sizes, colors, and glow effects

### Advanced Examples

#### Trading Dashboard
Complete dashboard layouts showing:
- Multiple signal indicators
- Portfolio heat meters
- Risk level gauges
- Performance metrics
- Real-time status indicators

#### Component Combinations
Examples of components working together:
- Signal cards with badges and progress
- Trading buttons with confirmations
- Dashboard widgets with live data

## 🎛️ Interactive Controls

Storybook provides live controls for:
- **Props editing**: Change component properties in real-time
- **State management**: Toggle loading, disabled, error states
- **Variant switching**: Try different component variants
- **Size adjustments**: Test responsive behavior

### Example Controls
```typescript
// Button component controls
variant: 'default' | 'success' | 'long' | 'short'
size: 'sm' | 'default' | 'lg' | 'xl'
loading: boolean
disabled: boolean
glow: boolean
```

## 📖 Documentation Features

### Auto-generated Docs
- **Component API**: Automatically extracted prop types
- **Usage examples**: Code snippets for each story
- **Design guidelines**: Best practices and usage notes

### Interactive Playground
- **Props table**: See all available props and their types
- **Code samples**: Copy-paste ready code examples
- **Live preview**: See changes instantly

### Accessibility Testing
- **a11y addon**: Automated accessibility checks
- **Contrast testing**: Color contrast validation
- **Keyboard navigation**: Tab order and focus testing

## 🧪 Testing with Storybook

### Visual Testing
```typescript
// Example story for visual regression testing
export const TradingDashboard: Story = {
  render: () => (
    <div className="p-6 bg-neutral-900">
      <HeatMeter value={75} />
      <ConfidenceMeter value={87} />
      <div className="flex gap-4 mt-4">
        <LongButton>BUY</LongButton>
        <ShortButton>SELL</ShortButton>
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    },
    backgrounds: {
      default: 'dark'
    }
  }
};
```

### Interaction Testing
```typescript
import { userEvent, within } from '@storybook/test';

export const ButtonInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await userEvent.click(button);
    // Assert expected behavior
  }
};
```

## 📱 Responsive Testing

### Viewport Testing
Storybook includes preset viewports:
- **Mobile**: 320px, 414px
- **Tablet**: 768px
- **Desktop**: 1024px, 1440px
- **Trading**: 1920px (optimal for trading dashboards)

### Testing Different Screens
```typescript
export const ResponsiveDashboard: Story = {
  parameters: {
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' }},
        desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' }}
      }
    }
  }
};
```

## 🎨 Design Tokens in Storybook

### Color Palette
Interactive color swatches showing:
- Primary brand colors
- Trading-specific colors (long/short/neutral)
- Status colors (success/warning/error)
- Performance colors (profit/loss)

### Typography Scale
Live examples of:
- Font families and weights
- Size scale with pixel values
- Line height variations
- Use case examples

### Spacing System
Visual grid showing:
- Spacing scale (4px base grid)
- Common spacing patterns
- Layout examples

## 🔧 Configuration

### Storybook Configuration
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  }
};
```

### Theme Configuration
```typescript
// .storybook/preview.ts
import { themes } from '@storybook/theming';

export default {
  parameters: {
    docs: {
      theme: themes.dark,
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
        { name: 'trading-dark', value: '#1e293b' }
      ]
    }
  }
};
```

## 📝 Writing Stories

### Basic Story Structure
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/ui/button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'long', 'short']
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button'
  }
};
```

### Trading-Specific Stories
```typescript
export const TradingActions: Story = {
  render: () => (
    <div className="flex gap-4">
      <LongButton>BUY BTC</LongButton>
      <ShortButton>SELL BTC</ShortButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Trading action buttons with proper color coding and glow effects.'
      }
    }
  }
};
```

## 🚀 Best Practices

### Story Organization
- **Group by component type**: Foundation, Trading, Layout
- **Use descriptive names**: TradingDashboard vs Example
- **Include edge cases**: Loading states, error states, empty data

### Documentation
- **Add descriptions**: Explain component purpose and usage
- **Show real-world examples**: Use actual trading scenarios
- **Include accessibility notes**: Document keyboard navigation

### Testing
- **Cover all variants**: Test every component variant
- **Test interactions**: Button clicks, form submissions
- **Responsive testing**: Mobile, tablet, desktop views

## 🔗 Integration

### With Design System
Storybook serves as the single source of truth for:
- Component behavior and appearance
- Design token usage examples
- Accessibility compliance verification

### With Documentation
- Stories are embedded in GitBook documentation
- Component API docs are auto-generated
- Usage examples are kept in sync

---

*Storybook provides a comprehensive view of the Trading Orchestrator design system, enabling consistent and accessible component development.*