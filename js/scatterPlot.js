class ScatterPlot {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            width: _config.width || 400,
            height: _config.height || 250,
            margin: _config.margin || { top: 20, right: 20, bottom: 30, left: 100 }
        };
        this.data = _data;
        this.xAttribute = 'defaultValue'; // Default x attribute
        this.yAttribute = 'defaultValue'; // Default y attribute
        this.initVis();
    }

    initVis() {
        const vis = this;
    
        // Define width and height
        vis.width = vis.config.width - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.height - vis.config.margin.top - vis.config.margin.bottom;
    
        // Append SVG to the parent element
        vis.svg = d3.select(vis.config.parentElement)
            .append("svg")
            .attr("width", vis.config.width)
            .attr("height", vis.config.height)
            .append("g")
            .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);
    
        // Set up scales and axes
        vis.xScale = d3.scaleLinear().range([0, vis.width]);
        vis.yScale = d3.scaleLinear().range([vis.height, 0]);
        vis.xAxis = d3.axisBottom().scale(vis.xScale);
        vis.yAxis = d3.axisLeft().scale(vis.yScale);
        vis.colorScale = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, 10)); // Categorical color scale
    
        // Append x-axis
        vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${vis.height})`);
    
        // Append y-axis
        vis.svg.append("g")
            .attr("class", "y-axis");
    
        // Append x-axis label
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 50)
            .text("X Axis");
    
        // Append y-axis label
        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", -vis.height / 2)
            .attr("y", -60)
            .attr("transform", "rotate(-90)")
            .text("Y Axis");
    
        // Append clipping path
        vis.svg.append("clipPath")
            .attr("id", "scatterplot-clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);
    
        // Create brush function
        vis.brush = d3.brush()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("end", brushed);
    
        // Append brush to svg
        vis.svg.append("g")
            .attr("class", "brush")
            .call(vis.brush);
    
        // Define brush function
        function brushed() {
            const selection = d3.event.selection;
            if (selection) {
                const [x0, y0] = selection[0];
                const [x1, y1] = selection[1];
    
                // Update the scales based on the brush selection
                vis.xScale.domain([vis.xScale.invert(x0), vis.xScale.invert(x1)]);
                vis.yScale.domain([vis.yScale.invert(y1), vis.yScale.invert(y0)]);
    
                // Update the axes
                vis.svg.select(".x-axis").call(vis.xAxis);
                vis.svg.select(".y-axis").call(vis.yAxis);
    
                // Update the circles' positions based on the new scales
                vis.svg.selectAll(".circle")
                    .attr("cx", d => vis.xScale(d.x))
                    .attr("cy", d => vis.yScale(d.y));
            }
        }
    
        // Update the visualization
        vis.updateVis();
    
        // Log the valid data
        // console.log('Valid Data:', validData);
    }
    

    updateData(selectedXAttribute, selectedYAttribute, newData) {
        this.xAttribute = selectedXAttribute;
        this.yAttribute = selectedYAttribute;
        this.data = newData;
        this.updateVis();
    }

    getStateFullName(abbreviation) {
        switch (abbreviation) {
            case 'AL':
                return 'Alabama';
            case 'AK':
                return 'Alaska';
            case 'AZ':
                return 'Arizona';
            case 'AR':
                return 'Arkansas';
            case 'CA':
                return 'California';
            case 'CO':
                return 'Colorado';
            case 'CT':
                return 'Connecticut';
            case 'DC':
                return 'Washington D.C';
            case 'DE':
                return 'Delaware';
            case 'FL':
                return 'Florida';
            case 'GA':
                return 'Georgia';
            case 'HI':
                return 'Hawaii';
            case 'ID':
                return 'Idaho';
            case 'IL':
                return 'Illinois';
            case 'IN':
                return 'Indiana';
            case 'IA':
                return 'Iowa';
            case 'KS':
                return 'Kansas';
            case 'KY':
                return 'Kentucky';
            case 'LA':
                return 'Louisiana';
            case 'ME':
                return 'Maine';
            case 'MD':
                return 'Maryland';
            case 'MA':
                return 'Massachusetts';
            case 'MI':
                return 'Michigan';
            case 'MN':
                return 'Minnesota';
            case 'MS':
                return 'Mississippi';
            case 'MO':
                return 'Missouri';
            case 'MT':
                return 'Montana';
            case 'NE':
                return 'Nebraska';
            case 'NV':
                return 'Nevada';
            case 'NH':
                return 'New Hampshire';
            case 'NJ':
                return 'New Jersey';
            case 'NM':
                return 'New Mexico';
            case 'NY':
                return 'New York';
            case 'NC':
                return 'North Carolina';
            case 'ND':
                return 'North Dakota';
            case 'OH':
                return 'Ohio';
            case 'OK':
                return 'Oklahoma';
            case 'OR':
                return 'Oregon';
            case 'PA':
                return 'Pennsylvania';
            case 'RI':
                return 'Rhode Island';
            case 'SC':
                return 'South Carolina';
            case 'SD':
                return 'South Dakota';
            case 'TN':
                return 'Tennessee';
            case 'TX':
                return 'Texas';
            case 'UT':
                return 'Utah';
            case 'VT':
                return 'Vermont';
            case 'VA':
                return 'Virginia';
            case 'WA':
                return 'Washington';
            case 'WV':
                return 'West Virginia';
            case 'WI':
                return 'Wisconsin';
            case 'WY':
                return 'Wyoming';
            default:
                return abbreviation;
        }
    }

    addLegend() {
        const vis = this;
    
        // Clear existing legend
        d3.select("#legend-container").selectAll("*").remove();
    
        // Create legend container
        const legendContainer = d3.select("#legend-container")
            .append("div")
            .attr("class", "legend-container")
            .style("height", `${vis.config.height - vis.config.margin.top - vis.config.margin.bottom}px`);
    
        // Create legend
        const legend = legendContainer
            .append("div")
            .attr("class", "legend")
            .style("overflow-y", "auto");
    
        // Add title to the legend
        legend.append("div")
            .attr("class", "legend-title")
            .text("State Legend");
    
        // Add color blocks and labels for each state
        const uniqueStates = Array.from(new Set(vis.data.objects.counties.geometries.map(d => vis.getStateAbbreviation(d.properties.name))));
    
        // Filter out the empty string from uniqueStates
        const filteredStates = uniqueStates.filter(state => state !== '');
    
        // Set up a color scale with a wider range of colors
        const colorScale = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, filteredStates.length));
    
        filteredStates.forEach(state => {
            legend.append("div")
                .attr("class", "legend-item")
                .style("background-color", colorScale(state))
                .text(vis.getStateFullName(state)); // Use full state name
        });
    }
    
    updateVis() {
        const vis = this;
    
        // Extract the relevant properties from the geoData
        const dataValues = vis.data.objects.counties.geometries.map(d => ({
            x: d.properties[vis.xAttribute],
            y: d.properties[vis.yAttribute],
            state: vis.getStateAbbreviation(d.properties.name) // Extract state abbreviation
        }));

        // Filter out undefined, NaN, and negative values for both X and Y
        const validData = dataValues.filter(d => typeof d.x === 'number' && !isNaN(d.x) && d.x >= 0 && typeof d.y === 'number' && !isNaN(d.y) && d.y >= 0);
    
        // Calculate maximum x and y values from the valid data
        const maxX = d3.max(validData, d => d.x);
        const maxY = d3.max(validData, d => d.y);
    
        // Add a buffer for padding
        const xBuffer = 0.1 * maxX;
        const yBuffer = 0.2 * maxY;
    
        // Update domains, filtering out negative values
        vis.xScale.domain([0, maxX + xBuffer]);
        vis.yScale.domain([0, maxY + yBuffer]);
    
        // Update axes
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);
    
        // Function to capitalize the first letter of each word
        function capitalizeFirstLetter(string) {
            return string.replace(/\b\w/g, function (char) {
                return char.toUpperCase();
            });
        }
    
        // Update axis labels
        vis.svg.select(".x-axis-label").text(capitalizeFirstLetter(vis.xAttribute.replace(/([A-Z])/g, ' $1').trim()));
        vis.svg.select(".y-axis-label").text(capitalizeFirstLetter(vis.yAttribute.replace(/([A-Z])/g, ' $1').trim()));
    
        // Remove existing circles
        vis.svg.selectAll(".circle").remove();
    
        // Append circles only if both X and Y data are present
        vis.svg.selectAll(".circle")
        .data(validData)
        .enter()
        .append("circle")
        .attr("class", "circle")
        .attr("cx", d => vis.xScale(d.x))
        .attr("cy", d => vis.yScale(d.y))
        .attr("r", 3)
        .attr("fill", d => {
            //console.log('State:', d.state); // Log the state
            return vis.colorScale(d.state);
        })
        .attr("clip-path", "url(#scatterplot-clip)");
        vis.addLegend();
        // Log the valid data
        //console.log('Valid Data:', validData);
    }
    
    getStateAbbreviation(name) {
        // Extract state abbreviation from the name property
        const matches = name.match(/\(([^)]+)\)/);
        return matches ? matches[1] : ''; // Extracted state abbreviation
    }    
}

export { ScatterPlot };
