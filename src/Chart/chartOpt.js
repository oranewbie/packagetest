

const lighten = (color, value) => Chart.helpers.color(color).lighten(value).rgbString();

export function transLangKey(a) {
  return a;
}

const defChartOption= {
  responsive: true,
  maintainAspectRatio: false, //크기 재조정할 수 있으므로
  layout: {
    padding: {
      left: 20,
      right: 20
    }
  },
  plugins: {
      autocolors : {
        mode: 'dataset'
      },
      datalabels : {
        display: 'auto',
        clamp : true
      }
    },
}

export function getChartOption(currentDataset,type,chartOptions,chartDataSet) {

  let newChartOptions ={...defChartOption }
  let newChartDataSet = {...chartDataSet}
  let datasets = newChartDataSet.datasets;
  datasets.forEach(ds=>{
    if(ds.label == currentDataset) {
      if(type=='bar'){
        ds.type='bar'
      }
      // else if(type=='hbar'){
      //   ds.type='bar';
      //   newChartOptions.indexAxis="y"
      // }
      else if(type == 'line') {
        ds.type='line'
      }
      // else if(type == 'vline') {
      //   ds.type='line'
      //   newChartOptions.indexAxis="y"
      // }
      else if(type == 'bubble') {
        ds.type='bubble'
      }
      else if(type == 'doughnut') {
        ds.type='doughnut'
      }
      else if(type == 'pie') {
        ds.type='pie'
      }
      else if(type == 'polarArea') {
        ds.type='polarArea'
      }
      else if(type == 'radar') {
        ds.type='radar'
      }
      else if(type == 'scatter') {
        ds.type='scatter'
      }
    }
  })
  
  return {chartOptions:newChartOptions,chartDataSet:newChartDataSet}
}

export function defChartOpt(title, theme){
    const themeType = theme.type;
  
    return {...defChartOption};
  }
  
  export const chartTypeItems = [
    {
      title: 'Bar',
      type: 'bar',
    },
    {
      title: 'Line',
      type: 'line',
    },
    {
      title: 'Pie',
      type: 'pie',
    },
    {
      title: 'Polar Area',
      type: 'polarArea',
    },
    {

      title: 'Radar',
      type: 'radar',
    },
    {

      title: 'Scatter',
      type: 'scatter',
    },
    {
      title: 'Map',
      type: 'map',
    },
   
  ];


  
export const legendOptionsMap={
  position: [
    { value: 'top', label: 'top' },
    { value: 'left', label: 'left' },
    { value: 'bottom', label: 'bottom' },
    { value: 'right', label: 'right' },
    { value: 'chartArea', label: 'chartArea' },
  ],
  align: [
    { value: 'start', label: 'start' },
    { value: 'center', label: 'center' },
    { value: 'end', label: 'end' },
  ],
  textAlign: [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
    { value: 'center', label: 'center' },
  ],
  pointStyles: [
    { value: 'circle', label: 'circle' },
    { value: 'cross', label: 'cross' },
    { value: 'crossRot', label: 'crossRot' },
    { value: 'dash', label: 'dash' },
    { value: 'line', label: 'line' },
    { value: 'rect', label: 'rect' },
    { value: 'rectRounded', label: 'rectRounded' },
    { value: 'rectRot', label: 'rectRot' },
    { value: 'star', label: 'star' },
    { value: 'triangle', label: 'triangle' },
    { value: false, label: 'false' },
  ],
  weightOption: [
    { value: 'normal', label: 'normal' },
    { value: 'bold', label: 'bold' },
    { value: 'lighter', label: 'lighter' },
    { value: 'bolder', label: 'bolder' },
  ]
}

