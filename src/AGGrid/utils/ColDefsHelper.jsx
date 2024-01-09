import uniqBy from "lodash/uniqBy";

export const trueValues = ['true','TRUE','True','Y','y',1,'1','T','t','on','ON','On'];
export const falseValues = ['false','FALSE','False','N','n',0,'1','F','f','off','OFF','Off'];

export const isGroupColumn=(grpCol)=> {
  //이전 items정보 호환을 위해서
  if(grpCol.dataType =='group' || grpCol.children || grpCol.childs)
    return true;
  else
    return false;
}


/**
     * aggrid colDef headerClass 추가
     * @param {*} column 
     * @param {*} className 
     */
export function addHeaderCellClass(column, className) {

    const prevCellClass = column.headerClass;   
    
    if(prevCellClass) {
      const classArray=[]
      classArray.push(prevCellClass);
      classArray.push(className);
  
      column.headerClass = classArray.join(" ");
    }
    else {
        column.headerClass=className
    }
  }
  
  export function addCellClassRule(column, className, classSelector) {
    if(!column.cellClassRules) {
      column.cellClassRules={}
    }    
    column.cellClassRules[className] = classSelector !=undefined ? classSelector : ()=>true
  }
  /**
   * aggrid colDef cellClass 추가
   * @param {*} column 
   * @param {*} className 
   */
  export function addCellClass(column, className) {
  
    const prevCellClass = column.cellClass;   
    
    if(prevCellClass) {
      const getClassName=(cls, params) => {
        if(typeof cls=='function') {
            return cls(params)
        }
        else
            return cls
      }
  
      const newCellCssFunc =(params) => {
        const prevCls = getClassName(prevCellClass,params)
        const cls = getClassName(className, params)
  
        if(prevCls) {
            if(Array.isArray(prevCls)) {                            
                if(Array.isArray(cls))
                    return [...prevCls, ...cls]
                else
                    return [...prevCls, cls]
            }
            else {
              if(Array.isArray(cls))
                  return [prevCls, ...cls]
              else
                  return [prevCls, cls]
            }
        }
        else {
            return cls;
        }
      }
      column.cellClass = newCellCssFunc;
    }
    else {
        column.cellClass=className
    }
  }
  
  export function hasChild(children, child) {
    for(let i=0; i < children.length; i++) {
      const itm = children[i]
      if(itm.field ==  child.field)
        return true;
      else if(itm.children) {
        if(hasChild(itm.children,child ))
          return true;
      }
    }
  }
  /** items 에서 자신 또는 자식이 item 인 것의 index */
  export function getParentItemIndex(items, item) {
    for(let i=0; i < items.length; i++) {
      const itm = items[i]
      if(itm.field ==  item.field)
        return i;
      else if(itm.children) {
        if(hasChild(itm.children,item ))
          return i;
      }
    }
    return -1;
  }

/*
  Object 배열에서 colName property의 unique값을 가져온다.
*/
export function getFieldValues(dataSet, colName, startidx, endIdx) {
    if(endIdx < 0) {
        endIdx = dataSet.length;
    }
    let copied = dataSet.slice(startidx,endIdx - startidx + 1)
    const uniqueObjects = uniqBy(copied, (obj) => obj[colName]);
    return uniqueObjects.map(item=> item[colName])
}

function formatNumber(params) {
  var number = params.value;
  // this puts commas into the number eg 1000 goes to 1,000,
  // i pulled this from stack overflow, i have no idea how it works
  return Math.floor(number)
    .toString()
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

/*
  ag-grid에서 measureColumnName 값들중 mValue에 해당하는 것만 sum
*/
export function aggridAggregate(gridOptions,field, measureColumnName,mValue) {
  let sum=0;
  gridOptions.api.forEachNode(function (node) {
    const rowData = node.data
    if(rowData) {
      if(rowData[measureColumnName] == mValue) {
        const val = gridOptions.api.getValue(field, node);
        if(val)
          sum += val
        else if(rowData[field]) {
          sum += rowData[field]
        }
      }
    }
  });

  return sum;
}