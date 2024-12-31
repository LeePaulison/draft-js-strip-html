import { useState } from 'react'
import { Editor } from 'react-draft-wysiwyg'
import { EditorState, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';
import './App.css'
import '../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

// Sanitize HTML
import { sanitizeHTML } from './utils/sanitizeHTML'

function App() {
  const [editorState, setEditorState] = useState(EditorState.createEmpty())

  const onEditorStateChange = (editorState) => {
    setEditorState(editorState)
  }

  const sanitizedContentState = (contentState) => {
    const rawState = convertToRaw(contentState);

    const sanitizedBlocks = rawState.blocks.map((block) => ({
      ...block,
      text: block.text.trim(),  // Trim leading/trailing whitespace
    }));

    return convertFromRaw({ ...rawState, blocks: sanitizedBlocks });
  };

  const convertHTMLToContentState = (html) => {
    const { contentBlocks, entityMap } = htmlToDraft(html);


    // Create ContentState from blocks and entityMap
    const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);

    const sanitizedContent = sanitizedContentState(contentState);

    return sanitizedContent;
  };

  const handlePastedText = (html) => {
    const sanitizeHTMLText = sanitizeHTML(html);

    const contentState = convertHTMLToContentState(sanitizeHTMLText);

    const newEditorState = EditorState.push(editorState, contentState, 'insert-fragment');
    setEditorState(newEditorState);

    return 'handled';
  }

  return (
    <>
      <Editor
        editorState={editorState}
        onEditorStateChange={onEditorStateChange}
        handlePastedText={handlePastedText}
        editorClassName='editor-default'
        wrapperClassName='wrapper-default'
        toolbar={{
          options: ['inline', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'history'],
          inline: {
            options: ['bold', 'italic', 'underline', 'superscript', 'subscript']
          },
          fontSize: {
            options: [10, 12, 14, 16, 18, 24],
          },
          list: {
            inDropdown: false,
          },
          textAlign: {
            inDropdown: false,
            options: ['left', 'center', 'right'],
          },
          colorPicker: {
            colors: ['rgb(247,218,100)'],
          },
          link: {
            inDropdown: false,
          },
        }}
      />
    </>
  )
}

export default App
