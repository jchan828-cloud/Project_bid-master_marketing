'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface HoneypotProps extends InputHTMLAttributes<HTMLInputElement> {
  name?: string;
}

export const Honeypot = forwardRef<HTMLInputElement, HoneypotProps>(
  ({ name = 'website_url', ...props }, ref) => {
    return (
      <div
        style={{
          opacity: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          height: 0,
          width: 0,
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <label htmlFor={name}>Leave this field empty</label>
        <input
          {...props}
          ref={ref}
          type="text"
          name={name}
          id={name}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
    );
  }
);

Honeypot.displayName = 'Honeypot';
