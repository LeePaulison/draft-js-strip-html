// Sanitize HTML input using Single Responsibility Principle (SRP) and the DOMParser API
// The sanitizeHTML function takes an input HTML string and returns a sanitized HTML string.
export function sanitizeHTML(inputHTML) {
  // Allowed HTML tags and attributes
  const allowedTagsAndAttributes = {
    body: [],
    a: ["href", "style", "target"],
    b: ["style"],
    i: ["style"],
    u: ["style"],
    strong: ["style"],
    em: ["style"],
    span: ["style"],
    br: [],
    p: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    h5: ["style"],
    h6: ["style"],
    ul: ["style"],
    ol: ["style"],
    li: ["style"],
    mark: ["style"],
    sup: ["style"],
    sub: ["style"],
  };

  // Style map for supported inline styles
  // Handling inline styles in this manner is easier than creating draft.js entities
  const styleMap = {
    b: "font-weight: bold;",
    i: "font-style: italic;",
    u: "text-decoration: underline;",
  };

  function customTrim(str) {
    const whitespaceRegex =
      /^[\s\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+|[\s\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+$/g;
    const innerWhitespaceRegex = /[\s\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/g;
    return str.replace(whitespaceRegex, "").replace(innerWhitespaceRegex, " ");
  }

  console.log("Input HTML:", inputHTML);

  const trimmedHTML = customTrim(inputHTML);

  function isSafeStyle(styles) {
    const unsafeKeywords = ["expression", "javascript", "vbscript", "data", "url"];
    return !unsafeKeywords.some((keyword) => styles.includes(keyword));
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmedHTML, "text/html");

  function processTextNode(node) {
    const textContent = node.textContent;
    if (!textContent.trim()) {
      return null;
    }
    return document.createTextNode(textContent);
  }

  function sanitizeAttributes(node, allowedAttributes) {
    Array.from(node.attributes).forEach((attr) => {
      if (!allowedAttributes.includes(attr.name)) {
        node.removeAttribute(attr.name);
      } else if (attr.name === "style" && !isSafeStyle(attr.value)) {
        node.removeAttribute(attr.name);
      }
    });
  }

  function transformToSpan(node, style) {
    const span = document.createElement("span");

    // Handle existing styles
    if (node.hasAttribute("style")) {
      const existingStyle = node.getAttribute("style").trim();

      // Only add a semicolon if existing styles are non-empty
      const mergedStyle = existingStyle ? `${existingStyle}; ${style}`.trim() : style;

      span.setAttribute("style", mergedStyle);
    } else {
      span.setAttribute("style", style);
    }

    // Process children and append them to the new <span>
    Array.from(node.childNodes).forEach((child) => {
      const sanitizedChild = cleanNode(child);
      if (sanitizedChild) span.appendChild(sanitizedChild);
    });

    return span;
  }

  function replaceWithChildren(node) {
    const fragment = document.createDocumentFragment();
    Array.from(node.childNodes).forEach((child) => {
      const sanitizedChild = cleanNode(child);
      if (sanitizedChild) {
        fragment.appendChild(sanitizedChild);
      }
    });
    return fragment;
  }

  function sanitizeElementAttributes(node, allowedAttributes) {
    sanitizeAttributes(node, allowedAttributes);
  }

  function sanitizeElementChildren(node) {
    const sanitizedChildren = Array.from(node.childNodes).map(cleanNode).filter(Boolean);
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    sanitizedChildren.forEach((child) => node.appendChild(child));
  }

  function processElementNode(node) {
    const tagName = node.tagName.toLowerCase();

    if (tagName === "script") {
      return null;
    }

    if (styleMap[tagName]) {
      return transformToSpan(node, styleMap[tagName]);
    }

    if (!allowedTagsAndAttributes[tagName]) {
      return replaceWithChildren(node);
    }

    sanitizeElementAttributes(node, allowedTagsAndAttributes[tagName] || []);
    sanitizeElementChildren(node);

    return node;
  }

  function cleanNode(node) {
    if (!node) {
      return null;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      return processTextNode(node);
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      return processElementNode(node);
    }

    return null;
  }

  const sanitizedBody = cleanNode(doc.body);

  const container = document.createElement("div");
  container.appendChild(sanitizedBody);

  return container.innerHTML.trim();
}
