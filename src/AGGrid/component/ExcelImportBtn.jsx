import React, { useState, useRef, useEffect } from "react";
import PropTypes from 'prop-types';
import IconButton from '@mui/material/IconButton';
import * as XLSX from 'xlsx';
import { Box, Tooltip  } from '@mui/material'
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { PopupDialog, zAxios, createUniqueKey,getAppSettings } from '@zionex/wingui-core/index';
import { getHeaderDepth } from "../GridObject";
import AGGrid from "../AGGrid";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const fileStyle = { width: 0, height: 0, padding: 0, overflow: "hidden", border: 0 }

const NULL_VALUE='__NA__'
/**
 * Excel파일을 import하는 3가지 경우의 수
 * 1. bindInfo 가 첫행에 있는 엑셀파일의 경우엔 bindInfo를 이용해서 바로 처리 UI가 보여지지 않는다
 * 2. 미리 정해진 Import Template Excel 파일을 사용하는 경우
 *     props에 bindingColumns 와 headerDepth 가 존재해야 한다. 없으면 임의의 excel 파일로 처리
 * 3. 아무 정보가 없는 임의의 excel 파일인 경우, 임포트할 값을 조정하기 위해 팝업 UI가 뜬다.
 *   3-1. excelImporter 의 getColumnDefs() 로 임포트할 값 정보를 미리 설정, 없으면 field값도 입력받는다. 
 * 
 * excelImporter: 엑셀을 import 하려는 객체
 * 아래 프로퍼티를 제공한다.
 * 
 * getColumnDefs,PropTypes.func,   
 * onExcelImportSelect: PropTypes.func,
   onExcelImportSuccess:PropTypes.func,
   onExcelImportError:PropTypes.func,
   onExcelImportComplete: PropTypes.func,
 * 
 * @param {*} props 
 * @returns 
 */
