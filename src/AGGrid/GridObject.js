import React from 'react'
import { isGroupColumn } from "./utils/ColDefsHelper";
import StateCellRenderer from "./renderer/StateCellRenderer";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver'

export function convertCamelToSnake(str) {
  return str.replace(/([A-Z])/g, function (x, y) {
    return "_" + y.toLowerCase()
  }).replace(/^_/, "");
}

function transLangKey(a) {
  return a;
}
/**
 * colDef에서 삭제해야할 prop
 */
const uncompatibleItemProps= [
  'name',
  'dataType',
  'headerText',
  'validRules',  
  'columnType',
  'headerVisible',
  'hideChildHeaders',
  'expandable',
  'expanded',
  'format',
  'textAlignment',
  'useDropdown',
  'groupShowMode',
  'valueProp',
  'labelProp',
  'lang',
  'requisite',
  'values',
  'iteration',
  'numberFormat',
  'editFormat',
  'styleName',
  'merge',
  'title',
  'visible',
  'columnIdOrg',
  'isIterationColumn',
  'editableNew',
  'positiveOnly',
  'useDropDown',
  'aggName',
  //'mergeRule',
  'orgItem',
  'itemName',
  'GRP_CD',
  'colSeq',
  'colType',
]


//validation 결과에 따라 cellClassRules를 추가해준다.
const internalInvalidCellCssRule = (params,getValidationFail) => {
  if(params) {
    const data = params.data;
    const field = params.colDef.field;

    if(data) {
      const err=getValidationFail(data._rowId, field)    
      if(err) {
        return true;
      }
    }
    return false;
  }
}

const internalMergeCellCssRule =(params, customMergeCellCssRule) => { 
  if(customMergeCellCssRule !=undefined) {
    if(typeof customMergeCellCssRule =='function') {
      return customMergeCellCssRule(params);
    }
    else
      return customMergeCellCssRule
  }
  else {
    const columnId = params.colDef.field;
    const mergeInfo= params.data[`merged[${columnId}]`]
    if(mergeInfo && mergeInfo.merged > 1)
      return true;
    else
      return false;
  }
}

function internalRowSpan(params) {

  if(!params.data )
    return 1;

  const columnId = params.colDef.field; 
  const mergeInfo= params.data[`merged[${columnId}]`]

  if(!mergeInfo)
    return 1;

  // let startRow = params.api.getFirstDisplayedRow();    
  // let rowIndx = params.node.rowIndex;
  
  // if(startRow == rowIndx) {    
  //   const firstMergeInfo = mergeInfo.startMerge
  //   if(firstMergeInfo)
  //     return firstMergeInfo.merged - mergeInfo.mergeSeq;
  //   else
  //     return mergeInfo.merged;
  // }
  // else{
    return mergeInfo.merged;
  //}
}

/**
 * 날짜 비교 함수
 * @param {} filterLocalDateAtMidnight 
 * @param {*} cellValue 
 * @returns 
 */
export const myDateComparator = (filterLocalDateAtMidnight, cellValue) => {

  let cellDate = null;
  //1. cellValue의 타입을 확인
  if(typeof cellValue =='string') {
    cellDate = new Date(Date.parse(cellValue));
  }
  else if(cellValue instanceof Date) {
    cellDate = cellValue;
  }

  if (cellDate < filterLocalDateAtMidnight) {
    return -1;
  } else if (cellDate > filterLocalDateAtMidnight) {
    return 1;
  } else {
    return 0;
  }
}

 
/**
 * cell validation 처리 결과 오류 메시지 툴팁
 */
class InternalValidationTooltip {
  init(params) {
    this.eGui = document.createElement("div");
    this.eGui.classList.add("custom-tooltip");

    let { field, tooltip } = params.value;
    
    this.eGui.innerHTML = `
        <div class="validation-msg">
          <span >${tooltip}</span>
        </div> 
    `;
  }
  getGui() {
    return this.eGui;
  }
}

export function getHeaderDepth(columns, depth) {
  depth++;
  let childDepth = depth;

  for (let i = 0; i < columns.length; i++) {
    columns[i].depth = depth;
    if(isGroupColumn(columns[i])) {
        var tmp_group = columns[i];
        childDepth = Math.max(getHeaderDepth(tmp_group.children || tmp_group.childs, depth), childDepth);
    }
  }
  return Math.max(depth, childDepth);
}

function ApplyI18n(column) {
  if (isGroupColumn(column)) {
    column.children.map(childCol => {
      ApplyI18n(childCol)
    })
  }
  else if (column.lang && column.lang == true) {
    //displayvalue를 처리하기 위한 callback
    column.valueFormatter = function (params) {
      let tmp = transLangKey(params.value);
      return tmp;
    }
  }
}

