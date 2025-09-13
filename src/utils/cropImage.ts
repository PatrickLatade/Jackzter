import { Area } from "react-easy-crop";

export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/jpeg");
};
