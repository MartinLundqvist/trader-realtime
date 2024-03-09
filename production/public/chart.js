// let chartSourceData = [];
const myChart = echarts.init(document.getElementById('main'));

fetch('/chart_data/filelist.txt')
  .then((response) => {
    if (!response.ok) throw new Error('Failed to fetch file list');
    return response.text();
  })
  .then((data) => {
    const files = data.split('\n'); // split the file content by newline to get an array of file names
    const select = document.getElementById('fileSelect'); // get the select element

    // populate the select element with the file names
    files.forEach((file) => {
      const option = document.createElement('option');
      option.value = file;
      option.text = file;
      select.appendChild(option);
    });

    // add an event listener to the select element to fetch the selected file when the selection changes
    select.addEventListener('change', (event) => {
      fetch(`/chart_data/${event.target.value}`)
        .then((response) => {
          if (!response.ok) {
            window.alert(
              'Failed to fetch file ' + event.target.value + ' from server'
            );
            throw new Error(
              'Failed to fetch file ' + event.target.value + ' from server'
            );
          }

          return response.json();
        })
        .then((data) => {
          updateChart(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });

    // force the event listener to run once to fetch the first file
    select.dispatchEvent(new Event('change'));
  })
  .catch((err) => {
    console.log(err);
  });

// fetch('/playground/marketdata.json')
//   .then((response) => response.json())
//   .then((data) => {
//     // chartSourceData = data;
//     updateChart(data);
//   });

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  return formatter.format(date);
};

const updateChart = (data) => {
  if (!data) return;

  console.log(data);

  // Change to US timezone
  for (let d of data) {
    d.date = formatDate(d.date);
  }

  const dates = data.map((d) => d.date);

  const candles = data.map((d) => [d.open, d.close, d.low, d.high]);

  const ema1Data = data.map((d) => d.ema_fast);
  const ema2Data = data.map((d) => d.ema_slow);
  const bollingerUpData = data.map((d) => d.bb_high);
  const bollingerDownData = data.map((d) => d.bb_low);
  const atrData = data.map((d) => (100 * d.atr) / d.close);

  const signalMarkPoints = [];
  const signalMarkAreas = [];

  for (let d of data) {
    if (d.signal === 'buy' || d.signal === 'sell') {
      signalMarkPoints.push({
        name: d.signal,
        value: d.signal,
        xAxis: d.date,
        yAxis: d.close,
        symbolRotate: d.signal === 'buy' ? 180 : 0,
        symbol: 'pin',
        symbolSize: 40,
        itemStyle: {
          color: 'orange',
        },
        label: {
          show: true,
          position: d.signal === 'buy' ? 'insideBottom' : 'insideTop',
        },
      });

      signalMarkAreas.push(
        [
          {
            xAxis: d.date,
            yAxis: d.signal === 'buy' ? d.tp : d.sl,
            itemStyle: {
              borderColor: d.signal === 'buy' ? 'green' : 'red',
              borderWidth: 10,
              opacity: 0.5,
            },
          },
          {
            xAxis: d.date,
            yAxis: d.close,
          },
        ],
        [
          {
            xAxis: d.date,
            yAxis: d.close,
            itemStyle: {
              borderColor: d.signal === 'buy' ? 'red' : 'green',
              borderWidth: 10,
              opacity: 0.5,
            },
          },
          {
            xAxis: d.date,
            yAxis: d.signal === 'buy' ? d.sl : d.tp,
          },
        ]
      );
    }
  }

  const option = {
    grid: {
      bottom: 120,
    },
    title: {
      text: 'Candlestick Chart with EMA and Bollinger Bands',
    },
    tooltip: {
      alwaysShowContent: false,
      trigger: 'axis',
      triggerOn: 'click',
    },
    legend: {
      bottom: 10,
      data: [
        'Candlestick',
        'EMA Fast',
        'EMA Slow',
        'Bollinger Band Up',
        'Bollinger Band Down',
        'ATR',
      ],
    },
    xAxis: [
      {
        data: dates, // array of dates
      },
      {
        type: 'value',
        min: 1,
        max: data.length,
      },
    ],
    yAxis: [
      {
        scale: true,
      },
      { scale: true },
    ],
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: [0, 1],
        bottom: 50,
      },
      {
        show: true,
        type: 'inside',
        xAxisIndex: [0, 1],
        start: 98,
        end: 100,
      },
    ],
    series: [
      {
        name: 'Candlestick',
        type: 'candlestick',
        data: candles, // array of [open, close, low, high] values
        itemStyle: {
          color: 'green',
          color0: 'red',
          borderColor: 'green',
          borderColor0: 'red',
        },
        markPoint: {
          data: signalMarkPoints,
          // data: testPoints,
        },
        markArea: {
          data: signalMarkAreas,
        },
      },
      {
        name: 'EMA Fast',
        type: 'line',
        symbol: 'none',
        color: 'orange',
        lineStyle: {
          opacity: 0.5,
        },
        data: ema1Data, // array of EMA1 values
      },
      {
        name: 'EMA Slow',
        type: 'line',
        symbol: 'none',
        color: 'blue',
        lineStyle: {
          opacity: 0.5,
        },
        data: ema2Data, // array of EMA2 values
      },
      {
        name: 'Bollinger Band Up',
        type: 'line',
        symbol: 'none',
        color: 'black',
        lineStyle: {
          opacity: 0.5,
        },
        data: bollingerUpData, // array of upper Bollinger Band values
      },
      {
        name: 'Bollinger Band Down',
        type: 'line',
        symbol: 'none',
        color: 'black',
        lineStyle: {
          opacity: 0.5,
        },
        data: bollingerDownData, // array of lower Bollinger Band values
      },
      {
        name: 'ATR',
        type: 'line',
        symbol: 'none',
        color: 'pink',
        lineStyle: {
          opacity: 0.5,
        },
        yAxisIndex: 1,
        data: atrData, // array of lower Bollinger Band values
      },
    ],
  };

  console.log(option);

  // Use configuration item and data specified to show chart
  console.log('Setting new echarts option');
  console.log(myChart);
  myChart.setOption(option);
  myChart.resize();
};