export function ExcelImportBtn({excelImporter, preProcessData,bindingColumns, headerDepth,...props}) {

  let component = getAppSettings('component');
  const iconClasses = useIconStyles();
  //grid: excel handler 그리드 객체가 넘어어오면 
  excelImporter = excelImporter || {}

  const clientside= props.clientside != undefined ? props.clientside : true
  
  const inputId = useRef(null);
  if (!inputId.current)
    inputId.current = createUniqueKey();

    
  const [snackMsg, setSnackMsg] = useState({ snackOpen: false })

  const [showExcelDataPopup, setShowExcelDataPopup] = useState(false) //칼럼 매칭을 위한 팝업을 보여줌
  const [grid, setGrid] = useState(null);
  const [excelData, setExcelData] = useState([]) //파일에서 읽은 엑셀 데이타
  const [excelColDefs, setExcelColDefs] = useState([]) //엑셀 파일 colDefs
  const [gridExcelData, setGridExcelData] = useState([]) //엑셀 데이타 100개, 제일 긴 row값 등을 넣는다.
  const topPinnedRow = useRef([])

  const [refData, setRefData] = useState(null)
  const [fieldCodes, setFieldCodes] = useState(null)

  //getColumnDefs 자동으로 설정 못하면 rowData 칼럼키를 직접 쓴다.
  const manualColumnDef = useRef(false)
  const excelHeaderDepth = useRef(1); //엑셀파일의 헤드 높이, 수동으로 맵핑할 때만 사용됨


  useEffect(()=>{
    if(grid && topPinnedRow.current && topPinnedRow.current.length >0) {
        grid.api.setPinnedTopRowData(topPinnedRow.current)
    }
  },[grid, topPinnedRow.current])

  const onGridReady = (params) => {
    setGrid(params)
  }

  const getRowStyle= (params) => {
    if (params.node.rowPinned) {
      if(params.node.data && params.node.data['columnMap']) {
        return { fontWeight: 'bold', 'background-color': '#ffffd2' };
      }
      else
        return { fontWeight: 'bold', 'background-color': 'var(--ag-header-background-color)' };
    }
  }

  const isEditable =  (params) => {
    if (params.node.rowPinned) {
      if(params.node.data && params.node.data['columnMap'])
        return true;
    }
    return false;
  }

  const changeExcelHeaderDepth=(h)=>{
    //1. topPinnedRow를 다시 만든다.
    let newTopPinnedRow=[];
    const excelHeaderRow=[];
    //첫번째는 그대로
    newTopPinnedRow.push(topPinnedRow.current[0]);

    //excel 헤드 영역
    for(let i=0; i < Math.min(excelData.length, h); i++) {
      const rows = excelData[i]
      let rowObj={}
      for(let c =0; c < rows.length; c++){
        const field = excelColDefs[c].field
        rowObj[field]= rows[c]
      }
      excelHeaderRow.push(rowObj)
    }
    newTopPinnedRow= newTopPinnedRow.concat(excelHeaderRow);
    topPinnedRow.current=newTopPinnedRow;      

    //2. ui에 excel grid data 다시 생성 
    //100 개만
    const excelGridData=[]
    for(let i=h; i < Math.min(excelData.length, 100); i++) {
      const rows = excelData[i]
      let rowObj={}
      for(let c =0; c < rows.length; c++){
        const field = excelColDefs[c].field
        rowObj[field]= rows[c]
      }
      excelGridData.push(rowObj)
    }
    setGridExcelData(excelGridData);
    excelHeaderDepth.current = h;
  }

  /** 컨텍스트 메뉴 아이템 */
  const getContextMenuItems=(params) => {

    let excelHDepth = excelHeaderDepth.current;
    if(params.node.rowPinned && params.node.data && params.node.data['columnMap'])
    {
      return []
    }
    else if(params.node.rowPinned && params.node.data && !params.node.data['columnMap']) {
      const result = [
        {
          // custom item
          name: 'Unset Header',
          action: () => {
            let h = excelHDepth - (excelHDepth - params.node.rowIndex +1) 
            changeExcelHeaderDepth(h)
          },
          cssClasses: ['redFont', 'bold'],
        }
      ];
    
      return result;
    }
    else {
      const result = [
        {
          // custom item
          name: 'Set Header',
          action: () => {
            let h = excelHDepth + params.node.rowIndex +1;// pin rowIndex따로 임. 다시 0부터 시작함
            changeExcelHeaderDepth(h)
          },
          //cssClasses: ['redFont', 'bold'],
        }
      ];
    
      return result;
    }
  }

  const cellEditorSelector=(params, fieldCodes)=> {

    if(fieldCodes && fieldCodes.length > 0) {
      return {
        component : 'agSelectCellEditor',
        params : {
          values: fieldCodes,
        }
      }
    }
    else
      return undefined;
  }

  const onCellValueChanged = (event) => {
    const data = event.data;
    const field = event.colDef.field;
    const oldValue = event.oldValue;
    const newValue = event.newValue;

    excelColDefs.forEach(col => {
      const colNm = col.field;
      if(colNm != field)
      {
        //중복된게 있으면 
        if(newValue == data[colNm]) {
          //data[colNm] = NULL_VALUE;
          event.context.setValue(event.node, colNm, NULL_VALUE)
        }
      }
    })
  }

  /**
   * excel data가 배열로 저장되었다는 건 맵핑 UI를
   * 타도록 할때만 설정된다.
   * 1. 
   */
  useEffect(()=>{

    const newExcelColDefs=[]
    const excelGridData=[]
    let newRefData={}
    newRefData[NULL_VALUE]=' ';
    const newFieldCodes=[NULL_VALUE]

    if(excelData && excelData.length > 0) {
      
      let hdepth=1;
      let colDefs=null;
      
      if (excelImporter.getColumnDefs) {
        colDefs = excelImporter.getColumnDefs();  
        
        colDefs.forEach( col => {
          const key = col.field;
          const label = col.headerName || col.field
          newFieldCodes.push(key)
          newRefData[key] = label;
        })
        setRefData(newRefData)
        setFieldCodes(newFieldCodes)
        //헤더 깊이
        hdepth = getHeaderDepth(colDefs,0)
      }
      excelHeaderDepth.current =hdepth

      //엑셀 데이타 칼럼 체크
      let maxColLen=0;
      for(let i=0; i < excelData.length; i++) {
        const rows = excelData[i]
        maxColLen = Math.max(maxColLen, rows.length)
      }
      if(colDefs) {
        maxColLen = Math.max(maxColLen, colDefs.length)
      }

      //엑셀 colDefs 정의
      for(let i= 0; i < maxColLen; i++) {
        newExcelColDefs.push({
          field: `C[${i}]`,
          editable: isEditable,
          cellDataType: false,
          cellEditorSelector:(params) => cellEditorSelector(params,newFieldCodes),
          refData: newRefData,
          cellRenderer: props => {
              const cellValue = props.valueFormatted ? props.valueFormatted : props.value;
              return <span>{cellValue}</span>
            },
          })
      }
      setExcelColDefs(newExcelColDefs);

      let newTopPinnedRow=[]   //고정 시킬 Rows 아래 엑셀 파일 헤드영역과 칼럼 맵핑 row는 topr고정
      const excelHeaderRow=[]; //엑셀 파일 헤드영역
      const mappedColumnRow={} // 칼럼 맵핑 영역      

      if (colDefs) {       
        newExcelColDefs.forEach((col, i)=>{
          if(colDefs.length > i)
            mappedColumnRow[`C[${i}]`] = colDefs[i].field;
          else
            mappedColumnRow[`C[${i}]`]=''
        })    
      }
      else {
        newExcelColDefs.forEach((col, i)=>{
            mappedColumnRow[`C[${i}]`]=''
        })
        manualColumnDef.current = true;
      }
      mappedColumnRow['columnMap'] =true
      newTopPinnedRow.push(mappedColumnRow);

      //excel 헤드 영역
      for(let i=0; i < Math.min(excelData.length, hdepth); i++) {
        const rows = excelData[i]
        let rowObj={}
        for(let c =0; c < rows.length; c++){
          const field = newExcelColDefs[c].field
          rowObj[field]= rows[c]
        }
        excelHeaderRow.push(rowObj)
      }
      newTopPinnedRow= newTopPinnedRow.concat(excelHeaderRow);
      topPinnedRow.current=newTopPinnedRow;      
      
      //100 개만
      for(let i=hdepth; i < Math.min(excelData.length, 100); i++) {
        const rows = excelData[i]
        let rowObj={}
        for(let c =0; c < rows.length; c++){
          const field = newExcelColDefs[c].field
          rowObj[field]= rows[c]
        }
        excelGridData.push(rowObj)
      }
      setGridExcelData(excelGridData);
      setShowExcelDataPopup(true)
    }
  },[excelData])

  //중복이 있으면 안된다.
  const isValidItems = (items) => {
    const err = items.some(function (x) {
      if (x.field == NULL_VALUE)
        return false;
      const ret = items.filter(a => a.field == x.field)
      return (ret.length > 1)
    });
    return err ? false : true;
  }

  const importExcel = (items, dataBeginIdx, data) => {

    if (!isValidItems(items))
      return;

    const transData = {}
    if (data.length > 0) {

      let RESULT_DATA = []

      for (let r = dataBeginIdx; r < data.length; r++) {
        let row = {}
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const field = item.field
          if (field != NULL_VALUE)
            row[field] = data[r][i]
        }
        RESULT_DATA.push(row)
      }
      if (preProcessData) {
        RESULT_DATA = preProcessData(RESULT_DATA);
      }
      transData.RESULT_DATA = RESULT_DATA;
      onExcelImportSuccess(transData)
    }
    onExcelImportComplete()
  }

  const onInputClick = (e) => {
    e.target.value = ''
  }

  const onExcelImportSelect = (uploadFile) => {
    if (excelImporter.onExcelImportSelect) {
      excelImporter.onExcelImportSelect(excelImporter,uploadFile)
    }
  }

  const onExcelImportSuccess = (data) => {
    if (excelImporter.onExcelImportSuccess) {
      excelImporter.onExcelImportSuccess(excelImporter,data)
    }
  }
  const onExcelImportComplete = () => {

    if (excelImporter.onExcelImportComplete) {
      excelImporter.onExcelImportComplete(excelImporter)
    }
  }
  const onExcelImportError = (err) => {
    if (excelImporter.onExcelImportError) {
      excelImporter.onExcelImportError(excelImporter,err)
    }
  }

  const onChange = async (e) => {
    e.preventDefault();

    if (e.target.files) {
      const uploadFile = e.target.files[0]
      onExcelImportSelect(uploadFile);
      const formData = new FormData()
      formData.append('file', uploadFile)

      await zAxios({
        method: 'post',
        url: baseURI() + 'excel-import',
        data: formData,
        timeout: 1800000,
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
        }
      }).then(
        (response) => {
          if (response.status === HTTP_STATUS.SUCCESS && response.data.RESULT_DATA) {
            onExcelImportSuccess(response.data)
          }
          else {
            //response.data.RESULT_SUCCESS
            onExcelImportError(response.data.RESULT_MESSAGE)
          }
          onExcelImportComplete()
        }
      ).catch(function (err) {
        onExcelImportError(err)
      });
      ;
    }
  }

  const getValidBindInfo = (bindInfo) => {
    let result = null;
    try {
      result = JSON.parse(bindInfo)
      return result;
    }
    catch (e) {
    }
    return result;
  }
  /**
   * sheetjs를 이용해서 클라이언트에서 읽어서 처리하도록
   * @param {*} e 
   */
  const onChangeClientSide = async (e) => {
    e.preventDefault();

    if (e.target.files) {
      const uploadFile = e.target.files[0]
      const reader = new FileReader();
      const rABS = !!reader.readAsBinaryString;
      reader.onload = (e) => {
        onExcelImportSelect(uploadFile);
        /* Parse data */
        const bstr = e.target.result;
        const wb = XLSX.read(bstr, { type: rABS ? 'binary' : 'array' });
        /* Get first worksheet */
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        /* 엑셀의 머지 정보를 처리한다. */
        if (ws['!merges']) {
          ws['!merges'].map((merge) => {

            const value = XLSX.utils.encode_range(merge).split(':')[0];
            for (let col = merge.s.c; col <= merge.e.c; col++)
              for (let row = merge.s.r; row <= merge.e.r; row++)
                ws[String.fromCharCode(65 + col) + (row + 1)] = ws[value];
          });
        }

        const data = XLSX.utils.sheet_to_json(ws, { raw: true, header: 1, blankrows: false });

        const transData = {}
        if (data.length > 0) {

          //이전 import 바인딩 정보가 첫번째 줄에 있으면 그것을 이용
          let bindInfo = data[0][0];
          let RESULT_DATA = []

          bindInfo = getValidBindInfo(bindInfo);//JSON.parse(bindInfo)
          if (bindInfo && bindInfo.BINDING_FIELDS) {
            const dataBeginIdx = bindInfo.DATA_BEGIN_IDX ? bindInfo.DATA_BEGIN_IDX : 2
            for (let r = dataBeginIdx; r < data.length; r++) {
              let row = {}
              for (let i in bindInfo.BINDING_FIELDS) {
                const field = bindInfo.BINDING_FIELDS[i]
                row[field] = data[r][i]
              }
              RESULT_DATA.push(row)
            }
            if (preProcessData) {
              RESULT_DATA = preProcessData(RESULT_DATA);
            }
            transData.RESULT_DATA = RESULT_DATA;
            onExcelImportSuccess(transData)
          }
          else {
            //일번 excel 파일이나 엄격하게 작성된 template이고 
            //해당 바인딩 정보를 알고 있다.
            if (bindingColumns && headerDepth) {
              let dataBeginIdx = headerDepth;
              for (let r = dataBeginIdx; r < data.length; r++) {
                let row = {}
                for (let i = 0; i < bindingColumns.length; i++) {
                  const field = bindingColumns[i]
                  row[field] = data[r][i]
                }
                RESULT_DATA.push(row)
              }

              if (preProcessData) {
                RESULT_DATA = preProcessData(RESULT_DATA);
              }
              transData.RESULT_DATA = RESULT_DATA;
              onExcelImportSuccess(transData)
            }
            else {
              //바인딩 정보가 없으면 데이타를 보여주고 헤드정보를 구성하도록 UI구성
              //이때도 colDefs가 있으면 이를 이용한다.
              setExcelData(data);
              return;
            }
          }
        }
        onExcelImportComplete()
      }
      reader.readAsBinaryString(uploadFile)
    }
  }

  const onSubmitExcelData = () => {

    const columnMapRowNode=grid.api.getPinnedTopRow(0);
    const data = columnMapRowNode.data;

    const columnDef=[]
    excelColDefs.forEach(col=>{
      columnDef.push(
        {
          field: data[col.field],
        })
    })
    
    if (!isValidItems(columnDef)) {
      showSnackMsg('중복된 칼럼이 존재합니다.')
      return;
    }

    setShowExcelDataPopup(false)
    importExcel(columnDef, excelHeaderDepth.current, excelData)
  }

  const handleSnackClose = () => {
    setSnackMsg({ snackOpen: false })
  }

  const showSnackMsg = (msg, alertSeverity) => {
    setSnackMsg({ snackOpen: true, snackMsg: msg, alertSeverity: alertSeverity || 'info' })
  }

  return (
    <>
      <input type="file" id={inputId.current} onChange={clientside ? onChangeClientSide : onChange} style={fileStyle} onClick={onInputClick} />
      <Tooltip title={transLangKey("EXCEL_IMPORT")} placement='bottom' arrow>
      <label htmlFor={inputId.current}>
      {component.button === 'icon' ?
        <IconButton className={iconClasses.gridIconButton} aria-label="excel" component='span'>
          <Icon.Upload size={20}/>
        </IconButton>
        : <Button variant="outlined" props={{ ...props }} >
          {transLangKey("EXCEL_IMPORT")}
      </Button>
      }
      </label>
      </Tooltip>
      {
        showExcelDataPopup && (
          <PopupDialog open={showExcelDataPopup} onClose={() => { setShowExcelDataPopup(false) }} onSubmit={onSubmitExcelData} resizeHeight={550} resizeWidth={550}>
            <Box sx={{ display: 'flex', flexDirection:'column', height:'100%' }}>
              {/* <Box>{getColumnDef()}</Box> */}
              <AGGrid style={{height:'100%'}} 
                  onGridReady={onGridReady} 
                  columnDefs={excelColDefs} 
                  rowData={gridExcelData} 
                  getRowStyle={getRowStyle}
                  allowContextMenuWithControlKey={ true}
                  getContextMenuItems={getContextMenuItems} 
                  onCellValueChanged={onCellValueChanged}
                  headerHeight={20}
                  defaultColDef={ {
                    flex: 1,
                    minWidth: 100,
                    resizable: true,
                  }}                  
                  />
            </Box>
          </PopupDialog>
        )
      }
      <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={snackMsg.snackOpen}
        autoHideDuration={3000}
        onClose={handleSnackClose} >
        <Alert onClose={handleSnackClose} severity={snackMsg.alertSeverity} sx={{ width: '100%' }}>
          {snackMsg.snackMsg}
        </Alert>
      </Snackbar>
    </>
  )
}

ExcelImportBtn.propTypes = {
  excelImporter: PropTypes.any,  
  clientside: PropTypes.bool,
  preProcessData: PropTypes.func,
  bindingColumns: PropTypes.arrayOf(PropTypes.string), /* template Excel 사용시 : field 명 배열 */
  headerDepth:PropTypes.number                         /* template Excel 사용시 :헤드 높이 */
};

ExcelImportBtn.displayName = 'ExcelImportBtn'