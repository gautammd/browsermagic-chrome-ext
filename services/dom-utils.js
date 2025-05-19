/**
 * DOM Utilities Module
 * Provides reusable functions for DOM operations and element identification
 */

/**
 * Generate an XPath for a DOM element
 * @param {Element} element - The DOM element to generate XPath for
 * @returns {string} - XPath expression for the element
 */
export function getXPath(element) {
  // Create a fully qualified XPath that always starts from the document root
  if (!element) return '';
  
  // Special case for the document
  if (element === document) return '';
  
  // Special case for the HTML element
  if (element === document.documentElement) return '/html';
  
  // Special case for the document body
  if (element === document.body) return '/html/body';
  
  // Build the full path from the element up to the document root
  let path = [];
  let current = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    // Get all siblings of the same node type
    let siblings = Array.from(
      current.parentNode.childNodes
    ).filter(node => 
      node.nodeType === Node.ELEMENT_NODE && 
      node.tagName === current.tagName
    );
    
    // If there's only one element of this type, simplify the path
    if (siblings.length === 1) {
      path.unshift(current.tagName.toLowerCase());
    } else {
      // Element has siblings of the same type, find its index
      let index = 1; // XPath indices start at 1
      let sibling = current;
      
      // Count preceding siblings with the same node name
      while (sibling = sibling.previousElementSibling) {
        if (sibling.tagName === current.tagName) {
          index++;
        }
      }
      
      path.unshift(`${current.tagName.toLowerCase()}[${index}]`);
    }
    
    current = current.parentNode;
    
    // Stop when we reach the document
    if (current === document) break;
  }
  
  // Create the full XPath string starting from root
  return '/' + path.join('/');
}

/**
 * Get visible text content of an element
 * @param {Node} node - The node to extract text from
 * @returns {string} - Visible text content
 */
export function getVisibleText(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (!(node instanceof Element)) return '';
  
  const st = getComputedStyle(node);
  if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) return '';
  
  let text = '';
  for (let child of node.childNodes) text += getVisibleText(child);
  return text;
}

/**
 * Check if an element is in the viewport
 * @param {Object} rect - Element's bounding rect {x, y, width, height}
 * @returns {boolean} - Whether the element is in the viewport
 */
export function inViewport({x, y, width, height}) {
  return (
    x + width > 0 &&
    y + height > 0 &&
    x < window.innerWidth &&
    y < window.innerHeight
  );
}

/**
 * Check if an element is visible
 * @param {Element} element - DOM element to check
 * @returns {boolean} - Whether the element is visible
 */
export function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  
  // Check basic visibility
  if (style.display === 'none' || 
      style.visibility === 'hidden' || 
      style.opacity === '0') {
    return false;
  }
  
  // Check dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }
  
  return true;
}

/**
 * Find an element on the page using various strategies
 * @param {string} description - The element description
 * @param {string} action - The action to perform ('click' or 'fill')
 * @returns {Element|null} - The found element or null if not found
 */
export function findElementByDescription(description, action) {
  // Try finding by text content
  let element = findElementByText(description);
  if (element) return element;
  
  // Try finding by label (for inputs)
  if (action === 'fill') {
    element = findElementByLabel(description);
    if (element) return element;
    
    // Try finding by placeholder
    element = findElementByPlaceholder(description);
    if (element) return element;
  }
  
  // Try finding by aria-label
  element = findElementByAriaLabel(description);
  if (element) return element;
  
  // Try finding by title
  element = findElementByTitle(description);
  if (element) return element;
  
  return null;
}

/**
 * Find an element by its text content
 * @param {string} text - The text to search for
 * @returns {Element|null} - The found element or null if not found
 */
export function findElementByText(text) {
  const lowerText = text.toLowerCase();
  
  // Try direct text content match
  const elements = Array.from(document.querySelectorAll('*'));
  
  // First try exact match
  let match = elements.find(el => {
    const content = el.textContent?.trim();
    return content && content.toLowerCase() === lowerText && isElementVisible(el);
  });
  
  if (match) return match;
  
  // Then try contains match
  match = elements.find(el => {
    const content = el.textContent?.trim();
    return content && content.toLowerCase().includes(lowerText) && isElementVisible(el);
  });
  
  return match;
}

