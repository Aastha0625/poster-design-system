
"use client";

import React, { useRef, useEffect, useState } from "react";
import { Stage, Layer, Text, Rect, Circle, Transformer, Image as KonvaImage } from "react-konva";
import { useEditorStore } from "@/store/useEditorStore";
import { TextElement, ShapeElement, ImageElement } from "@/types/poster";
import Konva from "konva";
import useImage from "use-image";

// Helper component for rendering images in Konva
const PosterImage = ({ el, isSelected, onSelect, onChange }: any) => {
  const [image] = useImage(el.src, "anonymous");
  return (
    <KonvaImage
      id={el.id}
      image={image}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        });
      }}
    />
  );
};

export default function Canvas() {
  const { poster, selectedElementId, setSelectedElementId, updateElement } = useEditorStore();
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = document.getElementById("canvas-container");
    if (!container) return;
    
    const updateScale = () => {
      const padding = 40;
      const containerWidth = container.clientWidth - padding * 2;
      const containerHeight = container.clientHeight - padding * 2;
      
      const scaleX = containerWidth / poster.width;
      const scaleY = containerHeight / poster.height;
      const newScale = Math.min(scaleX, scaleY, 1);
      
      setScale(newScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [poster.width, poster.height]);

  useEffect(() => {
    if (selectedElementId && trRef.current && stageRef.current) {
      const node = stageRef.current.findOne(`#${selectedElementId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selectedElementId, poster.elements]);

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.id() === "bg";
    if (clickedOnEmpty) {
      setSelectedElementId(null);
    }
  };

  const handleDragEnd = (e: any, id: string) => {
    updateElement(id, { x: e.target.x(), y: e.target.y() });
  };

  const handleTransformEnd = (e: any, id: string, type: string) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    if (type === "text") {
      updateElement(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
      });
    } else {
      updateElement(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      });
    }
  };

  return (
    <Stage
      width={poster.width * scale}
      height={poster.height * scale}
      scaleX={scale}
      scaleY={scale}
      onMouseDown={checkDeselect}
      onTouchStart={checkDeselect}
      ref={stageRef}
      id="poster-canvas"
    >
      <Layer>
        <Rect id="bg" x={0} y={0} width={poster.width} height={poster.height} fill={poster.background} listening={true} />

        {poster.elements.map((el) => {
          if (el.type === "image") {
            return (
              <PosterImage 
                key={el.id} 
                el={el as ImageElement} 
                isSelected={el.id === selectedElementId}
                onSelect={() => setSelectedElementId(el.id)}
                onChange={(updates: any) => updateElement(el.id, updates)}
              />
            );
          }

          if (el.type === "text") {
            const textEl = el as TextElement;
            return (
              <Text
                key={el.id} 
                id={el.id} 
                x={textEl.x} 
                y={textEl.y} 
                width={textEl.width}
                text={textEl.text} 
                fontSize={textEl.fontSize} 
                fontFamily={textEl.fontFamily || "Arial"}
                fill={textEl.fill} 
                align={textEl.align || "left"} 
                fontStyle={textEl.fontWeight === "bold" ? "bold" : "normal"}
                lineHeight={textEl.lineHeight}
                letterSpacing={textEl.letterSpacing}
                draggable 
                onClick={() => setSelectedElementId(el.id)} 
                onTap={() => setSelectedElementId(el.id)}
                onDragEnd={(e) => handleDragEnd(e, el.id)} 
                onTransformEnd={(e) => handleTransformEnd(e, el.id, "text")}
              />
            );
          }

          if (el.type === "shape") {
            const shapeEl = el as ShapeElement;
            const commonProps = {
              id: el.id, 
              x: shapeEl.x, 
              y: shapeEl.y, 
              fill: shapeEl.fill,
              stroke: shapeEl.stroke,
              strokeWidth: shapeEl.strokeWidth,
              draggable: true, 
              onClick: () => setSelectedElementId(el.id), 
              onTap: () => setSelectedElementId(el.id),
              onDragEnd: (e: any) => handleDragEnd(e, el.id), 
              onTransformEnd: (e: any) => handleTransformEnd(e, el.id, "shape"),
            };

            if (shapeEl.shapeType === "rectangle") {
              return (
                <Rect 
                  key={el.id} 
                  {...commonProps} 
                  width={shapeEl.width} 
                  height={shapeEl.height} 
                  cornerRadius={shapeEl.cornerRadius}
                />
              );
            }
            if (shapeEl.shapeType === "circle") {
              return (
                <Circle 
                  key={el.id} 
                  {...commonProps} 
                  radius={shapeEl.width / 2} 
                  offsetX={-(shapeEl.width / 2)} 
                  offsetY={-(shapeEl.height / 2)} 
                />
              );
            }
            if (shapeEl.shapeType === "line") {
              return (
                <Rect 
                  key={el.id} 
                  {...commonProps} 
                  width={shapeEl.width} 
                  height={Math.max(shapeEl.height, 2)} 
                />
              );
            }
          }
          return null;
        })}

        {selectedElementId && (
          <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return oldBox;
            return newBox;
          }} />
        )}
      </Layer>
    </Stage>
  );
}

