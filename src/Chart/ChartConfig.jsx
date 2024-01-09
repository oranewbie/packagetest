import React, { useRef, createRef, useState, useEffect, forwardRef } from 'react';
import { Box, Tabs, Tab } from "@mui/material";

import { getChartOption,chartTypeItems,
  legendOptionsMap,FontMeta, PaddingMeta,TitleMeta,
  LegendOptMeta,defLegendOpt,titleOptionsMap,defTitleOpt,
  tooltipOptionsMap,defTooltipOpt,datasetOptionsMap,transLangKey, TitleOptMeta, TooltipOptMeta } from './chartOpt';

import JsonEditor,{gePropsMeta} from '../jsoneditor'


const PropertyEditor= forwardRef(({editObjectMeta, editObject, onChange,optionsMap,optionMeta,...props},ref) => {  

  return (
    <JsonEditor
      metaData={editObjectMeta}
      data={editObject}
      onChange={data => {
        onChange(data)
      }}
      optionsMap={ optionsMap }
      optionMeta={optionMeta}
    />
  )
})

function ChartConfig({chartOptions,chartDataSet,chartRef,...props}) {

  const [datasetTabValue, setDatasetTabValue] = useState('legend');
  
  const [legendOpt, setLegendOption] = useState(defLegendOpt)
  const [titleOpt, setTitleOpt] = useState(defTitleOpt)
  const [subtitleOpt, setSubtitleOpt] = useState(defTitleOpt)
  const [tooltipOpt, setTooltipOpt] = useState(defTooltipOpt)

  const propsMeta= useRef(null);
  if(!propsMeta.current) {
    const optionMeta = gePropsMeta()
    propsMeta.current = optionMeta
    optionMeta.register('Chart', chartRef.current);
    optionMeta.register('legendOptionsMap',legendOptionsMap)
    optionMeta.register('FontMeta',FontMeta)
    optionMeta.register('PaddingMeta',PaddingMeta)
    optionMeta.register('TitleMeta',TitleMeta)
    optionMeta.register('titleOptionsMap',titleOptionsMap)
    optionMeta.register('tooltipOptionsMap',tooltipOptionsMap)
  }

  const getDatasetOpt=()=> {
    if(chartRef.current) {
      let chart = chartRef.current;

      const datasetOpt=chart.config.data.datasets.map(ds=> {
          return {
            backgroundColor: ds.backgroundColor,
            datalabels: ds.datalabels,
            label:ds.label,
            type:ds.type
          }
        }
        );

      return {datasets: datasetOpt}
    }
    else
      return {}
  }

  const [dataOption, setDataOption] = useState(getDatasetOpt())

  useEffect(()=> {
    if(chartRef.current) {
      let chart = chartRef.current;

      //propsMeta.current.register('Chart.defaults.color',chartRef.current.defaults.color)
      //propsMeta.current.register('Chart.defaults.font',chartRef.current.defaults.font)

      //console.log('chart', chart,)
      //console.log('chartOptions', chartOptions)
      //console.log('chartDataSet', chartDataSet)

      const datasetOpt=chart.config.data.datasets.map(ds=> {
          return {
            backgroundColor: ds.backgroundColor,
            datalabels: ds.datalabels,
            label:ds.label,
            type:ds.type
          }
        });

      setDataOption({datasets: datasetOpt})
    }
  },[chartRef.current, chartOptions, chartDataSet])

  useEffect(()=> {
    if (chartRef.current) {
      let chart = chartRef.current;
      chart.options.plugins['legend'] = legendOpt;
      chart.update();
    }
  },[legendOpt])

  useEffect(()=> {
    if (chartRef.current) {
      let chart = chartRef.current;
      chart.options.plugins['title'] = titleOpt;
      chart.update();
    }
  },[titleOpt])

  useEffect(()=> {
    if (chartRef.current) {
      let chart = chartRef.current;
      chart.options.plugins['subtitle'] = subtitleOpt;
      chart.update();
    }
  },[subtitleOpt])

  useEffect(()=> {
    if (chartRef.current) {
      let chart = chartRef.current;
      chart.options.plugins['tooltip'] = tooltipOpt;
      chart.update();
    }
  },[tooltipOpt])

  useEffect(()=> {
    if (chartRef.current && dataOption.datasets) {
      let chart = chartRef.current;
      chart.data.datasets.forEach(ds => {
        const configDs=dataOption.datasets.find( d => d.label == ds.label)
        for(let p in configDs) {
          ds[p] = configDs[p]
        }
      })
      chart.update();
    }
  },[dataOption])

  const setChartUpdate=(options, data) => {
    if (chartRef.current) {
      let chart = chartRef.current;
      chart.clear();
      chart.data = data;
      chart.options = options;
      chart.update();
    }
  }

  const onChangeLabelOpt=(value)=>{
    const chart = chartRef.current;
    if(!chart)
      return;

    chart.data.datasets.forEach((ds, index) => {
      if (ds.datalabels ) {
        ds.datalabels.display = value;
      }
    })
    
    chart.update();
  }

  const setPluginOption=(type, prop, value) => {
    const chart = chartRef.current;
    if(!chart)
      return;

    chart.options.plugins[type][prop] = value;
    
    chart.update();
  }

  const changeAction=(option, key, value)=> {
    const chart = chartRef.current;
    console.log('changeAction',chart)
    // if(option == 'datalabels') {
    //   if(key =='display')
    //     onChangeLabelOpt(value)
    // }
    // else if(option == 'title') {
    //   setPluginOption('title', key, value)
    // }
    // else if(option == 'legend') {
    //   setPluginOption(legend,key, value)
    // }
      
  }

  const getChartOptionValue=(type, key)=>{
    const chart = chartRef.current;
    if(chart.option[type])
      return chart.option[type][key]
    else
      return undefined;
  }

  const getChartPluginValue=(type, key)=>{
    const chart = chartRef.current;
    if(chart.plugins[type])
      return chart.plugins[type][key]
    else
      return undefined;
  }

  /** 챠트 config값을 가져온다. */
  const getChartValue=(action, option) => {
    const chart = chartRef.current;
    console.log('getChartValue',chart)
  }

  const datasetTabChange=(event, newValue)=>{
    setDatasetTabValue(newValue)
  }
  
  return (
    <Box sx={{ display:'flex',width: '100%', height: '100%', padding: '10px',overflow:'hidden' }}>
      <Box style={{ display:'flex',border: '1px solid', width: '100%' }}>
        <Box style={{ display:'flex', width: '100%', height:'100%', overflow:'hidden' }}>
          <Tabs orientation="vertical" sx={{height:'100%', width: '80px'}} value={datasetTabValue} onChange={datasetTabChange}>
            <Tab label={transLangKey('Legend')} value="legend" />
            <Tab label={transLangKey('Title')} value="title" />
            <Tab label={transLangKey('SubTitle')} value="subtitle" />
            <Tab label={transLangKey('Tooltip')} value="tooltip" />
            <Tab label={transLangKey('Dataset')} value="dataset" />     
          </Tabs>
          <Box style={{height:'100%', width: 'calc(100% - 80px)', border:'1px solid #efefef', display:'flex', flexDirection:'column'}}>
            <Box style={{ display:'flex',  width: '100%' , height:'100%', overflow:'auto', display: datasetTabValue === "legend" ? "flex" : "none" }}>
              <PropertyEditor editObjectMeta={LegendOptMeta} optionMeta={propsMeta.current} editObject={legendOpt} onChange={setLegendOption} optionsMap={legendOptionsMap}/>
            </Box>
            <Box style={{ display:'flex',  width: '100%' , height:'100%', overflow:'auto', display: datasetTabValue === "title" ? "flex" : "none" }}>
              <PropertyEditor editObjectMeta={TitleOptMeta} optionMeta={propsMeta.current} editObject={titleOpt} onChange={setTitleOpt} optionsMap={titleOptionsMap}/>
            </Box>
            <Box style={{ display:'flex',  width: '100%' , height:'100%', overflow:'auto', display: datasetTabValue === "subtitle" ? "flex" : "none" }}>
              <PropertyEditor editObjectMeta={TitleOptMeta}  optionMeta={propsMeta.current} editObject={subtitleOpt} onChange={setSubtitleOpt} optionsMap={titleOptionsMap}/>
            </Box>
            <Box style={{ display:'flex',  width: '100%' , height:'100%', overflow:'auto', display: datasetTabValue === "tooltip" ? "flex" : "none" }}>
              <PropertyEditor editObjectMeta={TooltipOptMeta}  optionMeta={propsMeta.current} editObject={tooltipOpt} onChange={setTooltipOpt} optionsMap={tooltipOptionsMap}/>
            </Box>
            <Box style={{ display:'flex',  width: '100%', height:'100%', display: datasetTabValue === "dataset" ? "flex" : "none" }}>
              <PropertyEditor editObject={dataOption} optionMeta={propsMeta.current} onChange={setDataOption} optionsMap={datasetOptionsMap}/>
            </Box>
          </Box> 
        </Box>
      </Box>  
    </Box>
  )
}


export default ChartConfig;