import { Box } from '@mui/material'
import './jsoneditorstyle.css'
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import JsonView from './JsonView'

export class JSONEditorProps{
  constructor() {
    this.jsonProp={}
  }
  register(prop, value) {
    this.jsonProp[prop]= value;
  }
  get(prop) {
    return this.jsonProp[prop]
  }
}

export function gePropsMeta() {
  return new JSONEditorProps();
}

function JsonEditor(props) {
  const [editObjectMeta, setEditObjectMeta] = useState(props.metaData)
  const [editObject, setEditObject] = useState(_.cloneDeep(props.data))
  useEffect(() => {
    props.onChange(editObject)
  }, [editObject])

  return (
    <Box className="jsonEditorContainer" style={{ height:'100%', width: '100%', padding:'10px', overflow:'auto' }}>
      <JsonView
        editObjectMeta={editObjectMeta}
        editObject={editObject}
        setEditObject={setEditObject}
        optionsMap={props.optionsMap} 
      />
    </Box>
  )
}

export default JsonEditor