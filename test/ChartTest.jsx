
import React, { useState, useEffect, useRef, useCallback,forwardRef,useImperativeHandle,useMemo   } from "react";

import Chart from '../src/Chart' 

import { Button,Box } from "@mui/material";


/**
 * Chart Config test
 */
function ChartTest(props) {

    const data = {
        // labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        // labels 대신 아래와 같이 각각의 데이터의 x값을 개별적으로 전달해줍니다.
        datasets: [
          {
            type: 'line',
            label: 'Dataset 1',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 2,
            data: [
              { x: 'January', y: 1 },
              { x: 'February', y: 2 },
              { x: 'March', y: 3 },
              { x: 'April', y: 4 },
              { x: 'May', y: 5 }
            ],
          },
          {
            type: 'bar',
            label: 'Dataset 2',
            backgroundColor: 'rgb(255, 99, 132)',
            data: [
              { x: 'January', y: 1 },
              { x: 'February', y: 2 },
              { x: 'March', y: 3 },
              { x: 'April', y: 4 },
              { x: 'May', y: 5 },
              { x: 'June', y: 6 }
            ],
            borderColor: 'red',
            borderWidth: 2,
          },
          {
            type: 'bar',
            label: 'Dataset 3',
            backgroundColor: 'rgb(75, 192, 192)',
            data: [
              { x: 'January', y: 1 },
              { x: 'February', y: 2 },
              { x: 'March', y: 3 },
              { x: 'April', y: 4 },
              { x: 'May', y: 5 },
              { x: 'June', y: 6 }
            ],
          },
        ],
      };


      const options = {
        spanGaps: true,
        maxBarThickness: 30,
        grouped: true,
        interaction: {
          mode: 'index',
        },
        plugins: {
          legend: {
            labels: {
              usePointStyle: true,
              padding: 10,
              font: {
                family: "'Noto Sans KR', 'serif'",
                lineHeight: 1,
              },
            }
          },
          tooltip: {
            backgroundColor: 'rgba(124, 35, 35, 0.4)',
            padding: 10,
            bodySpacing: 5,
            bodyFont: {
              font: {
                family: "'Noto Sans KR', sans-serif",
              }
            },
            usePointStyle: true,
            filter: (item) => item.parsed.y !== null,
            callbacks: {
              title: (context) => context[0].label + '💙',
              label: (context) => {
                let label = context.dataset.label + '' || '';
      
                return context.parsed.y !== null
                  ? label + ': ' + context.parsed.y + '배'
                  : null;
              },
            },
          },
        },
        scales: {
          x: {
            afterTickToLabelConversion: function (scaleInstance) {
              const ticks = scaleInstance.ticks;
      
              const newTicks = ticks.map((tick) => {
                return {
                  ...tick,
                  label: tick.label + '🎵'
                };
              });
      
              scaleInstance.ticks = newTicks;
            },
            grid: {
              display: false,
              drawTicks: true,
              tickLength: 4,
              color: '#E2E2E230'
            },
            axis: 'x',
            position: 'bottom',
            ticks: {
              minRotation: 45,
              padding: 5,
            },
          },
          y: {
            type: 'linear',
            grid: {
              color: '#E2E2E230',
            },
            afterDataLimits: (scale) => {
              scale.max = scale.max * 1.2;
            },
            axis: 'y',
            display: true,
            position: 'left',
            title: {
              display: true,
              align: 'end',
              color: '#808080',
              font: {
                size: 12,
                family: "'Noto Sans KR', sans-serif",
                weight: 300,
              },
              text: '단위: 배'
            }
          },
          y_sub: {
            position: 'right',
            title: {
              display: true,
              align: 'end',
              color: '#808080',
              font: {
                size: 12,
                family: "'Noto Sans KR', sans-serif",
                weight: 300,
              },
              text: '단위: 배'
            },
            afterDataLimits: (scale) => {
              scale.max = scale.max * 1.2;
            },
          },
        }
      };
  const refChart = useRef(null);
  
  
  return (
      <div style={{ height: "100%", width:'100%',padding: '5px', border:'1px solid'}}>
            <Chart
              ref={refChart}
              data={data}
              options={options}
            />
        </div>
  );
}

export default ChartTest
