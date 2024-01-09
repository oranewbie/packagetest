import React, {forwardRef,useEffect,useImperativeHandle,useRef,useState,} from 'react';
import {aggFuncTemplate} from '../../../dataSource/DataStore'

/**
 * measure :  measureCol: measure 칼럼
 *            aggFunc: agg function or {mvalue: aggFunc, ...} 객체
 *            dataColumns: aggregate할 칼럼
 *           [
 *            {measureCol : colId1, aggFunc: aggFunc, mvalues: [값1, 값2, ...], dataColumns:[]},
 *            {measureCol : colId2, aggFunc: aggFunc2, mvalues: [값1, 값2, ...], dataColumns:[]}
 *           ]
 */
export const GroupFooterCellRenderer= forwardRef(({data,value, measure, ...props}, ref) => {
  
  useImperativeHandle(ref, () => {
    return {
      getValueToDisplay(params) {
        return params.value
      },
    };
  });

  const node = props.node
  const colId = props.colDef.colId;
  const footerAgg =[];

  if(node.footer) {
    if(measure) {
      measure.forEach( measureInfo=> {
        if(columns.dataColumns.includes(colId)) {

          let aggFuncInfo = measureInfo.aggFunc
          
          measureInfo.mvalues.forEach(m => {
            const aggFunc=undefined
            const aggfuncType = typeof aggFuncInfo
            if(aggfuncType =='object')
              aggFunc = aggFuncInfo[m];
            else if(aggfuncType =='string' )
              aggFunc= aggFuncTemplate[aggfuncType]
            else
              aggFunc = aggFuncInfo

            let mAggCtx = {'measure' : m, aggVal:0}
            //agg 구하기
            if(node.allLeafChildren && node.allLeafChildren.length > 0) {
              node.allLeafChildren.forEach(child => {
                if(child.data[measureInfo.measureCol] == m) {
                  if(aggFunc)
                    aggFunc(mAggCtx,child.data[colId])
                }
              })
            }
            footerAgg.push(mAggCtx)
          })
        }
      })
    }

    return <div>
      {
        footerAgg.map(agg => {
          <div>{agg.measure}:{agg.aggVal}</div>
        }) 
      }
    </div>
  }
  else 
    return(
      <span>{ value }</span>
    )
}
);
