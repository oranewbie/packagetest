import React, { useRef, useMemo, useEffect } from 'react';
import { createStore } from 'zustand';
import { isEmpty } from '../GridObject';

/**
 * 그리드를 위한 Store
 * 0. 그리드의 rowData reference
 *    aggrid는 최조 rowData에 대한 reference 유지하고 값이 변경되면 그 reference 객체에 데이타를 변경한다.
 *    추가/삭제로 인해서 props.rowData의 크기가 바뀌지는 않는다. 즉, aggrid에서 별도의 rowData 컨테이너를 생성하고 데이터는 props.rowData를 사용해서
 *    메모리의 효율적으로 관리할 수 있다.
 *    그래서 신규 추가되는 부분
 * 
 * 1. 변경 / 추가 / 삭제 관리
*/
export const createGridStore = () => {
  return createStore((set, get, api) => ({
    gridObject: null,
    miscOpt:{},
    initRowData:[], /* 처음 설정된 rowData, 추가와 삭제가 일어나지 않고 원래 데이타 순서를 가지고 있다.*/
    rowData:[],  /* rowData reference */
    changes: [], /* update 정보 */
    newRows: [], /* 신규 row 정보 */
    removedRows:[], /* 삭제 row 정보 */
    lastRowIdx: 0, //add 시에 계속 늘어남. removeRow시에 줄어들지 않음.
    trxCnt: -1,   
    setGridObject: (gridObject, miscOpt) => fnSetGridObject(get(), set, gridObject, miscOpt),
    getGridObject: ()=> get().gridObject,
    setMiscOption: (miscOpt) => set({miscOpt: miscOpt}),
    destroyStore: ()=> fnDestroyStore(get(),set),
    setRowData: (rowData) => fnSetRowData(get(), set, rowData),
    getLastRowIdx: () => get().lastRowIdx, 
    valueChangeTrx: (data, field,oldValue, newValue) => fnValueChangeTrx(get(), set, data, field, oldValue,newValue), //값의 변경
    addRowTrx: (data) => fnAddRowTrx(get(), set, data),
    insertRowTrx: (data) => fnInsertRowTrx(get(), set, rowId, data),   
    removeRowTrx: (data) => fnRemoveRowTrx(get(), set, data),
    rollback: () => fnRollback(get(), set),   //변경사항을 반영하지 않고 처리
    commit: () => fnCommit(get(), set),   
    isUpdated: () => fnIsUpdated(get()),
    getUpdatedRows: () => fnGetUpdatedRows(get()),
    getNewRows: () => fnGetNewRows(get()),
    getRemovedRows: () => { return get().removedRows},
    isNewRow: (row) => fnIsNewRow(get(), row),
    getRowState:(row) => fnGetRowState(get(), row),
    getAllUpdatedRows: () => fnGetAllUpdatedRows(get()),
    getAllUpdatedRowStates: () => fnGetAllUpdatedRowStates(get()),
    /** cell validation 결과 정보 */
    validation:[],
    setValidationFail : (rowId, field,failMsg) => fnSetValidationFail(get(), set, rowId, field,failMsg),
    clearValidationFail : (rowId, field) => fnClearValidationFail(get(), set, rowId, field),
    getValidationFail : (rowId, field) => fnGetValidationFail(get(), rowId, field),
    contextValue: {},
    setCustomCtxValue: (key, val) => fnSetCustomCtxValue(get(),set, key, val),
    getCustomCtxValue: (key) => fnGetCustomCtxValue(get(), key),
  }))
}

function fnSetGridObject(state, set, gridObject, miscOpt) {
  const prevMiscOpt=state.miscOpt;

  set({gridObject: gridObject, miscOpt:{...prevMiscOpt,...miscOpt}})
} 

function fnDestroyStore(state, set) {
  set({rowData:[], changes:[], newRows:[],removedRows:[],validation:[]})
}

/** rowData를 새로 설정하면 모든 상태를 초기화된다. */
function fnSetRowData(state, set, rowData) {

  if(rowData)
    set({initRowData:[...rowData], rowData:rowData, lastRowIdx: rowData.length,changes:[],newRows:[],removedRows:[],trxCnt:-1})
  else
    set({initRowData:[], rowData:[], lastRowIdx: 0,changes:[],newRows:[],removedRows:[],trxCnt:-1})
}

