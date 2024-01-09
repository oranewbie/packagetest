import React, { useEffect, useRef, useState, useMemo,useCallback,
  useImperativeHandle, useLayoutEffect} from 'react';
import PropTypes from 'prop-types';
import { AgGridReact } from 'ag-grid-react';
import { LicenseManager } from "ag-grid-enterprise";
LicenseManager.setLicenseKey("CompanyName=zionex,LicensedGroup=zionex_dev1,LicenseType=MultipleApplications,LicensedConcurrentDeveloperCount=1,LicensedProductionInstancesCount=1,AssetReference=AG-035038,SupportServicesEnd=17_January_2024_[v2]_MTcwNTQ0OTYwMDAwMA==3322fd0a3fd15434d251003ff096c4d4")


import 'ag-grid-enterprise';
import './css/ag-grid.css';
import './css/ag-theme-alpine.css';
import './css/ag-custom.css'

import { useStore } from 'zustand'
//import {generateId, useViewStore, useContentStore, transLangKey, isDeepEqual,} from "../../index";

import { createGridItem, FlatternTreeData, calcMerge,calcMerge2,
  exportGridtoExcel, isColumnDateType,to_date,isDeepEqualWithUndef,
  FlatternColumns,isDeepEqual } from './GridObject';

import { createGridStore } from './store/gridStoreProvier';
import {CustomDateCellEditor} from './editor/CustomDateCellEditor'
import {MultiColumnSelectCellEditor} from './editor/MultiColumnSelectCellEditor'
import {ExcelTypeCellEditor } from './editor/ExcelTypeCellEditor';
import CheckboxCustomHeader from './renderer/CheckboxCustomHeader'
import { RowNode } from 'ag-grid-enterprise';
import CustomLoadingCellRenderer from './loading/LoadingCellRender'

// AG grid 기본칼럼 정보
export const defaultColDef ={
  resizable: true,
  sortable: true,
  editable: false,
  filter: true,
  useValueFormatterForExport: true,
  useValueParserForImport: true,
  headerClass: "header-center",
}

//칼럼 타입 정의..
// ag grid에서 제공하는 cellDataType: 'text', 'number', 'boolean', 'date', 'dateString', 'object'
export const columnTypes = {
  rowState: {
    noTrxManage:true
  },
  checkSelect: {
    noTrxManage:true
  },
  rowNum: {
    noTrxManage:true
  },
  checkColumn:{
    cellDataType: 'boolean', 
    headerName: '', 
    visible: true, 
    editable: true, 
    width: 30,
    suppressColumnsToolPanel:true, 
    lockVisible:true, 
    lockPosition:'left',
    suppressMovable:true,
  },
  	editable: {
		editable: true,
    cellClassRules: {
      "editable" : (params) => params.colDef.colId !== 'delYn',      
    }
  },
  requisite: {
    cellClassRules: {
      "requisite": () => true
    }
  },
  //정렬
  near: {
    cellClassRules: {
      "textAlignLeft": () => true
    }
  },
  left: {
    cellClassRules: {
      "textAlignLeft": () => true
    }
  },
  center: {
    cellClassRules: {
      "textAlignCenter": () => true
    }
  },
  right: {
    cellClassRules: {
      "textAlignRight": () => true
    }
  },
  far: {
    cellClassRules: {
      "textAlignRight": () => true
    }
  },
  text: {
    filter: 'agSetColumnFilter',
    //cellEditor:"zExcelTypeCellEditor"
  },
  number: { 
    filter: 'agNumberColumnFilter',
    valueFormatter: (params) => {
      if(params) {
        
        const colId = params.colDef.colId;
        let value = params.data ? params.data[colId] : params.value
        //const ctx = params.context;
        //const format = ctx.getValueFormat(params.colDef)
        // if(format) {

        // }
        // else
        if(value != undefined)
          return value.toLocaleString()
        else if(params.value)
          return params.value.toLocaleString()
      }
    },
    valueParser: function numberParser(params) {
      return Number(params.newValue);
    },
  },
  date: {
    filter: 'agDateColumnFilter',
    // filterParams: { 
    //   comparator: myDateComparator 
    // },
    //suppressMenu: true,
    // cellRenderer:'zCustomDateCellEditor',
    cellEditor:'zCustomDateCellEditor',
    valueFormatter: (params) => {
      if (params.value === null || isNaN(params.value)) {
        return null;
      } else {
        let datetime = new Date(params.value);
        let day = datetime.getDate().toString().padStart(2, '0');
        let month = (datetime.getMonth() + 1).toString().padStart(2, '0');
        let year = datetime.getFullYear().toString();
        let hourNum = datetime.getHours() % 24;
        let hour = hourNum.toString().padStart(2, '0');
        let min = datetime.getMinutes().toString().padStart(2, '0');
        let sec = datetime.getSeconds().toString().padStart(2, '0');
        if (params.colDef.subtype === "date") {
          return ( year + '-' + month + '-' + day );
        } else if (params.colDef.subtype === "datetime") {
          return ( year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec );
        } else if (params.colDef.subtype === "month") {
          return ( year + '-' + month );
        } else if (params.colDef.subtype === "year") {
          return ( year );
        } else {
          return ( year + '-' + month + '-' + day );
        }
      }
    }
  },
  boolean : {
    cellClassRules: {
      "cellCenter": () => true
    },
  }, 
  editableNew: {
    editable : (params) => {
      if(params && params.context && params.context.isNewRow) {
        return params.context.isNewRow(params.data)
      }
      return false;
    },
    cellClassRules: {
      "editable" : (params) => params.context.isNewRow(params.data),
    },
  }
};

