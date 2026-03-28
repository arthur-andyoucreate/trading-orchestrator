import type { Meta, StoryObj } from '@storybook/react';
import { 
  Badge,
  LongBadge,
  ShortBadge,
  NeutralBadge,
  StrongBadge,
  ModerateBadge,
  WeakBadge,
  ProfitBadge,
  LossBadge,
  BreakevenBadge,
  ActiveBadge,
  InactiveBadge,
  PendingBadge
} from '../components/ui/badge';
import { Star, AlertTriangle, CheckCircle } from 'lucide-react';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Status indicators, labels, and trading direction badges with various styles and states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'default', 'secondary', 'destructive', 'success', 'warning', 'outline',
        'long', 'short', 'neutral', 'strong', 'moderate', 'weak',
        'active', 'inactive', 'pending', 'error', 'profit', 'loss', 'breakeven'
      ],
      description: 'The visual style variant of the badge',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'xl'],
      description: 'The size of the badge',
    },
    animated: {
      control: { type: 'boolean' },
      description: 'Adds pulsing animation',
    },
    pulse: {
      control: { type: 'boolean' },
      description: 'Alias for animated property',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Error',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

// Size variations
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    children: 'Extra Large',
  },
};

// With icons
export const WithIcon: Story = {
  args: {
    variant: 'warning',
    icon: <AlertTriangle className="h-3 w-3" />,
    children: 'Warning',
  },
};

export const WithCustomIcon: Story = {
  args: {
    variant: 'success',
    icon: <CheckCircle className="h-3 w-3" />,
    children: 'Verified',
  },
};

// Animated
export const Animated: Story = {
  args: {
    variant: 'pending',
    animated: true,
    children: 'Loading...',
  },
};

export const Pulse: Story = {
  args: {
    variant: 'warning',
    pulse: true,
    children: 'Alert',
  },
};

// Trading Direction Badges
export const TradingDirections: Story = {
  render: () => (
    <div className="flex gap-4">
      <LongBadge />
      <NeutralBadge />
      <ShortBadge />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-configured badges for trading directions with appropriate icons and colors.',
      },
    },
  },
};

export const Long: Story = {
  render: () => <LongBadge />,
  parameters: {
    docs: {
      description: {
        story: 'Badge for long/buy positions with green color and trending up icon.',
      },
    },
  },
};

export const Short: Story = {
  render: () => <ShortBadge />,
  parameters: {
    docs: {
      description: {
        story: 'Badge for short/sell positions with red color and trending down icon.',
      },
    },
  },
};

export const TradingNeutral: Story = {
  render: () => <NeutralBadge />,
  parameters: {
    docs: {
      description: {
        story: 'Badge for neutral/hold positions with gray color and neutral icon.',
      },
    },
  },
};

// Signal Strength Badges
export const SignalStrength: Story = {
  render: () => (
    <div className="flex gap-4">
      <WeakBadge />
      <ModerateBadge />
      <StrongBadge />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Signal strength indicators for trading signals and confidence levels.',
      },
    },
  },
};

export const Strong: Story = {
  render: () => <StrongBadge />,
};

export const Moderate: Story = {
  render: () => <ModerateBadge />,
};

export const Weak: Story = {
  render: () => <WeakBadge />,
};

// Performance Badges
export const Performance: Story = {
  render: () => (
    <div className="flex gap-4">
      <LossBadge>-12.5%</LossBadge>
      <BreakevenBadge>±0.0%</BreakevenBadge>
      <ProfitBadge>+24.8%</ProfitBadge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Performance badges for displaying profit/loss with appropriate color coding.',
      },
    },
  },
};

export const Profit: Story = {
  render: () => <ProfitBadge>+15.2%</ProfitBadge>,
};

export const Loss: Story = {
  render: () => <LossBadge>-8.7%</LossBadge>,
};

export const Breakeven: Story = {
  render: () => <BreakevenBadge>±0.0%</BreakevenBadge>,
};

// Status Badges
export const Status: Story = {
  render: () => (
    <div className="flex gap-4">
      <ActiveBadge />
      <PendingBadge />
      <InactiveBadge />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Status badges for system states, with pending badge having pulse animation.',
      },
    },
  },
};

export const Active: Story = {
  render: () => <ActiveBadge />,
};

export const Inactive: Story = {
  render: () => <InactiveBadge />,
};

export const Pending: Story = {
  render: () => <PendingBadge />,
};

// Complex example
export const TradingDashboard: Story = {
  render: () => (
    <div className="space-y-4 p-6 bg-neutral-900 text-white rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">BTC/USD Position</h3>
        <ActiveBadge />
      </div>
      
      <div className="flex items-center gap-4">
        <LongBadge size="lg" />
        <StrongBadge />
        <ProfitBadge size="lg">+18.5%</ProfitBadge>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" size="sm">AI Signal</Badge>
        <Badge variant="secondary" size="sm">Risk: Low</Badge>
        <Badge variant="info" size="sm" icon={<Star className="h-3 w-3" />}>
          Confidence: 87%
        </Badge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A complete trading dashboard example showing how badges work together to convey position status.',
      },
    },
  },
};