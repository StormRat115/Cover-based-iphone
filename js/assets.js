const pendingImages = new WeakMap();

// Required art must be downloaded AND decoded before the menu can open.
// A slow or failed image must never resolve as a successful null fallback.
export function loadImage(image, { timeoutMs = 60000, maxAttempts = 2 } = {}) {
  if (pendingImages.has(image)) return pendingImages.get(image);
  const source = image.src.split("&retry=")[0];
  const label = source.split("/").pop().split("?")[0];
  const promise = new Promise((resolve, reject) => {
    let attempt = 1;
    let timeout;
    let settled = false;
    let decoding = false;

    function cleanup() {
      clearTimeout(timeout);
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
    }

    function fail(reason) {
      if (settled) return;
      clearTimeout(timeout);
      if (attempt >= maxAttempts) {
        settled = true;
        cleanup();
        reject(
          new Error(
            "Could not prepare " +
              label +
              ": " +
              reason +
              ". Please retry loading.",
          ),
        );
        return;
      }
      attempt++;
      decoding = false;
      armTimeout();
      image.src =
        source + (source.includes("?") ? "&" : "?") + "retry=" + attempt;
    }

    async function onLoad() {
      if (settled || decoding) return;
      if (!image.naturalWidth || !image.naturalHeight)
        return fail("empty image");
      decoding = true;
      const decodingAttempt = attempt;
      try {
        if (typeof image.decode === "function") await image.decode();
        // Ignore an old decode if a timeout has already begun another attempt.
        if (settled || decodingAttempt !== attempt) return;
        settled = true;
        cleanup();
        resolve(image);
      } catch (error) {
        if (!settled && decodingAttempt === attempt)
          fail("image decoding failed");
      }
    }

    function onError() {
      fail("image download failed");
    }
    function armTimeout() {
      timeout = setTimeout(() => fail("loading timed out"), timeoutMs);
    }

    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);
    armTimeout();
    if (image.complete) {
      if (image.naturalWidth > 0) onLoad();
      else onError();
    }
  });
  pendingImages.set(image, promise);
  promise.catch(() => {
    if (pendingImages.get(image) === promise) pendingImages.delete(image);
  });
  return promise;
}