export const defaultColGroupDef= {
  marryChildren: true,
}

/**
 * custom data type
 */
export const dataTypeDefinitions = {
  percentage: {
    extendsDataType: 'number',
    baseDataType: 'number',
    valueFormatter: params => params.value == null ? '' : `${Math.round(params.value * 100)}%`,
  }
}

export const defaultExcelExportParams= {
  headerRowHeight: 30,
  exportMode:'xlsx',
  allColumns:true,
}
const defaultAutoGroupColumnDef = {
  editable : (params) => {
    if(params && params.context && params.context.isNewRow) {
      return params.context.isNewRow(params.data)
    }
    return false;
  },
  cellClassRules: {
    "editable" : (params) => params.context.isNewRow(params.data),
  },
}

export const excelStyles= [
  {
    id: 'header',
    alignment: {
      vertical: 'Center',
      horizontal: 'Center',
    },
    interior: {
      color: '#f8f8f8',
      pattern: 'Solid',
      patternColor: undefined,
    },
    borders: {
      borderBottom: {
        color: '#ffab00',
        lineStyle: 'Continuous',
        weight: 1,
      },
    },
  },
  {
    id: 'headerGroup',
    font: {
      bold: true,
    },
  },
]

/** 내부 트리 표현을 위한 칼럼 */
function internalGetDataPath(data) {
  return data['__treepath__'];
}

