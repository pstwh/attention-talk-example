import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { AttentionWeight, Token } from '../types';

interface VisualizationCanvasProps {
  tokens: Token[];
  weights: AttentionWeight[];
  activeTokenIndex: number | null;
  hoveredTokenIndex: number | null;
  isCrossAttention?: boolean;
  targetTokens?: Token[]; // For cross attention
  width: number;
  height: number;
}

const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({
  tokens,
  weights,
  activeTokenIndex,
  hoveredTokenIndex,
  isCrossAttention = false,
  targetTokens = [],
  width,
  height
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [resizeTrigger, setResizeTrigger] = useState(0);

  useEffect(() => {
      const handleResize = () => setResizeTrigger(prev => prev + 1);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        draw();
    }, 50);
    return () => clearTimeout(timer);
  }, [tokens, weights, activeTokenIndex, hoveredTokenIndex, isCrossAttention, targetTokens, width, height, resizeTrigger]);

  const draw = () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const tokenElements = document.querySelectorAll(`[data-token-id]`);
    const positions: Map<string, { x: number, y: number, width: number }> = new Map();

    const svgRect = svgRef.current.getBoundingClientRect();

    tokenElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const id = el.getAttribute('data-token-id');
      if (id) {
        positions.set(id, {
          x: rect.left - svgRect.left + rect.width / 2,
          y: rect.top - svgRect.top + (isCrossAttention ? (el.getAttribute('data-layer') === 'source' ? rect.height : 0) : rect.height / 2),
          width: rect.width
        });
      }
    });
    
    const relevantWeights = weights.filter(w => {
        if (hoveredTokenIndex === null && activeTokenIndex === null) return false;
        const index = hoveredTokenIndex !== null ? hoveredTokenIndex : activeTokenIndex;
        return w.sourceIndex === index;
    });

    relevantWeights.forEach(w => {
        if (w.weight < 0.05) return;

        let sourceId, targetId;
        
        if (isCrossAttention) {
             sourceId = `target-${w.sourceIndex}`;
             targetId = `source-${w.targetIndex}`;
        } else {
             sourceId = `token-${w.sourceIndex}`;
             targetId = `token-${w.targetIndex}`;
        }

        const sourcePos = positions.get(sourceId);
        const targetPos = positions.get(targetId);

        if (sourcePos && targetPos) {
            const link = d3.linkVertical<any, { x: number, y: number }>()
                .x((d) => d.x)
                .y((d) => d.y);

            const pathData = isCrossAttention 
                ? link({ source: sourcePos, target: targetPos }) 
                : (() => {
                    const midX = (sourcePos.x + targetPos.x) / 2;
                    const dist = Math.abs(sourcePos.x - targetPos.x);
                    const arcHeight = Math.min(dist * 0.7, 150); 
                    const midY = sourcePos.y - arcHeight - 20; 
                    
                    if (sourcePos.x === targetPos.x) {
                         return `M${sourcePos.x},${sourcePos.y - 15} C${sourcePos.x - 20},${sourcePos.y - 60} ${sourcePos.x + 20},${sourcePos.y - 60} ${sourcePos.x},${sourcePos.y - 15}`;
                    }

                    return `M${sourcePos.x},${sourcePos.y - 15} Q${midX},${midY} ${targetPos.x},${targetPos.y - 15}`;
                })();
            
            // Updated Colors for Light Theme
            const strokeColor = isCrossAttention 
                ? "#2563eb" // Blue-600 (Stronger Blue)
                : "#db2777"; // Pink-600 (Stronger Pink)

            svg.append("path")
                .attr("d", pathData || "")
                .attr("fill", "none")
                .attr("stroke", strokeColor) 
                .attr("stroke-width", Math.max(1.5, w.weight * 6)) // Slightly thicker default
                .attr("stroke-opacity", w.weight * 0.8)
                .attr("stroke-linecap", "round")
                .style("pointer-events", "none")
                .attr("stroke-dasharray", function() { return this.getTotalLength() + " " + this.getTotalLength(); })
                .attr("stroke-dashoffset", function() { return this.getTotalLength(); })
                .transition()
                .duration(400)
                .ease(d3.easeCubicOut)
                .attr("stroke-dashoffset", 0);
        }
    });
  };

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-10"
    />
  );
};

export default VisualizationCanvas;