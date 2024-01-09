
import React, { useState, useEffect, useRef, useCallback,forwardRef,useImperativeHandle,useMemo   } from "react";


import AGGrid from '../src/AGGrid' 
import { AgGridReact } from 'ag-grid-react';
import {exeData} from './data'

import 'ag-grid-enterprise';
import './css/ag-grid.css';
import './css/ag-theme-alpine.css';
import './css/ag-custom.css'

import { Button,Box } from "@mui/material";

const initColumnDefs = [ 
  { field: 'country', minWidth: 150,editable:true},
  {
    field: 'athlete',
    minWidth: 150,
    checkboxSelection: true,
    editable:true
  },
  { field: 'age', maxWidth: 90,editable:true, },
  { field: 'year', maxWidth: 90,editable:true, },
  { field: 'date', minWidth: 150 ,editable:true,},
  { field: 'sport', minWidth: 150,editable:true, },
  { field: 'gold' ,editable:true,},
  { field: 'silver' ,editable:true,},
  { field: 'bronze',editable:true, },
  { field: 'total' ,editable:true,},
  
]
/**
 * AG Grid 전환 테스트
 */
function RawAgGridTest2(props) {

  const refAGGrid = useRef(null);
  
  const [columnDefs, setColumnDefs] = useState(initColumnDefs);
  const [rowData, setRowData] = useState([]);


  const setData=()=>{
    setRowData([...exeData])
  }

  return (
        <div style={{ display:'flex', flexDirection:'column',height: "100%", width:'100%'}}>
          <div>
            <Button onClick={setData}>데이타 로딩</Button>
          </div>

          <div style={{ height: "100%", width:'100%',paddingRight: '5px'}} className={props.className || "ag-theme-alpine"}>
              <AgGridReact
                ref={refAGGrid}
                columnDefs={columnDefs}
                rowData={rowData}
              />
          </div>
    </div>
  );
}

export default RawAgGridTest2