function isValidEmail(email) {
  // taken from https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function checkInputCharValid(headerText, validRule, value) {
  let inputReg;

  let err = { level: "error", message: '' };
  if (value !== undefined && value !== null && value !== "") {

    if ("positive" == validRule) {
      inputReg = new RegExp(/^\d*[.]*\d*$/);
      if (inputReg.test(value) == false) {
        err.message = `[${headerText}]` + transLangKey("MSG_CHECK_VALID_INPUT");
        return err;
      }
    } else if ("number" == validRule) {
      inputReg = new RegExp(/^[0-9]+$/);
      if (inputReg.test(value) == false) {
        err.message = `[${headerText}]` + transLangKey("MSG_CHECK_VALID_INPUT");
        return err;
      }
    } else if ("alphaonly" == validRule) {
      inputReg = new RegExp(/^[a-zA-Z]+$/);
      if (inputReg.test(value) == false) {
        err.message = `[${headerText}]` + transLangKey("MSG_CHECK_VALID_INPUT");
        return err;
      }
    } else if ("notspecial" == validRule) {
      inputReg = new RegExp(/^[a-zA-Z0-9]+$/);
      if (inputReg.test(value) == false) {
        err.message = `[${headerText}]` + transLangKey("MSG_CHECK_VALID_INPUT");
        return err;
      }
    } else if ("email" == validRule) {
      inputReg = new RegExp(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+$/);
      if (inputReg.test(value) == false) {
        err.message = `[${headerText}]` + transLangKey("MSG_CHECK_VALID_INPUT");
        return err;
      }

    } else if ("tel" == validRule) {
      inputReg = new RegExp(/^\d{2,3}-\d{3,4}-\d{4}$/);
      if (inputReg.test(value) == false) {
        err.message = `[${headerText}]` + transLangKey("MSG_CHECK_VALID_INPUT");
        return err;
      }
    } else if ("jumin" == validRule) {
      inputReg = new RegExp(/\d{6} \- [1-4]\d{6}/);
      if (inputReg.test(value) == false) {
        err.message = `[${headerText}]` + transLangKey("MSG_CHECK_VALID_INPUT");
        return err;
      }
    } else if ("nothangul" == validRule) {
      inputReg = new RegExp(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]+/g);

      if (inputReg.test(value) == true) {
        err.message = `[${headerText}]` + transLangKey("MSG_CHECK_VALID_INPUT");
        return err;
      }
    } else if ("color" == validRule) {
      inputReg = new RegExp(/^#[a-fA-F0-9]{6}$/g);

      if (inputReg.test(value) == false) {
        err.message = `[${headerText}]` + transLangKey("MSG_CHECK_VALID_INPUT");
        return err;
      }
    } else {
      inputReg = new RegExp(validRule);
      if (inputReg.test(value) == false) {
        err.message = `[${headerText}]` + transLangKey("MSG_CHECK_VALID_INPUT");
        return err;
      }
    }
    return true;
  }
  return true;
}

function getHeaderText(columnDefs, colname) {
  const colDef=columnDefs.find(col=> col.field == colname)
  if(colDef)
    return colDef.headerName;
  else
    return transLangKey(colname);
}

const __compare=(value1, value2, columnDef) => {
  if(columnDef.cellDataType == 'date') {
    if(value1 instanceof  Date && value2 instanceof Date ) {
      return value1.getTime() - value2.getTime();
    }
  }
  else {
    if(value1 == value2)
      return 0;
    else if(value1 > value2)
      return 1;
    else if(value1 < value2)
      return -1;
  }
}

