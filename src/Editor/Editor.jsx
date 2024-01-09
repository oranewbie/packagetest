import React ,{useCallback } from 'react'
import {handleImageDrop} from './editorUtil'
import { EditorContent, ReactNodeViewRenderer,useEditor} from '@tiptap/react'
import './style.css'

import History from '@tiptap/extension-history'
import Strike from '@tiptap/extension-strike'
import Italic from '@tiptap/extension-italic'
import Bold from '@tiptap/extension-bold'
import Heading from '@tiptap/extension-heading'
import HardBreak from '@tiptap/extension-hard-break'
import CodeBlock from '@tiptap/extension-code-block'
import Blockquote from '@tiptap/extension-blockquote'
import MenuBar from './MenuBar'
import Text from '@tiptap/extension-text'
import Dropcursor from '@tiptap/extension-dropcursor'
import Paragraph from '@tiptap/extension-paragraph'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Image from '@tiptap/extension-image'
import Document from '@tiptap/extension-document'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Code from '@tiptap/extension-code'
import { BubbleMenu,FloatingMenu } from '@tiptap/react'
import Gapcursor from '@tiptap/extension-gapcursor'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import FontFamily from '@tiptap/extension-font-family'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Link from '@tiptap/extension-link'
import BulletList from '@tiptap/extension-bullet-list'
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import ListKeymap from '@tiptap/extension-list-keymap'
import TextAlign from '@tiptap/extension-text-align'
import Youtube from "@tiptap/extension-youtube";
import { TextSelection } from '@tiptap/pm/state';
import { ColorHighlighter, SmilieReplacer,ReactExtension,ImageResize,CodeBlockComponent 
 } from "./extension";

// import css from 'highlight.js/lib/languages/css'
// import js from 'highlight.js/lib/languages/javascript'
// import ts from 'highlight.js/lib/languages/typescript'
// import html from 'highlight.js/lib/languages/xml'
import {common,createLowlight } from 'lowlight'
const lowlight = createLowlight(common)
// import {lowlight} from 'lowlight'
// lowlight.registerLanguage('html', html)
// lowlight.registerLanguage('css', css)
// lowlight.registerLanguage('js', js)
// lowlight.registerLanguage('ts', ts)


const extensions = [
    Document,
    Paragraph,
    Text,
    Highlight.configure({ multicolor: true }),
    Blockquote,
    HardBreak,
    Bold,
    Italic,
    Strike,
    Heading,
    TextStyle,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    History,
    FontFamily,
    Color,
    //CodeBlock,
    CodeBlockLowlight.extend({
          addNodeView() {
            return ReactNodeViewRenderer(CodeBlockComponent)
          },
      }).configure({ lowlight }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    ReactExtension,   
    Dropcursor,    
    Code,
    CodeBlock,
    BubbleMenu,
    FloatingMenu,
    Gapcursor,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    HorizontalRule,
    Link.configure({
      openOnClick: true,
      validate: (href) => /^https?:\/\//.test(href)
    }),
    BulletList, OrderedList, ListItem,
    ListKeymap,
    ImageResize.configure(
      {resizeIcon: <>ResizeMe</>,
      allowBase64:true,
    }),
    Youtube.configure({
      inline: false,
      nocookie: true
    }),
    ColorHighlighter,
    SmilieReplacer,
]
  
function Editor(props) {

  const editor = useEditor({
    extensions: extensions, 
    content:props.content,
    autofocus: true,
    editable: true,
    editorProps: {
      handleDrop: (view, event, slice, moved) => handleImageDrop(view, event, slice, moved, props.uploadImage),
      attributes: {
        class: "awesome-wysiwyg-editor"
      }
    },
    onUpdate: ({ editor: _editor }) => {
      console.log(_editor.getJSON());
      localStorage.setItem("_editorContent", JSON.stringify(_editor.getJSON()));
    },
  })
  
  if(!editor)
    return null;

  const showBubbleMenu=(params) =>{
    //console.log('showBubbleMenu',params)
    if(params.from != undefined && params.to != undefined
      && params.from != params.to) {
        if(params.state.selection instanceof TextSelection)
          return true;
    }
    
    return false;
  }

  const showFloatingMenu=(params) =>{
    console.log('showFloatingMenu',params)
    return false;
  }

  const showMenu = props.menubar !=undefined ? props.menubar : true;
  const showBubble = props.bubblemenu !=undefined ? props.bubblemenu : (showMenu ? false : true )
  const showFloat = props.floatmenu !=undefined ? props.floatmenu : true;

  const buildMenuBar=() => {
    return showMenu ? <MenuBar editor={editor} /> : null
  }
  const buildBubbleMenu=() => {
    
    showBubble ? (<BubbleMenu
            className="bubble-menu"
            editor={editor}
            tippyOptions={{ duration: 100 }}
            shouldShow={showBubbleMenu}
            >
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "is-active" : ""}>
              bold
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "is-active" : ""}>
              italic
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? "is-active" : ""}>
              strike
            </button>
          </BubbleMenu>)
          : null
  }

  const buildFloatMenu=() => {
    return showFloat ? 
    (<FloatingMenu
        className="floating-menu"
        tippyOptions={{ duration: 100 }}
        editor={editor}
      >
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={
            editor.isActive("heading", { level: 1 }) ? "is-active" : ""
          }>
          H1
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={
            editor.isActive("heading", { level: 2 }) ? "is-active" : ""
          }>
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "is-active" : ""}>
          Bullet List
        </button>
      </FloatingMenu> 
    )
    : null;
  }

  return (
    <div style={{width:'100%', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden'}}>
      { buildMenuBar()}
      { buildBubbleMenu() }
      { buildFloatMenu() }
      <EditorContent editor={editor} style={{width:'100%', height:'100%', display:'flex', flexDirection:'column', overflow:'auto'}} />
    </div>
  )
}

export default Editor