export const FontMeta={
  family:{type: 'string',default: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"},
  size: {type: 'number',default: 12},
  style: {type: 'string',default: 'normal'},
  weight: {type: ['string','number'], default: 'undefined', options:'weightOption'}, //normal | bold | lighter | bolder | number
  lineHeight: {type: ['string','number'],default: '1.2'}, // number|string
}

export const PaddingMeta=
  [
    {type: 'number',default: 0}, // 
    {type: {
      top: {type:'number'},
      left: {type:'number'},
      bottom: {type:'number'},
      right: {type:'number'}
    }},
    {type: {
      x: {type:'number'}, // left/right
      y: {type:'number'}, // top/bottom
    }}
 ];

export const TitleMeta={
  color:{type: 'Color', default: "Chart.defaults.color"},
  display: {type: 'boolean',default: false},
  font: {type: FontMeta ,default: 'Chart.defaults.font'},
  padding: {type: PaddingMeta, default: 0}, 
  text: {type: 'string'}, 
}

export const LegendOptMeta={
  display: {type: 'boolean',default: true},
  position: {type: 'string', default: 'top', options:'legendOptionsMap.position'},
  align:{type: 'string', default: 'center',options:'legendOptionsMap.align'},
  maxHeight: {type:'number'},
  maxWidth: {type:'number'},
  fullSize:{type: 'boolean',default:true},
  onClick:{type:'function'},
  onHover:{type:'function'},
  onLeave:{type:'function'},
  reverse:{type: 'boolean',default:false},
  labels: {type: {
    boxWidth: {type:'number', default: 40},
    boxHeight: {type:'number', default: 40},
    color:{type:'color', default: 'Chart.defaults.color'},
    font: {type: FontMeta, default:'Chart.defaults.font'},
    padding:{type:'number', default: 10},
    generateLabels:{type:'function'},
    filter:{type:'function'},
    sort:{type:'function'},
    pointStyle:{type:['string','boolean'], default:'circle', options:'legendOptionsMap.pointStyles'},
    textAlign: {type: 'string', default: 'center', options:'legendOptionsMap.textAlign'},
    usePointStyle: {type:'boolean', default:false},
    pointStyleWidth:{type:'number', default:null},
    useBorderRadius:{type:'boolean', default:false},
    borderRadius:{type:'number', default:undefined},
   }
  }, 
  rtl:{type: 'boolean',default: true},
  textDirection:{type: 'string',default: 'rtl'},
  title: [
            {type:'string',default: undefined}, 
            {type:{
                    color: {type:'color', default:'#000'},
                    display:{type: 'boolean',default: true},
                    padding: PaddingMeta,
                    text:{type: 'string',default: undefined},
                    },
            }
          ]
}

export const defLegendOpt={
  display:true,
  position: 'top',
  align:'center',
  fullSize:true,
  reverse:false,
  labels: {
    boxWidth:40,
    color:'#000',
    padding:10,
    textAlign:'center',
  }, 
  rtl:true,
  textDirection:'rtl',
  // title: {
  //   color:'#000',
  //   display:true,
  //   padding:0,
  //   text:''
  // }
}

export const titleOptionsMap={
  position: [
    { value: 'top', label: 'top' },
    { value: 'left', label: 'left' },
    { value: 'bottom', label: 'bottom' },
    { value: 'right', label: 'right' },
  ],
  align: [
    { value: 'start', label: 'start' },
    { value: 'center', label: 'center' },
    { value: 'end', label: 'end' },
  ],
}

export const TitleOptMeta={
  align: {type:'string', default: 'center', options:'titleOptionsMap.align'},
  color: {type:'string', default: 'center'},
  display: {type:'string', default: 'center'},
  fullSize: {type:'string', default: 'center'},
  position: {type:'string', default: 'center', options:'titleOptionsMap.position'},
  font: {type: FontMeta, default: {weight: 'bold'}},
  padding:{type: PaddingMeta, default: 'center'},
  text: {type:['string','string[]'], default: ''},
}

export const defTitleOpt={
  align:'center',
  color:'#000',
  display:true,
  fullSize:true,
  position: 'top',
  padding:10, // 숫자 혹은 objct 올수 있음
  text:'', //문자 혹은 문자배열
}


export const tooltipOptionsMap={
  position: [
    { value: 'average', label: 'average' },
    { value: 'nearest', label: 'nearest' },
  ],
  xAlign: [
    { value: 'left', label: 'left' },
    { value: 'center', label: 'center' },
    { value: 'right', label: 'right' },
  ],
  yAlign: [
    { value: 'top', label: 'top' },
    { value: 'center', label: 'center' },
    { value: 'bottom', label: 'bottom' },
  ],
  titleAlign: [
    { value: 'left', label: 'left' },
    { value: 'right', label: 'right' },
    { value: 'center', label: 'center' },
  ],
}
export const TooltipItem= {
  chart: {type:'Chart'}, // The chart the tooltip is being shown on
  label: {type:'string'}, // Label for the tooltip
  parsed: {type:'object'}, // Parsed data values for the given `dataIndex` and `datasetIndex`
  raw: {type:'object'}, // Raw data values for the given `dataIndex` and `datasetIndex`
  formattedValue: {type:'string'},
  dataset: {type:'object'},
  datasetIndex: {type:'number'},
  dataIndex: {type:'number'},
  element: {type:'Element'}, // The chart element (point, arc, bar, etc.) for this tooltip item
}

export const TooltipCallbackMeta = {
  beforeTitle:{type:'function', arguments:['TooltipItem[]'], returnType: ['string','string[]','undefined']},
  title:{type:'function', arguments:['TooltipItem[]'], returnType: ['string','string[]','undefined']},
  afterTitle:{type:'function', arguments:['TooltipItem[]'], returnType: ['string','string[]','undefined']},
  beforeBody:{type:'function', arguments:['TooltipItem[]'], returnType: ['string','string[]','undefined']},
  beforeLabel:{type:'function', arguments:['TooltipItem'], returnType: ['string','string[]','undefined']},
  label:{type:'function', arguments:['TooltipItem'], returnType: ['string','string[]','undefined']},
  labelColor:{type:'function', arguments:['TooltipItem'], returnType: ['string','string[]','undefined']},
  labelTextColor:{type:'function', arguments:['TooltipItem'], returnType: ['string','string[]','undefined']},
  labelPointStyle:{type:'function', arguments:['TooltipItem'], returnType: ['string','string[]','undefined']},
  afterLabel:{type:'function', arguments:['TooltipItem[]'], returnType: ['string','string[]','undefined']},
  afterBody:{type:'function', arguments:['TooltipItem[]'], returnType: ['string','string[]','undefined']},
  beforeFooter:{type:'function', arguments:['TooltipItem[]'], returnType: ['string','string[]','undefined']},
  footer:{type:'function', arguments:['TooltipItem[]'], returnType: ['string','string[]','undefined']},
  afterFooter:{type:'function', arguments:['TooltipItem[]'], returnType: ['string','string[]','undefined']},
}

export const TooltipOptMeta={
  enabled:  {type:'boolean', default: true},
  external: {type:'function', arguments:'context'},
  mode:{type:'string', default:'interaction.mode'},
  intersect:{type:'boolean', default:'interaction.mode'},
  position: {type:'string', default: 'average', options: 'tooltipOptionsMap.position'},
  callbacks:{type: TooltipCallbackMeta},
  itemSort:{type:'function', arguments:'context'},
  filter:{type:'function', arguments:'context'},
  backgroundColor:{type:'Color', default:'rgba(0, 0, 0, 0.8)'},
  titleColor:{type:'Color', default:'#fff'},
  titleFont: {type: FontMeta, default:{weight: 'bold'}},
  titleAlign:{type: 'string', default:'left', options: 'tooltipOptionsMap.titleAlign'},
  titleSpacing:{type: 'number', default:2},
  titleMarginBottom: {type: 'number', default:6},
  bodyColor:{type:'Color', default:'#fff'},
  bodyFont:{type: FontMeta, default:{}},
  bodyAlign:{type: 'string', default:'left', options: 'tooltipOptionsMap.titleAlign'},
  bodySpacing: {type: 'number', default:2},
  footerColor:{type:'Color', default:'#fff'},
  footerFont:{type: FontMeta, default:{weight: 'bold'}}, 
  footerAlign:{type: 'string', default:'left', options: 'tooltipOptionsMap.titleAlign'},
  footerMarginTop: {type: 'number', default:6},
  padding: {type: PaddingMeta, default:6},
  caretPadding:{type: 'number', default:2},
  caretSize: {type: 'number', default:5},
  cornerRadius: {type: 'number', default:6},
  multiKeyBackground:{type:'Color', default:'#fff'},
  displayColors: {type:'boolean', default:true},
  boxWidth:{type: 'number', default:'bodyFont.size'},
  boxHeight:{type: 'number', default:'bodyFont.size'},
  boxPadding:{type: 'number', default:1},
  usePointStyle:{type:'boolean', default:false},
  borderColor:{type:'Color', default:'rgba(0, 0, 0, 0)'},
  borderWidth:{type: 'number', default:0},
  rtl:{type: 'boolean'},
  textDirection:{type: 'string'},
  xAlign:{type: 'string',options:'yAlign'},
  yAlign:{type: 'string',options:'yAlign'},
}

export const defTooltipOpt={
  enabled:true,
  position: 'average',
  backgroundColor:'rgba(0, 0, 0, 0.8)',
  titleColor:'#fff',
  titleFont: {weight:'bold'},
  titleAlign:'left',
  titleSpacing:2,
  titleMarginBottom: 6,
  bodyColor:'#fff',
  bodyFont:{},
  bodyAlign:'left',
  bodySpacing:2,
  footerColor:'#fff',
  footerColor:{weight: 'bold'},
  footerAlign:'#left',
  footerMarginTop: 6,
  padding: 6,
  caretPadding:2,
  caretSize:5,
  cornerRadius: 6,
  multiKeyBackground:'#fff',
  displayColors: true,
  boxPadding:1,
  borderColor:'rgba(0, 0, 0, 0)',
  borderWidth:0,
}

export const datasetOptionsMap={
  type:[
    { value: 'bar', label: 'bar' },
    { value: 'line', label: 'line' },
    { value: 'pie', label: 'pie' },
    { value: 'polarArea', label: 'polarArea' },
    { value: 'radar', label: 'radar' },
    { value: 'scatter', label: 'scatter' },
    { value: 'map', label: 'map' },
  ]
}