const validateFn = (params, field,rules) => {

  const api = params.api;
  const value = params.newValue;
  const columnDef = params.colDef;
  const node      = params.node
  const columnDefs=params.api.getColumnDefs();

  let error = {};
  let headerText = getHeaderText(columnDefs, field)

  if (rules !== undefined) {
    rules.forEach((rule) => {
      let valid = rule.valid;
      if (rule.criteria === 'required' && (value === undefined || value === null || value.length <= 0)) {
        error.level = 'error';
        //MSG_CHECK_VALID_002 : '{{headerText}}는 필수값입니다.'
        error.message = transLangKey('MSG_CHECK_VALID_002', { headerText:headerText })
      } else if (rule.criteria === 'values') {
        if (Array.isArray(valid) && !valid.inclues(value)) {
          error.level = 'error';
          //MSG_CHECK_VALID_001 : '{{headerText}}값은 {{val}}중 하나여야 합니다.'
          error.message = transLangKey('MSG_CHECK_VALID_001', { headerText:headerText, val:valid })
        }
      } else if (rule.criteria === 'maxLength' && (value && value.length > valid)) {
        error.level = 'error';
        //MSG_CHECK_VALID_003 : '{{headerText}}길이는 {{val}}보다 작아야 합니다.'
        error.message = transLangKey('MSG_CHECK_VALID_003', { headerText:headerText, val:valid })
      }
      // min
      if (rule.criteria === 'min' && __compare(value, valid, columnDef) < 0) {
        error.level = 'error';
        //MSG_CHECK_VALID_004 : '{{headerText}}값은 {{val}}보다 커야 합니다.'
        error.message = transLangKey('MSG_CHECK_VALID_004', { headerText:headerText, val:valid })
      } else if (rule.criteria === 'max' && (__compare(value, valid, columnDef) > 0)) {
        error.level = 'error';
        //MSG_CHECK_VALID_005 : '{{headerText}}값은 {{val}}보다 작아야 합니다.'
        error.message = transLangKey('MSG_CHECK_VALID_005', { headerText:headerText, val:valid })
      } else if (rule.criteria === 'lessThan') {

        let val = api.getValue(valid,node);
        
        if (value && __compare(value,val, columnDef) >=0) {
          let aHeadText = getHeaderText(columnDefs, valid)
          error.level = 'error';
          //MSG_CHECK_VALID_005 : '{{headerText}}값은 {{val}}보다 작아야 합니다.'
          error.message = transLangKey('MSG_CHECK_VALID_005', { headerText:headerText, val:aHeadText })
        }
      } else if (rule.criteria === 'lessOrEqualThan') {
        let val = api.getValue(valid,node);
        
        if (value && __compare(value,val, columnDef) > 0) {
          let aHeadText = getHeaderText(columnDefs, valid)

          error.level = 'error';
          //MSG_CHECK_VALID_007 : '{{headerText}}값은 {{val}}값보다 작거나 같아야 합니다.'
          error.message = transLangKey('MSG_CHECK_VALID_007', { headerText:headerText, val:aHeadText })
        }
      } else if (rule.criteria === 'biggerThan') {
        let otherParam = {...params}
        let val = api.getValue(valid,node);
        if (value && __compare(value,val, columnDef) <= 0) {
          let aHeadText = getHeaderText(columnDefs, valid)

          error.level = 'error';
          //MSG_CHECK_VALID_008 : '{{headerText}}값은 {{aHeadText}}값보다 커야 합니다.'
          error.message = transLangKey('MSG_CHECK_VALID_008', { headerText:headerText, aHeadText:aHeadText })
        }
      } else if (rule.criteria === 'biggerOrEqualThan') {
        let val = api.getValue(valid,node);
        if (value && __compare(value, val, columnDef) < 0) {
          let aHeadText = getHeaderText(columnDefs, valid)

          error.level = 'error';
          //MSG_CHECK_VALID_009 : '{{headerText}}값은 {{aHeadText}}값보다 크거나 같아야 합니다.'
          error.message = transLangKey('MSG_CHECK_VALID_009', { headerText:headerText, aHeadText:aHeadText })
        }
      } else if (rule.criteria == 'inputChar') {
        err = checkInputCharValid(headerText, valid, value);
        if (err != true) {
          error.level = 'error';
          error.message = err.message;
        } else {
          error.level = 'ignore'
        }
      } else if (rule.criteria == 'validFunc') {
        let err = valid(params, field);
        if (err != true) {
          error.level = 'error';
          error.message = err.message;
        }
      }
    });
  }

  return error;
}

export function isEmpty(obj) {
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return JSON.stringify(obj) === JSON.stringify({});
}


const validationValueSetter = (validRules, valueSetter,storeApi) => params => {

  let data = params.data
  const field = params.colDef.field;
  const err = validateFn(params, field,validRules);
  const state = storeApi.getState();

  if (isEmpty(err)) {
    state.clearValidationFail(data._rowId, field);
  } else {
    state.setValidationFail(data._rowId, field, err.message);
  }

  if(valueSetter)
    return valueSetter(params)
  else {
    data[field] = params.newValue
    params.api.applyTransaction({ update: [data] });
  }

  return true;
};

const internalValueSetter = (valueSetter,storeApi) => params => {

  if(valueSetter)
    return valueSetter(params)
  else {
    let data = params.data;
    let field = params.colDef.field;
    data[field] = params.newValue

    params.api.applyTransaction({ update: [data] });
  }

  return true;
};

export function isColumnNumberType(item) {
  const dataType = item.cellDataType || item.dataType
  if (dataType && (dataType.toUpperCase() === 'NUMBER' || dataType.toUpperCase()==='INT'))
    return true;
  else
    return false;
}

export function isColumnDateType(item) {
  const dataType = item.cellDataType || item.dataType
  if (dataType && (dataType.toUpperCase() === 'DATETIME' || dataType.toUpperCase()==='DATE'))
    return true;
  else
    return false;
}

