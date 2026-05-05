export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the rotated size of the image.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * This function was adapted from the one in the react-easy-crop project
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  watermarkText?: string
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - resizing to 1200x900 for consistent quality
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(data, 0, 0);

  // Resizing to standard dimensions for consistency (Method 3)
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = 1200;
  finalCanvas.height = 900;
  const finalCtx = finalCanvas.getContext('2d');
  if (finalCtx) {
    finalCtx.drawImage(canvas, 0, 0, 1200, 900);
    
    if (watermarkText) {
      finalCtx.font = 'bold 32px Arial, sans-serif';
      finalCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      finalCtx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      finalCtx.shadowBlur = 4;
      finalCtx.shadowOffsetX = 1;
      finalCtx.shadowOffsetY = 1;

      // Center
      finalCtx.textAlign = 'center';
      finalCtx.textBaseline = 'middle';
      finalCtx.fillText(watermarkText, 600, 450);

      // Top Left
      finalCtx.textAlign = 'left';
      finalCtx.textBaseline = 'top';
      finalCtx.fillText(watermarkText, 30, 30);

      // Top Right
      finalCtx.textAlign = 'right';
      finalCtx.fillText(watermarkText, 1170, 30);

      // Bottom Left
      finalCtx.textAlign = 'left';
      finalCtx.textBaseline = 'bottom';
      finalCtx.fillText(watermarkText, 30, 870);

      // Bottom Right
      finalCtx.textAlign = 'right';
      finalCtx.fillText(watermarkText, 1170, 870);
    }
  }

  // As a blob
  return new Promise((resolve) => {
    finalCanvas.toBlob((file) => {
      resolve(file);
    }, 'image/jpeg', 0.9);
  });
}
