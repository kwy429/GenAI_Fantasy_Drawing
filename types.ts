
export interface CanvasProps {
  color: string;
  lineWidth: number;
}

export interface CanvasRef {
  clearCanvas: () => void;
  getCanvasData: () => string | null;
}
