import type { Meta, StoryObj } from '@storybook/react';
import { Progress, HeatMeter, ConfidenceMeter, RiskGauge, PerformanceMeter } from '../components/ui/progress';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Progress indicators for portfolio heat, confidence levels, risk gauges, and performance metrics.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Current progress value',
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum value for the progress',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'danger', 'info', 'heat', 'confidence', 'risk', 'performance'],
      description: 'The visual style variant of the progress bar',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'xl'],
      description: 'The size of the progress bar',
    },
    showValue: {
      control: { type: 'boolean' },
      description: 'Show the numeric value',
    },
    showPercentage: {
      control: { type: 'boolean' },
      description: 'Show the percentage value',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text for the progress bar',
    },
    glow: {
      control: { type: 'boolean' },
      description: 'Add glow effect based on value',
    },
    animated: {
      control: { type: 'boolean' },
      description: 'Animate progress changes',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60,
    label: 'Progress',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    value: 75,
    label: 'Success Progress',
    showPercentage: true,
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    value: 85,
    label: 'Warning Level',
    showPercentage: true,
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    value: 95,
    label: 'Danger Zone',
    showPercentage: true,
    glow: true,
  },
};

// Size variations
export const Small: Story = {
  args: {
    size: 'sm',
    value: 45,
    label: 'Small Progress',
    showPercentage: true,
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    value: 70,
    label: 'Large Progress',
    showPercentage: true,
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    value: 80,
    label: 'Extra Large Progress',
    showPercentage: true,
  },
};

// With various display options
export const WithValue: Story = {
  args: {
    value: 750,
    max: 1000,
    showValue: true,
    label: 'Current Value',
  },
};

export const WithPercentage: Story = {
  args: {
    value: 65,
    showPercentage: true,
    label: 'Completion',
  },
};

export const WithBoth: Story = {
  args: {
    value: 1250,
    max: 2000,
    showValue: true,
    showPercentage: true,
    label: 'Revenue Target',
  },
};

export const WithGlow: Story = {
  args: {
    value: 90,
    glow: true,
    label: 'High Performance',
    showPercentage: true,
  },
};

// Trading specific progress bars
export const PortfolioHeat: Story = {
  render: () => <HeatMeter value={75} />,
  parameters: {
    docs: {
      description: {
        story: 'Portfolio heat meter showing current portfolio exposure as a percentage. Uses gradient colors from green (safe) to red (high risk).',
      },
    },
  },
};

export const SignalConfidence: Story = {
  render: () => <ConfidenceMeter value={87} />,
  parameters: {
    docs: {
      description: {
        story: 'Signal confidence meter displaying AI model confidence in trading signals.',
      },
    },
  },
};

export const RiskLevel: Story = {
  render: () => <RiskGauge value={35} />,
  parameters: {
    docs: {
      description: {
        story: 'Risk gauge showing current portfolio risk level with glow effect for high values.',
      },
    },
  },
};

export const Performance: Story = {
  render: () => <PerformanceMeter value={125} />,
  parameters: {
    docs: {
      description: {
        story: 'Performance meter showing portfolio returns relative to benchmark (100 = benchmark performance).',
      },
    },
  },
};

// Trading dashboard example
export const TradingDashboard: Story = {
  render: () => (
    <div className="space-y-6 p-6 bg-neutral-900 text-white rounded-lg w-96">
      <h3 className="text-lg font-semibold mb-4">Portfolio Metrics</h3>
      
      <HeatMeter value={65} />
      <ConfidenceMeter value={92} />
      <RiskGauge value={28} />
      <PerformanceMeter value={118} />
      
      <div className="mt-6 p-4 bg-neutral-800 rounded">
        <h4 className="text-sm font-medium mb-2">System Health</h4>
        <Progress 
          value={98} 
          variant="success"
          size="sm"
          label="API Uptime"
          showPercentage
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete trading dashboard showing all progress meter types in context.',
      },
    },
  },
};

// Animation states
export const LowValue: Story = {
  args: {
    variant: 'heat',
    value: 15,
    label: 'Low Heat',
    showPercentage: true,
    glow: true,
  },
};

export const MediumValue: Story = {
  args: {
    variant: 'heat',
    value: 55,
    label: 'Medium Heat',
    showPercentage: true,
    glow: true,
  },
};

export const HighValue: Story = {
  args: {
    variant: 'heat',
    value: 85,
    label: 'High Heat',
    showPercentage: true,
    glow: true,
  },
};

export const CriticalValue: Story = {
  args: {
    variant: 'heat',
    value: 95,
    label: 'Critical Heat',
    showPercentage: true,
    glow: true,
  },
};

// Custom formatting
export const CustomFormat: Story = {
  args: {
    value: 1250000,
    max: 2000000,
    label: 'Assets Under Management',
    showValue: true,
    showPercentage: true,
    formatValue: (value: number) => `$${(value / 1000000).toFixed(1)}M`,
  },
};