/**
 * Find an input element by its label text
 * @param {string} labelText - The label text to search for
 * @returns {Element|null} - The found element or null if not found
 */
export function findElementByLabel(labelText) {
  const lowerLabelText = labelText.toLowerCase();
  
  // Find all labels with matching text
  const labels = Array.from(document.querySelectorAll('label')).filter(label => {
    const text = label.textContent?.trim().toLowerCase();
    return text && (text === lowerLabelText || text.includes(lowerLabelText));
  });
  
  // Check each label for an associated input
  for (const label of labels) {
    // Check for 'for' attribute
    if (label.htmlFor) {
      const input = document.getElementById(label.htmlFor);
      if (input && isElementVisible(input)) {
        return input;
      }
    }
    
    // Check for nested input
    const input = label.querySelector('input, textarea, select');
    if (input && isElementVisible(input)) {
      return input;
    }
  }
  
  return null;
}

/**
 * Find an input element by its placeholder text
 * @param {string} placeholder - The placeholder text to search for
 * @returns {Element|null} - The found element or null if not found
 */
export function findElementByPlaceholder(placeholder) {
  const lowerPlaceholder = placeholder.toLowerCase();
  
  // Find inputs with matching placeholder
  const inputs = Array.from(
    document.querySelectorAll('input[placeholder], textarea[placeholder]')
  ).filter(input => {
    const ph = input.getAttribute('placeholder')?.toLowerCase();
    return ph && (ph === lowerPlaceholder || ph.includes(lowerPlaceholder)) && 
           isElementVisible(input);
  });
  
  return inputs.length > 0 ? inputs[0] : null;
}

/**
 * Find an element by its aria-label
 * @param {string} ariaLabel - The aria-label to search for
 * @returns {Element|null} - The found element or null if not found
 */
export function findElementByAriaLabel(ariaLabel) {
  const lowerAriaLabel = ariaLabel.toLowerCase();
  
  // Find elements with matching aria-label
  const elements = Array.from(
    document.querySelectorAll('[aria-label]')
  ).filter(el => {
    const label = el.getAttribute('aria-label')?.toLowerCase();
    return label && (label === lowerAriaLabel || label.includes(lowerAriaLabel)) && 
           isElementVisible(el);
  });
  
  return elements.length > 0 ? elements[0] : null;
}

/**
 * Find an element by its title attribute
 * @param {string} title - The title to search for
 * @returns {Element|null} - The found element or null if not found
 */
export function findElementByTitle(title) {
  const lowerTitle = title.toLowerCase();
  
  // Find elements with matching title
  const elements = Array.from(
    document.querySelectorAll('[title]')
  ).filter(el => {
    const t = el.getAttribute('title')?.toLowerCase();
    return t && (t === lowerTitle || t.includes(lowerTitle)) && 
           isElementVisible(el);
  });
  
  return elements.length > 0 ? elements[0] : null;
}

/**
 * Get text from a label associated with an element
 * @param {Element} element - DOM element
 * @returns {string|null} - Label text or null if not found
 */
export function getLabelText(element) {
  // Check for labeled form elements
  if (element.id && (element.tagName === 'INPUT' || 
                    element.tagName === 'TEXTAREA' || 
                    element.tagName === 'SELECT')) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      return label.textContent.trim();
    }
  }
  
  // Check if element is inside a label
  let parent = element.parentElement;
  while (parent) {
    if (parent.tagName === 'LABEL') {
      return parent.textContent.trim();
    }
    parent = parent.parentElement;
  }
  
  return null;
}

/**
 * Helper to convert a field name to a likely selector
 * @param {string} fieldName - The field name from the prompt
 * @returns {string} - A CSS selector
 */
