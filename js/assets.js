import { assetData } from './asset-data.js';

const SRC = {
  asphalt: assetData.tileAsphalt || 'assets/generated/tile-asphalt.png',
  ruinA: assetData.ruinA || 'assets/generated/building-ruin-a.png',
  ruinB: assetData.ruinB || 'assets/generated/building-ruin-b.png',
  jersey: assetData.jersey || 'assets/generated/cover-jersey.png',
};

export const images = {
  asphalt: null,
  ruinA: null,
  ruinB: null,
  jersey: null,
  ready: false,
};

function loadOne(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function loadAssets() {
  const [asphalt, ruinA, ruinB, jersey] = await Promise.all([
    loadOne(SRC.asphalt),
    loadOne(SRC.ruinA),
    loadOne(SRC.ruinB),
    loadOne(SRC.jersey),
  ]);
  images.asphalt = asphalt;
  images.ruinA = ruinA;
  images.ruinB = ruinB;
  images.jersey = jersey;
  images.ready = true;
  return images;
}