const getCellDataType=(dataType) => {
  if (dataType.toUpperCase() === 'BOOLEAN') {
    return 'boolean'
  } else if (dataType.toUpperCase() === 'DATETIME' || dataType.toUpperCase()==='DATE') {
    return "date"
  } else if (dataType.toUpperCase() === 'NUMBER' || dataType.toUpperCase() === 'INT') {
    return 'number';
  } else if (!dataType || dataType.toUpperCase() === 'TEXT' || dataType.toUpperCase() === 'STRING') {
    return 'text'
  }
  else  return dataType;
}

// aggrid colDef와 호환되지 않는 prop 제거
export const deleteUnuseColumnProps=(objColumn)=> {
  uncompatibleItemProps.forEach(k => {
    if(objColumn.hasOwnProperty(k))
      delete objColumn[k]
  })
}

function setCheckSelectColumn() {
  return {
    colId: 'checkSelect', field: 'checkSelect', cellDataType: 'boolean', headerName: ' ', visible: true, editable: true, width: 40,
    suppressColumnsToolPanel: true, lockVisible: true, lockPosition: 'left', suppressMovable: true, pinned: 'left',
    suppressMenu: true, sortable: false, resizable: false, suppressSizeToFit: true, headerAllCheck:true,
    cellClass: 'indicator-cell',
    headerClass: 'indicator-header-cell',
    valueGetter: function delYnValueGetter(params) {
      return params.node.data?.['checkSelect']? params.node.data['checkSelect'] : false
    },
  }
}
import { CheckSquare, PlusSquare } from "react-feather";

function getIcon(rowState) {
  if (rowState === 'created') {
    return (<PlusSquare size={14} />)
  } else if (rowState === 'updated') {
    return (<CheckSquare size={14} />)
  }
}

function setRowStateColumn() {
  return {
    colId: 'rowState', field: 'rowState', headerName: ' ', maxWidth: 100, width: 40,
    suppressColumnsToolPanel: true, lockVisible: true, lockPosition: 'left', suppressMovable: true,
    suppressMenu: true, sortable: false, resizable: false, suppressSizeToFit: true, pinned: 'left',
    cellClass: 'indicator-cell',
    headerClass: 'indicator-header-cell',
    valueGetter: (params) => { 
      let state=''
      if(params.node)
        state=params.context.getRowState(params.node) ;
      return state;
    },
    cellRenderer:  StateCellRenderer
    // (params) => { //StateCellRenderer 
    //   return getIcon(params.value);
    // }
  }
}

function setRowNumColumn() {
  return {
    colId: 'rowNum', field: 'rowNum', headerName: 'No.', maxWidth: 100, width: 40,
    suppressColumnsToolPanel: true, lockVisible: true, lockPosition: 'left', suppressMovable: true,
    suppressMenu: true, sortable: false, resizable: false, suppressSizeToFit: true, pinned: 'left',
    cellClass: 'indicator-cell',
    headerClass: 'indicator-header-cell',
    valueGetter: function hashValueGetter(params) {
      return params.node ? params.node.rowIndex + 1 : null;
    }
  }
}

