import {createCSSSelector,deleteCSSSelector} from '@zionex/wingui-core/utils/common'
import wingui from "./gridCustom";
import {RTableMap} from './RTableMap'
import { getDateFromDateString } from '../../../utils/common';
import winguiUtil from '@zionex/wingui-core/component/aggrid/personalize/gridCustom'
import { EntryCellRenderer } from './EntryCellRenderer';
import { addHeaderCellClass,addCellClass,addCellClassRule,getParentItemIndex,aggridAggregate} from '../utils/ColDefsHelper';
import {TEXT_ALIGNMENT, indicateTypes} from '@zionex/wingui-core/common/const'
import { isGroupColumn } from '../utils/ColDefsHelper';
import {format } from '@zionex/wingui-core/utils/format'
import {zAxios} from "@wingui/common/imports";

/** 이전 item props를 지원하기 위해 */
function getColName(col) {
  if (indicateTypes.includes(col.type)) {
    return col.type
  } else {
    if (col.name) {
      return col.name
    } else {
      return col.field;
    }
  }
}

function getColVisible(col) {
  if(col.visible)
    return col.visible
  else
    return !col.hide;
}

function getDateFromString(dateString) {
    if (dateString) {
      let temp = dateString.replaceAll(/\D/gi, '');
      if (temp.length > 6) {
        dateString = new Date(temp.substr(0, 4) + '-' + temp.substr(4, 2) + '-' + temp.substr(6, 2));
      } else {
        dateString = new Date(temp.substr(0, 4) + '-' + temp.substr(4, 2));
      }
    }
    return dateString;
}

function cleanupNoChildGroupColumns(columns) {
  for (let i = 0, len = columns.length; i < len; i++) {
    if (isGroupColumn(columns[i] )) {
      if (columns[i].children.length < 1) {
        columns.splice(i, 1);
        cleanupNoChildGroupColumns(columns);
      } else {
        cleanupNoChildGroupColumns(columns[i].children);
      }
    }
  }
}

//셀이 에디팅 가능한지 체크
function isCellEditable(gridExt, params) {
  if(gridExt && params.data) {
    // const colId = params.colDef.colId;
    const colId = params.colDef.field;
    const val = params.data[colId]

    const catVal = params.data['CATEGORY']
    const editMeasures = gridExt.editMeasures

    if(colId.includes(",VALUE") && val==null)
      return false;

    //카테고리 값이 에디팅 measure값이고
    //칼럼이 에디팅 타겟 칼럼인 경우
    if(editMeasures.includes(catVal) 
        && gridExt.editTargetDataColIds.includes(colId)) {
      
      //DTF 처리
      if(gridExt.dateColumnNames.includes(colId) ) {
        if(getDateFromString(colId.replace("DATE_", "").substring(0, 10)) <= gridExt.dtfDate)
          return false;
      }
      return true;
    }
  }
}

/**
 * group footer aggregation custom function
 * @param {*} params 
 */
function groupFooterAggFunc(params, editMeasures) {
  let total =0;
  if(params.rowNode.childrenAfterFilter) {

    const field = params.colDef.field;

    const groupChilds = params.rowNode.childrenAfterFilter;
    const thatNode = groupChilds.find(node => {
      if(node.data) {
        return editMeasures.includes(node.data['CATEGORY'])
      }
      else
        return false;
    })

    if(thatNode)
      total += params.api.getValue(field, thatNode)
  }

  return total;
}

//aggrid colDef editable 콜백
function cbEditable(params) {
  const gridExt = params.context.getCustomCtxValue('prefInfoHelper')

  if(isCellEditable(gridExt, params)) {
    return true;
  }
  else
    return false;
}

function cbCellClass(params) {
  const gridExt = params.context.getCustomCtxValue('prefInfoHelper')
  const classNames=[];
  const colId = params.colDef.field;
  
  if(isCellEditable(gridExt, params)) {
    classNames.push(STYLE_ID_EDIT_MEASURE)
  }

  //setDemandMeasureStyle
  if(gridExt.gridCd == "UI_DP_DMND_ORDER-RST_CPT_01") {
    if(gridExt.dateColumnNames.includes(colId) || colId === "CATEGORY") {
      
      const catVal = params.data['CATEGORY']
      if (catVal === 'DP_FCST_QTY'){
        classNames.push('reportStyle1');
      }
      if (catVal.endsWith("_QTY_S") || catVal === ("ACT_SALES_QTY")){
        classNames.push('reportStyle2');
      }
    }
  }

  return classNames;
}

function cellRendererSelector(params) {
  
    const gridExt = params.context.getCustomCtxValue('prefInfoHelper')
    if(isCellEditable(gridExt, params)) {
      const gridItem = gridExt._getGridItem(params.colDef.field)
      return {
        component: EntryCellRenderer,
        gridItem: gridItem
      }
    } 
    else
      return undefined;
}

export default class PrefInfoHelper {
        
    constructor (gridCd,extGridOptions) {

        this.gridCd = gridCd;
        this.DPEntry = extGridOptions.DPEntry;
        
        //AG Grid gridOptions
        this.extGridOptions = { ...extGridOptions, 
                                groupIncludeFooter: true,
                                //groupIncludeTotalFooter: true,
                                rowGroupPanelShow: extGridOptions.rowGroupPanelShow ? extGridOptions.rowGroupPanelShow : 'never', // never / always / onlyWhenGrouping
                                onAfterDataSet:this.onAfterDataSet,
                                onCellValueChanged: this.onCellValueChanged,
                                //valueCache : false
                                autoGroupColumnDef: { 
                                  cellRendererParams: {
                                        footerValueGetter: params =>  {
                                            const isRootLevel = params.node.level === -1;
                                            if (isRootLevel) {
                                                return 'Grand Total';
                                            }
                                            return `Sub Total (${params.value})`;
                                        },
                                    }
                                },
                                //onSelectionChanging: this.onSelectionChanging
                              }
        
        this.applyExtGridOptions()
        //화면에서 초기 설정된 gridItems
        this.gridItems=[];
        
        this.reset();
                
        this.versionData={}
        this.dtfDate=null;

        this.BUCKET  = null;
        this.AUTH_TP = null;
        this.PLAN_TP = null;

        this.dimensionData=[];
        this.measureData=[];

        //
        this.editMeasures=[]; //에디팅 타겟 measure
        this.editTargetDataColIds=[];

        this.customStyles = new RTableMap(); 
        this.dynamicCSS=[] //동적 생성된 클래스
        this.specificStyle = {}

        this.onReadyDataFill=(gridOptions, resultData) => {} //빈 함수
    }