export function getFieldSelector(fieldName) {
  // Very simplified selector generation
  fieldName = fieldName.toLowerCase();
  
  const commonSelectors = {
    email: 'input[type="email"], input[name="email"], input[id="email"]',
    name: 'input[name="name"], input[id="name"]',
    search: 'input[type="search"], input[name="q"], input[placeholder*="search"]',
    password: 'input[type="password"]',
    username: 'input[name="username"], input[id="username"]'
  };
  
  return commonSelectors[fieldName] || `input[name*="${fieldName}"], input[id*="${fieldName}"], textarea[name*="${fieldName}"], textarea[id*="${fieldName}"]`;
}

/**
 * Helper to convert an element description to a likely selector
 * @param {string} elementDesc - The element description from the prompt
 * @returns {string} - A CSS selector
 */
export function getElementSelector(elementDesc) {
  // Very simplified selector generation
  elementDesc = elementDesc.toLowerCase();
  
  const commonSelectors = {
    'submit': 'button[type="submit"], input[type="submit"]',
    'search': 'button[type="search"], button[aria-label*="search"], button:contains("Search")',
    'login': 'button:contains("Login"), button:contains("Sign in")'
  };
  
  if (commonSelectors[elementDesc]) {
    return commonSelectors[elementDesc];
  }
  
  // For Google search specifically
  if (elementDesc === 'search button' || elementDesc === 'google search') {
    return 'input[name="btnK"], button[name="btnK"], input[value="Google Search"]';
  }
  
  // General fallback selectors
  return `button:contains("${elementDesc}"), input[value*="${elementDesc}"], a:contains("${elementDesc}"), [role="button"]:contains("${elementDesc}")`;
}

/**
 * Find interactive elements on the page
 * @param {string} targetSelector - Optional CSS selector to focus on a specific element
 * @returns {Array} - Array of interactive DOM elements
 */
export function findInteractiveElements(targetSelector) {
  // Start with either a specific target or the whole document
  const rootElement = targetSelector ? 
    document.querySelector(targetSelector) : document.body;
  
  if (!rootElement) {
    return [];
  }
  
  // Select all interactive elements
  const interactiveSelectors = [
    // Clickable elements
    'a', 'button', 'input[type="button"]', 'input[type="submit"]',
    '[role="button"]', '[role="link"]', '[onclick]', 
    // Form elements
    'input:not([type="hidden"])', 'textarea', 'select', 
    '[role="checkbox"]', '[role="radio"]', '[role="combobox"]', '[role="textbox"]',
    // Other interactive elements
    '[contenteditable="true"]', '[tabindex]:not([tabindex="-1"])'
  ];
  
  // Query all elements matching the selectors
  const elements = Array.from(
    rootElement.querySelectorAll(interactiveSelectors.join(','))
  );
  
  // Filter out hidden elements and those with no useful properties
  return elements.filter(element => {
    return isElementVisible(element) && hasUsefulProperties(element);
  });
}

/**
 * Check if an element has useful properties for the LLM
 * @param {Element} element - DOM element to check
 * @returns {boolean} - Whether the element has useful properties
 */
export function hasUsefulProperties(element) {
  // Check for text content
  const hasText = element.textContent?.trim().length > 0;
  
  // Check for useful attributes
  const hasAttributes = element.id || 
                      element.name || 
                      element.placeholder || 
                      element.getAttribute('aria-label') || 
                      element.title;
  
  // Check if it's a standard interactive element type
  const isStandardInteractive = 
    element.tagName === 'A' || 
    element.tagName === 'BUTTON' || 
    element.tagName === 'INPUT' || 
    element.tagName === 'TEXTAREA' || 
    element.tagName === 'SELECT';
  
  return hasText || hasAttributes || isStandardInteractive;
}

/**
 * Get the element type for classification
 * @param {Element} element - DOM element
 * @returns {string} - Element type
 */
export function getElementType(element) {
  const tag = element.tagName.toLowerCase();
  
  // Form inputs have more specific types
  if (tag === 'input') {
    return element.type || 'input';
  }
  
  // Check for ARIA roles
  const role = element.getAttribute('role');
  if (role) {
    return `${tag}[role=${role}]`;
  }
  
  return tag;
}