function fnNewRowValueChangeTrx(state, set, updatedData, field, oldValue, newValue) {
  let newRows = state.newRows;
  const trxCnt = state.trxCnt;

  let idx=newRows.findIndex(item=> item.rowData._rowId == updatedData._rowId)
  
  if(idx >=0) {
    let updatedRow = newRows[idx];
    updatedRow.rowData = updatedData;

    let updStatObject=updatedRow['__updated_stat__'];  
    //필드이름으로 된 상태정보 가져온다.
    if(!updStatObject) {
      updStatObject={}
      updatedRow['__updated_stat__'] = updStatObject;
    }
    let fieldStateInfo = updStatObject[field];

    if(!fieldStateInfo) {
      //첫 변경임.
      fieldStateInfo=updStatObject[field] = {initValue: oldValue , value: newValue}
    }
    else {
      fieldStateInfo.value = newValue; //새로운 값으로 설정
    }
    //원래값으로 돌아갔다. 해당 필드의 상태정보 삭제
    if(fieldStateInfo.initValue === fieldStateInfo.value) { 
      delete updStatObject[field]
    }
    //빈객체이면 삭제한다. 모두 초기값으로 설정됨
    if(isEmpty(updStatObject)) {
      changes.splice(idx, 1);
    }
    
  }
  else {
    let updatedRow = { rowData: updatedData }
    let _updatedStat_ = {}

    //처음 변경일 경우 initValue를 설정
    let fieldStateInfo = {initValue: oldValue, value: newValue}
   
    _updatedStat_[field] = fieldStateInfo;
    updatedRow['__updated_stat__'] =_updatedStat_;

    newRows.push(updatedRow);
  }
  console.log('changes new rows:', newRows)
  set({ newRows: newRows, trxCnt: trxCnt+1})
}

/**
 * AG Grid의 값이 변경될 때마다 최초값과 비교하고 업데이트 된 것을 가지고 있는다.
 * @param {} state 
 * @param {*} set 
 * @param {*} data 
 * @param {*} field 
 * @param {*} oldValue 
 * @param {*} newValue 
 */
function fnValueChangeTrx(state, set, updatedData, field, oldValue, newValue) {
  let changes = state.changes;
  const rowDatas = state.rowData;
  const gridObject = state.gridObject;
  const columns = gridObject.api.getColumnDefs().find(c=> c.field == field)
  
  //row를 바꿔준다.
  let row=rowDatas.find(d=> d._rowId == updatedData._rowId)
  if(row) {
    row[field] = newValue;
  }

  if(columns) {
    if(columns.noTrxManage)
      return;
  }
  
  const trxCnt = state.trxCnt;

  if(fnIsNewRow(state, updatedData)) {
    fnNewRowValueChangeTrx(state, set, updatedData, field, oldValue, newValue)
    return;
  }

  let idx=changes.findIndex(d=> d.rowData._rowId == updatedData._rowId)
  
  if(idx >=0) {
    let updatedRow = changes[idx];
    updatedRow.rowData = updatedData;

    let updStatObject=updatedRow['__updated_stat__'];  
    //필드이름으로 된 상태정보 가져온다.
    let fieldStateInfo = updStatObject[field];

    if(!fieldStateInfo) {
      //첫 변경임.
      fieldStateInfo=updStatObject[field] = {initValue: oldValue , value: newValue}
    }
    else {
      fieldStateInfo.value = newValue; //새로운 값으로 설정
    }
    //원래값으로 돌아갔다. 해당 필드의 상태정보 삭제
    if(fieldStateInfo.initValue === fieldStateInfo.value) { 
      delete updStatObject[field]
    }
    //빈객체이면 삭제한다. 모두 초기값으로 설정됨
    if(isEmpty(updStatObject)) {
      changes.splice(idx, 1);
    }
    
  }
  else {
    let updatedRow = { rowData: updatedData }
    let _updatedStat_ = {}

    //처음 변경일 경우 initValue를 설정
    let fieldStateInfo = {initValue: oldValue, value: newValue}
   
    _updatedStat_[field] = fieldStateInfo;
    updatedRow['__updated_stat__'] =_updatedStat_;

    changes.push(updatedRow);
  }
  console.log('changes', changes)
  set({ changes: changes, trxCnt: trxCnt+1})
}

