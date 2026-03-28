import type { Meta, StoryObj } from '@storybook/react';
import TradingInterface from '../components/trading/trading-interface';

const meta: Meta<typeof TradingInterface> = {
  title: 'Trading/TradingInterface',
  component: TradingInterface,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'desktop'
    },
    docs: {
      description: {
        component: 'Complete trading interface with TradingView charts, position management, and AI signals.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    symbol: {
      control: { type: 'select' },
      options: ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:SOLUSDT', 'HYPERLIQUID:BTCUSD'],
      description: 'Trading pair symbol for the main chart',
    },
    showMiniChart: {
      control: { type: 'boolean' },
      description: 'Show mini chart in sidebar',
    },
    showPositions: {
      control: { type: 'boolean' },
      description: 'Show current positions panel',
    },
    showSignals: {
      control: { type: 'boolean' },
      description: 'Show AI signals panel',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    showMiniChart: true,
    showPositions: true,
    showSignals: true,
  },
};

export const BTCFocus: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    showMiniChart: false,
    showPositions: true,
    showSignals: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'BTC-focused trading interface without mini chart for maximum chart space.',
      },
    },
  },
};

export const ETHTrading: Story = {
  args: {
    symbol: 'BINANCE:ETHUSDT',
    showMiniChart: true,
    showPositions: true,
    showSignals: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'ETH trading interface with full feature set.',
      },
    },
  },
};

export const SOLTrading: Story = {
  args: {
    symbol: 'BINANCE:SOLUSDT',
    showMiniChart: true,
    showPositions: true,
    showSignals: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'SOL trading interface showing altcoin trading capabilities.',
      },
    },
  },
};

export const MinimalView: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    showMiniChart: false,
    showPositions: false,
    showSignals: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal trading view with just the main chart and trading controls.',
      },
    },
  },
};

export const AnalysisMode: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    showMiniChart: true,
    showPositions: false,
    showSignals: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Analysis mode focusing on AI signals without position distractions.',
      },
    },
  },
};

export const PortfolioMode: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    showMiniChart: true,
    showPositions: true,
    showSignals: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Portfolio management mode focusing on current positions.',
      },
    },
  },
};

export const HyperliquidMode: Story = {
  args: {
    symbol: 'HYPERLIQUID:BTCUSD',
    showMiniChart: true,
    showPositions: true,
    showSignals: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Hyperliquid native trading interface with perpetual futures.',
      },
    },
  },
};

export const MobileView: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    showMiniChart: false,
    showPositions: true,
    showSignals: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    },
    docs: {
      description: {
        story: 'Mobile-optimized trading interface with essential features.',
      },
    },
  },
};

export const TabletView: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    showMiniChart: true,
    showPositions: true,
    showSignals: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Tablet-optimized trading interface with adaptive layout.',
      },
    },
  },
};

export const UltrawideView: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    showMiniChart: true,
    showPositions: true,
    showSignals: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'ultrawide'
    },
    docs: {
      description: {
        story: 'Ultrawide display optimized for professional traders with maximum screen real estate.',
      },
    },
  },
};