function setColumnProp(prop, storeApi) {
  const storeState= storeApi.getState();
  const getValidationFail = storeState.getValidationFail;
  
  let objColumn = {}
  if (prop.type === 'rowNum') {
    objColumn = setRowNumColumn()
  } else if (prop.type === 'rowState') {
    objColumn = setRowStateColumn()
  } else if (prop.type === 'checkSelect') {
    objColumn = setCheckSelectColumn()
  } else {
    objColumn = Object.assign({}, prop);
    objColumn.field = prop.field || prop.fieldName || prop.name;
    objColumn.colId = prop.colId || objColumn.field
  }

  if(prop.width != undefined) {
    const w = prop.width;
    if(typeof w =='string')
      objColumn.width = parseInt(w)
  }

  if(objColumn.headerAllCheck) {
    objColumn.headerComponent='zCheckboxHeader';
  }
  //정의된 칼럼 타입 설정
  objColumn.type=[];

  if(prop.type) {
    if(Array.isArray(prop.type))
      objColumn.type=objColumn.type.concat(prop.type)
    else
      objColumn.type.push(prop.type)
  }
  
  if(prop.requisite) {
    objColumn.type.push('requisite') //필수
  }

  if(prop.editable==true) {
    objColumn.editable = prop.editable
    objColumn.type.push('editable') //필수
  }

  if(prop.editableNew ==true) {
    delete objColumn.editable;
    objColumn.type.push('editableNew')
  }
  
  if(prop.validRules) {
    objColumn.valueSetter = validationValueSetter(prop.validRules, prop.valueSetter,storeApi)
  }
  else {
    //objColumn.valueSetter = internalValueSetter(prop.valueSetter,storeApi)
  }
  
  if(objColumn.cellDataType == undefined && objColumn.dataType) {
    objColumn.cellDataType = getCellDataType(objColumn.dataType)
  }
  if(objColumn.cellDataType == undefined)
    objColumn.cellDataType = "text"
  objColumn.type.push(objColumn.cellDataType) 

  //cellDataType에 따른 default 정렬
  if(!objColumn.textAlign && !objColumn.textAlignment) {
    switch(objColumn.cellDataType){
      case 'number':
        objColumn.type.push("right");
        break;
      case 'date':
      case 'boolean':
          objColumn.type.push("center");
          break;
      default:
        objColumn.type.push("left");
        break;
    }
  }

  const headerText = objColumn.headerName || prop.headerText;
  if (prop.columnType === 'D') {
    objColumn.headerName = headerText
  }
  else {
     objColumn.headerName = transHeaderText(objColumn, headerText) ;//headerText != undefined ? transLangKey(headerText) : transLangKey(convertCamelToSnake((objColumn.field).replace(/([A-Z])/g, function (x, y) { return '_' + y.toLowerCase() }).replace(/^_/, '')).toUpperCase())
  }
  

  if(prop.visible !== undefined)
    objColumn.hide = !prop.visible;  
  
  if (objColumn.hide == false && prop.width !== undefined) {
    objColumn.width = parseFloat(prop.width);
  }

  if(prop.textAlignment) {
    objColumn.type.push(prop.textAlignment)
  }

  if(prop.textAlign) {
    objColumn.type.push(prop.textAlign)
  }

  //useDropDown 지원
  if(prop.useDropDown) {
    objColumn.cellEditor='agRichSelectCellEditor';
    //objColumn.cellRenderer='zCustomSelectCellRenderer';
    
    let valueProp='value'
    let labelProp='label'
    let displayProp='label';

    const dropdownOption = prop.dropdownOption

    const dropdownValueFormatter=(params)=> {
      if(prop.valueFormatter)
        return prop.valueFormatter(params)

      let optData=[]
      
      if(dropdownOption) {
        if(dropdownOption.valueProp)
          valueProp= dropdownOption.valueProp;
        if(dropdownOption.labelProp)
          labelProp= dropdownOption.labelProp;
        if(dropdownOption.displayProp)
          displayProp = dropdownOption.displayProp;

        if(dropdownOption.getOption) {
          const getOption = dropdownOption.getOption
          if(typeof getOption =='string') {
            optData= params.context.getCodeDefs(getOption)
          }else { //함수여야 한다.
            const optVal = getOption(params);
            if(typeof optVal =='string')
              optData= params.context.getCodeDefs(optVal)
            else
              optData = optVal;
          }
        }
      }
      else {
        optData= params.context.internalGetCodeDefs(params, params.colDef.field)
      }

      if(optData) {
        const valueOpt= optData.find(opt => opt[valueProp] == params.value)
        if (valueOpt)
          return valueOpt[displayProp];
        else
          return "";
      }
      else
        return params.value;
    }

    objColumn.valueFormatter = dropdownValueFormatter;

    const getValueFromContext=(params)=> {
      let optData=[]
      
      if(dropdownOption) {
        if(dropdownOption.valueProp)
          valueProp= dropdownOption.valueProp;
        if(dropdownOption.labelProp)
          labelProp= dropdownOption.labelProp;
        if(dropdownOption.getOption) {
          const getOption = dropdownOption.getOption
          if(typeof getOption =='string') {
            optData= params.context.getCodeDefs(getOption)
          }else { //함수여야 한다.
            const optVal = getOption(params);
            if(typeof optVal =='string')
              optData= params.context.getCodeDefs(optVal)
            else
              optData = optVal;
          }
        }
      }
      else {
        optData= params.context.internalGetCodeDefs(params, params.colDef.field)
      }

      if(optData) {
        return optData.map(opt => opt[valueProp])  
      }
      else
        return [];
    }
    
    const formatRichSelectValue=(field,value)=> {
      let optData=[]
      
      const gridObject = storeState.getGridObject();
      if(dropdownOption) {
        if(dropdownOption.valueProp)
          valueProp= dropdownOption.valueProp;
        if(dropdownOption.labelProp)
          labelProp= dropdownOption.labelProp;
        
        if(dropdownOption.getOptionLabel) {
          const getOptionLabel = dropdownOption.getOptionLabel
          return getOptionLabel(gridObject, field, value)
        }
        else {
          optData = gridObject.context.getCodeDefs(field);
        }
      }
      else {
        optData = gridObject.context.getCodeDefs(field);
      }

      if(optData) {
        const valueOpt= optData.find(opt => opt[valueProp] == value)
        if (valueOpt)
          return valueOpt[labelProp];
        else
          return "";
      }
      else
        return value;
    }

    
    
    objColumn.cellEditorParams= {
      values: getValueFromContext,
      formatValue : (value) => formatRichSelectValue(objColumn.field, value),
    }
  }

  //validation 툴팁 처리 
  //tooltip 콤포넌트를 지정하지 않았다면 validation을 위한 처리를 해준다.
  //tooltip 콤포넌트를 custom하게 사용하려면 validation관련 처리를 함께 해줘야 한다.
  if(!prop.tooltipComponent && prop.validRules){
    objColumn.tooltipComponent= InternalValidationTooltip;
    objColumn.tooltipValueGetter= (params) => {
      let data = params.data;
      let field = params.colDef.field;
      if(data) {
        const err = getValidationFail(data._rowId, field)
        if (!err) 
          return "";
        else
          return {
            field,
            tooltip: err['failMsg'],
          };
      }
      else
        return '';
    }
  }

  if(prop.validRules) {
    if(objColumn.cellClassRules) {
      objColumn.cellClassRules['invalid-cell-value'] = (params) => internalInvalidCellCssRule(params,getValidationFail)
    }
    else {
      objColumn.cellClassRules= {'invalid-cell-value': (params) => internalInvalidCellCssRule(params,getValidationFail)}
    }
  }
  if(prop.mergeRule) {
    
    storeState.setCustomCtxValue("merge", true);

    if(objColumn.cellClassRules) {
      objColumn.cellClassRules['merge-cell'] = (params) => internalMergeCellCssRule(params, prop.cellClassRules['merge-cell'])
    }
    else {
      objColumn.cellClassRules= {'merge-cell': (params) => internalMergeCellCssRule(params, undefined)}
    }
    if(prop.rowSpan == undefined) {
      objColumn.rowSpan = internalRowSpan;
    }
  }
  deleteUnuseColumnProps(objColumn)
  return objColumn;
}

