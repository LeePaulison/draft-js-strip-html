# Draft-JS - Sanitize HTML

The following implementation of draft-js uses a custom handlePasteText function to Sanitize HTML pasted into the Editor as per tasking requirements.

Requirements:
- Clear color and background-color styles
- Retain a limited selection of HTML tags and styling for copy/paste operations
- Sanitize HTML of dangerous attributes and HTML tags that may contain malicious code.
- Retain unsupported HTML content, but do not retain the HTML tag
- Remove leading and trailing whitespace of the content as a whole.  Whitespace formatting within the content remains untouched.

## Installation
```bash
  npm install
```

## To Run
```bash
  npm run dev
```
