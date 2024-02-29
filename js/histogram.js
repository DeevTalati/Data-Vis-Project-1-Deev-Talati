class Histogram {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 400,
            containerHeight: _config.containerHeight || 250,
            margin: _config.margin || { top: 20, right: 20, bottom: 60, left: 70 }
        };
        this.data = _data;
        this.selectedVariable = 'defaultValue'; // Default selected variable
        this.initVis();
    }

    initVis() {
        const vis = this;

        // Define fixed width and height
        vis.width = vis.config.containerWidth;
        vis.height = vis.config.containerHeight;

        // Update margin if necessary to accommodate axis titles
        vis.config.margin.bottom += 5; // Adjust as needed

        // Select the parent element and append an SVG container
        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('width', vis.width + vis.config.margin.left + vis.config.margin.right)
            .attr('height', vis.height + vis.config.margin.top + vis.config.margin.bottom)
            .append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Filter out undefined values from data
        const dataValues = vis.data.objects.counties.geometries.map(d => {
            return d.properties[vis.selectedVariable];
        }).filter(d => typeof d !== 'undefined');
        const validData = dataValues.filter(d => typeof d === 'number' && !isNaN(d));

        // Set xScale domain based on the range of data values
        vis.xScale = d3.scaleLinear()
            .domain([0, d3.max(validData)]) // Use the maximum of validData
            .range([0, vis.width]);

        // Set yScale range based on the height
        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Call updateVis after initialization
        vis.updateVis();
    }

    removeOldChart() {
        // Remove existing chart elements
        d3.select(this.config.parentElement).selectAll("*").remove();
    }

    updateData(selectedVariable, newData) {
        this.selectedVariable = selectedVariable;
        this.data = newData;
        this.removeOldChart();
        this.initVis();
        this.updateVis(); // Update the visualization with new data
    }

    updateVis() {
        const vis = this;

        // Check if the selected variable is the default value
        if (vis.selectedVariable === 'defaultValue') {
            // If it is the default value, do nothing and return
            return;
        }

        // Extract the relevant property from the geoData
        const dataValues = vis.data.objects.counties.geometries.map(d => {
            return d.properties[vis.selectedVariable];
        });

        // Filter out undefined, NaN, and negative values
        const validData = dataValues.filter(d => typeof d === 'number' && !isNaN(d) && d >= 0);

        // Calculate histogram bins
        const bins = d3.histogram()
            .domain(vis.xScale.domain())
            .thresholds(vis.xScale.ticks(10))
            (validData);

        // Update the yScale domain to represent the frequency
        vis.yScale.domain([0, d3.max(bins, d => d.length)]);

        // Calculate buffer for x-axis
        const xBuffer = Math.max(d3.max(validData) * 0.1, 1); // Adjust the buffer percentage as needed

        // Update the xScale domain with buffer
        vis.xScale.domain([0, d3.max(validData) + xBuffer]);

        // Remove any existing axes
        vis.svg.selectAll('.axis').remove();

        // Add x-axis title representing the selected property
        vis.svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${vis.height})`)
            .call(d3.axisBottom(vis.xScale)
                .tickFormat(d => {
                    if (vis.selectedVariable === 'urbanRuralStatus') {
                        // Map numerical values to corresponding strings
                        switch (d) {
                            case 1:
                                return 'Rural';
                            case 2:
                                return 'Small City';
                            case 3:
                                return 'Suburban';
                            case 4:
                                return 'Urban';
                            default:
                                return '';
                        }
                    } else {
                        return d; // For other variables, use numerical values directly
                    }
                })
            );

        // Append y-axis
        vis.svg.append('g')
            .attr('class', 'y axis')
            .call(d3.axisLeft(vis.yScale));

        // Remove any existing bars
        vis.svg.selectAll('.bar').remove();

        // Append bars to the SVG
        vis.svg.selectAll('.bar')
            .data(bins)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => vis.xScale(d.x0))
            .attr('y', d => vis.yScale(d.length))
            .attr('width', d => Math.max(vis.xScale(d.x1) - vis.xScale(d.x0) - 1, 0)) // Ensure width is non-negative
            .attr('height', d => vis.height - vis.yScale(d.length))
            .style('fill', '#69b3a2'); // Add color to bars, you can change the color as needed

        // Function to capitalize the first letter of each word
        function capitalizeFirstLetter(string) {
            return string.replace(/\b\w/g, function (char) {
                return char.toUpperCase();
            });
        }

        // Add x-axis title representing the selected property
        vis.svg.append('text')
            .attr('class', 'x-axis-title')
            .attr('x', vis.width / 2)
            .attr('y', vis.height + vis.config.margin.top + 30) // Adjust the position as needed
            .style('text-anchor', 'middle')
            .text(vis.selectedVariable === 'urbanRuralStatus' ? 'Urban/Rural Status' : capitalizeFirstLetter(vis.selectedVariable.replace(/([A-Z])/g, ' $1').trim())); // Use the selected property as the x-axis title

        // Add y-axis title representing the frequency
        vis.svg.append('text')
            .attr('class', 'y-axis-title')
            .attr('transform', 'rotate(-90)')
            .attr('x', -vis.height / 2)
            .attr('y', -vis.config.margin.left + 20) // Adjust the position as needed
            .style('text-anchor', 'middle')
            .text('Frequency'); // Use 'Frequency' as the y-axis title

        // Add data marks above bars representing the frequency
        vis.svg.selectAll('.data-mark')
            .data(bins)
            .enter().append('text')
            .attr('class', 'data-mark')
            .attr('x', d => vis.xScale((d.x0 + d.x1) / 2))
            .attr('y', d => vis.yScale(d.length) - 5) // Adjust the position as needed
            .attr('text-anchor', 'middle')
            .text(d => d.length); // Display the length of each bin (i.e., the frequency)
    }

}

export { Histogram };
