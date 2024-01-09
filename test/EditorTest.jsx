
import React, { useState, useEffect, useRef, useCallback,forwardRef,useImperativeHandle,useMemo   } from "react";

import Editor from '../src/Editor' 

import { Button,Box } from "@mui/material";


/**
 * Chart Config test
 */
function EditorTest(props) {

  const refEditor = useRef(null); 
  
  return (
    <div style={{ height: "100%", width:'100%',padding: '5px'}}>
        <Editor ref={refEditor} />
    </div>
  );
}

export default EditorTest
