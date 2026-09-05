// Lightweight browser API doubles for deterministic logic tests, not visual QA.
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";

export function createHarness({
  root = resolve("."),
  width = 390,
  height = 844,
  revision = null,
  imagesReady = true,
} = {}) {
  const nodes = new Map(),
    frames = [],
    timers = new Map(),
    modules = new Map(),
    images = [];
  const metrics = {
    draws: 0,
    htmlWrites: 0,
    intervals: 0,
    images: 0,
    strokes: [],
    ellipses: [],
  };
  let now = 0,
    timerId = 0,
    seed = 123456;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  class Events {
    listeners = new Map();
    addEventListener(type, callback, options = {}) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push({ callback, once: options.once });
    }
    removeEventListener(type, callback) {
      this.listeners.set(
        type,
        (this.listeners.get(type) || []).filter(
          (item) => item.callback !== callback,
        ),
      );
    }
    emit(type, detail = {}) {
      const event = {
        type,
        target: this,
        preventDefault() {},
        stopPropagation() {},
        ...detail,
      };
      for (const item of [...(this.listeners.get(type) || [])]) {
        item.callback(event);
        if (item.once) this.removeEventListener(type, item.callback);
      }
    }
  }
  class Element extends Events {
    constructor(tag = "div") {
      super();
      this.tagName = tag.toUpperCase();
      this.style = {};
      this.dataset = {};
      this.children = [];
      this.textContent = "";
      this.firstChild = { nodeValue: "" };
      const classes = new Set();
      this.classList = {
        add: (...values) => values.forEach((value) => classes.add(value)),
        remove: (...values) => values.forEach((value) => classes.delete(value)),
        contains: (value) => classes.has(value),
        toggle: (value, force) => {
          const active = force ?? !classes.has(value);
          if (active) classes.add(value);
          else classes.delete(value);
          return active;
        },
      };
    }
    set id(value) {
      this._id = value;
      nodes.set(value, this);
    }
    get id() {
      return this._id;
    }
    set innerHTML(value) {
      this._html = value;
      metrics.htmlWrites++;
      for (const match of value.matchAll(/id="([^"]+)"/g)) {
        const child = new Element();
        child.id = match[1];
        this.appendChild(child);
      }
    }
    get innerHTML() {
      return this._html || "";
    }
    appendChild(child) {
      child.parentNode = this;
      child.parentElement = this;
      this.children.push(child);
      return child;
    }
    insertBefore(child) {
      return this.appendChild(child);
    }
    remove() {
      nodes.delete(this.id);
    }
    setAttribute(name, value) {
      this[name] = value;
    }
    getBoundingClientRect() {
      return { left: 0, top: 0, width, height };
    }
    getContext() {
      if (!this.context)
        this.context = new Proxy(
          {},
          {
            get(target, key) {
              if (key in target) return target[key];
              return (...args) => {
                if (key === "ellipse") metrics.ellipses.push(args);
                if (key === "stroke")
                  metrics.strokes.push({
                    strokeStyle: target.strokeStyle,
                    lineWidth: target.lineWidth,
                    shadowBlur: target.shadowBlur,
                  });
                if (
                  [
                    "fill",
                    "stroke",
                    "fillRect",
                    "drawImage",
                    "fillText",
                  ].includes(key)
                )
                  metrics.draws++;
              };
            },
          },
        );
      return this.context;
    }
  }
  const document = new Events();
  document.hidden = false;
  document.readyState = "complete";
  document.body = new Element("body");
  document.head = new Element("head");
  document.createElement = (tag) => new Element(tag);
  document.getElementById = (id) => nodes.get(id) || null;
  document.querySelector = (selector) => nodes.get(selector.slice(1)) || null;
  const commands = ["FOLLOW", "HOLD", "ASSAULT", "FOCUS"].map((command) => {
    const button = new Element("button");
    button.dataset.command = command;
    return button;
  });
  document.querySelectorAll = (selector) =>
    selector.startsWith("#squadCommands") ? commands : [];
  for (const match of readFileSync(
    resolve(root, "index.html"),
    "utf8",
  ).matchAll(/<([\w-]+)[^>]*id="([^"]+)"[^>]*>/g)) {
    const node = new Element(match[1]);
    node.id = match[2];
    if (match[0].includes("hidden")) node.classList.add("hidden");
    document.body.appendChild(node);
  }
  for (const command of commands)
    nodes.get("squadCommands").appendChild(command);
  class Image extends Events {
    constructor() {
      super();
      metrics.images++;
      images.push(this);
      this.complete = imagesReady;
      this.naturalWidth = imagesReady ? 1448 : 0;
      this.naturalHeight = imagesReady ? 1086 : 0;
    }
    set src(value) {
      this._src = value;
    }
    get src() {
      return this._src;
    }
    decode() {
      return this.decodePromise || Promise.resolve();
    }
  }
  const window = new Events();
  const context = vm.createContext({
    console,
    document,
    window,
    Image,
    Math: Object.assign(Object.create(Math), { random }),
    performance: { now: () => now },
    requestAnimationFrame: (callback) => {
      frames.push(callback);
      return frames.length;
    },
    setTimeout: (callback, delay = 0) => {
      const id = ++timerId;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    setInterval: () => {
      metrics.intervals++;
      return ++timerId;
    },
    clearInterval() {},
    innerWidth: width,
    innerHeight: height,
    devicePixelRatio: 2,
    addEventListener: window.addEventListener.bind(window),
    localStorage: { getItem: () => null, setItem() {} },
    location: { reload() {} },
  });
  Object.assign(window, {
    requestAnimationFrame: context.requestAnimationFrame,
    innerWidth: width,
    innerHeight: height,
    devicePixelRatio: 2,
  });
  async function load(path) {
    const id = path.startsWith("/") ? path : resolve(root, path);
    if (modules.has(id)) return modules.get(id);
    const localPath = id.split("?")[0];
    const source = revision
      ? execFileSync(
          "git",
          ["show", revision + ":" + localPath.slice(root.length + 1)],
          { cwd: root, encoding: "utf8" },
        )
      : readFileSync(localPath, "utf8");
    const module = new vm.SourceTextModule(source, {
      context,
      identifier: id,
      importModuleDynamically: async (specifier, parent) => {
        const child = await load(
          resolve(dirname(parent.identifier), specifier),
        );
        if (child.status === "unlinked") await child.link(linker);
        if (child.status === "linked") await child.evaluate();
        return child;
      },
    });
    modules.set(id, module);
    return module;
  }
  async function linker(specifier, parent) {
    return load(resolve(dirname(parent.identifier), specifier));
  }
  async function importModule(path) {
    const module = await load(path);
    if (module.status === "unlinked") await module.link(linker);
    if (module.status === "linked") await module.evaluate();
    return module.namespace;
  }
  function frame(milliseconds = 1000 / 60) {
    now += milliseconds;
    for (const callback of frames.splice(0)) callback(now);
    for (const [id, timer] of [...timers]) {
      if (timer.at <= now) {
        timers.delete(id);
        timer.callback();
      }
    }
  }
  function advance(count, milliseconds) {
    for (let i = 0; i < count; i++) frame(milliseconds);
  }
  return {
    window,
    document,
    nodes,
    frames,
    timers,
    modules,
    images,
    metrics,
    importModule,
    frame,
    advance,
    Image,
    context,
    random,
  };
}