/**
 * Get relevant attributes for element identification
 * @param {Element} element - DOM element
 * @returns {Object} - Object containing relevant attributes
 */
export function getRelevantAttributes(element) {
  const attributes = {};
  const relevantAttrs = [
    'id', 'name', 'placeholder', 'value', 'href', 'src', 
    'aria-label', 'aria-describedby', 'title', 'alt', 'type', 'role'
  ];
  
  relevantAttrs.forEach(attr => {
    if (element.hasAttribute(attr)) {
      attributes[attr] = element.getAttribute(attr);
    }
  });
  
  // Add label text if it exists
  const labelText = getLabelText(element);
  if (labelText) {
    attributes.labelText = labelText;
  }
  
  return attributes;
}

/**
 * Get element location information
 * @param {Element} element - DOM element
 * @returns {Object} - Location information
 */
export function getElementLocation(element) {
  const rect = element.getBoundingClientRect();
  
  return {
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    inViewport: isInViewport(rect)
  };
}

/**
 * Check if an element is in the current viewport
 * @param {DOMRect} rect - Element's bounding rect
 * @returns {boolean} - Whether the element is in the viewport
 */
export function isInViewport(rect) {
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Performance-optimized fast snapshot of key elements on the page
 * @param {Object} options - Options for the snapshot
 * @returns {Object} - Snapshot object with key elements and page information
 */
export function fastSnapshot(options = {}) {
  const { includeTitle = true, includeMetadata = true } = options;
  
  // Basic page information
  const snapshot = {
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  // Add title if requested
  if (includeTitle) {
    snapshot.title = document.title;
  }
  
  // Add metadata if requested
  if (includeMetadata) {
    const metadata = {};
    
    // Extract common metadata
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach(tag => {
      const name = tag.getAttribute('name') || tag.getAttribute('property');
      const content = tag.getAttribute('content');
      if (name && content) {
        metadata[name] = content;
      }
    });
    
    snapshot.metadata = metadata;
  }
  
  // Optimized DOM scanning implementation
  const RELEVANT = new Set([
    'BUTTON', 'A', 'INPUT', 'LABEL', 'SELECT', 'TEXTAREA', 'IMG', 'SVG'
  ]);
  const results = [];

  function scan(el) {
    if (!(el instanceof Element || el instanceof Document || el instanceof ShadowRoot)) return;

    if (el.shadowRoot) scan(el.shadowRoot);

    if (el instanceof Element) {
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) return;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      if (!inViewport(rect)) return;

      let visibleText = getVisibleText(el).replace(/\s+/g, ' ').trim().slice(0, 60);
      if (RELEVANT.has(el.tagName) || visibleText.length) {
        results.push({
          tag: el.tagName,
          xpath: getXPath(el),
          text: visibleText,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height)
        });
      }

      for (let child of el.children) scan(child);
    }

    if (el instanceof ShadowRoot || el instanceof Document) {
      for (let child of el.children) scan(child);
    }
  }

  // Start scanning from document body
  scan(document.body);
  
  // Add the key elements to the snapshot
  snapshot.keyElements = results;
  
  // Get current viewport size
  snapshot.viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  return snapshot;
}

/**
 * Extract page context information for the LLM
 * @param {Object} options - Options for extraction
 * @returns {Object} - Page context object
 */
export function extractPageContext(options = {}) {
  const { fullPage = true, targetSelector = null } = options;
  
  // Use the optimized fastSnapshot function
  const snapshot = fastSnapshot();
  
  // Convert the snapshot format to page context format
  const pageInfo = {
    url: snapshot.url,
    title: snapshot.title,
    elements: snapshot.keyElements.map(el => {
      return {
        xpath: el.xpath,
        text: el.text,
        type: el.tag.toLowerCase(),
        location: {
          x: el.x,
          y: el.y, 
          width: el.w,
          height: el.h
        }
      };
    }),
    isOptimized: true
  };
  
  return pageInfo;
}