'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/imageUtils';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  watermarkText?: string;
}

export default function ImageCropper({ image, onCropComplete, onCancel, watermarkText }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels, 0, { horizontal: false, vertical: false }, watermarkText);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 10000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: '90%', maxWidth: '600px', height: '500px',
        position: 'relative', background: '#000', borderRadius: '20px', overflow: 'hidden'
      }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
        />
      </div>

      <div style={{
        marginTop: '2rem', display: 'flex', gap: '1rem', width: '90%', maxWidth: '600px',
        background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '15px',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Zoom:</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary-gold)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, padding: '1rem', borderRadius: '10px',
              border: '1px solid var(--card-border)', background: 'transparent',
              color: 'var(--foreground)', fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="premium-button"
            style={{ flex: 2, padding: '1rem' }}
          >
            Crop & Upload
          </button>
        </div>
      </div>
      
      <p style={{ marginTop: '1.5rem', color: '#fff', fontSize: '0.9rem', opacity: 0.7 }}>
        Drag to position. Use slider to zoom.
      </p>
    </div>
  );
}
