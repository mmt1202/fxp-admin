export function qs<T extends Element>(selector: string, parent: ParentNode = document): T {
  const element = parent.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  return element;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: {
    className?: string;
    textContent?: string;
    attributes?: Record<string, string>;
  } = {},
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.textContent) {
    element.textContent = options.textContent;
  }

  Object.entries(options.attributes ?? {}).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });

  return element;
}

export function clearAndAppend(parent: HTMLElement, child: Node): void {
  parent.replaceChildren(child);
}
