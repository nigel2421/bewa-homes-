'use client';

import React, { useState, useCallback } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import ImageCropper from './ImageCropper';

interface ImageUploaderProps {
  ownerId: string;
  onUploadComplete: (urls: string[]) => void;
  existingImages?: string[];
}

export default function ImageUploader({ ownerId, onUploadComplete, existingImages = [] }: ImageUploaderProps) {
  const { user } = useAuth();
  const watermarkText = user?.businessName || 'BEWA Homes';
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Cropping State
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [currentFileToCrop, setCurrentFileToCrop] = useState<string | null>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setPendingFiles(fileArray);
    
    // Start cropping the first one
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCurrentFileToCrop(reader.result as string);
    });
    reader.readAsDataURL(fileArray[0]);
  };

  const finalizeUpload = async (croppedBlob: Blob) => {
    setCurrentFileToCrop(null);
    setUploading(true);
    
    try {
      const fileName = `cropped_${Date.now()}.jpg`;
      const storageRef = ref(storage, `units/${ownerId}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, croppedBlob);

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(p);
          },
          (error) => {
            console.error("Upload error:", error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const updatedImages = [...images, downloadURL];
            setImages(updatedImages);
            onUploadComplete(updatedImages);
            resolve(true);
          }
        );
      });

      // Move to next file if any
      const remaining = pendingFiles.slice(1);
      setPendingFiles(remaining);
      if (remaining.length > 0) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setCurrentFileToCrop(reader.result as string);
        });
        reader.readAsDataURL(remaining[0]);
      } else {
        setUploading(false);
        setProgress(0);
      }
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    const updated = images.filter(img => img !== url);
    setImages(updated);
    onUploadComplete(updated);
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Property Photos (Locked to 4:3)</p>
      
      {currentFileToCrop && (
        <ImageCropper 
          image={currentFileToCrop} 
          onCropComplete={finalizeUpload}
          onCancel={() => {
            setCurrentFileToCrop(null);
            setPendingFiles([]);
          }}
          watermarkText={watermarkText}
        />
      )}

      {/* Image Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        {images.map(url => (
          <div key={url} style={{ position: 'relative', height: '100px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
            <img src={url} alt="Property" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button 
              type="button"
              onClick={() => removeImage(url)}
              style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              ✕
            </button>
          </div>
        ))}
        
        {/* Upload Button Placeholder */}
        <label style={{ 
          height: '100px', border: '2px dashed var(--card-border)', borderRadius: '10px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          cursor: 'pointer', fontSize: '1.5rem', color: 'var(--muted)',
          transition: 'border-color 0.2s',
          background: 'var(--card-bg)',
          ...(uploading ? { opacity: 0.5, pointerEvents: 'none' } : {})
        }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-gold)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--card-border)'}>
          +
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={e => handleFileSelect(e.target.files)} 
          />
        </label>
      </div>

      {uploading && (
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ height: '4px', width: '100%', background: 'var(--background)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary-gold)', borderRadius: '2px', transition: 'width 0.2s' }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Optimizing and uploading ({Math.round(progress)}%)...</p>
        </div>
      )}
    </div>
  );
}
