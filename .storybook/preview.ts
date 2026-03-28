import type { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      theme: themes.dark,
      source: {
        state: 'open',
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark', 
          value: '#0f172a',
        },
        {
          name: 'trading-dark',
          value: '#1e293b',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile1: {
          name: 'Small mobile',
          styles: { width: '320px', height: '568px' },
        },
        mobile2: {
          name: 'Large mobile',
          styles: { width: '414px', height: '896px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1024px', height: '768px' },
        },
        ultrawide: {
          name: 'Ultrawide',
          styles: { width: '1440px', height: '900px' },
        },
        trading: {
          name: 'Trading Dashboard',
          styles: { width: '1920px', height: '1080px' },
        },
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;