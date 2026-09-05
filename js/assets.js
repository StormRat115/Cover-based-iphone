const pendingImages = new WeakMap();

// Share concurrent requests and settle even if an image failed before preload.
export function loadImage(image) {
  if (pendingImages.has(image)) return pendingImages.get(image);
  const promise = new Promise((resolve) => {
    let attempts = 0;
    let timeout;
    let retry;
    let settled = false;
    const source = image.src.split("&retry=")[0];
    function finish(value) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearTimeout(retry);
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
      resolve(value);
    }
    function onLoad() {
      finish(image.naturalWidth > 0 ? image : null);
    }
    function onError() {
      if (settled) return;
      clearTimeout(timeout);
      clearTimeout(retry);
      if (++attempts >= 3) return finish(null);
      retry = setTimeout(() => {
        image.src =
          source + (source.includes("?") ? "&" : "?") + "retry=" + attempts;
        armTimeout();
      }, 180);
    }
    function armTimeout() {
      timeout = setTimeout(onError, 8000);
    }
    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);
    if (image.complete) {
      if (image.naturalWidth > 0) onLoad();
      else onError();
    } else armTimeout();
  });
  pendingImages.set(image, promise);
  return promise;
}
