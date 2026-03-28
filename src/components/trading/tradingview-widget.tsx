/**
 * TradingView Widget Component
 * Professional trading charts integration
 */

'use client';

import React, { useEffect, useRef, memo } from 'react';
import { Card } from '@/components/ui/card';

export interface TradingViewWidgetProps {
  symbol?: string;
  width?: string | number;
  height?: string | number;
  interval?: string;
  theme?: 'light' | 'dark';
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  save_image?: boolean;
  container_id?: string;
  show_popup_button?: boolean;
  popup_width?: string;
  popup_height?: string;
  studies?: string[];
  autosize?: boolean;
  className?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = memo(({
  symbol = 'BINANCE:BTCUSDT',
  width = '100%',
  height = 600,
  interval = '1H',
  theme = 'dark',
  style = '1',
  locale = 'en',
  toolbar_bg = '#f1f3f6',
  enable_publishing = false,
  allow_symbol_change = true,
  save_image = true,
  container_id,
  show_popup_button = false,
  popup_width = '1000',
  popup_height = '650',
  studies = [],
  autosize = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    const loadScript = () => {
      if (scriptLoadedRef.current) return;

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        initWidget();
      };
      document.head.appendChild(script);
    };

    const initWidget = () => {
      if (!window.TradingView || !containerRef.current) return;

      const widgetOptions = {
        width: autosize ? undefined : width,
        height: autosize ? undefined : height,
        symbol,
        interval,
        timezone: 'Etc/UTC',
        theme,
        style,
        locale,
        toolbar_bg,
        enable_publishing,
        allow_symbol_change,
        save_image,
        container_id: container_id || containerRef.current.id,
        show_popup_button,
        popup_width,
        popup_height,
        studies,
        autosize,
        ...(autosize && { width: '100%', height: '100%' }),
      };

      new window.TradingView.widget(widgetOptions);
    };

    if (window.TradingView) {
      initWidget();
    } else {
      loadScript();
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [
    symbol, width, height, interval, theme, style, locale, toolbar_bg,
    enable_publishing, allow_symbol_change, save_image, container_id,
    show_popup_button, popup_width, popup_height, studies, autosize
  ]);

  const containerId = container_id || `tradingview_${Math.random().toString(36).substring(7)}`;

  return (
    <div className={`tradingview-widget-container ${className}`}>
      <div
        ref={containerRef}
        id={containerId}
        style={{
          width: autosize ? '100%' : width,
          height: autosize ? '100%' : height,
        }}
      />
    </div>
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';

// Pre-configured widget variants
export const TradingViewChart = memo(({ symbol, className, ...props }: TradingViewWidgetProps) => (
  <Card className={`p-0 overflow-hidden ${className || ''}`}>
    <TradingViewWidget
      symbol={symbol}
      theme="dark"
      autosize
      allow_symbol_change={true}
      studies={['MASimple@tv-basicstudies', 'RSI@tv-basicstudies']}
      {...props}
    />
  </Card>
));

export const TradingViewMini = memo(({ symbol, ...props }: TradingViewWidgetProps) => (
  <TradingViewWidget
    symbol={symbol}
    width="100%"
    height={300}
    theme="dark"
    style="3"
    interval="1H"
    allow_symbol_change={false}
    toolbar_bg="#1e293b"
    {...props}
  />
));

export const TradingViewFullscreen = memo(({ symbol, ...props }: TradingViewWidgetProps) => (
  <TradingViewWidget
    symbol={symbol}
    autosize
    theme="dark"
    interval="15m"
    allow_symbol_change={true}
    save_image={true}
    studies={[
      'MASimple@tv-basicstudies',
      'RSI@tv-basicstudies',
      'MACD@tv-basicstudies',
      'Volume@tv-basicstudies'
    ]}
    {...props}
  />
));

TradingViewChart.displayName = 'TradingViewChart';
TradingViewMini.displayName = 'TradingViewMini';
TradingViewFullscreen.displayName = 'TradingViewFullscreen';

export { TradingViewWidget };
export default TradingViewWidget;