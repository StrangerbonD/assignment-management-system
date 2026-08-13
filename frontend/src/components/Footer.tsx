'use client';

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      background: '#ffffff',
      borderTop: '2px solid #e2e8f0',
      marginTop: '4rem',
      padding: '1.5rem 1rem',
      textAlign: 'center',
      fontSize: '0.875rem',
      color: '#006633',
      fontWeight: 600
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        © 2026 Copyright: StrangerBond All rights reserved.
      </div>
    </footer>
  );
};
