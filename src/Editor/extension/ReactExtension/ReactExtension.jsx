import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { NodeSelection,TextSelection } from '@tiptap/pm/state'

import ReactComponent from './ReactComponent'

export const ReactExtension=Node.create({
  name: 'reactComponent',
  group: 'block',
  atom: true,
  draggable: true,
  //content: 'inline*',
  addAttributes() {
    return {
      count: {
        default: 0,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'react-component',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['react-component', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReactComponent)
  },
  addCommands() {
    return {
      setReactComponent:
        () => ({ chain, state }) => {
          const { $to: $originTo } = state.selection

          const currentChain = chain()

          if ($originTo.parentOffset === 0) {
            currentChain.insertContentAt(Math.max($originTo.pos - 2, 0), { type: this.name })
          } else {
            currentChain.insertContent({ type: this.name })
          }

          return (
            currentChain
              // set cursor after horizontal rule
              .command(({ tr, dispatch }) => {
                if (dispatch) {
                  const { $to } = tr.selection
                  const posAfter = $to.end()

                  if ($to.nodeAfter) {
                    if ($to.nodeAfter.isTextblock) {
                      tr.setSelection(TextSelection.create(tr.doc, $to.pos + 1))
                    } else if ($to.nodeAfter.isBlock) {
                      tr.setSelection(NodeSelection.create(tr.doc, $to.pos))
                    } else {
                      tr.setSelection(TextSelection.create(tr.doc, $to.pos))
                    }
                  } else {
                    const node = $to.parent.type.contentMatch.defaultType?.create()
                    if (node) {
                      tr.insert(posAfter, node)
                      tr.setSelection(TextSelection.create(tr.doc, posAfter + 1))
                    }
                  }
                  tr.scrollIntoView()
                }

                return true
              })
              .run()
          )
        },
    }
  },
  // addCommands() {
  //   return {
  //     setReactComponent: attributes => ({  tr, dispatch, editor }) => {
  //       const node = editor.schema.nodes.reactComponent.create({...attributes});
  //       if (dispatch) {
  //         const offset = tr.selection.anchor + 1

  //         tr.replaceSelectionWith(node)
  //           .scrollIntoView()
  //           .setSelection(TextSelection.near(tr.doc.resolve(offset)))
  //       }
  //       return true
  //     },
  //   }
  // },
})