function fnAddRowTrx(state, set, datas) {
  const newRows = state.newRows;
  const rowDatas = state.rowData;

  let lri = state.lastRowIdx;

  if(Array.isArray(datas)) {
    datas.forEach(data=> {
      data._rowId = lri;
      lri = lri + 1;

      newRows.push({rowData:data})
      rowDatas.push(data);
    })
  }
  else {
    let data = datas;
    data._rowId = lri;
    newRows.push({rowData: data})
    rowDatas.push(data);
    lri = lri + 1;
  }

  console.log('newRows', newRows)
  set({newRows:newRows, lastRowIdx: lri})
}

function fnInsertRowTrx(state, set, rowId, datas) {
  const newRows = state.newRows;
  const rowDatas = state.rowData;

  let lri = state.lastRowIdx;

  let idx = rowDatas.findIndex(d=> d._rowId == rowId)

  if(Array.isArray(datas)) {
    datas.forEach(data=> {
      data._rowId = lri;
      lri = lri + 1;

      newRows.push({rowData:data})
      if(idx < 0) {
        rowDatas.push(data);
      }
      else {
        rowDatas.splice(idx +1,0,data);
        idx++;
      }
    })
  }
  else {
    let data = datas;
    data._rowId = lri;
    newRows.push({rowData: data})

    if(idx < 0) {
      rowDatas.push(data);
    }
    else {
      rowDatas.splice(idx +1,0,data);
    }
    lri = lri + 1;
  }

  console.log('newRows', newRows)
  set({newRows:newRows, lastRowIdx: lri})
}

function fnRemoveRowTrx(state, set, datas) {
  const removedRows = state.removedRows;
  const rowDatas = state.rowData;

  let newRows = state.newRows;
  let changes = state.changes;

  if(Array.isArray(datas)) {

    datas.forEach(data=> {
      // 삭제된 데이타의 변경내용은 변경전까지 남겨둔다.
      // rollback이 되면 변경분도 되돌려 줘야 하기때문에.
      const nIdx = newRows.findIndex(d=> d.rowData._rowId == data._rowId)
      if(nIdx >=0) {
        newRows.splice(nIdx,1);
        //newRow인 경우엔 변경분도 삭제
        const cIdx=changes.findIndex(d=> d.rowData._rowId == data._rowId);
        if(cIdx >=0) {
          changes.splice(cIdx,1)
        }
      }
      else {
        const rIdx= rowDatas.findIndex(d=> d._rowId == data._rowId);
        if(rIdx >=0)
          rowDatas.splice(rIdx,1);
        removedRows.push({rowData: data})
      }
    })
  }
  else {
    const data = datas;

    const nIdx = newRows.findIndex(d=> d.rowData._rowId == data._rowId)
    if(nIdx >=0) {
      newRows.splice(nIdx,1);
      const cIdx=changes.findIndex(d=> d.rowData._rowId == data._rowId);
      if(cIdx >=0) {
        changes.splice(cIdx,1)
      }
    }
    else {
      const rIdx= rowDatas.findIndex(d=> d._rowId == data._rowId);
      if(rIdx >=0)
        rowDatas.splice(rIdx,1);

      removedRows.push({rowData: data})
    }
  }
  // console.log('fnRemoveRowTrx:removedRows',removedRows)
  // console.log('fnRemoveRowTrx:changes', changes)
  // console.log('fnRemoveRowTrx:newRows', newRows)
  set({removedRows:removedRows,newRows:newRows, changes:changes})
}

function fnCommit(state, set) {
  //변경사항 반영,rowData에 반영
  const rowData = state.rowData;
  set({initRowData:rowData, changes:[], newRows:[], removedRows:[]})
}

function fnRollback(state, set) {

  let initRowData = state.initRowData; //추가/삭제 부분 복원
  
  //변경내역 복원
  const changes = state.changes;
  changes.forEach(c=> {
    const rdata = c.rowData;
    let orgData = initRowData.find(r=> r._rowId == rdata._rowId)
    if(orgData) {
      const _updatedStat_ =c['__updated_stat__'];
      for(let f in _updatedStat_) {
        orgData[f] =  _updatedStat_[f].initValue; //초기값으로 되돌린다.
      }
    }
  })

  //변경사항 반영,rowData에 반영
  set({rowData:[...initRowData], changes:[], newRows:[], removedRows:[]})
}

function fnGetUpdatedRows(state) {
  const changes = state.changes;
  return changes.map(c => c.rowData) //rowData는 마지막 변경값을 가지고 있다.
}
function fnGetNewRows(state) {
  const newRows = state.newRows;
  return newRows.map(c => c.rowData) //rowData는 마지막 변경값을 가지고 있다.
}

