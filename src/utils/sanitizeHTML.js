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
    const whitespaceRegex = /^\s+|\s+$/g; // Only trim leading/trailing spaces
    return str.replace(whitespaceRegex, ""); // Don't collapse inner spaces
  }

  const trimmedHTML = customTrim(inputHTML);

  // Sanitize and filter out unsafe or disallowed styles
  function sanitizeStyle(styles) {
    const unsafeKeywords = ["expression", "javascript", "vbscript", "data", "url"];
    const disallowedProperties = ["color", "background-color"]; // Explicitly disallow "color"

    // Split the style string into individual declarations
    const styleDeclarations = styles.split(";").map((s) => s.trim());

    // Filter out unsafe or disallowed properties
    const sanitizedStyles = styleDeclarations.filter((declaration) => {
      const [property, value] = declaration.split(":").map((s) => s.trim().toLowerCase());
      return (
        property &&
        value &&
        !unsafeKeywords.some((keyword) => declaration.includes(keyword)) &&
        !disallowedProperties.includes(property)
      );
    });

    return sanitizedStyles.join("; "); // Return the cleaned-up style string
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

  // Validate and sanitize attributes
  function sanitizeAttributes(node, allowedAttributes) {
    Array.from(node.attributes).forEach((attr) => {
      if (!allowedAttributes.includes(attr.name)) {
        node.removeAttribute(attr.name);
      } else if (attr.name === "style") {
        const sanitizedStyle = sanitizeStyle(attr.value);
        if (sanitizedStyle) {
          node.setAttribute("style", sanitizedStyle);
        } else {
          node.removeAttribute("style"); // Remove style if it becomes empty
        }
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
      const textNode = processTextNode(node);
      return textNode;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const elementNode = processElementNode(node);
      return elementNode;
    }

    return null;
  }

  const sanitizedBody = cleanNode(doc.body);

  const container = document.createElement("div");
  container.appendChild(sanitizedBody);

  return container.innerHTML.trim();
}
