class ChoroplethMap {

  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 500,
      margin: _config.margin || {top: 10, right: 10, bottom: 10, left: 10},
      tooltipPadding: 10,
      legendBottom: 473,
      legendLeft: 450,
      legendRectHeight: 12, 
      legendRectWidth: 150
    };
    this.data = _data;
    this.selectedVariable = 'defaultValue'; // Default selected variable

    this.initVis();
  }
  
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('class', 'center-container')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append main SVG group
    vis.g = vis.svg.append("g")
            .attr('class', 'center-container center-items us-state')
            .attr('transform', 'translate('+vis.config.margin.left+','+vis.config.margin.top+')')
            .attr('width', vis.width + vis.config.margin.left + vis.config.margin.right)
            .attr('height', vis.height + vis.config.margin.top + vis.config.margin.bottom);

    // Initialize projection and path generator
    vis.projection = d3.geoAlbersUsa()
            .translate([vis.width /2 , vis.height / 2])
            .scale(vis.width);

    vis.path = d3.geoPath()
            .projection(vis.projection);

    // Initialize color scale
    vis.colorScale = d3.scaleLinear()
        .range(['#cfe2f2', '#0d306b'])
        .interpolate(d3.interpolateHcl);

    // Initialize gradient for legend
    vis.linearGradient = vis.svg.append('defs').append('linearGradient')
        .attr("id", "legend-gradient");

    // Append legend
    vis.legend = vis.g.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${vis.config.legendLeft},${vis.height - vis.config.legendBottom})`);
    
    vis.legendRect = vis.legend.append('rect')
        .attr('width', vis.config.legendRectWidth)
        .attr('height', vis.config.legendRectHeight);

    vis.legendTitle = vis.legend.append('text')
        .attr('class', 'legend-title')
        .attr('dy', '.35em')
        .attr('y', -10)

    // Render the visualization
    vis.renderVis();
  }

  updateVis() {
    let vis = this;
  
    console.log('Updating visualization with selected column:', vis.selectedVariable);
  
    const counties = topojson.feature(vis.data, vis.data.objects.counties);
    console.log('vis data:', vis.data);
    // Filter out undefined values before computing the extent
    //const dataValues = counties.features.map(d => d.properties[vis.selectedVariable]).filter(d => !isNaN(d));

    // Extract the relevant property from the geoData
    const dataValues = counties.features.map(d => {
      return d.properties[vis.selectedVariable];
    });

    const validData = dataValues.filter(d => typeof d === 'number' && !isNaN(d) && d >= 0);
    console.log('Data values for selected column:', validData);
  
    vis.colorScale.domain(d3.extent(validData));
  
    console.log('Color scale domain:', vis.colorScale.domain());
  
    vis.counties.transition()
      .duration(500)
      .attr('fill', d => {
        if (d.properties && !isNaN(d.properties[vis.selectedVariable])) {
          return vis.colorScale(d.properties[vis.selectedVariable]);
        } else {
          return 'url(#lightstripe)';
        }
      });
    const dataValuesExtent = d3.extent(validData);
    // Define begin and end of the color gradient (legend)
    vis.legendStops = [
      { color: '#cfe2f2', value: dataValuesExtent[0], offset: 0},
      { color: '#0d306b', value: dataValuesExtent[1], offset: 100},
    ];

    vis.updateLegend();
  }

  renderVis() {
    let vis = this;

    // Append counties
    vis.counties = vis.g.selectAll("path")
        .data(topojson.feature(vis.data, vis.data.objects.counties).features)
        .enter().append("path")
        .attr("d", vis.path)
        .attr('fill', d => {
            if (d.properties && d.properties[vis.selectedVariable]) {
                return vis.colorScale(d.properties[vis.selectedVariable]);
            } else {
                return 'url(#lightstripe)';
            }
        })
        .on('mousemove',(d,event) => {
          console.log('Mouse over event:', event);
          console.log('Mouse over data:', d);
          if (d && d.properties && d.properties[vis.selectedVariable]) {
              if(vis.selectedVariable == "urbanRuralStatus"){
                d.properties[vis.selectedVariable] = d.properties.urbanRuralStatusString;
              }
            
              const dataValue = `<strong>${d.properties[vis.selectedVariable]}</strong>`;
              
              d3.select('#tooltip')
                  .style('display', 'block')
                  .style('left', (d3.event.pageX + vis.config.tooltipPadding) + 'px')
                  .style('top', (d3.event.pageY + vis.config.tooltipPadding) + 'px')
                  .html(`
                      <div class="tooltip-title">${d.properties.name}</div>
                      <div>${dataValue}</div>
                  `);
          }
      })
      
      .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
      });
      
    // Append state borders if needed
    vis.g.append("path")
        .datum(topojson.mesh(vis.data, vis.data.objects.states, function(a, b) {
            return a !== b;
        }))
        .attr("id", "state-borders")
        .attr("d", vis.path);
    
        
    // Initialize legend
    vis.initLegend();
}

  updateData(columnName, newData) {
    let vis = this;
    vis.selectedVariable = columnName;
  
    // Merge the new data with the original data while preserving the structure
    vis.data.objects.counties = newData.objects.counties; // Update the counties data
    vis.updateVis();
  }

  updateLegend() {
    let vis = this;
  
    // Remove existing legend elements
    vis.legend.selectAll('.legend-title').remove();
  
    // Define begin and end of the color gradient (legend)
    const dataValuesExtent = vis.colorScale.domain();
    const legendScale = d3.scaleLinear()
      .domain(dataValuesExtent)
      .range([0, vis.config.legendRectWidth]);
  
    vis.legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format(".2s"));
  
    vis.legendAxisGroup.call(vis.legendAxis);
  
    vis.linearGradient.selectAll('stop')
      .data([
        { color: '#cfe2f2', offset: '0%'},
        { color: '#0d306b', offset: '100%'}
      ])
      .enter().append('stop')
      .merge(vis.linearGradient.selectAll('stop')) // merge existing and new data
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color);
  
    // Extracting units from the variable
    const variableName = vis.selectedVariable.replace(/([A-Z])/g, ' $1').trim(); // Add spaces before capital letters
    let units = ''; // Variable for units
    if (variableName === 'Poverty Percentage') {
      variableName = 'Poverty Percent'; // Ensure the variable name is correct
      units = '%'; // Add percent sign for 'Poverty Percent'
    } else if (variableName === 'Median Household Income') {
      units = 'USD'; // Add 'USD' for 'Median Household Income'
    }
    const titleText = variableName + (units ? ' (' + units + ')' : ''); // Construct title text with units if applicable
    // Append legend title
    vis.legend.append('text')
      .attr('class', 'legend-title')
      .attr('dy', '.35em')
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('x', vis.config.legendRectWidth / 2)
      .style('text-transform', 'capitalize') // Capitalize the first letter of each word
      .text(titleText); // Add spaces before capital letters
  }  

  initLegend() {
    let vis = this;
  
    // Append gradient to the legend
    vis.linearGradient.selectAll('*').remove(); // Remove existing stops (if any)
    vis.legendRect.attr('fill', 'url(#legend-gradient)');
  
    // Define begin and end of the color gradient (legend)
    const dataValuesExtent = vis.colorScale.domain();
    const legendScale = d3.scaleLinear()
      .domain(dataValuesExtent)
      .range([0, vis.config.legendRectWidth]);
  
    vis.legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format(".2s"));
  
    vis.legendAxisGroup = vis.legend.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0, ${vis.config.legendRectHeight})`)
      .call(vis.legendAxis);
  
    vis.legendStops = [
      { color: '#cfe2f2', value: dataValuesExtent[0], offset: 0},
      { color: '#0d306b', value: dataValuesExtent[1], offset: 100},
    ];
  
    vis.linearGradient.selectAll('stop')
      .data(vis.legendStops)
      .enter().append('stop')
      .attr('offset', d => d.offset + '%')
      .attr('stop-color', d => d.color);
    
      // Function to capitalize the first letter of each word
    function capitalizeFirstLetter(string) {
      return string.replace(/\b\w/g, function (char) {
          return char.toUpperCase();
      });
    }

    // Append legend title
    vis.legend.append('text')
      .attr('class', 'legend-title')
      .attr('dy', '.35em')
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('x', vis.config.legendRectWidth / 2)
      .text(capitalizeFirstLetter(vis.selectedVariable.replace(/([A-Z])/g, ' $1').trim())); // Add spaces before capital letters
  }
  

  clicked() {
    // Implement click event handling if needed
  }
}