function transHeaderText(column, headerText) {
  const field = column.field || column.name;
  return headerText != undefined ? transLangKey(headerText) : transLangKey(convertCamelToSnake((field).replace(/([A-Z])/g, function (x, y) { return '_' + y.toLowerCase() }).replace(/^_/, '')).toUpperCase())
}


function transItemToColDef(column,storeApi) {

  if(isGroupColumn(column)) {    
    //예전 childs를 children으로 옮겨준다.
    const headerText = column.headerName || column.headerText;
    column.headerName = transHeaderText(column, headerText)
           
    const children = column.children;
    for (let j = 0; j < children.length; j++) {
      children[j] = transItemToColDef( children[j],storeApi);
    }
  }
  else {
    column = setColumnProp(column,storeApi);
  }
  return column;
}


function verfyChildren(column,storeApi) {

  if(isGroupColumn(column)) {    
    //예전 childs를 children으로 옮겨준다.
    if(column.childs) {
      if(!column.children)
        column.children=[];
      
      column.childs.forEach(child => {
        column.children.push(child)
      })
    } 
       
    const children = column.children;
    for (let j = 0; j < children.length; j++) {
      children[j] = verfyChildren(children[j],storeApi);
    }
  }
  return column;
}

export function createGridItem(items,storeApi) {
  try {
    if(items) {
      const verifiedCols = items.map(column => {
        return verfyChildren(column,storeApi)
      })
      
      const columns= verifiedCols.map(column => {
        ApplyI18n(column)
        return transItemToColDef(column,storeApi)
      })

      console.log('createGridItem',columns)
      return columns;
    }
  } catch (e) {
    console.log(e)
  } finally {
  }
}

export class FlatternColumns {

  constructor(items) {
    this.flatNewGridItems=[];
    this.flattenItems(items)
  }
  flattenItems(arr) {
    arr && arr.map((item) => {
      if (item.children) {
        this.flattenItems(item.children);
      } else {
        this.flatNewGridItems.push(item);
      }
    })
  }
  getFlatColumnDefs() {
    return this.flatNewGridItems;
  }
}
/**
 * 기존에 사용하던 tree data 구조를 ag-grid에서 사용되는 tree data 구조로 바꾼다
 * treeJson의 형태는 {childArrProp: [item1, item2]}
 * 
 * childArrProp: 
 * pathField: 패스 field로 사용할 이름,ag-grid tree 구조는 트리 표현을 위한 정보 칼럼이 필요. 지정되지 않으면 내부적으로 '__treepath__' 사용
 * pathValueField: pathField 에 표시할 키값 필드
 * 
 */
export class FlatternTreeData {
  constructor(treeJson, opt) {
    this.childArrProp = opt.childArrProp;
    this.iconField = opt.iconField;
    this.pathField = opt.pathField || '__treepath__';
    this.pathValueField = opt.pathValueField;
    this.flatternData=[];

    const dataArr = treeJson[this.childArrProp];

    dataArr.forEach((item) => {
      const pathArr=[];
      pathArr.push(item[this.pathValueField])
      
      item[this.pathField] = pathArr;
      this.flatternData.push(item);

      if (item[this.childArrProp]) {
        this.flattenTreeData(item[this.childArrProp], [...pathArr]);
      }
    })
  }

