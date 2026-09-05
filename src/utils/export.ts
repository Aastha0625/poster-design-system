
export function exportCanvasToImage(stageId: string, filename: string = "poster.png") {
  // We need to wait for react-konva to render before exporting
  // We can select the konvajs-content div or call stage.toDataURL if we had a ref
  // Since we assign an ID to the stage, we can find the canvas inside it
  const stageContainer = document.getElementById(stageId);
  if (!stageContainer) return;
  
  const canvas = stageContainer.querySelector("canvas");
  if (!canvas) return;

  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

