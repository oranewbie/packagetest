
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
  { type:'rowState'},
  { field: 'country', minWidth: 150,editable:true, mergeRule:{ criteria: "prevvalues+value" }},
  {
    field: 'athlete',
    minWidth: 150,
    checkboxSelection: true,
    editable:true,
    mergeRule:{ criteria: "prevvalues+value" }
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
function RawAgGridTest(props) {

  const refAGGrid = useRef(null);
  
  const [columnDefs, setColumnDefs] = useState(initColumnDefs);
  const [rowData, setRowData] = useState([]);

  const setData=()=>{
    setRowData([...exeData])
  }


  const onGridAddClick=()=> {
    if(refAGGrid.current) {
      // console.log(refGrid.current)
      refAGGrid.current.insertRowData();
    }
  }

  const onGridDelClick=() => {
    if(refAGGrid.current) {
      refAGGrid.current.removeRowSeleted();
      //console.log(refGrid.current.getJsonRows())
    }
  }

  const onGetUpdatedRows=() => {
    if(refAGGrid.current) {
      console.log(refAGGrid.current.getUpdatedRows())
    }
  }

  const commit=() => {
    if(refAGGrid.current) {
      refAGGrid.current.commit()
    }
  }

  const rollback=() => {
    if(refAGGrid.current) {
      refAGGrid.current.rollback()
    }
  }
  const reloadGrid=()=>{
    refAGGrid.current.reloadGrid();
  }
  return (
        <div style={{ display:'flex', flexDirection:'column',height: "100%", width:'100%'}}>
          <div style={{ height: "30px", width:'100%'}}>
            <Button onClick={setData}>데이타 로딩</Button>
            <Button onClick={onGridAddClick}>추가</Button>
            <Button onClick={onGridDelClick}>삭제</Button>
            <Button onClick={rollback}>rollback</Button>
            <Button onClick={commit}>commit</Button>
            <Button onClick={onGetUpdatedRows}>업데이트 상태</Button>
            <Button onClick={reloadGrid}>reload grid</Button>
          </div>
          <div style={{ height: "calc(100% - 30px)", width:'100%'}} className={props.className || "ag-theme-alpine"}>
               <AGGrid
                  ref={refAGGrid}
                  columnDefs={columnDefs}
                  rowData={rowData}
                />
            </div>
    </div>
  );
}

export default RawAgGridTest
