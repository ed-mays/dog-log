import React, { useState } from 'react';
import { useFeatureFlagsContext } from '../hooks/useFeatureFlagsContext';
import type { FeatureFlag } from '../types';

export const FeatureFlagsDevTool: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { flags, overrides, setOverride, resetOverrides } =
    useFeatureFlagsContext();

  // Sort flags alphabetically
  const flagKeys = Object.keys(flags).sort() as FeatureFlag[];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 9999,
          padding: '8px 12px',
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          fontSize: '12px',
        }}
        aria-label="Open Feature Flags DevTools"
      >
        🚩 Flags
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        width: '300px',
        maxHeight: '80vh',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
        fontSize: '14px',
      }}
    >
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          Feature Flags
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0 4px',
          }}
          aria-label="Close Feature Flags DevTools"
        >
          ×
        </button>
      </div>

      <div style={{ overflowY: 'auto', padding: '12px', flex: 1 }}>
        {flagKeys.map((key) => {
          const isOverridden = overrides[key] !== undefined;
          const value = flags[key];

          return (
            <div
              key={key}
              style={{
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontWeight: 500 }}>{key}</span>
                <span
                  style={{
                    fontSize: '12px',
                    color: value ? 'green' : 'red',
                    fontWeight: 'bold',
                  }}
                >
                  {value ? 'ON' : 'OFF'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name={`flag-${key}`}
                    aria-label={`${key} Default`}
                    checked={!isOverridden}
                    onChange={() => setOverride(key, undefined)}
                  />
                  <span style={{ marginLeft: '4px' }}>Default</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name={`flag-${key}`}
                    aria-label={`${key} True`}
                    checked={isOverridden && overrides[key] === true}
                    onChange={() => setOverride(key, true)}
                  />
                  <span style={{ marginLeft: '4px' }}>True</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name={`flag-${key}`}
                    aria-label={`${key} False`}
                    checked={isOverridden && overrides[key] === false}
                    onChange={() => setOverride(key, false)}
                  />
                  <span style={{ marginLeft: '4px' }}>False</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: '12px',
          borderTop: '1px solid #eee',
          backgroundColor: '#f8f9fa',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={resetOverrides}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Reset All Overrides
        </button>
      </div>
    </div>
  );
};
