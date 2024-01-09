import { NodeViewWrapper } from '@tiptap/react'
import React from 'react'
import './ReactComponent.css'
import ChartSample from './ChartSample'

function ReactComponent(props){
  
  const increase = () => {
    props.updateAttributes({
      count: props.node.attrs.count + 1,
    })
  }

  return (
    <NodeViewWrapper className="react-component">
      <div
        class="drag-handle"
        contenteditable="false"
        draggable="true"
        data-drag-handle
      />
      <span className="label">React Component</span>

      <div className="content">
        <ChartSample />
      </div>
    </NodeViewWrapper>
  )
}

export default ReactComponent;