import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  define: {
    // Expo / React Native の __DEV__ フラグをテスト時に再現する
    __DEV__: 'true',
  },
  test: {
    environment: 'node',
    // lib のストリーク計算など純粋関数のみを対象にする（RN ランタイムを引かない）
    include: ['tests/**/*.test.ts'],
    server: { deps: { inline: [] } },
  },
});