    setGrid(gridOptions) {
      this.gridOptions = gridOptions;
      this.applyExtGridOptions()
        //나를 등록해 놓는다.
      this.gridOptions.context.setCustomCtxValue('prefInfoHelper',this)
      this.gridOptions.context.setCustomCtxValue('gridCd', this.gridCd)
    }
    onSelectionChanging(params) {
      if(params.node)
      return params.node.displayIndex % 2==0;
    }
    reset() {
      //(prefInfo, crosstabInfo를 파라메터로) 조회에서 가져온 데이타 List중 첫번째 데이타로 만든 필드명 집합
      this.dataFieldNames=[] 
      this.dataColumns=[] //prefInfo로 생성된 칼럼정보, summary 칼럼을 포함하지 않는다.

      //최종 prefInfo롤 생성된 gridItems 나중에 aggrid 에 이넘을 넘겨준다.
      this.newGridItems=[];   
      this.flatNewGridItems=[];

      //생성된 newGriditems 중 _DATE, _DAT로 끝나는 날짜칼럼ID들
      this.dateColumnNames=[]; //initEntry를 통해 초기화 된다. 즉, newGridItems가 모두 생성된 후

      
      this.dateObj = {};

      this.monthlyDateColumnNames = [];
      this.quaterDateColumnNames = [];
      this.yearDateColumnNames = [];
      this.dayDateColumnNames = [];

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

    setVersionData(versionData) {
      this.versionData = versionData;
      this.dtfDate = this.getDTFdateFormat();
    }

    //오늘 일자를 가져온다. todo: 서버에서 가져오도록 해야한다.
    getToDay() {
        return new Date();
    }
    //prefInfo로 새롭게 구성한 그리드 items 정보
    getPreferedGridItems() {
        return this.newGridItems;
    }

    setDimensionData(data) {
        this.dimensionData = data;
    }
    setMeasureData(data) {
        this.measureData=data;
    }
    setExtGridOptions(key, val) {
        this.extGridOptions[key] = val;

        this.applyExtGridOptions();
    }

    applyExtGridOptions() {
      if(this.gridOptions)
        this.gridOptions.context.setExtGridOptions(this.extGridOptions)
    }
    getExtGridOptions(key) {
        return this.extGridOptions[key]
    }

    setGridItems(items) {
        this.gridItems=items;
    }

    /**
   * gridCd: viewCd, grpCd로 개인화 정보를 가져오면 여러 그리드의 crossTabInfo와 prefInfo를 가져오게 된다. 그 구분을 gridCd로 한다.
   * crossTabInfo와 prefInfo 를 설정해서 사용한다.
   */
    setGridCrosstabInfo(crossTab) {
        if (crossTab) {
          if (crossTab instanceof Array && crossTab.length > 0) {
            this.crossTabInfo = crossTab[0][this.gridCd];
          } else {
            this.crossTabInfo = crossTab[this.gridCd];
          }
        }
    }
    
    setGridPreferenceInfo(prefInfo)  {
        if (prefInfo !== undefined) {
          const me = this;
          this.prefInfo = prefInfo.filter(item => item.gridCd == me.gridCd || !item.gridCd);
          if (this.prefInfo) {
              this.prefInfoDB = TAFFY(this.prefInfo);
          }

          let editMeasures = [];
          if (this.prefInfo) {
            editMeasures = this.prefInfo.filter(function (columnInfo) {
              return columnInfo.crosstabItemCd == "GROUP-VERTICAL-VALUES" && columnInfo.editMeasureYn==true;
            }).map(function (columnInfo) { return columnInfo.fldApplyCd });
          }
          this.editMeasures = editMeasures;

          this.measureCodes = this.prefInfo.filter(function (prefRow) {
            return prefRow.fldActiveYn && prefRow.crosstabItemCd === 'GROUP-VERTICAL-VALUES';
          }).map(function (prefRow) {
              return prefRow.fldApplyCd;
          });
        }
    }

    /** fillJsonData  후 호출됨 */
    onAfterDataSet(params) {
      const prefInfoHelper = params.context.getCustomCtxValue('prefInfoHelper');
      if(prefInfoHelper) {
        let measureNames = prefInfoHelper.getRowTotalMeasures();

        if (measureNames && measureNames.length > 0) {
            let groupMeasureName = measureNames[0];
            setTimeout(()=> {prefInfoHelper.addSummaryFooter('CATEGORY', groupMeasureName, measureNames);},500);
        }
      }
    }

    /**
     * 값이 변경되면 summary의 값이 변경되도록
     * @param {*} rowId 
     * @param {*} field 
     * @returns 
     */
    onCellValueChanged(params) {

      //const data = params.data;
      const field = params.colDef.field;

      const prefInfoHelper = params.context.getCustomCtxValue('prefInfoHelper');
      if(prefInfoHelper) {
        if (prefInfoHelper.summaryFooter) {
          prefInfoHelper.summaryFooter.reAggregate(params, field);
        }
      }
    }

    
    //gridItems에서 아이템을 찾는다.
    _getGridItem(columnId) {
      return this.gridItems.find(v => getColName(v) === columnId);
    }

    _getColumnProp(columnId, propName) {
        let dataColumn = this._getGridItem(columnId)
        let prop = dataColumn[propName];
        return prop;
    }

    _hasColumnProp(columnId, propName) {
        let dataColumn = this._getGridItem(columnId)

        let prop = dataColumn[propName];
        return prop ? true : false;
    }

    _hasColumnProp2(columnId, propName, propName2) {
        let dataColumn = this._getGridItem(columnId)

        let prop = dataColumn[propName];
        return prop && prop[propName2] ? true : false;
    }

    _getColumnProp2( columnId, propName, propName2) {
        let dataColumn = this._getGridItem(columnId)
        let prop = dataColumn[propName];

        if (prop && prop[propName2]) {
            return prop[propName2]
        } else {
            return ''
        }
    }

    _isIterationColumn(columnId){
        let dataColumn = this._getGridItem(columnId)
        if (!dataColumn)
            return false;
        
        let iteration = dataColumn.iteration;
        if (iteration) {
            return true;
        }
        return false;
    }
    
    _isColumnFix(columnId) {
        let col = this._getGridItem(columnId)
        if (!col)
            return false;
        
        let fix = col.fix;
        if (fix) {
            return true;
        }
        if(col.pinned)
          return true;

        return false;
    }
    _getColumnPinDirection(columnId) {
      let col = this._getGridItem(columnId)
      if (!col)
            return undefined;
        
        let fix = col.fix;
        if (fix) {
            return 'left';
        }
        if(col.pinned)
          return col.pinned;

        return undefined;
    }
    
    _isColumnVisible(columnId) {
        let col = this._getGridItem(columnId)
        if (!col)
            return false;
        if(col.hide != undefined)
            return !col.hide;

        if(col.visible != undefined)
          return col.visible;
        
        return false;
    }
    
    _hasColumnLookup( columnId) {
        let columnInfo = this._getGridItem(columnId)
        
        let lookup = columnInfo.lookup
        if (lookup) {
            return true;
        }
        return false;
    }
    
    _propColumnButton(columnId) {
        let columnInfo = this._getGridItem(columnId)
        
        let button = columnInfo.button
        if (button) {
            return true;
        }
        return false;
    }
    
    _propColumnMerge(columnId) {
        let columnInfo = this._getGridItem(columnId)
    
        let merge = columnInfo.merge
        if (merge) {
        return true;
        }
        return false;
    }

    _propColumnTitle(columnId) {
      let dataColumn = this._getGridItem(columnId)
      if(dataColumn.headerName != undefined)
        return dataColumn.headerName;
      else   
        return dataColumn.headerText
    }


    setWheelScrollLines(wheelScrollLines) {
        //how to define aggrid scroll height ?
        this.wheelScrollLines = wheelScrollLines
    }
    /**
     * 개인화 정보를 가져와서 칼럼 생성
     * @param {*} viewCd 
     * @param {*} grpCd 
     */
    async loadCrossTabInfoAndPrefInfo(viewCd, grpCd,username,resultData){  
        console.log('loadCrossTabInfoAndPrefInfo begin')
        const crossTabInfo = await this.loadCrossTabInfo(viewCd, grpCd,username);
        const prefInfo = await this.loadPrefInfo(viewCd, grpCd,username);
        if(resultData)
          this.makeGridWithPreferenceInfos(prefInfo, crossTabInfo, resultData)
        console.log('loadCrossTabInfoAndPrefInfo end')
    }

    /**
     * 개인화 정보를 이용한 칼럼 생성
     * @param {*} prefInfo 
     * @param {*} crossTab 
     * @param {*} resultData 
     */
    makeGridWithPreferenceInfos (prefInfo, crossTab, resultData) {
        const me = this;
        this.setGridPreferenceInfo(prefInfo)
        this.setGridCrosstabInfo(crossTab)
        
        this.makeGridColumnWithPrefInfo(resultData || [])
    }
          
    async loadCrossTabInfo(viewCd, grpCd, username) {
        if (!viewCd)
            return;

        let retData = null;
        let param = {
            'view-cd': viewCd,
            username: username || ''
        }
        if (grpCd)
            param['grp-cd'] = grpCd;

        const me = this;

        await zAxios({
            method: 'get',
            header: { 'content-type': 'application/json' },
            url: 'system/users/preferences/crosstab-info',
            params: param,
            waitOn: false,
        })
        .then(function (res) {
            retData = res.data
            me.setGridCrosstabInfo(res.data)
        })
        .catch(function (err) {
            console.log(err);
        })
        return retData;
    }

    
    async loadPrefInfo(viewCd, grpCd,username) {
        if (!viewCd )
            return;

        let retData = null;
        let param = {
            'view-cd': viewCd,
            username: username || ''
        }
        if (grpCd)
            param['grp-cd'] = grpCd;

        const me = this;

        await zAxios({
            method: 'get',
            header: { 'content-type': 'application/json' },
            url: 'system/users/preferences/pref-info',
            params: param,
            waitOn: false
        })
        .then(function (res) {
            retData = res.data
            me.setGridPreferenceInfo(res.data)
        })
        .catch(function (err) {
            console.log(err);
        })
        return retData;
    }
        
    /**
     * prefInfo / crosstabInfo 를 이용해 동적 칼럼 생성후 
     * 생성된 날짜 칼럼으로 summary 날짜 칼럼을 위한 초기 정보를 만든다.
     * @param {*} regexp 
     */
    init(regexp) {
        if (!regexp) {
            regexp = /\d{4}.\d{2}.\d{2}/;
        }

        this.regexp = regexp;
                
        this.setWheelScrollLines(this.measureCodes.length);

        var isMonthly = false;

        for (var i = 0, n = this.dateColumnNames.length; i < n; i++) {
            var dateColumnName = this.dateColumnNames[i];

            var pattern = dateColumnName.match(regexp);
            if (!pattern) {
                console.warn('The matching date format does not exist. (date string: ' + dateColumnName + ', date pattern: ' + regexp + ')');
                continue;
            }

            var date = pattern.concat()[0];
            if (!isMonthly && i < n - 1) {
                var nexPattern = this.dateColumnNames[i + 1].match(regexp);
                if (nexPattern) {
                    var nextDate = nexPattern.concat()[0];
                    if (date.slice(-2) === '01' && nextDate.slice(-2) === '01') {
                        isMonthly = true;
                    }
                }
            }

            this.dateObj[dateColumnName] = date;
            if (isMonthly) {
                this.monthlyDateColumnNames.push(dateColumnName);
            }
        }
    }
    /*
    * prefInfo / crosstabInfo 를 이용해 동적 칼럼 생성후 
    * 생성된 날짜 칼럼으로 summary 날짜 칼럼을 위한 초기 정보를 만든다. 위 init 과 동일하나
    * 버킷 정보를 이용하는 수요계획입력에서 사용
    */
    initEntry(regexp, viewBuck, varBuck1, varDate1, varBuck2, varDate2, buck, endDate) {
        if (!regexp) {
            regexp = /\d{4}.\d{2}.\d{2}/;
        }
  
        this.regexp = regexp;        
        this.setWheelScrollLines(this.measureCodes.length);
    
    
        for (var i = 0, n = this.dateColumnNames.length; i < n; i++) {
            var dateColumnName = this.dateColumnNames[i];
            var pattern = dateColumnName.match(regexp);
            if (!pattern) {
                console.warn('The matching date format does not exist. (date string: ' + dateColumnName + ', date pattern: ' + regexp + ')');
                continue;
            }
    
            var dateStr = pattern.concat()[0];
    
            var buckType = null;
            if (viewBuck == "PB") {
                //Date type으로 변경
                var date = winguiUtil.util.date.toDate(dateStr, ".")
        
                if (varDate1 != null) {
                    if (date >= varDate1) {
                        buckType = varBuck1;
                    } else {
                        buckType = buck
                    }
                    if (varDate2 != null && date >= varDate2) {
                        buckType = varBuck2;
                    }
                } else {
                    buckType = buck
                }
                //console.log("hanguls  date", date, " bucketType:",buckType);
            } else {
                buckType = viewBuck;
            }
            
            this.dateObj[dateColumnName] = dateStr;

            if (buckType == null) {
            } else if (buckType == "M") {
                this.monthlyDateColumnNames.push(dateColumnName);
            } else if (buckType == "Q") {
                this.quaterDateColumnNames.push(dateColumnName);
            } else if (buckType == "Y") {
                this.yearDateColumnNames.push(dateColumnName);
            } else if (buckType == "D") {
                this.dayDateColumnNames.push(dateColumnName);
            }  
        }
    }
    
    /** preItem 다음에 추가, preItem이 그룹에 속해있으면 그 그룹 다음에 추가
     * */    
    addGridItem(item, preItem) {
      if(preItem !=undefined) {
        const index = getParentItemIndex(this.newGridItems, preItem)
        if(index >=0)
          this.newGridItems.splice(index +1, 0, item);
      }
      else
        this.newGridItems.push(item)
    }

    toDateString(dateColumnName) {
      return this.dateObj[dateColumnName];
    }
        
    setBucketHeaderText (isWeek) {

      for (var i = 0, n = this.dateColumnNames.length; i < n; i++) {
        var dateColumnName = this.dateColumnNames[i];
        var date = this.toDateString(dateColumnName);
  
        var headerText;
        if (this.yearDateColumnNames !== undefined && this.yearDateColumnNames.includes(dateColumnName)) {
            headerText = winguiUtil.util.date.toYearString(date);
        } else if (this.quaterDateColumnNames !== undefined && this.quaterDateColumnNames.includes(dateColumnName)) {
            headerText = winguiUtil.util.date.toQuaterString(date);
        } else if (this.monthlyDateColumnNames !== undefined && this.monthlyDateColumnNames.includes(dateColumnName)) {
            headerText = winguiUtil.util.date.toMonthlyString(date);
        } else if (this.dayDateColumnNames !== undefined && this.dayDateColumnNames.includes(dateColumnName)) {
            headerText = winguiUtil.util.date.toDayString(date);
        } else {
            headerText = winguiUtil.util.date.toPartialWeekString(date, isWeek, this.STD_WEEK);
        }

        const column = this.dataColumns.find(item => item.field == dateColumnName);
        if(column)
            column.headerName = headerText
      }
    };

    getRow() {
      if (!this.dataRows) {
        return {};
      }
  
      var args;
      if (arguments.length === 1 && arguments[0] instanceof Array) {
        args = arguments[0];
      } else {
        args = Array.prototype.slice.call(arguments);
      }
  
      var parent = this.dataRows;
      for (var i = 0, n = args.length; i < n; i++) {
        var parent = parent[args[i]];
        if (!parent) {
          console.warn('There is no data that matches the key value. (key value: ' + args.slice(0, i + 1).join(' > ') + ')');
          return {};
        }
      }
      return parent;
    };
  
    getRows () {
      if (this.dataRows) {
        return this.dataRows;
      }
  
      return {};
    };
          
    onSelectionEnded (onlyFirst, event) {
      if (!onlyFirst) {
        onlyFirst = false;
      }
  
      if (!event) {
        var regexp = this.regexp;
  
        event= function (event) {
          var sum = 0;
          var cellCount = 0;
  
          var cellRange = event.api.getCellRanges();
  
          cellRange.forEach((range) => {
            let colIds = range.columns.map((col) => col.field);
  
            let startRowIndex = Math.min(
              range.startRow.rowIndex,
              range.endRow.rowIndex
            );
            let endRowIndex = Math.max(
              range.startRow.rowIndex,
              range.endRow.rowIndex
            );
  
            for(let c=0; c < colIds.length; c++) {
              for(let i = startRowIndex; i <= endRowIndex; i++) {
                let node = getDisplayedRowAtIndex(i)
                if(node) {
                  const value = node.data[c] ;
                  if (regexp.test(c)) {
                    sum += value;
                    cellCount++;
                  }
                }
              }
            }
          });
  
          if (cellCount > 1) {
            footer.log.write(' ' + transLangKey('SUM') + ' : ' + sum); //저 footer는 뭐지?
          }
        };
      }
  
      this.extGridOption.RangeSelectionChangedEvent = event;
    }
  
    addSummaryColumns (summaryInfo, totalSummaryInfos) {
      this.summaryColumn = new SummaryColumn(this, this.dateColumnNames);
      this.summaryColumn.create(summaryInfo, totalSummaryInfos);
    }

    addSummaryFooter (measureColumnName, groupMeasureName, totalMeasureNames) {
      let footrCols =[];
      footrCols=footrCols.concat( this.dateColumnNames).concat(this.summaryColumn.getSummaryColumnNames())

      this.summaryFooter = new SummaryFooter(this, footrCols);
      this.summaryFooter.create(measureColumnName, groupMeasureName, totalMeasureNames);
    }

    dynamicCSSSelector(styles, name) {
        let selectorName;

        if (!name)
            selectorName = `dynamic_${createUniqueKey()}_styles`
        else
            selectorName = name;

        selectorName = selectorName.replace(/[,\.-]/gi, '_')
        if (typeof styles === 'string')
            createCSSSelector(selectorName, styles);
        else
            createCSSSelector(selectorName, JSonToStyleString(styles));

        if (this.dynamicCSS.findIndex(v => v === selectorName) < 0)
            this.dynamicCSS.push(selectorName);
        return selectorName;
    }
    
    clearCSSSelector(selectorName) {
        if (selectorName) {
            deleteCSSSelector(selectorName);
            let idx = this.dynamicCSS.findIndex(v => v === selectorName)
            if (idx >= 0) {
                this.dynamicCSS.splice(idx, 1);
            }
        }
        else {
            for (let i = 0; i < this.dynamicCSS.length; i++) {
                deleteCSSSelector(this.dynamicCSS.current[i]);
            }
            this.dynamicCSS.splice(0, dynamicCSS.current.length)
        }
    }
  
    /**
     * style 객체로 동적 css class를 만들고 specificStyle에 추가해놓는다.
     * @param {} styleName 
     * @param {*} style //스타일을 표현한 객체
     */
    addCellStyle(styleName, style) {

        if (this.specificStyle[styleName]) {
            let selectorName = this.specificStyle[styleName];
            this.dynamicCSSSelector(style, selectorName)
        } else {
            let selectorName = `${styleName}_${createUniqueKey()}_styles`
            selectorName = this.dynamicCSSSelector(style, selectorName)
            this.specificStyle[styleName] = selectorName;
        }
    }
    /**
     * 셀 단위 추가
     * @param {*} rowIdx 
     * @param {*} colName 
     * @param {*} styleName 
     */
    setCellStyle(rowIdx, colName, styleName) {
    
      let styleObj = this.customStyles.get(rowIdx, colName)
      if (styleObj == undefined) {
        let style = { accStyle: new Set() }    
        style.accStyle.add(styleName)

        this.customStyles.add(rowIdx, colName, style)
      } else {
        let style = styleObj
        
        style.accStyle.add(styleName)
        style.accStyle.delete("")
        this.customStyles.add(rowIdx, colName, style)
      }
    }
    
    unSetCellStyle(rowIdx, colName, styleName) {
    
      let styleObj = this.customStyles.get(rowIdx, colName)
      if (styleObj) {
        let style = styleObj
        style.accStyle.delete(styleName)
        this.customStyles.add(rowIdx, colName, style)
      }
    }
        
    /**
     *
     * @param {*} rowIdx
     * @param {*} colName
     * @param {*} styleName
     */
    setCellStyles(rowIdx, colName, styleName) {

        if (Array.isArray(rowIdx)) {
            if (Array.isArray(colName)) {
            for (let r = 0; r < rowIdx.length; r++) {
                for (let c = 0; c < colName.length; c++) {
                this.setCellStyle( rowIdx[r], colName[c], styleName)
                }
            }
            } else {
            for (let r = 0; r < rowIdx.length; r++) {
                this.setCellStyle( rowIdx[r], colName, styleName)
            }
            }
        } else {
            if (Array.isArray(colName)) {
            for (let c = 0; c < colName.length; c++) {
                this.setCellStyle(rowIdx, colName[c], styleName)
            }

            } else {
            this.setCellStyle( rowIdx, colName, styleName)
            }
        }
    }
    
    clearAllCustomStyles() {
        this.customStyles.clearAll();
    }   

    unSetCellStyles(rowIdx, colName, styleName) {    
        if (Array.isArray(rowIdx)) {
            if (Array.isArray(colName)) {
            for (let r = 0; r < rowIdx.length; r++) {
                for (let c = 0; c < colName.length; c++) {
                this.unSetCellStyle(rowIdx[r], colName[c], styleName)
                }
            }
            } else {
            for (let r = 0; r < rowIdx.length; r++) {
                this.unSetCellStyle(rowIdx[r], colName, styleName)
            }
            }
        } else {
            if (Array.isArray(colName)) {
            for (let c = 0; c < colName.length; c++) {
                this.unSetCellStyle(rowIdx, colName[c], styleName)
            }

            } else {
            this.unSetCellStyle(rowIdx, colName, styleName)
            }
        }
    }
  
   
    /**
     * gridItems(표준 xml에 정의된 그리드 칼럼정보)를 기준으로 prefInfo(개인화정보) 를 이용해서 
     * 칼럼들의 순서와 너비 visible을 설정한다.  gridItems에 item에 groups 정보가 있으면 그룹을 만들어 준다.
     * 리턴값은 [[columnId1],[columnId2],[columnId3,columnId4],...] 같은 형태 
     * @returns 
     */
    _getArrangedColumns () {
      let columnIds = []
      const me = this;

      this.gridItems.forEach(v => columnIds.push(getColName(v)))
    
      let prefInfo = this.prefInfo
      let indicateCols = this.gridItems.filter(v => indicateTypes.includes(v.type))
      if (prefInfo) {  
        if (prefInfo.length > 0) {
          //gridItems를 봐야하는 이유가 별로 없다. 그냥 prefInfo 만 가지고 해도 된다.
          let columnObj = prefInfo.filter(prefRow => columnIds.includes(prefRow.fldCd)).map(function (prefRow) {
            return { name: prefRow.fldCd, seq: prefRow.fldSeq === undefined ? 10000 : prefRow.fldSeq };
          });
          columnObj = indicateCols.concat(columnObj)
          
          columnObj = columnObj.sort((x, y) => x.seq < y.seq ? -1 : x.seq === y.seq ? 0 : 1);
          columnIds = columnObj.map(item => getColName(item));
        }
      }
    
      let arrangedColumns = [];
      let processedColumns = [];
    
      for (let i = 0, n = columnIds.length; i < n; i++) {
        let columnId = columnIds[i];
        let dataColumn = this._getGridItem(columnId)
    
        //그룹에 속한 것이면 이미 arrangedColumns에 그룹으로 들어간 상태이기 때문에 패스
        if (processedColumns.includes(columnId)) {
          continue;
        }
    
        //그룹스 처리
        let groups = this._getColumnGroups(dataColumn);
        if (groups) {
          let columnObj = [];
          for (let j = 0; j < columnIds.length; j++) {
            let targetColumnId = columnIds[j];
            let targetDataColumn = this._getGridItem(targetColumnId)
            let targetGroups = this._getColumnGroups(targetDataColumn);
            //같은 그룹이름을 가진 칼럼이 자신의 형제임
            //첫번째 그룹정보를 보는 순간 해당 그룹칼럼에 들어갈 자식들을 찾아서 배열에 넣는다.
            if (targetGroups === groups) {
              columnObj.push({ name: targetColumnId, seq: columnIds.indexOf(targetColumnId) });
              processedColumns.push(targetColumnId);
            }
          }
    
          columnObj = columnObj.sort((x, y) => x.seq < y.seq ? -1 : x.seq === y.seq ? 0 : 1);
          arrangedColumns.push(columnObj.map(item => getColName(item)));
        } else {
          arrangedColumns.push([columnId]);
        }
      }
    
      return arrangedColumns;
    }  

    columnsSort(columns) {
        return columns.sort(function (a, b) {
          if (a.columnIndexNo === undefined) {
            a.columnIndexNo = 10000;
          }
          if (b.columnIndexNo === undefined) {
            b.columnIndexNo = 10000;
          }
      
          if (a.columnIndexNo === b.columnIndexNo) {
            return getColName(a) > getColName(b) ? 1 : (getColName(b) > getColName(a) ? -1 : 0)
          } else {
            return a.columnIndexNo > b.columnIndexNo ? 1 : (b.columnIndexNo > a.columnIndexNo ? -1 : 0);
          }
        });
    }

    _getColumnGroups(column){
        //iteration 칼럼은 그룹칼럼 만드는 로직을 별도로 처리해야 한다.
        if (column.iteration) {
            return ''
        }
        if (column.groups) {
            return column.groups;
        }
        return '';
    }
    //그룹 칼럼이면 그중 하나라도 고정이면 그룹칼럼을 고정한다.
    _isFixedColumn(arrangedColumns) {
        let isFixedCol = false;
        for (let i = 0; i < arrangedColumns.length; i++) {
          let arrangedColumn = arrangedColumns[i];
          isFixedCol = this._isColumnFix(arrangedColumn)
            && this._isColumnVisible(arrangedColumn)
            && !isFixedCol;
        }
        return isFixedCol;
    }
      
    _propColumnTooltip(columnInfo) {
        let tooltip = columnInfo.tooltip;
        if (tooltip) {
            return tooltip.split(',').map(item => item.replace(/(^\s*)|(\s*$)/gi, ''));
        }
        return [];
    }
          
    
    /**
     * agGrid와 혼동이 있으므로 col.type을 지원하지 않는다
     */
    _getColumnDataType(col) {
      if(col.cellDataType != undefined)
        return col.cellDataType
      else if(col.dataType != undefined)
        return col.dataType
      else
        return 'text';
    }
    
    _propColumnFormat(columnInfo, columnDataType) {
        let format = columnInfo.numberFormat;
        if (format) {
            return format;
        } else {
            if (columnDataType === "INT" || columnDataType === "NUMBER") {
                return '#,###'
            } else if (columnDataType === "FLOAT" || columnDataType === "DOUBLE") {
                return '#,###.###'
            }
        
            if (DATETIME_DATA_TYPE.includes(columnDataType)) {
                return 'yyyy-MM-dd HH:mm:ss'
            }
            return '';
        }
    }
    
    _hasColumnDateLimitInitValue(columnInfo) {
        let dateLimitValues = columnInfo.dateLimit && columnInfo.dateLimit.initValue;
        if (dateLimitValues) {
            return true;
        }
        return false;
    }
    
    _propColumnDateLimitInitValue(columnInfo, elementName) {
        return columnInfo.dateLimit.initValue[elementName];
    } 

    _propColumnTextAlignment(columnInfo) {
        let textAlignment = columnInfo.textAlignment
        if (textAlignment) {
            textAlignment = textAlignment.toUpperCase();
            if (Object.getOwnPropertyNames(TEXT_ALIGNMENT).includes(textAlignment)) {
            return TEXT_ALIGNMENT[textAlignment];
            }
        }
        return '';
    }

    getDateFrom(d) {
      if(typeof d =='object')
        return d;
      else
        return getDateFromDateString(d)
    }
    /**
     * get Date limit (min/max date) for DATE(DATETIME) column
     */
    _getDateLimit(columnInfo) {
    
      let dateLimit = columnInfo.dateLimit;;
    
      let minDate;
      let maxDate;
    
      let dateLimitInitValue = dateLimit.initValue
      if (dateLimitInitValue) {
        /**
         * process min-date init
         */
        if (this._hasColumnDateLimitInitValue(columnInfo)) {
          minDate = this._propColumnDateLimitInitValue(columnInfo, 'minDate');
        }
    
        if (minDate !== undefined) {
          dateLimit.minDate = this.getDateFrom(minDate);
        }
    
        /**
         * process max-date init
         */
        if (this.hasColumnDateLimitInitValue(columnInfo)) {
          maxDate = this._propColumnDateLimitInitValue(columnInfo, 'maxDate');
        }
    
        if (maxDate !== undefined) {
          dateLimit.maxDate = this.getDateFrom(maxDate);
        }
      }
    
      return dateLimit;
    }
    

    /**
     * 칼럼 동적 생성
     * @param {*} fieldName 
     * @param {*} iterColumnId  column name
     * @param {*} isIterationColumn 
     * @returns 
     */
    createDataColumn(fieldName, iterColumnId, isIterationColumn) {
        
        const columnId = isIterationColumn ? iterColumnId : fieldName;

        let columnInfo = this.gridItems.find(v => getColName(v) === columnId)
    
        let columnVisible = getColVisible(columnInfo);
        let columnWidth = parseInt(columnInfo.width);
        let columnTitle = columnId;
    
        let tempColumnTitle = columnInfo.headerText;
        if (tempColumnTitle && tempColumnTitle.toUpperCase() !== PREF_FIELD_NM) {
            columnTitle = tempColumnTitle;
        }
        
        let dataColumn = Object.assign({}, columnInfo);    
          
        //visible, width, headerName은 prefInfo 것으로
        if (this.prefInfoDB) {
            let columnPrefInfo = this.prefInfoDB().filter({ fldCd: columnId }).get()[0];
            dataColumn.columnPrefInfo = columnPrefInfo;
            if (columnPrefInfo) {
            if (columnPrefInfo['fldActiveYn'] != undefined) {
                columnVisible = columnPrefInfo['fldActiveYn'];
            }
        
            if (columnPrefInfo['fldWidth'] != undefined) {
                columnWidth = Number(columnPrefInfo['fldWidth']);
            }
        
            if (!isIterationColumn) {
                if (columnPrefInfo['fldApplyCd'] != undefined) {
                columnTitle = transLangKey(columnPrefInfo['fldApplyCd']);
                }
            } else {
                if (columnPrefInfo['fldApplyCdLang'] != undefined) {
                    columnTitle = transLangKey(columnPrefInfo['fldApplyCdLang']);
                    } else if (columnPrefInfo['fldApplyCd']) {
                    columnTitle = columnPrefInfo['fldApplyCd'];
                    }
                }
            }
        }
     
        dataColumn.field = fieldName;
        dataColumn.cellDataType = this._getColumnDataType(columnInfo);
        dataColumn.headerName = transLangKey(columnTitle);
        dataColumn.visible = columnVisible;
        if(dataColumn.visible == false) {
          dataColumn.suppressColumnsToolPanel=true; //보이지 않는 칼럼이면 칼럼 툴 패널에서도 보이지 않게 처리
        }
        else {
          dataColumn.suppressColumnsToolPanel=false; 
        }
        dataColumn.width = columnWidth;     
        dataColumn.columnIdOrg = columnId;
        //dataColumn.isIterationColumn = isIterationColumn;
        if(isIterationColumn) {
          dataColumn.enableRowGroup = false;
          const measure = this.editMeasures[0]
          dataColumn.aggFunc= (params) => groupFooterAggFunc(params, [measure])
        }
        else {
          dataColumn.enableRowGroup = true;
        }
          
        //헤드는 css style을 받는 API가 없다. css class만 받는다.
        addHeaderCellClass(dataColumn,'header-center');

        let styles = {};

        let fieldColor;
        if (fieldName) {
            let colorTest = fieldName.match(/,COLOR_\w{6}/gi);
            if (colorTest) {
            fieldColor = colorTest[0].match(/_\w{6}/gi)[0].replace('_', '#');
            }
        }
        if (fieldColor !== undefined && columnIterationApplyColor !== undefined && (columnInfo.applyColor === 'both' || columnInfo.applyColor === 'header')) {
            /* 헤더 스타일 적용 */
            let headerStyles = {};
            headerStyles.background = fieldColor;
            addHeaderCellClass(dataColumn, this.dynamicCSSSelector(headerStyles))
            styles.background = fieldColor;
        }
                      
        let columnDataType = this._getColumnDataType(columnInfo).toUpperCase();
    
        if (TEXT_DATA_TYPE.includes(columnDataType)) {
            dataColumn.cellDataType = 'text'
        } 
        else if (NUMBER_DATA_TYPE.includes(columnDataType)) {
            dataColumn.cellDataType = 'number'

            let columnFormat = this._propColumnFormat(columnInfo, columnDataType);     
               
            if (columnFormat !== 'DS') {
                let formatPattern = /(#|,|\d|\.)/g;
                let columnFormats = [columnFormat.match(formatPattern).join(""), columnFormat.replace(formatPattern, '')];
            
                dataColumn.numberFormat = columnFormats[0];
            
                if (columnFormats[1] !== undefined && columnFormats[1].length > 0) {
                    dataColumn.suffix = columnFormats[1];
                }
            
                let excelFormat = columnInfo.excelFormat;
                if (excelFormat) {
                    dataColumn.excelFormat = excelFormat;
                } else {
                    if (!dataColumn.numberFormat) {
                        if (columnDataType === 'INT' || columnDataType === 'INTEGER') {
                            dataColumn.excelFormat = '#,###';
                            dataColumn.editFormat = '#,###';
                            dataColumn.valueFormatter =  (params) =>{
                                return format('#,###', params.value);
                            }
                            dataColumn.integerOnly = true;
                        } else if (columnDataType === 'DOUBLE' || columnDataType === 'FLOAT') {
                            let strFormats = dataColumn.numberFormat.split('.');
                            strFormats[0] = strFormats[0].replaceAt(strFormats[0].length - 1, '0');
                            if (strFormats[1]) {
                                strFormats[1] = strFormats[1].replaceAt(0, '0');
                            } else {
                                strFormats[1] = '0##';
                            }
                            let numf = strFormats[0] + '.' + strFormats[1]
                            dataColumn.excelFormat = numf;
                            dataColumn.editFormat = numf;
                            dataColumn.valueFormatter=   (params)=> {
                                return format(numf, params.value);
                            }
                        } else {
                            let numf = dataColumn.numberFormat;
                            dataColumn.excelFormat = numf;
                            dataColumn.editFormat = numf;
                            dataColumn.valueFormatter=  (params)=> {
                                return format(numf, params.value);
                            }
                        }
                    } else {
                        dataColumn.valueFormatter =  (params) =>{
                            return format(dataColumn.numberFormat, params.value);
                        }
                    }
                }
            }
        } else if (DATETIME_DATA_TYPE.includes(columnDataType)) {
            dataColumn.cellDataType = 'date'

            let columnFormat = this._propColumnFormat(columnInfo, columnDataType);
            dataColumn.datetimeFormat = columnFormat;
        
            //if (columnInfo.datepicker) {            
            if (columnInfo.dateLimit) {
                let dateLimit = this._getDateLimit(columnInfo);
                if (dateLimit.minDate) {
                    dataColumn.minDate = dateLimit.minDate;
                }
                if (dateLimit.maxDate) {
                    dataColumn.maxDate = dateLimit.maxDate;
                }
            }
            //}
        } else if (BOOL_DATA_TYPE.includes(columnDataType)) {
        
            dataColumn.cellDataType = 'boolean'

            if (this._hasColumnProp(columnId, 'headerCheckable')) {
              //Custom header component를 사용할 경우
              //https://www.ag-grid.com/react-data-grid/component-header/
              dataColumn.checkboxSelection = true;
            }
        } else if (IMAGE_DATA_TYPE.includes(columnDataType)) {
        
            dataColumn.cellDataType = 'text'
            this.addCellRenderParams(dataColumn, {imageType: true})
        } 
             
        let columnTextAlignment = this._propColumnTextAlignment(columnInfo);
        if (columnTextAlignment !== undefined && columnTextAlignment.length > 0) {
            dataColumn.textAlignment = columnTextAlignment;
        }
    
        // TODO: fitRowHeightAll, fitRowHeight
        // (* displayOptions.eachRowResizable: true로 지정되어 있어야 한다. multiLine인 경우 textWrap: “explicit”로 지정 )
        if (this.gridDataFit === 'VERTICAL') {
            styles.textWrap = 'normal';
        } else if (this.gridDataFit === 'NONE') {
            styles.textWrap = 'ellipse';
        }
        
        if (!(styles && Object.keys(styles).length === 0 && Object.getPrototypeOf(styles) === Object.prototype)) {
          addCellClassRule(dataColumn, this.dynamicCSSSelector(styles))
        }
        
        //이게 맞는지 확인, group/ sort/ filter 시 작동 유무 확인 필요
        if (this._propColumnMerge(columnId)) {
          addCellClassRule(dataColumn, 'merge-cell', (params) => params.value !== undefined)

          //aggrid colSpan :https://www.ag-grid.com/react-data-grid/column-spanning/
          //aggrid rowSpan: https://www.ag-grid.com/react-data-grid/row-spanning/
          const mData = this.measureData
          const mCode = this.measureCodes
          dataColumn.rowSpan = (params)=>{ 
                if(params.data == undefined) //group row
                  return 1;
      
                const m = params.data['CATEGORY']
                if(mCode[0] == m)
                  return mData.length
                else
                  return 1;
          }
        }        
        
        //https://www.ag-grid.com/react-data-grid/aggregation/
        //https://www.ag-grid.com/react-data-grid/server-side-model-grouping/#row-group-footers        
        if (NUMBER_DATA_TYPE.includes(columnDataType)) {
            
            //https://www.ag-grid.com/react-data-grid/aggregation-custom-functions/
            /*
            */
            //dataColumn.aggFunc = this.measureAggFunc //dataColumn.suffix
        }
                
        if (this._propColumnButton(columnId)) {
            this.addCellRenderParams(dataColumn, { 
                button: true
            })
        }    
        if(this._isColumnFix(columnId))
          dataColumn.pinned = this._getColumnPinDirection(columnId);
        
        this.dataColumns.push(dataColumn);
        
        return dataColumn;
    }
    
    /** prefInfo로 동적칼럼을 모두 만든 후 호출됨. 버킷에 따라 추가 칼럼정보 즉, Summary 칼럼 생성 */
    gridDataFillReady() {

      if(this.DPEntry) {
        let versionInfo = this.versionData;
        let viewBuck = this.BUCKET;
        
        let totalSummaryInfos = [
            {
            columnName: "TOTAL_SUM",
            summaryType: "sum",
            },
        ];
        let varDate1 = null;
        let varDate2 = null;
        let varBuck1 = null;
        let varBuck2 = null;
        let buck = null;
        let endDate = null;
        
        /* get start month, and apply grid calendar
            * 0 : SUN
            * 1 : MON
            * */
        let stdWeek = versionInfo["STD_WEEK"];
        let dayOfWeek = 0;
        switch (stdWeek) {
            case "Mon":
            dayOfWeek = 1;
            break;
            case "Sun":
            dayOfWeek = 0;
            break;
        }
        wingui.util.date.calendar.setFirstDayOfWeek(dayOfWeek);
        
        if (viewBuck && viewBuck == "PB") {
            varDate1 = versionInfo["VAR_DATE"];
            if (varDate1 && typeof varDate1 == "string") {
            varDate1 = varDate1.substr(0, 10);
            varDate1 = wingui.util.date.toDate(varDate1, "-");
            }
            varDate2 = versionInfo["VAR_DATE2"];
            if (varDate2 && typeof varDate2 == "string") {
            varDate2 = varDate2.substr(0, 10);
            varDate2 = wingui.util.date.toDate(varDate2, "-");
            }
            varBuck1 = versionInfo["VAR_BUKT"];
            varBuck2 = versionInfo["VAR_BUKT2"];
        }
        endDate = versionInfo["TO_DATE"];
        if (endDate && typeof endDate == "string") {
            endDate = endDate.substr(0, 10);
            endDate = wingui.util.date.toDate(endDate, "-");
        }
        
        buck = versionInfo["BUKT"];
        
        this.initEntry(/\d{4}.\d{2}.\d{2}/, viewBuck, varBuck1, varDate1, varBuck2, varDate2, buck, endDate);
        this.addSummaryColumns(null, totalSummaryInfos);
      }
      else
        this.init(/\d{4}.\d{2}.\d{2}/);
      
    }
    
    getRowTotalMeasures() {
        
        let extrctCode = "MEASURE_CD"
              
        let activatedLevelMeasures = this.measureData.filter(function (row) {
          let measureCode = row[extrctCode];
          if (measureCode == null) {
            return false;
          } else if (row.LEVEL_CD == null) {
            return false;
          } else if (row.ACTV_YN == false) {
            return false;
          }
          return (measureCode.slice(-3) == "QTY" || measureCode.slice(-3) == "AMT") && (!measureCode.includes("PR"));
        });
      
        // 3. get qty of authority type
        let authType = this.AUTH_TP;
        // 4. if qty of same level is none, set footer by activated level measures (refer 2.)
        let sameValue = activatedLevelMeasures.filter(function (row) {
            return row.LEVEL_CD == authType;
        }).map(function (row) {
            return row[extrctCode];
        });

        let otherValues = activatedLevelMeasures.map(function (row) {
          return row[extrctCode];
        });
      
        return sameValue.length > 0 ? sameValue : otherValues;
    }

    //현재 버킷 칼럼 헤드 스타일 지정
    setCurrentBucketHeaderStyle() {     
        const me = this;   
        //현재 일자 보다 적은 것 처리, 현재일자를 서버에서 가져오도록 해야 함.
        let dates = this.newGridItems.filter(function (colInfo) {
            const col = colInfo.field;

            if (!col?.startsWith("DATE_")) {
                return false;
            }
            let colDate = col.replace("DATE_", "").replace(",VALUE", "").substring(0, 10);
            return getDateFromString(colDate) <= me.getToDay()
        })
      
        let baseColumn = null;
        if (dates && dates.length) {
          baseColumn = dates.reduce(function (previous, current) {
                return previous > current ? previous : current;
          });
        }

        if (baseColumn != null) {
            const baseColumnInfo=this.newGridItems.find(item => item.field == baseColumn.field)
            if(baseColumnInfo) {
                addHeaderCellClass(baseColumnInfo,'current-Bucket');
                baseColumnInfo.headerName = baseColumnInfo.headerName +" (now)"
            }
        }
    }

    checkVersionBucket() {
        let viewBuck = this.BUCKET;
        if (viewBuck && viewBuck == "PB") {
          let versionInfo = this.versionData;
          if (versionInfo != null) {
            return versionInfo['BUKT'];
          } else {
            return 'PW';
          }
        } else {
          return viewBuck;
        }
    }

    getDTF() {
        let versionInfo = this.versionData;
        if (versionInfo) {
            let dateTimeFence = versionInfo['DTF_DATE'];
            return dateTimeFence;
        }
        else    
            return undefined;
    }

    getStartDate() {
        let versionInfo = this.versionData;
        if (versionInfo) {
            let dateTimeFence = versionInfo['FROM_DATE'];
            return dateTimeFence;
        }
    }

    getDTFdateFormat() {
        let dtf = this.getDTF();
        if (dtf) {
          let date = getDateFromString(dtf);
          if (dtf == this.getStartDate() && this.versionData.BUKT !== 'D') {
            date.setDate(date.getDate() - 1);
          }
          return date;
        }
        return undefined;
    }

    addCellRenderParams(column, params) {
        const existParams = column.cellRendererParams;
        column.cellRendererParams={...existParams, ...params}
    }
    setCellCommnetButton( measureName) {
        let dtfDate = this.dtfDate;
        let dateColumns = this.flatNewGridItems.filter(function (column) {
                return column?.field?.includes("DATE_");
            }).filter(function (col) {
                let fieldName = col.field;
                return getDateFromString(fieldName.replace("DATE_", "").substring(0, 10)) > dtfDate;
            });
        const me = this;
        dateColumns.forEach(dateColumn => {            
            me.addCellRenderParams(dateColumn, {commentEnable: true,
                                                measureName: measureName,
                                              });
        })
    }
   

    /**
     * dimension 영역 셀 머지
     * group by 되기 때문에 의미 없음
     */
    setMergeCell() {
      if (!this.prefInfo)
        return;
    
      const dimensions = this.prefInfo.filter(function (row) {
        return row["dimMeasureTp"] === "DIMENSION" && row["fldActiveYn"] === true
      }).map(function (row) {
        return row["fldCd"]
      });
    
      for (let i = 0, n = dimensions.length; i < n; i++) {
        
        this.flatNewGridItems.forEach(item => {
          //디멘젼 칼럼에 rowSpan 콜백설치
          if(item.field == dimensions[i]) {
            
            item.rowSpan = (params)=>{

              let height=1;
              let startRow = params.api.getFirstDisplayedRow();
              let lastRow = params.api.getLastDisplayedRow();
              const dispCols = params.columnApi.getAllDisplayedColumns();
              const coldId = params.colDef.field;
              
              //이전 칼럼 키를 가져온다.
              const prevColKey = [];
              for(let i=0; i < dispCols.length; i++) {
                const colInfo = dispCols[i];
                prevColKey.push(colInfo.colId)
                if(colInfo.colId == coldId) {
                  break;
                }
              }
      
              for(let i=startRow; i <= lastRow; i++) {
                  const rowNode = params.api.getDisplayedRowAtIndex(i)
                  let merged = true;
                  for(let cIdx=0; cIdx < preCol.length; cIdx++) {
                    //현재 row와 같은 값을 가진 노드 갯수
                    var val = params.data[prevColKey[cIdx]]; 
                    if(rowNode.data && rowNode.data[prevColKey[cIdx]] != val) {
                      merged=false;
                      break;
                    }
                  }
                  if(merged)
                    height++;
                  else
                    break;
              }
              return height;
          }
          }
        })
      }
    }

    preventColumnSort() {
      let dateFieldColumns = this.flatNewGridItems.filter(function (colDef) {
        const colId = colDef.field;
        return colId?.includes("DATE_") && colId?.includes("VALUE");
      });
      for (let i in dateFieldColumns) {
        const colDef = dateFieldColumns[i]
        colDef.sortable = false;
        //colDef.positiveOnly = true;
      }
      let categoryField = this.flatNewGridItems.find(colDef => colDef.field == 'CATEGORY')
      if (categoryField) {
        categoryField.sortable = false;
      }
    }

    pinDemandColumn() {
      for(let i=0; i < this.flatNewGridItems.length; i++) {
        const colDef = this.flatNewGridItems[i]

        colDef.pinned = 'left'
        if(colDef.field == 'CATEGORY') {
          colDef.pinned ='left'
          break;
        }        
      }
    }

    gridAfterSetData (resultData) {
        if (!resultData || resultData.length == 0) {
        return;
        }

        let measureNames = this.getRowTotalMeasures();
        let authType = this.AUTH_TP;

        //edit가능한 measure 값
        let selfEditMeasure = measureNames.filter(function (row) {
            return row == authType + "_QTY";
        });

        let isComment = this.prefInfo.filter(function (row) {
            return row.fldCd == "COMMENT"
        }).map(function (row) {
            return row.editTargetYn
        });

        //custom cell style 적용함수
        this.flatNewGridItems.forEach(col => {
            addCellClass(col,this.dynamicCellClassCallback);
        })
        if(this.DPEntry) {
          this.setBucketHeaderText((this.checkVersionBucket() == "W"));
this.pinDemandColumn();
        }
        this.setCurrentBucketHeaderStyle();

        if (isComment !== undefined && isComment[0] == true && selfEditMeasure.length > 0) {
            this.setCellCommnetButton(selfEditMeasure);
        }
        
        this.preventColumnSort();
        
    }

    //cellClass 적용함수
    dynamicCellClassCallback(params) {
        let ret = [];
        if(params.data == undefined)
          return ret;

        let rowIdx =  params.data._rowId;
        let colName = params.colDef.field;
        const prefInfoHelper = params.context.getCustomCtxValue('prefInfoHelper');

        if(prefInfoHelper.customStyles) {
            const customStyles = prefInfoHelper.customStyles;
            //cell에 등록된 style 정보를 가져온다.
            let thisStyleInfo= customStyles.get(rowIdx,colName);
            if(thisStyleInfo) {
                const accStyle = thisStyleInfo.accStyle
                for (let styleName of accStyle) {
                    if(!styleName)
                        continue;
                    if(grid.specificStyle[styleName]) {
                        ret.push(grid.specificStyle[styleName])
                    }
                    if(prcd == false) {
                        ret.push(styleName)
                    }
                }
                return ret;
            }
        }
    }

    /** rowData 정보와 iteration 정보를 이용해서 동적칼럼 생성할 field 배열 리턴*/
    getDynamicCreateFields(prefInfo,delimiterOnColumn, dataFieldNames, iterationColumnId,prefix, postfix) {
      const names=[]
      for (let i = 0 ; i < dataFieldNames.length; i++) {
        let fieldName = dataFieldNames[i];

        //결과 데이타로 넘어온 것 중 iteration prefix로 시작하고 postfix로 끝나는 것이 동적으로 생성해야 할 칼럼
        if ((fieldName.startsWith(prefix) && fieldName.endsWith(postfix))
            || (fieldName.startsWith(prefix) && fieldName.endsWith(transLangKey(postfix)))) {
            names.push(fieldName);
        }
      }

      //키 순서를 정한 정보(ordinalPosition) 이 있으면 그넘을 이용해서 sort, 아니면 문자열순 정렬
      let ordinalPosition = this._getColumnProp2(iterationColumnId, 'iteration', 'ordinalPosition')
      if(typeof ordinalPosition  == 'function') {
        names.sort(ordinalPosition);
      }
      else {
        names.sort(function (a, b) {
            let ac = a.replace(prefix, '').replace(postfix, '');
            let bc = b.replace(prefix, '').replace(postfix, '');
    
            if (ordinalPosition) {
              //배열이라고 판단
                let acPos = ordinalPosition.indexOf(ac);
                let bcPos = ordinalPosition.indexOf(bc);
    
                if (acPos !== -1 && bcPos !== -1) {
                    ac = acPos;
                    bc = bcPos;
                } else if (acPos !== bcPos) {
                    if (acPos === -1) {
                        return 1;
                    } else if (bcPos === -1) {
                        return -1;
}
                }
            }
            else {
              //preference 의 field seq에 따라 
              if(prefInfo) {
                delimiterOnColumn = delimiterOnColumn ? delimiterOnColumn : ",";

                const cols1 = ac.split(delimiterOnColumn);
                const cols2 = bc.split(delimiterOnColumn);

                for(let i=0; i < cols1.length; i++) {
                  const f = cols1[i];
                  const f2 = cols2[i];

                  const pref=prefInfo.find(p=> p.fldCd == f)
                  const pref2=prefInfo.find(p=> p.fldCd == f2)
                  if(pref && pref2) {
                    if(pref.fldSeq != pref2.fldSeq)
                      return pref.fldSeq - pref2.fldSeq
                    }
                }
            }
    
            if (ac > bc) {
                return 1;
            } else if (ac < bc) {
                return -1;
            } else {
                return 0;
}
            }
        });
      }    
      return names;
    }

    //그룹헤드 필드 
    stripHeaderName(iterationColumnId, field, prefix, postfix) {

      const prefixRemove       = this._getColumnProp2(iterationColumnId, 'iteration', 'prefixRemove')
      const postfixRemove      = this._getColumnProp2(iterationColumnId, 'iteration', 'postfixRemove')

      let groupHeader= field;
      //'SEQ123', ',SEQ_123' 이런식으로 된게 있으면 이 문자열만 제외하고 헤드 field로 쓴다.
      let seqPattern = /SEQ\d{3}|,SEQ_\d{3}/gi;
      let seqMatchTest = groupHeader.match(seqPattern);
      if (seqMatchTest != undefined && seqMatchTest != '' && seqMatchTest.length > 0) {
        for (let matchIdx = 0, matchLen = seqMatchTest.length; matchIdx < matchLen; matchIdx++) {
          let matchedStr = seqMatchTest[matchIdx];
          groupHeader = groupHeader.replace(matchedStr, '');
        }
      }

      let colorTest = groupHeader.match(/,COLOR_\w{6}/gi);
      if (colorTest && colorTest.length > 0) {
        groupHeader = groupHeader.replace(colorTest[0], '');
      }

      let remarkTest = groupHeader.match(/REMARK_\w+/gi);
      if (remarkTest && remarkTest.length > 0) {
        groupHeader = groupHeader.replace('REMARK_', '');
      }

      if (prefixRemove) {
        groupHeader = groupHeader.replace(prefix, '');
        groupHeader = groupHeader.replace(transLangKey(prefix), '');
      }

      if (postfixRemove) {
        groupHeader = groupHeader.replace(postfix, '');
        groupHeader = groupHeader.replace(transLangKey(postfix), '');
      }
      return groupHeader;
    }
    /**
     * 칼럼정보 생성
     * @param {*} resultData 
     */
    makeGridColumnWithPrefInfo(resultData){
      
      this.reset();

      if (this.onBeforeDataSet) {
        this.onBeforeDataSet(this, resultData)
      }
            
  
      //개인화정보 순서대로 칼럼정보 order by
      //그룹으로 묶힐 칼럼들은 배열에 같이 담아서 온다.
      let arrArrangedColumns = this._getArrangedColumns();
      console.log('arrArrangedColumns',arrArrangedColumns)
    
      //서버에서 던져준 데이타를 기준으로 dateField명을 만든다.
      if (resultData && resultData.length > 0) {
        this.dataFieldNames = Object.keys(resultData[0]);
      }
    
      let isFixed = false;
      //iteration 칼럼 제외한 dimension영역 칼럼
      let staticColumnsMap = {};    //dimesion 영역 칼럼
      let staticGridGroupHeaders = [];
      let columnsByIterCreate = []; //생성되는 모든 동적인 칼럼

      let columnIndexNo = 0;
      this.headerDepth = 0;
    
      for (let arrIdx = 0; arrIdx < arrArrangedColumns.length; arrIdx++) {
        let arrangedColumns = arrArrangedColumns[arrIdx];
    
        if (!this._isIterationColumn( arrangedColumns[0])) {
          let dataColumns = [];
          
          //그룹으로 묶이지 않았으면 개수는 1개
          for (let i = 0; i < arrangedColumns.length; i++) {
            let columnId = arrangedColumns[i];

            let dataColumn = this.createDataColumn(columnId, columnId, false);
            
            dataColumn.columnIndexNo = columnIndexNo;
            columnIndexNo++;

            //AG Grid에서는 개별 처리
            if(this._isColumnFix(columnId)) {
              dataColumn.pinned = this._getColumnPinDirection(columnId)
            }
            dataColumns.push(dataColumn);
          }
    
          let groupHeaders = [];
          let groupHeader = this._getColumnProp(arrangedColumns[0], 'groups')
          if (groupHeader) {
            //',' 로 분류된것은 현재 없음. ,로 분리하면 그룹 밑에 그룹 형태로 됨.
            groupHeaders = groupHeader.split(',');
            staticGridGroupHeaders.push(groupHeaders);
          }
          
          if (groupHeaders.length > 0) {
            for (let groupHeadersIndex = 0; groupHeadersIndex < groupHeaders.length; groupHeadersIndex++) {
              
              let groupHeader = groupHeaders[groupHeadersIndex];
              let groupColumnVisible = false;
              let headerBackgroundColors = [];
              let groupShowMode = '';

              for (let columnIdx = 0; columnIdx < arrangedColumns.length; columnIdx++) {
                if (this._getColumnProp(arrangedColumns[columnIdx], 'visible')) {
                  groupColumnVisible = true;
                }
    
                let headerBackground = this._getColumnProp(arrangedColumns[columnIdx], 'headerBackground')
                if (headerBackground) {
                  headerBackgroundColors.push(headerBackground);
                }
    
                if (this._getColumnProp(arrangedColumns[columnIdx], 'groupShowMode')) {
                  groupShowMode = true;
                }
              }
                  
              //그룹칼럼을 생성
              let groupColumn = {};
              
              groupColumn.field = arrangedColumns.toString() + '_' + groupHeader;
              groupColumn.width = 0;
              groupColumn.headerName = transLangKey(groupHeader);
              groupColumn.visible = groupColumnVisible;
              groupColumn.children = [];
               
              if (headerBackgroundColors.length > 0) {
                //그룹으로 묶은 애들 속성으로 그룹 style 을 만든다. 그중에 첫번째 값만 이용
                let headerStyles = {};   
                headerStyles.background = headerBackgroundColors[0];
                groupColumn.cellClass = this.dynamicCSSSelector(headerStyles);
              }

              if (groupShowMode) {
                //그룹이 열려 있거나 닫혀 있을 때만 열을 표시할지 여부
                groupColumn.columnGroupShow = 'open'
              }             
    
              if (this.headerDepth < groupHeadersIndex + 1) {
                this.headerDepth = groupHeadersIndex + 1;
              }
                  
              //마지막 그룹레벨이면 이전에 모아놓은 칼럼을 자식을 넣는다.
              if (groupHeaders.length === groupHeadersIndex + 1) {
                groupColumn.children = groupColumn.children.concat(dataColumns);    
              }
    
              if (groupHeadersIndex === 0) {
                groupColumn.columnIndexNo = columnIndexNo;
                columnIndexNo++;
              }
    
              let columnsConcatFlag = true;
              if (!staticColumnsMap.hasOwnProperty(groupHeader)) {
                staticColumnsMap[groupHeader] = groupColumn;
              } else {
                staticColumnsMap[groupHeader].children = staticColumnsMap[groupHeader].children.concat(groupColumn.children);
                staticColumnsMap[groupHeader].width = staticColumnsMap[groupHeader].width + groupColumn.width;
                columnsConcatFlag = false;
              }
    
              let parent = groupHeaders[groupHeadersIndex - 1];
              if (parent && columnsConcatFlag) {
                staticColumnsMap[parent].children.push(groupColumn);
              }
            }
          } else {
            staticColumnsMap[getColName(dataColumns[0])] = dataColumns[0];
          }
        }
        //iteration 칼럼생성 시작
        else { 
          let columnsMap = {};
    
          //iteration 칼럼인 경우엔 arrangedColumns은 무조건 1개여야 한다. 
          //groups property를 통한 그룹을 만들지 않기로 한다. 다른 방법을 사용
          const iterationColumnId = arrangedColumns[0];  
          const columnIterationPrefix  = this._getColumnProp2(iterationColumnId, 'iteration', 'prefix')
          const columnIterationPostfix = this._getColumnProp2(iterationColumnId, 'iteration', 'postfix')
          
          const hasDelimiter       = this._hasColumnProp2( iterationColumnId, 'iteration', 'delimiter')
          const delimiterOnColumn  = this._getColumnProp2(iterationColumnId, 'iteration', 'delimiter')
          const columnIterationVisible = this._getColumnProp( iterationColumnId, 'visible')
          const columnIterationHeaderBackground = this._getColumnProp( iterationColumnId, 'headerBackground')
          let tempColumnTitle = this._propColumnTitle(iterationColumnId); //headerText

          // 생성할 iteration 칼럼 필드명 배열
          let dynamicFieldNames =this.getDynamicCreateFields(this.prefInfo,delimiterOnColumn,this.dataFieldNames, iterationColumnId, columnIterationPrefix, columnIterationPostfix)
    
          //이제 dynamicFieldNames으로 동적 칼럼을 만든다.
          for (let fieldIdx = 0 ; fieldIdx < dynamicFieldNames.length; fieldIdx++) {

            let fieldName = dynamicFieldNames[fieldIdx];
            
            //칼럼생성
            let dataColumn = this.createDataColumn( fieldName, iterationColumnId, true);
            columnIndexNo++;
            dataColumn.columnIndexNo = columnIndexNo;

            dataColumn.editable = cbEditable;
            dataColumn.cellRendererSelector = cellRendererSelector;    

            addCellClassRule(dataColumn,'editable',cbEditable)

            
            //필드명을 정리한다. rowData로 넘어오는 키 property에 많은 기능들이 숨겨져 있다.
            let groupHeader = this.stripHeaderName(iterationColumnId, fieldName, columnIterationPrefix, columnIterationPostfix);

            //그룹 칼럼을 만들어야 할지도 모른다. delimiter 가 정의되어 있으면 그룹을 만들어줘야 한다.
            let groupHeaders = [];
            if (groupHeader.length > 0) {
              if (hasDelimiter) {
                //마지막에 붙은 delimiter 제거
                if (groupHeader.lastIndexOf(delimiterOnColumn) == groupHeader.length - 1) {
                  groupHeader = groupHeader.substring(0, groupHeader.length - 1);
                }
                //delimiter 기준 그룹칼럼 필드 배열생성
                let groupHeaderSplitResult_1 = groupHeader.split(delimiterOnColumn);

                let delimiterOnCrosstabInfo = ',';
                let crossTabInfo = this.crossTabInfo;
                if (crossTabInfo && Object.keys(crossTabInfo).includes('itc2to1')) {
                  delimiterOnCrosstabInfo = crossTabInfo['itc2to1']['delimiter'] ? crossTabInfo['itc2to1']['delimiter'] : ',';
                }

                for (let ghIdx = 0; ghIdx < groupHeaderSplitResult_1.length; ghIdx++) {
                  //크로스탭 구분자로 또 나눈다.
                  let groupHeaderSplitResult_2 = groupHeaderSplitResult_1[ghIdx].split(delimiterOnCrosstabInfo);
                  groupHeaders.push.apply(groupHeaders, groupHeaderSplitResult_2);
                }
              } else {
                groupHeaders.push(groupHeader);
              }
            }

            let title = this._getColumnProp2(iterationColumnId, 'title')
            //타이틀이 설정되어 있으면 타이틀을 칼럼 headerName으로 사용
            if (title && title.toUpperCase() !== PREF_FIELD_NM) {
              dataColumn.headerName = transLangKey(title);
            } else {
              
              //그룹칼럼 필드정보 중 마지막 필드를 headerName으로 사용
              let dataColumnHeaderText = groupHeaders[groupHeaders.length - 1];
              let prefFieldApplyCd, prefFieldApplyCdLang;

              if (this.prefInfoDB) {
                let prefField = this.prefInfoDB().filter({ fldCd: dataColumnHeaderText }).get()[0];
                if (prefField) {
                  prefFieldApplyCd = prefField['fldApplyCd'];
                  prefFieldApplyCdLang = transLangKey(prefField['fldApplyCdLang']);
                }
              }

              if (prefFieldApplyCdLang) {
                dataColumnHeaderText = prefFieldApplyCdLang;
              } else if (prefFieldApplyCd) {
                dataColumnHeaderText = prefFieldApplyCd;
              } else {
                dataColumnHeaderText = transLangKey(dataColumnHeaderText);
              }

              dataColumn.headerName = dataColumnHeaderText;
              groupHeaders.pop();
            }

            //그룹칼럼 필드정보를 이용해서 그룹칼럼 계층을 만든다.
            if (groupHeaders.length > 0) {
              for (let gHIdx = 0; gHIdx < groupHeaders.length; gHIdx++) {
                let groupHeaderText = groupHeaders[gHIdx];
                
          
                let groupColumn = {};

                groupColumn.field    = arrangedColumns.toString() + '_' + groupHeaderText;
                groupColumn.visible  = columnIterationVisible;
                groupColumn.children = [];
                groupColumn.level = gHIdx;

                if (this.headerDepth < gHIdx + 1) {
                  this.headerDepth = gHIdx + 1;
                }

                
                if (groupColumn.level === 0 && tempColumnTitle) {
                  if (tempColumnTitle.toUpperCase() === PREF_FIELD_NM) {
                    if (this.prefInfoDB) {
                      let columnPrefInfo = this.prefInfoDB().filter({ fldCd: iterationColumnId }).get()[0];

                      if (columnPrefInfo) {
                        let fieldNM = columnPrefInfo['fldApplyCd'];
                        if (fieldNM) {
                          groupHeaderText = fieldNM;
                        }
                      }
                    }
                  }
                }

                addHeaderCellClass(groupColumn,'header-center')

                if(columnIterationHeaderBackground != undefined) {
                  let headerStyles = {
                    background: columnIterationHeaderBackground
                  };
                  addHeaderCellClass(groupColumn, this.dynamicCSSSelector(headerStyles))
                }
                                      
                groupColumn.headerName = groupHeaderText;
                groupColumn.columnIdOrg = iterationColumnId;
                
                
                let groupIdentifier = '_';
                for (let i = 0; i < gHIdx; i++) {
                  groupIdentifier = groupIdentifier + groupHeaders[i];
                }

                if (gHIdx === 0) {
                  groupColumn.columnIndexNo = columnIndexNo;
                  columnIndexNo++;
                }

                if (groupHeaders.length === gHIdx + 1) {
                  if (columnsMap.hasOwnProperty(gHIdx + '_' + groupHeaderText + groupIdentifier)) {
                    columnsMap[gHIdx + '_' + groupHeaderText + groupIdentifier].children.push(dataColumn);
                  } else {
                    groupColumn.children.push(dataColumn);
                  }
                }

                if (!columnsMap.hasOwnProperty(gHIdx + '_' + groupHeaderText + groupIdentifier)) {
                  columnsMap[gHIdx + '_' + groupHeaderText + groupIdentifier] = groupColumn;
                }

                let parent = groupHeaders[gHIdx - 1];
                if (parent) {
                  groupIdentifier = '_';
                  for (let i = 0; i < gHIdx - 1; i++) {
                    groupIdentifier = groupIdentifier + groupHeaders[i];
                  }
                  columnsMap[(gHIdx - 1) + '_' + parent + groupIdentifier].children.push(groupColumn);
                }
              }
            } else {
              columnsMap[dataColumn.field] = dataColumn;
            }
          }
    
          let columnFields = Object.keys(columnsMap);
          for (let ckIdx = 0; ckIdx < columnFields.length; ckIdx++) {
            let column = columnsMap[columnFields[ckIdx]];
            if (column) {
              if (isGroupColumn(column)) {
                if (column.level === 0) { //최상위만 넣으면 된다.
                  columnsByIterCreate.push(column);
                }
              } else {
                columnsByIterCreate.push(column);
              }
            }
          }
        } // Iteration 칼럼 생성 끝
      }

      //this.dataColumns 생성된 칼럼들이 담겼다. this.dateColumnNames 동기화
      this.dateColumnNames = this.dataColumns.filter(function (dataColumn) {
          return dataColumn.columnIdOrg === 'DATE' || dataColumn.columnIdOrg === 'DAT';
      }).map(function (dataColumn) {
          return dataColumn.field;
      });


      let staticColumns = [];    
      cleanupNoChildGroupColumns(columnsByIterCreate);

      let columnKeys = Object.keys(staticColumnsMap);
    
      for (let columnKeysIdx = 0, columnKeysLen = columnKeys.length; columnKeysIdx < columnKeysLen; columnKeysIdx++) {
        let key = columnKeys[columnKeysIdx];
        for (let i = 0; i < staticGridGroupHeaders.length; i++) {
          if (staticGridGroupHeaders[i].includes(key) && staticGridGroupHeaders[i].indexOf(key) > 0) {
            delete staticColumnsMap[key];
          }
        }
      }
    
      for (let columnKeysIdx = 0, columnKeysLen = columnKeys.length; columnKeysIdx < columnKeysLen; columnKeysIdx++) {
        let key = columnKeys[columnKeysIdx];
    
        let column = staticColumnsMap[key];
        if (isGroupColumn(column)) {
          if (column.children.length < 1) {
            delete staticColumnsMap[key];
          } else {
            cleanupNoChildGroupColumns(column.children);
          }
        }
      }
    
      for (let columnKeysIdx = 0, columnKeysLen = columnKeys.length; columnKeysIdx < columnKeysLen; columnKeysIdx++) {
        let key = columnKeys[columnKeysIdx];
        if (typeof staticColumnsMap[key] !== 'undefined') {
          staticColumns.push(staticColumnsMap[key]);
        }
      }
    
      let newGridItems = staticColumns.concat(columnsByIterCreate);
      newGridItems = this.columnsSort(newGridItems);
      this.newGridItems=newGridItems

      console.log('newGridItems',this.newGridItems);  
      this.flattenItems(this.newGridItems);

      //1. 칼럼이 다 생성되면 에디팅 가능한 칼럼을 추려낸다.
      let editTargets = [];
      if (this.prefInfo) {
        editTargets = this.prefInfo.filter(function (columnInfo) {
          return columnInfo.editTargetYn==true;
        }).map(function (columnInfo) { return columnInfo.fldCd });
      }
      this.editTargetDataColIds = this.flatNewGridItems.filter( item=> editTargets.includes(item.columnIdOrg)).map(eItem=> eItem.field);
      
      //initEntry , Summary 칼럼 추가
      this.gridDataFillReady()    
      this.setInitGroupOrder();    
      this.gridAfterSetData(resultData)

      //동적으로 만들어진 칼럼 설정하고 resultData도 설정한다.
      if(this.onAfterPrefenceProcess)
        this.onAfterPrefenceProcess(this, resultData)

      if(this.gridOptions)
        this.gridOptions.context.refreshCells();
    }    


    /**
 * <init-group-order>
 *   : true로 설정된 경우 개인화정보의 SEQ를 기준으로 grouping
 *   : 숫자로 설정된 경우 순서대로 grouping
 *   : 혼용된 경우 true로 설정된 필드가 SEQ 순서대로 이후 설정 숫자 순서대로 grouping
 */
     setInitGroupOrder() {
        let columnIds = this.gridItems.map(v => getColName(v));
    
        let groupByFieldNames = [];
        let initGroupByTF = [];
        let initGroupOrderP = {};
        let initGroupOrderV = {};
    
        for (let i = 0; i < this.gridItems.length; i++) {
            let dataColumn = this.gridItems[i];
            
            let groupOrder = dataColumn.initGroupOrder;
            if (groupOrder !== undefined && groupOrder.length > 0) {
                if (groupOrder === 'true') {
                initGroupByTF.push(columnIds[i]);
                } else {
                initGroupOrderV[groupOrder] = columnIds[i];
                }
            }
        }
        
        for (let i = 0; i < initGroupByTF.length; i++) {
            let groupingColumn = this.prefInfoDB().filter({ fldCd: initGroupByTF[i] }).get(0)[0];
            if (groupingColumn !== undefined) {
                initGroupOrderP[groupingColumn['fldSeq']] = groupingColumn['fldCd'];
            }
        }
    
        if (initGroupOrderP !== null && Object.keys(initGroupOrderP).length > 0) {
        let groupOrderKeys = Object.getOwnPropertyNames(initGroupOrderP);
    
        if (groupOrderKeys.length > 0) {
            groupOrderKeys = groupOrderKeys.sort(function (a, b) {
                return a - b;
            });
    
            for (let i = 0; i < groupOrderKeys.length; i++) {
                groupByFieldNames.push(initGroupOrderP[groupOrderKeys[i]]);
            }
        }
        }
    
        if (initGroupOrderV !== null && Object.keys(initGroupOrderV).length > 0) {
            let groupOrderKeys = Object.getOwnPropertyNames(initGroupOrderV);
        
            if (groupOrderKeys.length > 0) {
                groupOrderKeys = groupOrderKeys.sort(function (a, b) {
                    return a - b;
                });
        
                for (let i = 0; i < groupOrderKeys.length; i++) {
                    groupByFieldNames.push(initGroupOrderV[groupOrderKeys[i]]);
                }
            }
        }
        
        const me = this;
        //Ag Grid는 칼럼의 rowGroupIndex 를 설정해주면 된다.
        if (groupByFieldNames.length > 0) {
            let grpIdx=0;
            groupByFieldNames.forEach(colName=> {
                const colItem = me.flatNewGridItems.find(item => item.field == colName);
                if(colItem) {
                    colItem.rowGroupIndex = grpIdx;
                    grpIdx++;
                }

            })
        }
    }
}  
  
/*
    합계 칼럼
    dateColumnNames: aggColumnNames 임
*/
class SummaryColumn {

    constructor (prefInfoHelper, dateColumnNames) {
        this.prefInfoHelper = prefInfoHelper;
        this.gridOptions = prefInfoHelper.gridOptions;
        this.dateColumnNames = dateColumnNames;
    }
  
    create  (summaryInfo, totalSummaryInfos) {
      const me = this;

      //생성할 summary 칼럼 정보 {'생성할 합계 칼럼명':[합계 대상 칼럼리스트,...], ...}
      this.summaryColumnNames = {};
      this.totalSummaryInfos = totalSummaryInfos;
  
      //날짜 칼럼들중
      for (var i = 0, n = this.dateColumnNames.length; i < n; i++) {
        var dateColumnName = this.dateColumnNames[i];
        //날짜 칼럼 명을 파싱해서..합계 칼럼 키를 만든다.
        var key = this.getSummaryColumnName(dateColumnName);
        if (key in this.summaryColumnNames) {
          this.summaryColumnNames[key].push(dateColumnName);
        } else {
          this.summaryColumnNames[key] = [dateColumnName];
        }
      }
  
      var keys = Object.keys(this.summaryColumnNames);
      for (var i = 0, n = keys.length; i < n; i++) {
        var key = keys[i];
        if (this.summaryColumnNames[key].length === 1) {
          delete this.summaryColumnNames[key];
        }
      }
  
      this.summaryColumnKeys = Object.keys(this.summaryColumnNames);
      this.summaryColumnKeys.sort();
  
      
      const colDefs = this.prefInfoHelper.dataColumns;      
      var firstColumn = colDefs.find(c => c.field == this.dateColumnNames[0])
      var firstColumnWidth = firstColumn ? firstColumn.width : 100;
  
      var summaryColumns = {};
      const measure = this.prefInfoHelper.editMeasures[0]

      for (var i = 0; i < this.summaryColumnKeys.length; i++) {
        let summaryColumnKey = this.summaryColumnKeys[i]
        let that = this
        summaryColumns[summaryColumnKey] = {
          field: summaryColumnKey,
          headerName: this.transHeaderText(summaryColumnKey),
          width: firstColumnWidth,
          cellDataType: 'number',
          editable: false,
          visible: true,
          cellStyle: {
            background: '#88bce55c',
            textAlignment: 'far',
          },
          cellClassRules: {'summary-column':()=>true,},
          headerClass:'summary-header header-center',
          aggFunc: (params) => groupFooterAggFunc(params, [measure]),
          valueGetter: (params) => {
            let sum =0;
            let summaryTargetCols = that.summaryColumnNames[summaryColumnKey]
            summaryTargetCols.map(function (columnName) {
              if(params.data) {
                const val = params.data[columnName];
                if(val)
                  sum = sum + val
              }
            });
            return sum;
          }
        };
      }
  
      for (var i = 0, len = this.summaryColumnKeys.length; i < len; i++) {
        var summaryColumnKey = this.summaryColumnKeys[i];
  
        var targetColumnNames = this.summaryColumnNames[summaryColumnKey];
        var targetColumnName = targetColumnNames[targetColumnNames.length - 1];
  
        var summaryColumn = summaryColumns[summaryColumnKey];
  
        for (var j = 0, n = colDefs.length; j < n; j++) {
          if (colDefs[j].field === targetColumnName) {
            this.prefInfoHelper.addGridItem(summaryColumn, colDefs[j]);
            break;
          }
        }
      }
  
      if (this.totalSummaryInfos) {
        for (var i = 0, n = this.totalSummaryInfos.length; i < n; i++) {
          var totalSummaryInfo = this.totalSummaryInfos[i];
          
          var summaryColumn = {
            field: totalSummaryInfo.columnName,
            headerName: this.transHeaderText(totalSummaryInfo.columnName),
            width: firstColumnWidth,
            cellDataType: 'number',
            editable: false,
            visible: true,
            cellStyle: {
                      background: '#88bce55c',
                      textAlignment: 'far',
                    },
            cellClassRules: {'summary-column':()=>true,},
            headerClass:'summary-header header-center',
            aggFunc: (params) => groupFooterAggFunc(params, [measure]),
            valueGetter: (params) => {
              let sum =0;
              if(params.data) {
                me.dateColumnNames.map(function (columnName) {
                  sum = sum + params.data[columnName]
                });
                if (totalSummaryInfo.summaryType === 'average')  {
                  sum = sum / me.dateColumnNames.length;
                }
              }
              return sum;
            }
          };
  
          this.prefInfoHelper.addGridItem(summaryColumn)
        }
      }
      //console.log('this.prefInfoHelper.dateColumns',this.prefInfoHelper.dataColumns)
    };
  
    transHeaderText  (columnName) {
      if (columnName.indexOf('_SUM') !== -1) {
        return transLangKey(columnName.replace('_SUM', '')) + ' ' + transLangKey('SUM');
      }
  
      if (columnName.indexOf('_AVG') !== -1) {
        return transLangKey(columnName.replace('_AVG', '')) + ' ' + transLangKey('AVG');
      }
      return transLangKey(columnName);
    }
  
    getTotalSummaryInfos() {
      return this.totalSummaryInfos;
    }
  
    hasSummaryColumnName(dateColumnName) {
      return this.getSummaryColumnName(dateColumnName) in this.summaryColumnNames;
    }
  
    getSummaryColumnName  (dateColumnName) {
      return this.prefInfoHelper.toDateString(dateColumnName).slice(0, -3) + '_SUM';
    }
  
    getSummaryColumnNames  () {
      if (this.totalSummaryInfos) {
        var summaryColumnNames = this.totalSummaryInfos.map(function (totalSummary) {
          return totalSummary.columnName;
        });
  
        return summaryColumnNames.concat(this.summaryColumnKeys);
      }
      return this.summaryColumnKeys;
    }
}


/** AG Grid row pinning */
class SummaryFooter {

  constructor (prefInfoHelper, summaryColumnNames) {
    this.prefInfoHelper = prefInfoHelper;
    this.gridOptions = prefInfoHelper.gridOptions;
    this.summaryColumnNames = summaryColumnNames;
  }

  create (measureColumnName, groupMeasureName, totalMeasureNames) {

    this.measureColumnName = measureColumnName;
    this.groupMeasureName = groupMeasureName;
    this.measureNames = totalMeasureNames;

    const totalFooterRow=[]
    const me = this;
    const gridOptions = this.gridOptions;

    this.measureNames.forEach(mValue => {
      let pinRow ={}
      pinRow[measureColumnName]=transLangKey(mValue)

      me.summaryColumnNames.forEach(col => {
        pinRow[col] = aggridAggregate(gridOptions,col, measureColumnName, mValue)
      })
      totalFooterRow.push(pinRow)
    })

    gridOptions.api.setPinnedBottomRowData(totalFooterRow)
  }

  reAggregate(gridOptions, field) {
    const me= this;
    const measureColName = this.measureColumnName
    this.measureNames.forEach((mValue, idx) => {
      let pinRow = gridOptions.api.getPinnedBottomRow(idx)
      if(pinRow) {
        pinRow.data[field] = aggridAggregate(gridOptions, field, measureColName, mValue)
        pinRow.updateData(pinRow.data)
      }
    })
  }
}