  flattenTreeData(arr, parentPath) {
    arr && arr.forEach((item) => {
      const pathArr = [...parentPath]
      pathArr.push(item[this.pathValueField])

      item[this.pathField] = pathArr;
      this.flatternData.push(item);

      if (item[this.childArrProp]) {
        this.flattenTreeData(item[this.childArrProp], [...pathArr]);
      }
    })
  }

  getTreeData() {
    return this.flatternData
  }
}
/**
 * 본인 또는 자식 말단 colDef의 field 명 리턴
 * @param {*} colDef 
 * @returns 
 */
export function getLeafColumFields(colDef) {
  let ret=[];
  if(colDef.children) {      
    const children = colDef.children;
    for(let i=0; i < children.length; i++) {
      ret=ret.concat(getLeafColumFields(children[i]))
    }
  }
  else {
    ret.push(colDef.field)
  }
  return ret;
}

/**
 * 본인 또는 자식 말단 colDef 리턴
 * @param {*} colDef 
 * @returns 
 */
export function getLeafColDefs(colDef) {
  let ret=[];
  if(colDef.children) {      
    const children = colDef.children;
    for(let i=0; i < children.length; i++) {
      ret=ret.concat(getLeafColDefs(children[i]))
    }
  }
  else {
    ret.push(colDef)
  }
  return ret;
}

function getCriteriaValue(criteria, row) {  
  return criteria.reduce( (acc, c)=> {
    if(row[c]) {
      if(acc)
        acc= acc + row[c]
      else
        acc = row[c]
    }
    return acc;
  },undefined)
}
/**
 * 칼럼 mergeRule을 토대로 머지정보를 row에 추가한다.
 * 
 * @param {*} columnDefs 
 * @param {*} rowData 
 * @param {*} gridApi 
 */
export function calcMerge(columnDefs, rowData,gridApi) {

  const mergeCols = columnDefs.filter(col=> col.mergeRule !=undefined);
  if(mergeCols.length ==0)
    return;

  const mergeRules = mergeCols.map( col => {return {field: col.field, criteria: col.mergeRule.criteria}})
  
  mergeRules.forEach(mr => {
    const field = mr.field;
    let criterias = mr.criteria.split('+');
    
    criterias= criterias.reduce( (acc, c) => {
      const cat = c.trim();
      if(cat == 'prevvalues') {
        const colDefs = columnDefs;
        for(let i=0; i < colDefs.length; i++) {
          if(colDefs[i].field == field)
            break;
          if(!colDefs[i].hide)
            acc.push(colDefs[i].field)
        }
      }
      else if(cat == 'value'){
        acc.push(field)
      }
      else { //values[`${fieldName}`]
        let ct = c.replace(/(values\[[\']?)|([\']?\]$)/g,"")
        if(ct)
          acc.push(ct.trim())
      }
      return acc;
    },[])
    
    mr.isMerged=(row1, row2) => {
      const value1= getCriteriaValue(criterias, row1)
      const value2= getCriteriaValue(criterias, row2)
      if(value1 && value1 == value2)
        return true;
      else
        return false;
    }
  })
  
  let rowBuffer=20;

  mergeRules.forEach(m => {

    let prevRow = rowData.length > 0 ? rowData[0] : null;
    let firstMergedRow=prevRow;
    let mergedCnt=0;

    rowData.forEach(row => {
      row[`merged[${m.field}]`] = undefined;
      
      if(m.isMerged(prevRow, row)) {
        mergedCnt = mergedCnt +1
        let mergeInfo=firstMergedRow[`merged[${m.field}]`];
        if(!mergeInfo) {
          mergeInfo = {startMerge: null, mergeSeq:0, merged:mergedCnt} 
          firstMergedRow[`merged[${m.field}]`]=mergeInfo;
        }
        else {
          mergeInfo.mergeSeq=0
          mergeInfo.merged=mergedCnt
        }
        
        if(firstMergedRow != row) {
          row[`merged[${m.field}]`] =  {startMerge: mergeInfo, mergeSeq:mergedCnt-1, merged:1};
        }
        rowBuffer = Math.max(rowBuffer, mergedCnt)
      }
      else {
        row[`merged[${m.field}]`] ={startMerge:null ,mergeSeq:0, merged:1};;
        firstMergedRow=row;
        mergedCnt=1;
      }
      prevRow= row;
    });
  })

  //console.log('rowBuffer', rowBuffer)
  //max row Buffer설정
  if(gridApi)
    gridApi.setGridOption("rowBuffer", rowBuffer);
}

export function calcMerge2(columnDefs,gridApi) {
  const mergeCols = columnDefs.filter(col=> col.mergeRule !=undefined);
  if(mergeCols.length ==0)
    return;
  
  let rowData = [];
  gridApi.forEachNodeAfterFilterAndSort(node => {
    if(node.data)
      rowData.push(node.data);
  })
  if(rowData.length > 0) {
    calcMerge(columnDefs,rowData,gridApi)
    //gridApi.refreshCells({force: true,suppressFlash:true})
    gridApi.redrawRows()
  }
}

/**
   * d : 날짜 표현 문자열
   * subtype: date cellDataType은 datetime이 기본설정이됨
   * 타임이 없이 date만 표현될 경우 subtype='date' 추가되어야
   * timezone 기준 표현가능.
   */
export const to_date=(d,subtype) => {
  if(typeof d == 'string') {
    const date=new Date(d);
    if(isNaN(date))
      return d;
    else {
      if(subtype =='date') {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate())
      }
      else 
        return date;
    }
  }
  else
    return d;
}

export function isDeepEqual(obj1, obj2) {
  if (!obj1 || !obj2 || typeof obj1 !== "object" | typeof obj2 !== "object") {
    return false
  }

  if (JSON.stringify(obj1) === JSON.stringify(obj2))
    return true;
  else
    return false;
}


export const isDeepEqualWithUndef=(obj1, obj2) => {
  if(obj1 == undefined && obj2 == undefined)
    return true;
  else
    return isDeepEqual(obj1, obj2)
}

/** 엑셀 blob에서 ArrayBuffer 로 read */
function readAsArrayBuffer(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      resolve(event.target?.result)
    }
    reader.readAsArrayBuffer(blob)
  })
}

