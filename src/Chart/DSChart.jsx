import React, { useState, useEffect, useRef } from "react";
import { Box,Popover,IconButton } from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Chart } from 'react-chartjs-2';
import ChartDataLabels from "chartjs-plugin-datalabels";
import ChartDragdata from 'chartjs-plugin-dragdata'
import ChartConfig from "./ChartConfig";
// import EqualizerBarChart from "@zionex/wingui-core/component/chart/EqualizerBarChart";
// //import autocolors from 'chartjs-plugin-autocolors';
// //import gradient from 'chartjs-plugin-gradient';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, LogarithmicScale, Filler, ArcElement } from 'chart.js';

ChartJS.register({ CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ChartDataLabels, LogarithmicScale, Filler, ChartDragdata, ArcElement  });

const DSChart = React.forwardRef((props, ref) => {

  if (!ref)
    ref = useRef(null);

  const settingRef = useRef(null)
  const [showSetting, setShowSetting] = useState(false)

  useEffect(() => {
    if (ref.current) {
      let curRef = ref.current;

      curRef.clear();
      
      curRef.data = props.data;
      curRef.options = props.options;

      curRef.data.datasets.forEach((ds, index) => {
        if (ds.datalabels === undefined) {
          ds.datalabels = {
            display: false,
            formatter: function (value, context) { return value.y },
          }
        }
      })
      
      curRef.update();
    }
  }, [props.data,props.options])

  return (
    <Box style={{ display: 'flex', alignItems: 'stretch', flexDirection: 'column', height: "100%", width: '100%', flex: 1, minWidth: 0 }}>
      <IconButton onClick={()=>setShowSetting(true)} ref={settingRef}><SettingsOutlinedIcon /></IconButton>
      <Popover open={showSetting} anchorEl={settingRef.current} onClose={()=>setShowSetting(false)} >
        <Box style={{ height: "100%", overflow:'hidden'}}>
            <ChartConfig
              chartOptions={props.options}
              chartDataSet={props.data}
              chartRef={ref}
            />                                  
        </Box>
      </Popover>
      <Box data-role='chartContainer' style={{ position: 'relative', height: 'calc(100% - 30px)', width: '100%',flex: 1, }}>
        <Chart
          ref={ref}
          data={props.data}
          options = {props.options}
        />
      </Box>
    </Box>
  )

}
)
export default DSChart;