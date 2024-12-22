// select the svg element
let svg = d3.select('svg');
let energy = "renewable-energy-consumption.csv";
let geojson = "https://cdn.jsdelivr.net/npm/visionscarto-world-atlas@0.1.0/world/110m.json";
let gdp = "gdp-per-unit-of-energy-use-2017.csv"
let selectedCountryData = null;


Promise.all([
d3.json(geojson),
d3.csv(energy, function (d) {
    // Convert all columns to numbers except for 'Country'
    Object.keys(d).forEach(key => {
        if (key !== 'Country') {
            d[key] = +d[key]; // Convert to number
        }
    });
    return d;
}),
d3.csv(gdp, function (d) {
    // Convert all columns to numbers except for 'Country'
    Object.keys(d).forEach(key => {
        if (key !== 'Country') {
            d[key] = +d[key]; // Convert to number
        }
    });
    return d;
})
]).then(main);

function main(data) 
{
    // Create a custom slider
    const slider = d3.select("#slider");
    const currentYearDisplay = d3.select("#current-year");

    slider
        .append("input")
        .attr("type", "range")
        .attr("min", 1990)
        .attr("max", 2014)
        .attr("step", 1)
        .attr("value", 2014)
        .on("input", function () 
        {
            // Update the year display with the current slider value
            const selectedYear = this.value;
            currentYearDisplay.text(selectedYear);
            updateMap(selectedYear);
            updateBarChart(selectedYear);
        });

    // Initial map update with the default year (2014)
    updateMap(2014);
    updateBarChart(2014);

    function updateMap(selectedYear) 
    {
        svg.selectAll('*').remove();
        let energy_data = d3.group(data[1], d => d.Country);
        let geoJson = topojson.feature(data[0], data[0].objects.countries).features;
        let land = topojson.feature(data[0], data[0].objects.land);

        const projection = d3.geoEquirectangular().fitSize([1000, 800], topojson.feature(data[0], data[0].objects.countries));
        let geo_generator = d3.geoPath(projection);

        let max_min = d3.extent(data[1], d => Number(d[selectedYear]));

        const linearScale = d3.scaleLinear()
                            .domain(max_min)
                            .range([0, 1]);

        const colorinterpolator = d3.interpolateViridis

        let mapCanvas = svg.append('g');

        let countryGroup = mapCanvas.append('g');
        countryGroup.selectAll('path')
            .data(geoJson)
            .enter()
            .append('path')
            .attr("class", "path_geo")
            .attr("d", geo_generator)
            .attr("fill", "white")
            .on('mouseover', function (mouseData, d) 
            {
                const countryName = d.properties.name;
                if (energy_data.has(countryName)) 
                {
                    const selectedCountryData = energy_data.get(d.properties.name)[0].Country;
                    const tooltip = d3.select('#line-chart-tooltip');

                    // Set the position of the tooltip based on the mouse coordinates
                    tooltip.style("left", (mouseData.clientX + 10).toString() + "px")
                           .style("top", (mouseData.clientY + 10).toString() + "px");

                    // Show the line chart tooltip
                    showLineChartTooltip(selectedCountryData);

                    const tooltip1 = d3.select('#scatter-chart-tooltip');

                    // Set the position of the tooltip based on the mouse coordinates
                    tooltip1.style("left", (mouseData.clientX + 330).toString() + "px")
                            .style("top", (mouseData.clientY + 10).toString() + "px");

                    // Show the line chart tooltip
                    showScatterPlotTooltip(selectedCountryData);
                    
                    d3.select('#tooltip')
                        .style("opacity", .8)
                        .style("left", (mouseData.clientX + 10).toString() + "px")
                        .style("top", (mouseData.clientY - 45).toString() + "px")
                        .html
                        (
                            "<div class='tooltipData' style='color:black'>Country: " + energy_data.get(d.properties.name)[0].Country + "</div>" +
                            "<div class='tooltipData' style='color:blue'>" + selectedYear + " Energy Consumption: " + (parseInt(energy_data.get(d.properties.name)[0][selectedYear])).toString() + " TWh</div>" +
                            "<div class='tooltipData'></div>"
                        );
                }
            })             
            .on('mouseout', function () 
            {
                hideLineChartTooltip();
                hideScatterPlotTooltip();
                d3.select('#tooltip').style("opacity", 0)
            })
            .transition()
            .delay((_, i) => i * 3)
            .duration(500)
            .style("fill", d => 
            {
                try 
                {
                    return colorinterpolator(linearScale(parseInt(energy_data.get(d.properties.name)[0][selectedYear])));
                } 
                catch (error)
                {
                    return "white";
                }
            });

        mapCanvas.append('path')
                 .datum(land)
                 .attr("class", "path_geo")
                 .attr("d", geo_generator)
                 .attr("fill", "none")
                 .attr("stroke", "black")
                 .attr("stroke-width", "0.5px");

        svg.call
        //svg.call(
        //    d3.zoom()
        //      .extent([[0, 0], [1000, 800]])
        //      .scaleExtent([0.5, 8]) // Limit the zoom scale
        //      .on("zoom", zoomed)
        //      .filter(event => event.type !== "wheel") // Disable zoom on scroll
        //);
        
        //function zoomed({ transform }) {
        //    mapCanvas.attr("transform", transform);
        //};
        
      {
           d3.zoom()
              .extent([[0, 0], [1000, 800]])
              .scaleExtent([0, 8])
              .on("zoom", zoomed)
      };
        
        const legend = svg.append('g')
                          .attr("class", "legend")
                          .attr("transform", "translate(950, 300)"); // Adjust the position as needed

        const legendGradient = legend.append("defs").append("linearGradient")
                                     .attr("id", "legendGradient")
                                     .attr("x1", "0%")
                                     .attr("x2", "0%")
                                     .attr("y1", "0%")
                                     .attr("y2", "100%");

        // Number of legend steps
        const numLegendSteps = 9;

        // Calculate the step size for the legend
        const legendMin = d3.min(data[1], d => Number(d[selectedYear]));
        const legendMax = d3.max(data[1], d => Number(d[selectedYear]));
        const legendStep = (legendMax - legendMin) / numLegendSteps;

        const legendValues = Array.from({ length: numLegendSteps }, (_, i) => legendMin + i * legendStep);
        legendValues[numLegendSteps - 1] = legendMax;

        // Create gradient stops
        legendGradient.selectAll("stop")
                      .data(legendValues)
                      .enter()
                      .append("stop")
                      .attr("offset", (d, i) => (i / (numLegendSteps - 1)) * 100 + "%")
                      .style("stop-color", (d) => colorinterpolator(linearScale(d)))

        // Create a rectangle filled with the gradient
        legend.append("rect")
              .attr("width", 12)
              .attr("height", numLegendSteps * 12)
              .style("fill", "url(#legendGradient)");

        // Add legend tick marks and labels
        legend.selectAll("text")
              .data(legendValues.filter((_, i) => i % 2 === 0))
              .enter()
              .append("text")
              .attr("x", 18)
              .attr("y", (d, i) => i * 25 + 6)
              .text((d) => parseInt(d))
              .style("font-size", "8px");    

              legend.append("text")
                    .attr("dx", -35)
                    .attr("dy", -15)
                    .style("font-size", "10px")
                    .style("font-style", "italic")
                    .selectAll("tspan")
                    .data(["Energy Consumption", "(TWh)"])
                    .enter()
                    .append("tspan")
                    .text(d => d)
                    .attr("x",-5)
                    .attr("y", (d, i) => i * -4);

        function zoomed({transform}) 
        {
            mapCanvas.attr("transform", transform);
        }
    }

    function updateBarChart(selectedYear) 
    {
        
        let currentChartMode = "TopTenCountries"; // Initialize the chart mode
        // Set the dimensions of the chart
        var margin = {top: 40, right: 30, bottom: 10, left: 150},
            width = 600 - margin.left - margin.right + 30,
            height = 400 - margin.top - margin.bottom;

        let data1 = data[1];
        d3.select("#chart-container").select("svg").remove();
        
        // Set the dimensions of the chart
        const svg = d3.select("#chart-container")
                      .append("svg")
                      .attr("width", width + margin.left + margin.right)
                      .attr("height", height + margin.top + margin.bottom)
                      .append("g")
                      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        let energy_data = d3.group(data1, d => d.Country);

        let max_min = d3.extent(data1, d => Number(d[selectedYear]));
        const dataForXAxis = [];

        energy_data.forEach((countryData, countryName) => {
            const valueForSelectedYear = parseFloat(countryData[0][selectedYear]);
            dataForXAxis.push({ Country: countryName, Value: valueForSelectedYear });
        });

        dataForXAxis.sort((a, b) => b.Value - a.Value);
        const topTenCountries = dataForXAxis.slice(0, 10);
        const bottomTenCountries = dataForXAxis.slice(dataForXAxis.length - 10).sort((a, b) => a.Value - b.Value);

        // Define the scales for X and Y axes for both top and bottom charts
        const xTop = d3.scaleLinear().domain([0, d3.max(topTenCountries, d => d.Value)]).range([0, width - 100]);
        const xBottom = d3.scaleLinear().domain([0, d3.max(bottomTenCountries, d => d.Value)]).range([0, width - 100]);

        const y = d3.scaleBand()
                    .range([0, height])
                    .padding(0.1);

        svg.append("g")
           .attr("class", "y-axis");

    // Define the function to update the chart based on the selected mode
    function updateChart(chartMode) 
    {
        currentChartMode = chartMode; // Update the current chart mode

        // Update the text in the button based on the current chart mode
        const button = document.querySelector('#btnSwitch');
        button.textContent = `${chartMode === "TopTenCountries" ? "Top 10 Countries" : "Bottom 10 Countries"}`;

        let data, yDomain;
        if (chartMode === "TopTenCountries") 
        {
            data = topTenCountries;
            yDomain = data.map(d => d.Country);
        } 
        else if (chartMode === "BottomTenCountries") 
        {
            data = bottomTenCountries;
            yDomain = data.map(d => d.Country);
        }

        // Update the y-axis domain with the appropriate countries
        y.domain(yDomain);

        // Update the chart based on the selected data
        svg.select(".x-axis")
           .call(d3.axisBottom(chartMode === "TopTenCountries" ? xTop : xBottom));

        svg.select(".y-axis")
           .call(d3.axisLeft(y));

        // Create the bars and labels
        const bars = svg.selectAll(".bar")
                        .data(data, d => d.Country);

        bars.exit().remove();

        const newBars = bars.enter()
                            .append("g")
                            .attr("class", "bar");

        newBars.append("rect")
               .attr("x", 0)
               .attr("y", d => y(d.Country))
               .attr("width", 0)  // Set initial width to 0
               .attr("height", y.bandwidth())
               .transition()
               .duration(1500)
               .delay((d, i) => i * 20)
               .ease(d3.easeBounceOut)
               .attr("width", d => (chartMode === "TopTenCountries" ? xTop : xBottom)(d.Value))
               .style("fill", "#414487")

        newBars.append("text")
               .attr("x", d => (chartMode === "TopTenCountries" ? xTop : xBottom)(d.Value) + 5)
               .attr("y", d => y(d.Country) + y.bandwidth() / 2)
               .text(d => parseInt(d.Value) + " TWh")
               .style("font-family",'sans-serif')
               .style('font-size','14')
               .style('font-weight','bold');

        svg.selectAll(".y-axis text")
           .style("font-family", "sans-serif")
           .style("font-size", "12");
    }

    // Initial chart rendering for the top ten countries
    updateChart(currentChartMode);

    // Toggle chart mode when the button is clicked
    const button = document.querySelector('#btnSwitch');
    button.onclick = function () 
        {
            if (currentChartMode === "TopTenCountries") 
            {
                updateChart("BottomTenCountries");
            } else 
            {
                updateChart("TopTenCountries");
            }
        };
    }

    function showLineChartTooltip(country) 
    {
        const tooltip = d3.select('#line-chart-tooltip');
        tooltip.transition().duration(200).style('opacity', 0.9);

        // Clear existing content in the tooltip
        tooltip.html('');

        // Assuming you have ECharts library loaded
        const echartsContainerLine = tooltip.append('div')
                                            .attr('id', 'echartsContainerLine')
                                            .style('width', '300px') // Set width
                                            .style('height', '220px') // Set height
                                            .attr('fill','pink')

        const myChart = echarts.init(echartsContainerLine.node());

        // Load data using D3.js
        const energy = data[2];

        let gdp_data = d3.group(dataset, d => d.Country);
        let countryData = gdp_data.get(country);

        // Extract data for the selected years
        let plotData = countryData.map(d => {
            let yearData = {};
            Object.keys(d).forEach(key => {
            if (key !== country) 
            {
                yearData[key] = d[key];
            }
        });
        return yearData;
        })[0];

    // Extract data for the chart
    const years = Object.keys(plotData);
    const values = Object.values(plotData);

    // ECharts option
    const option = {
        title: 
        {
            text: `GDP per Unit of Energy Use Trend - \n${country}`,
            textStyle: 
            {
                fontSize: 10,
                fontFamily: 'sans-serif',
                color: 'black',
            },
            textAlign: 'center',
            left: '50%',
            top: '3%',
        },
        tooltip: 
        {
            trigger: 'axis',
            formatter: function (params) 
            {
                const yearIndex = params[0].dataIndex;
                const gdpValue = params[0].value.toFixed(2);
                const year = years[yearIndex];
                return `GDP per unit of energy use for ${year} is: ${gdpValue}`;
            },
        },
        xAxis: 
        {
            type: 'category',
            data: years,
            axisLabel: 
            {
                textStyle: 
                {
                    fontFamily: 'sans-serif',
                    color: 'black',
                    fontSize: 10,
                }
            },
            min: "1990",
            max: "2014",
            boundaryGap: false,
            axisLine: 
            {
                lineStyle: 
                {
                color: 'black',
                }
            },
        },
        yAxis: 
        {
            type: 'value',
            axisLabel: 
            {
                    textStyle: 
                {
                    fontFamily: 'sans-serif',
                    color: 'black',
                    fontSize: 10,
                }
            },
            splitLine: 
            {
                    show: false,
            },
        },
        series: 
        [
            {
                name: 'Line Chart',
                type: 'line',
                data: values,
                lineStyle: 
                {
                    color: 'blue',
                    width: 2,
                },
            },
        ],
    };

    // Set ECharts option
    myChart.setOption(option);
    }

    function showScatterPlotTooltip(country) 
    {
        const tooltip = d3.select('#scatter-chart-tooltip');
        tooltip.transition().duration(200).style('opacity', 0.9);

        // Clear existing content in the tooltip
        tooltip.html('');

        // Assuming you have ECharts library loaded
        const echartsContainerLine = tooltip.append('div')
                                            .attr('id', 'echartsContainerLine')
                                            .style('width', '300px')
                                            .style('height', '220px')
                                            .attr('fill','pink')

        const myChart = echarts.init(echartsContainerLine.node());
        const consumptionDataset = data[1];

        let gdp_data = d3.group(dataset, d => d.Country);
  
        let countryData = gdp_data.get(country);

        let plotData = countryData.map(d => {
            let yearData = {};
            Object.keys(d).forEach(key => {
                if (key !== country) {
                    yearData[key] = +d[key];
                }
            });
        return yearData;
        })[0];

        let years = Object.keys(plotData);
        let gdpValues = Object.values(plotData);

        let consumptionData = consumptionDataset.filter(d => d.Country === country)[0];
        let consumptionValues = Object.values(consumptionData).slice(1);

        const xScale = d3.scaleLinear()
                         .domain([d3.min(consumptionValues), d3.max(consumptionValues)])
                         .range([0, 300]);

        const yScale = d3.scaleLinear()
                         .domain([d3.min(gdpValues), d3.max(gdpValues)])
                         .range([0, 220]);

        let option = 
        {
            title: 
            {
                text: `Energy Consumption vs GDP Correlation - \n ${country}`,
                textStyle: 
                {
                    fontSize: 10,
                    fontFamily: 'sans-serif',
                    color: 'black',
                },
                textAlign: 'center',
                left: '50%',
                top: '2%',
            },
            xAxis:
            {
                type: 'value',
                name: 'Energy Consumption',
                scale: true,
                axisLabel: 
                    {
                        textStyle: 
                        {
                            fontFamily: 'sans-serif',
                            color: 'black',
                            fontSize: 10,
                        }
                    },
                    boundaryGap: false,
                    axisLine: 
                    {
                        lineStyle: 
                        {
                            color: 'black',
                        }
                    },
                    splitLine: 
                {
                        show: false,
                },
                name: 'Energy Consumption (TWh)',
                nameLocation: 'center',
                nameGap: 22, 
                nameTextStyle: 
                {
                    fontSize: 9,
                },
            },
            grid: 
            {
                left: 50,
                top: 40
            },
            yAxis: 
            {
                type: 'value',
                name: 'GDP per unit of energy use',
                scale: true,
                axisLabel: 
                    {
                        textStyle: 
                        {
                        fontFamily: 'sans-serif',
                        color: 'black',
                        fontSize: 10
                        }
                    },
                    splitLine: 
                {
                        show: false,
                },
                axisTick: 
                {
                    show: false,
                },
                axisLine: 
                {
                    show: false,
                },
            name: 'GDP per unit of energy use',
            nameLocation: 'center',
            nameGap: 30,
            nameTextStyle: 
                {
                    fontSize: 9,
                    color: "black"
                },
                nameRotate: -270, 
            },
            series: 
                [
                    {
                        name: 'Scatter Plot',
                        type: 'scatter',
                        data: consumptionValues.map((value, index) => [value, gdpValues[index], years[index + 1]]), // Adjust index
                        itemStyle: 
                        {
                            color: 'blue',
                        },
                    },
                ],
        };

  // Set ECharts option
  myChart.setOption(option);
    }

    function hideLineChartTooltip() 
    {
        d3.select('#line-chart-tooltip')
          .transition()
          .duration(200)
          .style('opacity', 0);
    }

    function hideScatterPlotTooltip() 
    {
        d3.select('#scatter-chart-tooltip')
          .transition()
          .duration(200)
          .style('opacity', 0);
    }

    const echartsContainer = document.getElementById('echartsContainer');
    let myChart = echarts.init(echartsContainer);
    let dataset;
    let currentDataType = 'GDP'; // Default to GDP

    const toggleButton = document.getElementById('toggleButton');
    toggleButton.addEventListener('click', toggleData);

    function toggleData() 
    {
        // Toggle between GDP and Energy
        currentDataType = currentDataType === 'GDP' ? 'Energy Consumption' : 'GDP';
        updateButtonText();
        loadData();
    }

    function updateButtonText() 
    {
        toggleButton.innerText = `${currentDataType === 'GDP' ? 'GDP per unit of Energy Use' : 'Energy Consumption'}`;
    }

    function loadData() 
    {
        const dataFile = currentDataType === 'GDP' ? data[2] : data[1];

        dataset = dataFile;
        updateCheckboxContainer();
        updateAreaChart(getSelectedCountries());
    }

    function updateCheckboxContainer() 
    {
        const checkboxContainer = document.getElementById('checkboxContainer');
        checkboxContainer.innerHTML = ''; // Clear existing checkboxes

        const countries = Array.from(new Set(dataset.map(d => d.Country)));
        countries.forEach(country => 
        {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `country${country}`;
            checkbox.value = country;
            checkbox.checked = country === 'Albania' || country === 'Algeria' || country === 'Angola' || country === 'Argentina' || country === 'Armenia';
            checkbox.addEventListener('change', function () 
            {
                updateAreaChart(getSelectedCountries());
            });

            const label = document.createElement('label');
            label.htmlFor = `country${country}`;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${country}`));

            checkboxContainer.appendChild(label);
        });
    }

    function getSelectedCountries() 
    {
        return Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    }

    function updateAreaChart(selectedCountries) 
    {
        myChart.clear();

        const dataGroup = d3.group(dataset, d => d.Country);
        const countryData = selectedCountries.map(country => {
            return {
                        name: country,
                        data: dataGroup.get(country).map(d => {
                        let yearData = {};
                        Object.keys(d).forEach(key => {
                            if (key !== 'Country') 
                            {
                                yearData[key] = d[key];
                            }
                        });
                        return yearData;
                        })[0],
                    };
        });

        const isGDP = currentDataType === 'GDP';

        const option = {
            title: 
            {
                text: selectedCountries.length > 1 ?
                    `${currentDataType} ${isGDP ? 'per Unit of Energy Use' : ''} - ${selectedCountries.join(', ')}` :
                    `${currentDataType} ${isGDP ? 'per Unit of Energy Use' : ''} - ${selectedCountries[0]}`,
                textStyle: 
                {
                    fontFamily: 'sans-serif', 
                    color: '#000000',
                    fontSize: 12,
                    fontWeight: 'italic'
                },
                left:45,
                top: 15,
            },
            tooltip: 
            {
                trigger: 'axis',
                formatter: function (params) 
                {
                    const yearIndex = params[0].dataIndex;
                    let tooltipText = '';
                    params.forEach(param => {
                        const value = param.value.toFixed(2);
                        const country = param.seriesName;
                        tooltipText += `${currentDataType} ${isGDP ? 'per Unit of Energy Use for': '(TWh) for'} ${country} in ${param.name} is: ${value}<br>`;
                    });
                    return tooltipText;
                },
                textStyle: 
                {
                    fontFamily: 'sans-serif', 
                    color: '#000000',
                    fontSize: 12,
                },
            },
            legend: 
            {
                data: selectedCountries,
                orient: 'vertical',
                right: 0,
                bottom: 0,
                textStyle: 
                {
                    fontFamily: 'sans-serif', 
                    color: '#000000',
                    fontSize: 14,
                },
            },
            grid: 
            {
                right: '25%',
            },
            xAxis: 
            {
                type: 'category',
                data: Object.keys(countryData[0].data),
                axisLabel: 
                {
                    textStyle: 
                    {
                        fontFamily: 'sans-serif',
                        color: 'black',
                        fontSize: 14,
                    }
                },
                boundaryGap: false,
                axisLine: 
                {
                    lineStyle: 
                    {
                        color: 'black',
                    }
                }
            },
            yAxis: 
            {
                type: 'value',
                axisLabel: 
                {
                    textStyle: 
                    {
                    fontFamily: 'sans-serif',
                    color: 'black',
                    fontSize: 14
                    }
                }
            },
            series: 
            countryData.map(country => ({
                name: country.name,
                type: 'line',
                stack: 'total',
                areaStyle: 
                {
                    opacity: 0.5,
                },
                data: Object.values(country.data),
                lineStyle: 
                {
                    width: 2,
                },
            })),
            dataZoom: 
            [   {
                    type: 'slider',
                    start: 0,
                    end: 100,
                    fillerColor: '#414487',
                },
                {
                    type: 'inside',
                    start: 0,
                    end: 100,
                },
            ],
        };

        myChart.setOption(option);
    }

    // Load initial data
    loadData();
    updateButtonText();
}
