import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { TrendingUp, TrendingDown, Settings, Play, Pause } from 'lucide-react';

import { Button, LongButton, ShortButton, NeutralButton } from '../components/ui/button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and trading-specific styles.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'success', 'warning', 'outline', 'secondary', 'ghost', 'link', 'long', 'short', 'neutral'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'],
      description: 'The size of the button',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Shows loading spinner and disables the button',
    },
    glow: {
      control: { type: 'boolean' },
      description: 'Adds a glowing border effect',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the button',
    },
  },
  args: { onClick: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
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
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
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

// Icon variants
export const Icon: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
    children: <Settings className="h-4 w-4" />,
  },
};

export const IconSmall: Story = {
  args: {
    variant: 'secondary',
    size: 'icon-sm', 
    children: <Play className="h-3 w-3" />,
  },
};

export const IconLarge: Story = {
  args: {
    variant: 'default',
    size: 'icon-lg',
    children: <Pause className="h-5 w-5" />,
  },
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    children: 'Download',
    leftIcon: <TrendingDown className="h-4 w-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Next',
    rightIcon: <TrendingUp className="h-4 w-4" />,
  },
};

// Loading states
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

export const LoadingWithCustomText: Story = {
  args: {
    loading: true,
    loadingText: 'Processing...',
    children: 'Submit',
  },
};

// Special effects
export const Glow: Story = {
  args: {
    glow: true,
    children: 'Glow Effect',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

// Trading specific variants
export const Long: Story = {
  args: {
    variant: 'long',
    children: 'BUY / LONG',
    leftIcon: <TrendingUp className="h-4 w-4" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'A button variant specifically designed for long/buy trading actions with green styling and glow effect.',
      },
    },
  },
};

export const Short: Story = {
  args: {
    variant: 'short',
    children: 'SELL / SHORT',
    leftIcon: <TrendingDown className="h-4 w-4" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'A button variant specifically designed for short/sell trading actions with red styling and glow effect.',
      },
    },
  },
};

export const TradingNeutral: Story = {
  args: {
    variant: 'neutral',
    children: 'HOLD',
  },
  parameters: {
    docs: {
      description: {
        story: 'A neutral trading button for hold positions or neutral actions.',
      },
    },
  },
};

// Trading button group story
export const TradingButtons: Story = {
  render: () => (
    <div className="flex gap-4">
      <LongButton>BUY</LongButton>
      <NeutralButton>HOLD</NeutralButton>
      <ShortButton>SELL</ShortButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-configured trading action buttons for buy, hold, and sell operations.',
      },
    },
  },
};