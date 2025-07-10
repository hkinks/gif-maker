import React from 'react';
import type { VideoConfig } from '../types';

interface TextOverlayProps {
  config: VideoConfig;
  onChange: (config: Partial<VideoConfig>) => void;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({ config, onChange }) => {
  const previewText = config.overlayText || 'Preview Text';

  return (
    <div className="text-overlay">
      <h3>Text Overlay</h3>
      
      <div className="text-controls">
        <div className="control-group">
          <label htmlFor="overlay-text">Text:</label>
          <input
            id="overlay-text"
            type="text"
            value={config.overlayText}
            onChange={(e) => onChange({ overlayText: e.target.value })}
            placeholder="Enter text for overlay"
          />
        </div>
        
        <div className="control-group">
          <label htmlFor="text-position">Position:</label>
          <select
            id="text-position"
            value={config.textPosition}
            onChange={(e) => onChange({ textPosition: e.target.value as 'top' | 'bottom' })}
          >
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="text-color">Color:</label>
          <input
            id="text-color"
            type="color"
            value={config.textColor}
            onChange={(e) => onChange({ textColor: e.target.value })}
          />
        </div>
        
        <div className="control-group">
          <label htmlFor="text-font">Font:</label>
          <select
            id="text-font"
            value={config.textFont}
            onChange={(e) => onChange({ textFont: e.target.value })}
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Impact">Impact</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="text-size">Size: {config.textSize}px</label>
          <input
            id="text-size"
            type="range"
            min="12"
            max="48"
            value={config.textSize}
            onChange={(e) => onChange({ textSize: parseInt(e.target.value) })}
          />
        </div>
      </div>
      
      <div className="text-preview">
        <div className="preview-container">
          <div
            className="text-preview-display"
            style={{
              color: config.textColor,
              fontFamily: config.textFont,
              fontSize: `${config.textSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              textAlign: 'center',
              padding: '20px',
              background: '#2c3e50',
              borderRadius: '5px',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {previewText}
          </div>
        </div>
      </div>
    </div>
  );
};