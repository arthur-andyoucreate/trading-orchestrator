import type { Meta, StoryObj } from '@storybook/react';
import { TradingViewWidget, TradingViewChart, TradingViewMini, TradingViewFullscreen } from '../components/trading/tradingview-widget';

const meta: Meta<typeof TradingViewWidget> = {
  title: 'Trading/TradingViewWidget',
  component: TradingViewWidget,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'TradingView chart widgets for professional trading interfaces. Supports multiple symbols, timeframes, and customization options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    symbol: {
      control: { type: 'select' },
      options: [
        'BINANCE:BTCUSDT',
        'BINANCE:ETHUSDT', 
        'BINANCE:SOLUSDT',
        'BINANCE:AVAXUSDT',
        'COINBASE:BTCUSD',
        'KRAKEN:BTCUSD'
      ],
      description: 'Trading pair symbol',
    },
    interval: {
      control: { type: 'select' },
      options: ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'],
      description: 'Chart timeframe',
    },
    theme: {
      control: { type: 'select' },
      options: ['light', 'dark'],
      description: 'Chart color theme',
    },
    style: {
      control: { type: 'select' },
      options: ['1', '2', '3', '4', '9'],
      description: 'Chart style (1=Candles, 2=OHLC, 3=Line, 4=Area, 9=Baseline)',
    },
    width: {
      control: { type: 'number' },
      description: 'Chart width in pixels',
    },
    height: {
      control: { type: 'number' },
      description: 'Chart height in pixels',
    },
    autosize: {
      control: { type: 'boolean' },
      description: 'Auto-resize chart to container',
    },
    allow_symbol_change: {
      control: { type: 'boolean' },
      description: 'Allow users to change symbols',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    width: 800,
    height: 600,
    interval: '1H',
    theme: 'dark',
  },
};

export const Bitcoin: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    width: 800,
    height: 500,
    interval: '4H',
    theme: 'dark',
    style: '1',
    allow_symbol_change: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Bitcoin trading chart with 4-hour candles and symbol change enabled.',
      },
    },
  },
};

export const Ethereum: Story = {
  args: {
    symbol: 'BINANCE:ETHUSDT',
    width: 800,
    height: 500,
    interval: '1H',
    theme: 'dark',
    style: '1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Ethereum trading chart with 1-hour timeframe.',
      },
    },
  },
};

export const Solana: Story = {
  args: {
    symbol: 'BINANCE:SOLUSDT',
    width: 800,
    height: 500,
    interval: '15m',
    theme: 'dark',
    style: '1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Solana trading chart with 15-minute timeframe for scalping.',
      },
    },
  },
};

export const LightTheme: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    width: 800,
    height: 500,
    interval: '1H',
    theme: 'light',
    style: '1',
  },
  parameters: {
    backgrounds: {
      default: 'light'
    },
    docs: {
      description: {
        story: 'Light theme chart for bright environments.',
      },
    },
  },
};

export const LineChart: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    width: 800,
    height: 400,
    interval: '1D',
    theme: 'dark',
    style: '3',
  },
  parameters: {
    docs: {
      description: {
        story: 'Line chart style for clean price visualization.',
      },
    },
  },
};

export const AreaChart: Story = {
  args: {
    symbol: 'BINANCE:ETHUSDT',
    width: 800,
    height: 400,
    interval: '1D',
    theme: 'dark',
    style: '4',
  },
  parameters: {
    docs: {
      description: {
        story: 'Area chart style with filled background.',
      },
    },
  },
};

export const AutosizeChart: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    autosize: true,
    interval: '1H',
    theme: 'dark',
    style: '1',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', height: '600px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Auto-sizing chart that fills its container.',
      },
    },
  },
};

export const PreConfiguredChart: Story = {
  render: () => (
    <div style={{ width: '100%', height: '600px' }}>
      <TradingViewChart symbol="BINANCE:BTCUSDT" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-configured chart component with default settings optimized for trading.',
      },
    },
  },
};

export const MiniChart: Story = {
  render: () => (
    <div style={{ width: '400px' }}>
      <TradingViewMini symbol="BINANCE:ETHUSDT" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact mini chart for sidebar or quick reference.',
      },
    },
  },
};

export const FullscreenChart: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh' }}>
      <TradingViewFullscreen symbol="BINANCE:BTCUSDT" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Fullscreen trading chart with all indicators and tools.',
      },
    },
  },
};

export const MultiTimeframe: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: '800px' }}>
      <TradingViewWidget 
        symbol="BINANCE:BTCUSDT" 
        interval="15m" 
        theme="dark" 
        autosize 
      />
      <TradingViewWidget 
        symbol="BINANCE:BTCUSDT" 
        interval="4H" 
        theme="dark" 
        autosize 
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multi-timeframe analysis with 15m and 4H charts side by side.',
      },
    },
  },
};

export const MultiAsset: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '16px', height: '800px' }}>
      <TradingViewWidget symbol="BINANCE:BTCUSDT" interval="1H" theme="dark" autosize />
      <TradingViewWidget symbol="BINANCE:ETHUSDT" interval="1H" theme="dark" autosize />
      <TradingViewWidget symbol="BINANCE:SOLUSDT" interval="1H" theme="dark" autosize />
      <TradingViewWidget symbol="BINANCE:AVAXUSDT" interval="1H" theme="dark" autosize />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multi-asset dashboard with BTC, ETH, SOL, and AVAX charts.',
      },
    },
  },
};

export const ResponsiveMobile: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    width: '100%',
    height: 400,
    interval: '1H',
    theme: 'dark',
    style: '3',
    allow_symbol_change: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    },
    docs: {
      description: {
        story: 'Mobile-optimized chart with simplified interface.',
      },
    },
  },
};

export const ResponsiveTablet: Story = {
  args: {
    symbol: 'BINANCE:BTCUSDT',
    autosize: true,
    interval: '1H',
    theme: 'dark',
    style: '1',
    allow_symbol_change: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', height: '500px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Tablet-optimized chart with balanced features.',
      },
    },
  },
};