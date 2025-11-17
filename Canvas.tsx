
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import type { CanvasProps, CanvasRef } from '../types';

const CanvasComponent: React.ForwardRefRenderFunction<CanvasRef, CanvasProps> = (
  { color, lineWidth },
  ref
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawing = useRef(false);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // For HiDPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.scale(dpr, dpr);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);
  
  const getCoords = (event: MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if (event instanceof MouseEvent) {
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    } else if (event.touches && event.touches.length > 0) {
      return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (event: MouseEvent | TouchEvent) => {
    if (!contextRef.current) return;
    const { x, y } = getCoords(event);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    isDrawing.current = true;
    event.preventDefault();
  };

  const draw = (event: MouseEvent | TouchEvent) => {
    if (!isDrawing.current || !contextRef.current) return;
    const { x, y } = getCoords(event);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    setIsCanvasEmpty(false);
    event.preventDefault();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    isDrawing.current = false;
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);

      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
      canvas.removeEventListener('touchcancel', stopDrawing);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (canvas && context) {
        // We need to account for the DPR scaling when clearing
        const dpr = window.devicePixelRatio || 1;
        context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        setIsCanvasEmpty(true);
      }
    },
    getCanvasData: () => {
        if (isCanvasEmpty || !canvasRef.current) return null;
        const canvas = canvasRef.current;

        const MAX_DIMENSION = 1024;
        let { width, height } = canvas;
        
        const dpr = window.devicePixelRatio || 1;
        width /= dpr;
        height /= dpr;

        let targetWidth = width;
        let targetHeight = height;

        if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
            if (targetWidth > targetHeight) {
                targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
                targetWidth = MAX_DIMENSION;
            } else {
                targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
                targetHeight = MAX_DIMENSION;
            }
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if(!tempCtx) return null;

        tempCtx.fillStyle = '#000000';
        tempCtx.fillRect(0, 0, targetWidth, targetHeight);
        
        tempCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

        return tempCanvas.toDataURL('image/png');
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full aspect-square md:aspect-auto md:h-[500px] bg-black rounded-md cursor-crosshair touch-none"
    />
  );
};

export const Canvas = forwardRef(CanvasComponent);
