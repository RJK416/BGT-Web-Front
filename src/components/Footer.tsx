'use client';

import { tavernPalette } from '@/styles/tavernTheme';

export default function Footer() {
  return (
    <footer
      className="w-full mt-auto py-6 px-4"
      style={{
        background: tavernPalette.panelGradient,
        borderTop: `2px solid ${tavernPalette.border}`,
        boxShadow: `0 -2px 8px ${tavernPalette.shadow}`,
      }}
    >
      <div className="max-w-7xl mx-auto text-center">
        <div
          className="text-sm"
          style={{
            color: tavernPalette.ash,
          }}
        >
          <p className="mb-1">Created by Gega Oragvelidze</p>
          <p>
            Email:{' '}
            <a
              href="mailto:Gegaoragvelidze97@gmail.com"
              className="transition-colors duration-200 hover:underline"
              style={{
                color: tavernPalette.gold,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = tavernPalette.goldLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = tavernPalette.gold;
              }}
            >
              Gegaoragvelidze97@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