function fnIsNewRow(state, row) {
  if(!row) {
    console.error('fnIsNewRow', 'row is invalid value')
    return false;
  }

  if(state.newRows && state.newRows.length > 0) {
    const gridObject = state.gridObject;
    const rowData = gridObject.context.getRowNodeData(row);
    
    if (state.newRows.findIndex( r => r.rowData._rowId == rowData._rowId) >=0 )
      return true;
  }
  else
    return false;
}

function fnGetRowState(state, row) {
  if(!row) {
    console.error('fnGetRowState', 'row is invalid value')
    return undefined;
  }

  const newRows = state.newRows
  const changes = state.changes
  const removedRows = state.removedRows
  const gridObject = state.gridObject;

  const rowData = gridObject.context.getRowNodeData(row);

  if(newRows) {
    if(newRows.findIndex(r=> r.rowData._rowId == rowData._rowId) >=0)
      return 'created'
  }
  if(changes) {
    let idx=changes.findIndex(item=> item.rowData._rowId == rowData._rowId)
    if(idx >=0)
      return 'updated'
  }
  if(removedRows) {
    if(removedRows.findIndex(r=> r.rowData._rowId == rowData._rowId) >=0)
      return 'deleted'
  }
}

function fnIsUpdated(state) {
  const changes = state.changes;
  const newRows = state.newRows;
  const removedRows = state.removedRows;
  const miscOpt = state.miscOpt
  //이 그리드는 트랜잭션 처리를 하지 않는다.
  if(miscOpt.noTrxManage) {
    return false;
  }
  return changes.length > 0 || newRows.length > 0 || removedRows.length > 0

}

function fnGetAllUpdatedRows(state) {
  // let api = state.api;
  const changes = state.changes.map(c => c.rowData);
  const newRows = state.newRows.map(c => c.rowData);
  
  const allRows=[...changes,...newRows]
  return allRows;
}

function fnGetAllUpdatedRowStates(state) {
  // let api = state.api;
  const changes = state.changes.map(c => c.rowData);
  const newRows = state.newRows.map(c => c.rowData);
  const removedRows = state.removedRows.map(c => c.rowData);

  const allRows={"changes": changes,'newRows':newRows, 'removedRows': removedRows}
  return allRows;
}

function fnClearValidationFail(state, set, row, field) {

  if(!row) {
    console.error('fnClearValidationFail', 'row is invalid value')
    return;
  }

  const gridObject = state.gridObject;

  const rowData = gridObject.context.getRowNodeData(row);
  const rowId = rowData._rowId

  let validation = state.validation;
  let idx=validation.findIndex(item=> item._rowId == rowId)
  if(idx >=0) {
    let validateRow = validation[idx];
    if(validateRow.hasOwnProperty(field)) {
      delete validateRow[field];

      set({validation: validation})
    }
  }
}

function fnSetValidationFail(state, set, row, field, failMsg) {
  if(!row) {
    console.error('fnSetValidationFail', 'row is invalid value')
    return;
  }
  const gridObject = state.gridObject;

  let validation = state.validation;
  const rowData = gridObject.context.getRowNodeData(row);
  const rowId = rowData._rowId

  if(validation) {
    let idx=validation.findIndex(item=> item._rowId == rowId)
    if(idx >=0) {
      let validateRow = validation[idx];
      const fieldObj = validateRow[field];
      if(!fieldObj) {
        validateRow[field] = {valid: false , failMsg: failMsg}
      }
      else {
        fieldObj.failMsg = failMsg;
      }
    }
    else {
      let validateRow = {_rowId: rowId}
      validateRow[field] = {valid:false, failMsg: failMsg}
      validation.push(validateRow);
    }
    set({ validation: validation})
  }
}


function fnGetValidationFail(state, row, field) {
  const gridObject = state.gridObject;
  
  const rowData = gridObject.context.getRowNodeData(row);
  if(!rowData)
    return undefined;
  
  const rowId = rowData._rowId

  let validation = state.validation;
  if(validation) {
    let idx=validation.findIndex(item=> item._rowId == rowId)
    if(idx >=0) {
      let validateRow = validation[idx];
      if(validateRow.hasOwnProperty(field)) {
        return validateRow[field];
      }
    }
  }
}


function fnSetCustomCtxValue(state,set, key, val) {
  const contextValue = state.contextValue
  contextValue[key] = val;

  set({contextValue: contextValue})
}
function fnGetCustomCtxValue(state, key) {
  const contextValue = state.contextValue
  return contextValue[key]
}