function stringToArrayBuffer(string) {
  const buffer = new ArrayBuffer(string.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < string.length; i++) {
    view[i] = string.charCodeAt(i) & 0xff
  }
  return buffer
}

function getXlsxBlob(worksheets) {
  const workbook = XLSX.utils.book_new()

  worksheets.forEach(({name, header, body}) => {
    const worksheet = XLSX.utils.json_to_sheet(body, {header})
    XLSX.utils.book_append_sheet(workbook, worksheet, name)
  })

  const workbookOutput = XLSX.write(workbook, {
    type: 'binary',
    bookType: 'xlsx'
  })
  return new Blob([stringToArrayBuffer(workbookOutput)], {
    type: 'application/octet-stream'
  })
}

export function saveAsXlsx({ fileName = 'export', worksheets }) {
  const blob = getXlsxBlob(worksheets)
  saveAs(blob, `${fileName}.xlsx`)
}



/** AG Grid 엑셀 Custom Export */
export function exportGridtoExcel(params) {
  const xslsBlob=params.api.getDataAsExcel();
  readAsArrayBuffer(xslsBlob)
    .then((response) => {

      const wb = XLSX.read(response, { type: 'array'});
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      var sheetjsonData = XLSX.utils.sheet_to_json(ws);
      const header=[];
      if(sheetjsonData.length > 0) {
        const firstRow=sheetjsonData[0];
        for(let h in firstRow) {
          header.push(h)
        }
      }
      const jsonSheet={
        name:wsname,
        header:header,
        body:sheetjsonData
      }
      console.log(wsname, jsonSheet)

      /* 엑셀의 머지 정보를 처리한다. */
      // let rowData = [];
      // params.api.forEachNodeAfterFilterAndSort(node => {
      //   if(node.data)
      //     rowData.push(node.data);
      // })

      // rowData.forEach(data=> {
      //   for(const p in data) {
      //     if(p.indexOf('merged[')) {
      //       const mergeInfo= data[p]
      //       if(mergeInfo && mergeInfo.merged > 1) {
      //         let merge={};
      //         merge.merge.s.c
      //       }
      //     }
      //   }        
      // })

      
      // if (ws['!merges']) {
      //   ws['!merges'].map((merge) => {

      //     const value = XLSX.utils.encode_range(merge).split(':')[0];
      //     for (let col = merge.s.c; col <= merge.e.c; col++)
      //       for (let row = merge.s.r; row <= merge.e.r; row++)
      //         ws[String.fromCharCode(65 + col) + (row + 1)] = ws[value];
      //   });
      // }

      //새 엑셀 파일 생성
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, ws, wsname)

      const workbookOutput = XLSX.write(workbook, {
        type: 'binary',
        bookType: 'xlsx'
      })
      const excelBlob= new Blob([stringToArrayBuffer(workbookOutput)], {
        type: 'application/octet-stream'
      })

      const fileName='TESTTEST'
      saveAs(excelBlob, `${fileName}.xlsx`)
      //saveAsXlsx({ fileName :'TEST', worksheets:[jsonSheet] })

    })
}