const AGGrid = React.forwardRef((props, ref) => {

  //const [activeViewId,resetLangEvent] = useContentStore(state => [state.activeViewId,state.resetLangEvent]) // current View Id
  //const [setViewInfo] = useViewStore(state => [state.setViewInfo])   //view store

  const gridStoreRef = useRef(null) //상태 및 validation관리를 위한 AGGrid store
  if (!gridStoreRef.current) {
    gridStoreRef.current = createGridStore()
  }
  
  const [setGridObject,getGridObject, rowData,valueChangeTrx,addRowTrx,removeRowTrx, getUpdatedRows,
        isUpdated,getRemovedRows,getNewRows,getAllUpdatedRows,getAllUpdatedRowStates,
        getLastRowIdx,setRowData, isNewRow, rollback, commit, destroyStore, setCustomCtxValue, 
        getCustomCtxValue,validation,getRowState
        ]
    = useStore(gridStoreRef.current, (s) => [
        s.setGridObject, s.getGridObject, s.rowData, s.valueChangeTrx, s.addRowTrx,s.removeRowTrx,s.getUpdatedRows,
        s.isUpdated,s.getRemovedRows, s.getNewRows,s.getAllUpdatedRows, s.getAllUpdatedRowStates, 
        s.getLastRowIdx,s.setRowData, s.isNewRow, s.rollback,s.commit,s.destroyStore, s.setCustomCtxValue, 
        s.getCustomCtxValue, s.validation,s.getRowState]);

  const [initialState, setInitialState] = useState() //grid state 저장/복원
  const [gridVisible, setGridVisible] = useState(true);
  const uuid = useRef(null); //Grid ID 작업용
  if(uuid.current==null) {
    uuid.current = 'grid-div-cont-' + props.id;
  }

  const internalGridId = useRef(null); //Grid Inernal ID, props.id가 주어지지 않으면 이넘을 대신 사용한다.
  if(internalGridId.current==null) {
    internalGridId.current = 'AgGridReact-' + uuid.current
  }  
      
  const gridRef = useRef(null) //aggrid ref: to use aggrid api
  const itemsRef = useRef(null) //props로 넘어온 items 원래 정보를 가지고 있는다.
  const [gridColumnDefs, setGridColumnDefs] = useState([]) //itemRef를 변환시킨 ag-grid 칼럼정보
  
  const gridCodoes = useRef({}) //useDropDown 관련 코드목록: 구분키(칼럼명): [코드객체]
  const prevProps = useRef(null)  //props 비교를 위해 이전 props를 저장
  const prevGridState = useRef(null) //그리드 이전 상태

  const userCustomContext= useRef(undefined);    //사용자 정의 context 기본 옵션과 머지된다.
  const userCustomComponents= useRef(undefined); //사용자 정의 component 기본옵션과 머지된다.

  //내부 콜백을 사용하기 때문에 아래 사용자 정의 콜백은 보관해둔다.
  const useCustomCallback = useRef({
    getRowId: props.getRowId,
    onGridReady: props.onGridReady, 
    onStateUpdated: props.onStateUpdated,
    onGridPreDestroyed: props.onGridPreDestroyed,
    getContextMenuItems: props.getContextMenuItems,
    onCellValueChanged: props.onCellValueChanged, //we use readOnlyEdit and this event will not fired. i will fire it by myself
    onCellValueChanging:props.onCellValueChanging, 
    onBeforeDataSet: props.onBeforeDataSet,
    onAfterDataSet:props.onAfterDataSet,
    onGetCodeDefs: props.onGetCodeDefs,
  })

  //기본옵션 props로 넘어온 옵션이 있으면 그것과 머지된다.
  const wrapperInitOptions = useRef({
    columnTypes:columnTypes,
    defaultColDef: defaultColDef,
    defaultExcelExportParams: defaultExcelExportParams,
    excelStyles:excelStyles,
    autoGroupColumnDef:defaultAutoGroupColumnDef
  })

  /*props가 아닌 api로 설정한 추가 gridOptions들
    props와 이 옵션을 merge 시킨다. 이 옵션이 props로 설정된 것보다 우선된다.
    이 옵션의 경우 api.setGridOption 이나 updateGridOptions 설정가능한지 확인
    managed 옵션의 경우 위 함수로 처리가능
    https://www.ag-grid.com/javascript-data-grid/grid-options/ 에 initial로 
    명명된 것은 그렇지 않으면 Grid를 reload해야함.
  */
  const dynamicExtOptions= useRef({})
  const localeText = useMemo(()=>{ return {noRowsToShow: props.transLangKey ? props.transLangKey('MSG_NO_DATA') : "No Rows"}})

  const [myGridOptions, setMyGridOptions] = useState(getGridOptionFromProps(props))

  useImperativeHandle(ref, ()=> {
    return gridRef.current;
  }, [gridRef.current]) // dependencies

  /** 이전 items 정보 지원 및 확장 props지원 */
  function createColumnDefs(props){
    const { gridOptions, columnDefs:propsColumnDefs,items} = props
    //칼럼 정보는 gridOptions.columnDef, columnDefs, items로 올수 있다.
    let lColumnDefs=undefined;
    if(gridOptions && gridOptions.columnDefs) 
      lColumnDefs = gridOptions.columnDefs
    else
      lColumnDefs = propsColumnDefs || items;

    //칼럼이 새롭게 구성된 경우에 새롭게 생성한다.
    if(lColumnDefs && !isDeepEqual(itemsRef.current,lColumnDefs)) {      
      //grid가 생성된 후 변환
      if(gridRef.current) {
        itemsRef.current = lColumnDefs; //확장 property를 제어하기 위해 초기 칼럼 정보를 보관해둔다.
        const hitems=createGridItem(itemsRef.current,gridStoreRef.current)  
        setGridColumnDefs(hitems)
      }
    }
  }

  /**
   * rowData 키값
   * AGGrid wrapper에서 _rowId prop이  추가된다. 별도로 getRowId 콜백이 없으면 _rowId를 사용한다. 
   */
  const internalGetRowId= useCallback(params => {
    if(props.getRowId)
      return props.getRowId(params)
    if(params.data)
      return params.data._rowId
  },[props])

  /**
   * onCellEditRequest wrapper 상태관리
   */

  const internalOnCellEditRequest = useCallback(event => {
    if(useCustomCallback.current.onCellValueChanging){
      if(!useCustomCallback.current.onCellValueChanging(event))
        return;
    }
    const data = event.data;
    const field = event.colDef.originColId ? event.colDef.originColId: event.colDef.field;
    if(!field) {
      console.warn('internalOnCellEditRequest', 'field is not defined')
      return;
    }
    const oldValue = event.oldValue;
    const newValue = event.newValue;

    const newData = { ...data};
    newData[field] = newValue;

    if(myGridOptions.treeData==true) {
      if(event.column.colId === 'ag-Grid-AutoColumn') {
        newData['__treepath__'].pop();
        newData['__treepath__'].push(newData[field])
      }
    }

    //상태 저장
    valueChangeTrx(newData, field, oldValue, newValue)

    const res = gridRef.current.api.applyTransaction({
      update: [newData],
    });

    if(useCustomCallback.current.onCellValueChanged) {
      useCustomCallback.current.onCellValueChanged(event)
    }
  }
  ,[valueChangeTrx, props])

  const setContextToGridRef=(grid) => {
    const context=grid.context
    if(context) {
        Object.keys(context).forEach(k => {
          grid[k] = context[k];
        })
    }
  }

  const setGridRef=(el)=>{
    if(el && el != gridRef.current) {
      gridRef.current=el;
      //1. context 에 정의된 함수 레퍼런스를 만든다.
      setContextToGridRef(gridRef.current);
      //2. viewInfo에 등록
      let viewObj={
        type:'grid',
        isUpdated: ()=> gridRef.current.context.isUpdated(),
        gridRef: el
      }
      const key = props.id || internalGridId.current
      //setViewInfo(activeViewId, key, viewObj)
    }
  }

  /**
   * onGridReady wrapper store에 aggrid api 설정, store 함수들이 이용할 수 있다.
   * 이 함수가 부모가 AGGrid가 mount되는 것보다 나중에 호출된다.
   */
  const internalOnGridReady = params=> {

    //console.log('Grid GridReady')
    setGridObject(params, props.miscOpt); //1. store에 gridObject 저장
    setGridRef(params)                    //2. viewInfo 등록

    createColumnDefs(props);
    
    //개인화를 위한 것
    if(props.gridCd)
      setCustomCtxValue('gridCd',props.gridCd)
    
    if(useCustomCallback.current.onGridReady) {
      useCustomCallback.current.onGridReady(params)
    }
  }

  const isEqualState=(prevState, state)=>{

    if(isDeepEqualWithUndef(prevState.AggregationState, state.AggregationState) &&
      isDeepEqualWithUndef(prevState.columnOrder, state.columnOrder) &&
      isDeepEqualWithUndef(prevState.columnPinning, state.columnPinning) &&
      isDeepEqualWithUndef(prevState.columnVisibility, state.columnVisibility) &&
      isDeepEqualWithUndef(prevState.filter, state.filter) &&
      isDeepEqualWithUndef(prevState.sort, state.sort) &&
      isDeepEqualWithUndef(prevState.rowGroup, state.rowGroup)
    )
      return true;
    else
      return false;
  }
  const internalOnStateUpdated = params => {

    //변화된 상태에 따라 merge 다시 계산
    const gridState = prevGridState.current;
    if(gridState) {
      if(! isEqualState(params.state, gridState) ) {
        const displayedCols = gridRef.current.api.getAllGridColumns();
        if(displayedCols) {
          const colDefs = displayedCols.map(dc=> dc.colDef)
          calcMerge2(colDefs, params.api)
        }
      }
    }

    if(useCustomCallback.current.onStateUpdated) {
      useCustomCallback.current.onStateUpdated(params)
    }
    prevGridState.current = params.state;
  }

  const internalOnGridPreDestroyed= params => {
    //그리드 상태를 저장한다.
    if(!isDeepEqual(initialState, params.state))
      setInitialState(params.state)

    //console.log('Grid Destroyed', params.state)
        
    if(useCustomCallback.current.onGridPreDestroyed) {
      useCustomCallback.current.onGridPreDestroyed(params)
    }
  }

  /* 컨텍스트 메뉴 */
  const internalGetContextMenuItems= params=>{

    if(useCustomCallback.current.getContextMenuItems) {
      return useCustomCallback.current.getContextMenuItems(params)
    }
    const defaultItems = params.defaultItems
    let result=[];
    if(defaultItems)
      result= result.concat(defaultItems)

    result.push(
      {
        name: 'Export Upload Template',
        action: () => {
          exportGridtoExcel(params)
        },
      },
    );
    
    return result;
  }
  
  const internalGetCodeDefs=(props, field)=> {
    //애매하다. 
    if(useCustomCallback.current.onGetCodeDefs)
        return useCustomCallback.current.onGetCodeDefs(props,field)

    return gridCodoes.current[field]
  }

  /////////////////// Context 함수 //////////////////////////////////
  /** _rowId 구성, 머지 calc */
  const fillJsonData = useCallback((rowDatas)=> {
    //다시한번 rowData에 변화를 줄수 있는 기회를 준다.
    if(gridRef.current && useCustomCallback.current.onBeforeDataSet)
      useCustomCallback.current.onBeforeDataSet(gridRef.current, rowDatas)

    //rowData 전처리, 내부 rowId 구성
    if(rowDatas) {
      //아직 gridRef.current 생성되지 않았을 수 있다.
      //칼럼정보를 이용해서..date 형인 칼럼정보
      const fItem = new FlatternColumns(itemsRef.current || [])
      const columnDefs = fItem.getFlatColumnDefs();

      //날짜 타입 칼럼은 datetime과 date에 따라 변경 처리해줘야 한다. 
      const dateCols=columnDefs.filter(c => isColumnDateType(c))

      rowDatas.forEach((data, idx)=> {
        data['_rowId'] = idx; //_rowId 설정

        dateCols.forEach(dc => {
          //subtype은 확장 프로퍼티다. 그래서 columnDefs에서 찾으면 안된다.
          data[dc.field] = to_date(data[dc.field], dc.subtype)
        })
      })
    
      if(gridRef.current) {
        const displayedCols = gridRef.current.api.getAllGridColumns();
        if(displayedCols) {
          const colDefs = displayedCols.map(dc=> dc.colDef)
          calcMerge(colDefs, rowDatas,gridRef.current.api)
        }
      }
    }
    setRowData(rowDatas)

    if(gridRef.current && useCustomCallback.current.onAfterDataSet)
      useCustomCallback.current.onAfterDataSet(gridRef.current, rowDatas)
  },[])
 
  /** rowNode를 리턴
   * row: rowId || RowNode || RowNode.data  
  */
  const getRowNode=(row) =>{
    if(!row)
      return undefined;

    if(typeof row == 'object') {
      if(row instanceof RowNode) {
        return row;
      }
      else {
        return gridRef.current.api.getRowNode(row._rowId.toString())
      }        
    }
    else
      return gridRef.current.api.getRowNode(row.toString())
  }

  const getRowNodeData=(rows)=> {
    if(Array.isArray(rows)) {
      const changeData = rows.map(d=> { 
        const node = getRowNode(d);
        if(node)
          return node.data;
      })
      return changeData;
    }
    else {
      const node = getRowNode(rows);
      if(node)
        return node.data;
    }    
  }

  const getJsonRow = useCallback((rowId) => {
    const ret = [];
    const node = getRowNode(rowId)
    if(node)
      return node.data
    else
      return undefined;
  }, []);
  
  const getJsonRows = useCallback((predicate) => {
    const ret = [];
    gridRef.current.api.forEachNode(function (node) {
      if(node.data) {
        if(predicate && predicate(node.data))
          ret.push(node.data);
        else
          ret.push(node.data);
      }
    });
    return ret;
  }, []);

  const getDistinctValues =  useCallback((field, maxcount) => {
    const ret = new Set();
    gridRef.current.api.forEachNode(function (node) {
      if(node.data) {
        ret.add(gridRef.current.api.getValue(field, node))        
      }
    });
    const retArr= Array.from(ret);
    if(maxcount && maxcount < retArr.length)
      return retArr.slice(0,maxcount);
    else
      return retArr;
  }, []);

  const addRowData = useCallback((addIndex, newItems) => {
    if(!newItems)
      newItems = {_rowId: getLastRowIdx()};
    else {
      newItems._rowId = getLastRowIdx();
    }
    if(!Array.isArray(newItems))
      newItems=[newItems]
    
    addRowTrx(newItems);

    const res = gridRef.current.api.applyTransaction({
      add: newItems,
      addIndex: addIndex,
    });
    return res;
  }, []);

  const insertRowData = (addIndex, newItems) => {  //수정
    if(addIndex == undefined || addIndex == null) {
      // var focusedCell = gridRef.current.api.getFocusedCell();
      const selNodes = gridRef.current.api.getSelectedNodes();     
      if(selNodes && selNodes.length > 0) {
        //const selNode = selNodes[selNodes.length -1]
        //addIndex = selNode.rowIndex;
        let idx = selNodes[0].rowIndex;
        addIndex = idx +1 ;
      } else {
        addIndex = 0;
      }
    }
    return addRowData(addIndex, newItems);
  }

  const clearRowData = useCallback(() => {
    const delRowDatas = [];
    gridRef.current.api.forEachNode(function (node) {
      delRowDatas.push(node.data);
    });

    removeRowTrx(delRowDatas);
    const res = gridRef.current.api.applyTransaction({
      remove: delRowDatas,
    });
    return res;
  }, []);

  /**
   * 트랜잭션을 만들지 않는다.
   */
  const clearRows= useCallback(() => {
    const delRowDatas = [];
    gridRef.current.api.forEachNode(function (node) {
      delRowDatas.push(node.data);
    });

    rollback();
    const res = gridRef.current.api.applyTransaction({
      remove: delRowDatas,
    });
    return res;
  }, []);


  const removeRowSeleted = useCallback(() => {
    const selectedData = gridRef.current.api.getSelectedRows();

    removeRowTrx(selectedData);
    const res = gridRef.current.api.applyTransaction({ remove: selectedData });
    return res;
  }, []);

  const removeRows = useCallback((ids) => {
    const removeData=[]
    if(Array.isArray(ids)) {      
      ids.forEach(id=> {
        const node = getRowNode(id);
        removeData.push(node.data)
      })
    }
    else {
      const id = ids;
      const node = getRowNode(id);
      removeData.push(node.data);
    }
    removeRowTrx(removeData);
    const res = gridRef.current.api.applyTransaction({ remove: removeData });
    return res;
  }, []);
  

  /* rows: node ||  rowId 배열 또는 단일값 */
  const selectRows = useCallback((rows) => {
    const nodesToSelect =[]
    if(Array.isArray(rows)) {
      rows.forEach(row => {
        let node= getRowNode(row)
        if(node)
          nodesToSelect.push(node)
      });
    }
    else {
      const row = rows;
      let node= getRowNode(row)
      if(node)
        nodesToSelect.push(node)
    }
    gridRef.current.api.setNodesSelected({ nodes: nodesToSelect });
  }, []);

  const selectRow= useCallback((row) => {
    let node= getRowNode(row);
    
    node.setSelected(true,true);
  }, []);


  /* rows: node ||  rowId */
  const setValue=(row, field, newValue, supressRefresh)=> {  
    let node = getRowNode(row);

    if(node && node.data) {
      const oldValue = node.data[field] ;
      node.data[field] = newValue;    
      //상태 저장
      valueChangeTrx(node.data, field, oldValue, newValue) 

      const res = gridRef.current.api.applyTransaction({
        update: [node.data],
      });

      if(!supressRefresh) {
        gridRef.current.api.refreshCells({
          force:true,
          suppressFlash:false,
          rowNodes: [].concat(node),
          columns: [].concat(field)
        })
      }
      return res;
    }
  }

  const setValues=(rows, field, newValue, supressRefresh)=> {  

    const batchSet=[]
    rows.forEach((row)=> {
      let node= getRowNode(row);
       
      if(node && node.data) {
        const oldValue = node.data[field] ;
        node.data[field] = newValue;    
        //상태 저장
        valueChangeTrx(node.data, field, oldValue, newValue) 
        batchSet.push(node.data)
      }
    })
    
    const res = gridRef.current.api.applyTransaction({
      update: batchSet,
    });

    if(!supressRefresh) {
      gridRef.current.api.refreshCells({
        force:true,
        suppressFlash:false,
        rowNodes: [].concat(batchSet),
        columns: [].concat(field)
      })
    }
    return res;
  }
  /* rows: node ||  rowId */
  const getValue=(row, field)=> { 
    let node = getRowNode(row);
    
    if(node && node.data) {
      return node.data[field] ;
    }
    else
      return undefined;
  }
  /** editting cell stopEditing, 값을 반영한다. */
  const editCommit=() => {
    const cellDefs = gridRef.current.api.getEditingCells(); 
    
    for(let i=0; i < cellDefs.length; i++) {

    }
    gridRef.current.api.stopEditing();    
  }

  const refreshCells=(row, field, force,suppressFlash)=> {

    let node=null;
    if(row) 
      node= getRowNode(row);
    
    if(node) {
      if(field != undefined) {
        gridRef.current.api.refreshCells({
          force: force !=undefined ? force : true,
          suppressFlash: suppressFlash !=undefined ? suppressFlash : false,
          rowNodes: [].concat(node),
          columns: [].concat(field)
        })
      }
      else {
        gridRef.current.api.redrawRows({
          rowNodes: [].concat(node)
        })
      }
    }
    else { //node가 undefined이면
      if(field != undefined) {
        gridRef.current.api.refreshCells({
          force: force !=undefined ? force : true,
          suppressFlash: suppressFlash !=undefined ? suppressFlash : false,
          columns: [].concat(field)
        })
      }
      else {
        gridRef.current.api.refreshCells({
          force: force !=undefined ? force : true,
          suppressFlash: suppressFlash !=undefined ? suppressFlash : false
        })
      }
    }
  }
  /**
   * 그리드 크기에 맞춰 칼럼 크기 조정
   */
  const fitGridData = useCallback(() => {
    gridRef.current.api.sizeColumnsToFit()
  }, [gridRef.current]);

  /**
   * cell 내용에 맞추어 칼럼크기 조정
   */
  const autoColumnSize = useCallback((skipHeader) => {
    const allColumnIds = [];
    gridRef.current.columnApi.getColumns().forEach((column) => {
      allColumnIds.push(column.getId());
    });

    gridRef.current.columnApi.autoSizeColumns(allColumnIds, skipHeader);
  }, [gridRef.current]);

  /**
   * 칼럼 속성 변경
   */
  const setGroupColumnProperty = useCallback( (colDefs, colId, prop, value) => {
    colDefs.forEach(function (colDef) {
      if (colDef.colId === colId) {
        colDef[prop] = value;        
      } else if (colDef.children) {
        setGroupColumnProperty(colDef.children, colId, prop, value);
      }
    });
  }, [gridRef.current]);

  const setColumnProperty = useCallback( (colId, prop, value) => {
    const columnDefs = gridRef.current.api.getColumnDefs();
    setGroupColumnProperty(columnDefs, colId, prop, value); 

    gridRef.current.api.setColumnDefs(columnDefs);
  }, [gridRef.current]);
  
  /**
   * 칼럼 속성
   */
  const getColumnProperty = useCallback((colId, prop) => {
    const columnDefs = gridRef.current.api.getColumnDefs();
    const colDef= columnDefs.find(colDef => colDef.colId == colId)
    if(colDef)
      return colDef[prop]
    else
      return undefined;  
  }, [gridRef.current]);

  const getColumnDefs= useCallback(() => {
    return gridRef.current.api.getColumnDefs();
  }, [gridRef.current]);

  /** 스클로 뷰에서 최상위 rowidx */
  const getTopRowIndexInScrollView = useCallback(() => {
    return gridRef.current.api.getModel().getRowIndexAtPixel(0);
  }, [gridRef.current]);

  /** 스클로 뷰에서 최상위 rowNode */
  const getTopRowNodeInScrollView = useCallback(() => {
    const rowidx = gridRef.current.api.getModel().getRowIndexAtPixel(0);
    if(rowidx >=0) {
      return gridRef.current.api.getDisplayedRowAtIndex(rowidx)
    }
    else
      return undefined;
  }, [gridRef.current]);

  const setCodeDefs=(field, options) =>{
    if(typeof field == 'string')
      gridCodoes.current[field] = options;
    else
      gridCodoes.current[field.field] = options;
  }

  const getCodeDefs=(filed)=> {
    return gridCodoes.current[filed]
  }

  //일괄 validation 체크
  const validateCells= useCallback(() => {
      return validation;
  }, [gridRef.current]);

  const getGridItems=()=> {
    return itemsRef.current
  }

  const getGridColumnDefs=()=>{
    return gridColumnDefs;
  }

  const getStoreApi=()=> {
    return gridStoreRef.current
  }

  const setObjectRows=(jsonArr, option) => {
    const ftd = new FlatternTreeData(jsonArr, option)
    const flatternArr = ftd.getTreeData();
    fillJsonData(flatternArr)
    return flatternArr;
  }
  
  const findNode=(rowidx, predicate)=> {
    const model = gridRef.current.api.getModel()
    const rowCnt = model.getRowCount();//gridRef.current.api.getDisplayedRowCount()
    for(let i= rowidx; i < rowCnt; i++) {
      const node= model.rowsToDisplay[i];
      if(predicate(node, i)==true)
        return node;
    }
    return undefined;
  }

  const getRowCount=()=> {
    const model = gridRef.current.api.getModel()
    const rowCnt = model.getRowCount();//gridRef.current.api.getDisplayedRowCount()
    return rowCnt;
  }

  /////////////////// Context 함수 끝 //////////////////////////////////

  /** custom 이벤트 콜백 등에 사용된 props를 벗겨낸다. */
  function stripWrapProps(orgProps){

    createColumnDefs(orgProps)

    const {
      gridOptions, 
      columnDefs:propsColumnDefs, 
      items,
      className,
      getRowId,            //use internal wrap function 
      onCellValueChanging, //custom event callback
      onCellValueChanged,  //readOnlyEdit 모드에서  custom event callback으로 처리
      onGridReady,         //use internal wrap function 
      onBeforeDataSet,     //custom event callback
      onAfterDataSet,      //custom event callback
      onGetCodeDefs,       //cell dropdown lookup code를 호출
      onStateUpdated,      //use internal wrap function
      onGridPreDestroyed,  //use internal wrap function
      getContextMenuItems, //use internal wrap function
      context,             //user merge
      components,          //user merge
      defaultColDef,       //user merge
      columnTypes,          //user merge
      defaultExcelExportParams, //user merge
      autoGroupColumnDef,     //user merge
      excelStyles,//user merge
      rowData,             //별도 정제 처리:_rowId와 데이트 타입 값 설정
      ...ohterProps
    } = orgProps

    if(context)
      userCustomContext.current= context;
    if(components)
      userCustomComponents.current= components;

    if(onCellValueChanging)
      useCustomCallback.current.onCellValueChanging =onCellValueChanging;
    if(onCellValueChanged)
      useCustomCallback.current.onCellValueChanged =onCellValueChanged;
    if(onGridReady)
      useCustomCallback.current.onGridReady =onGridReady;
    if(getRowId)
      useCustomCallback.current.getRowId =getRowId;

    if(onBeforeDataSet)
      useCustomCallback.current.onBeforeDataSet =onBeforeDataSet;
    if(onAfterDataSet)
      useCustomCallback.current.onAfterDataSet =onAfterDataSet;
    if(onGetCodeDefs)
      useCustomCallback.current.onGetCodeDefs =onGetCodeDefs;

    if(onStateUpdated)
      useCustomCallback.current.onStateUpdated =onStateUpdated;
    if(onGridPreDestroyed)
      useCustomCallback.current.onGridPreDestroyed =onGridPreDestroyed;
    if(getContextMenuItems)
      useCustomCallback.current.getContextMenuItems =getContextMenuItems;

    //사용자 정의 옵션과 머지
    if(defaultColDef)
      wrapperInitOptions.current.defaultColDef={...wrapperInitOptions.current.defaultColDef,...defaultColDef};
    if(columnTypes)
      wrapperInitOptions.current.columnTypes={...wrapperInitOptions.current.columnTypes,...columnTypes};

    if(defaultExcelExportParams)
      wrapperInitOptions.current.defaultExcelExportParams={...wrapperInitOptions.current.defaultExcelExportParams,...defaultExcelExportParams};
    if(excelStyles)
      wrapperInitOptions.current.excelStyles={...wrapperInitOptions.current.excelStyles,...excelStyles};

    if(autoGroupColumnDef) {
      wrapperInitOptions.current.autoGroupColumnDef={...wrapperInitOptions.current.autoGroupColumnDef, ...autoGroupColumnDef};
    }    
    
    let otherGridOptions =undefined;
    if(gridOptions) {
      otherGridOptions= stripWrapProps(gridOptions)
    }

    return {...ohterProps,...wrapperInitOptions.current,...otherGridOptions};
  }

  function getGridOptionFromProps(props) {
    const ohterOptions=stripWrapProps(props)
    
    let defGridOptions= {
      //디폴트 옵션 설정한다. 
      readOnlyEdit: true,       //사용자가 에디팅한 것을 grid에 반영하지 않고 cellEditRequest 호출
      stopEditingWhenCellsLoseFocus : true,
      suppressRowTransform: true,    //rowSpan을 가능하게 하기 위해
      suppressFieldDotNotation:true, //필드 이름에 '.' 가능해야한다.
      localeText: localeText,
      enableRangeSelection: true,
      suppressRowClickSelection: false, //checkbox selection 처리시 rowselect false로
      undoRedoCellEditing: true,
      undoRedoCellEditingLimit: 20,
      enableFillHandle: true,
      enableCellChangeFlash: true,
      animateRows: true,
      //popupParent: ()=> document.querySelector('#' + uuid.current),
      ...ohterOptions,
    }

    if(defGridOptions.treeData && !defGridOptions.getDataPath) {
      defGridOptions.getDataPath = internalGetDataPath;
    }

    return defGridOptions;
  }

  //AG Grid 옵션의 동적 변경
  function setExtGridOptions(options){
    const ohterOptions=stripWrapProps(options)
    dynamicExtOptions.current = ohterOptions;
  }

  const getExtGridOptions=()=>{
    return dynamicExtOptions.current;
  }

  const loadingCellRenderer = useMemo(() => {
    return CustomLoadingCellRenderer;
  }, []);
  const loadingCellRendererParams = useMemo(() => {
    return {
      loadingMessage: 'Loading...',
    };
  }, []);
  
  const unmount = useCallback(() => {
    destroyStore();
  },[])

  const reloadGrid = useCallback(() => {
    setGridVisible(false);
    setTimeout(() => {
      setGridVisible(true);
    });
  }, [gridColumnDefs,rowData]);
  
  useEffect(()=>{
    if(!isDeepEqual(prevProps.current, props)) {
      const grdOptions=getGridOptionFromProps(props)
      setMyGridOptions(grdOptions)
      prevProps.current=props;
    }
  },[props])

  useEffect(()=> {
    if(props.rowData)
      fillJsonData(props.rowData);
  },[props.rowData])

  //언어가 바뀌면 새로 그린다. reload 해야할지 테스트해야함.
  // useEffect(()=> {
  //   if(gridRef.current && resetLangEvent) {
  //     gridRef.current.api.refreshCells();
  //     gridRef.current.api.refreshHeader();
  //     //reloadGrid();
  //   }
  // },[resetLangEvent])
      
  useEffect(()=>{
    return unmount;
  },[])

  //이전 상태가 있다는 건
  //그리드가 다시 생성되었다는 의미.
  useEffect(()=>{
    if(initialState)
     reloadGrid();
  },[initialState])

  return (
    <div id={uuid.current} style={{ height: "100%", width:'100%',paddingRight:'5px'}} className={props.className || "ag-theme-alpine"}>
        {gridVisible && <AgGridReact 
            id = {internalGridId.current}
            initialState={initialState}
            columnDefs={gridColumnDefs}      
            rowData={rowData}
            suppressPropertyNamesCheck= {true} //unknown gridOption or colDef property warning supressed
            loadingCellRenderer={loadingCellRenderer}
            loadingCellRendererParams={loadingCellRendererParams}
            getRowId = {internalGetRowId}
            onCellEditRequest ={internalOnCellEditRequest}
            onGridReady={internalOnGridReady}            
            onStateUpdated={internalOnStateUpdated}
            onGridPreDestroyed={internalOnGridPreDestroyed}
            //popupParent= {document.querySelector('body')} //팝업창에서 사용시 그리드 팝업이 팝업창 뒤로 숨는 문제가 있어서 zIndex 정리후 오픈 
            getContextMenuItems= {internalGetContextMenuItems}

            components= { {
              zExcelTypeCellEditor:ExcelTypeCellEditor,
              zMultiColumnSelectCellEditor:MultiColumnSelectCellEditor,
              zCustomDateCellEditor:CustomDateCellEditor,
              zCheckboxHeader: CheckboxCustomHeader,
              ...userCustomComponents.current
              }
            }
            
            context= {{
                //칼럼
                getGridItems: getGridItems,
                getGridColumnDefs:getGridColumnDefs,
                setColumnProperty:setColumnProperty,
                //setGroupColumnProperty:setGroupColumnProperty,
                getColumnProperty:getColumnProperty,
                getColumnDefs:getColumnDefs,
                //store
                getStoreApi: getStoreApi,
                setCustomCtxValue: setCustomCtxValue,
                getCustomCtxValue: getCustomCtxValue,
                //동적 gridOptions 
                setExtGridOptions : setExtGridOptions,
                getExtGridOptions : getExtGridOptions,
                //데이타 핸들링
                fillJsonData:fillJsonData,
                getJsonRow: getJsonRow,
                getJsonRows: getJsonRows,
                getDistinctValues:getDistinctValues,
                clearRowData:clearRowData,
                clearRows:clearRows,
                setValue:setValue,
                setValues:setValues,
                getValue:getValue,
                removeRowSeleted:removeRowSeleted,
                removeRows:removeRows,
                addRowData:addRowData,
                insertRowData:insertRowData,
                getUpdatedRows: getUpdatedRows,
                getRemovedRows:getRemovedRows,
                getNewRows:getNewRows,
                getAllUpdatedRows:getAllUpdatedRows,
                getAllUpdatedRowStates:getAllUpdatedRowStates,
                isNewRow:isNewRow,
                getRowState:getRowState,
                isUpdated:isUpdated,
                commit: commit,
                rollback: rollback,
                editCommit: editCommit,
                setObjectRows:setObjectRows,
                //MISC
                getRowNode:getRowNode,
                getRowNodeData:getRowNodeData,
                findNode:findNode,
                selectRows:selectRows,
                selectRow:selectRow,
                getRowCount:getRowCount,
                refreshCells:refreshCells,
                fitGridData:fitGridData,                
                autoColumnSize:autoColumnSize,   
                getTopRowIndexInScrollView: getTopRowIndexInScrollView,
                getTopRowNodeInScrollView: getTopRowNodeInScrollView,
                validateCells:validateCells,        
                setCodeDefs:setCodeDefs,    
                internalGetCodeDefs: internalGetCodeDefs,
                getCodeDefs:getCodeDefs,
                reloadGrid:reloadGrid,
                ...userCustomContext.current
            }}
            
            {...myGridOptions}
            {...dynamicExtOptions.current}

          />
        }
    </div> 
  )
})

AGGrid.propTypes= {
  
}

AGGrid.displayName='AGGrid';

export default AGGrid;
