class ChoroplethMap {

  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 500,
      margin: _config.margin || {top: 10, right: 10, bottom: 10, left: 10},
      tooltipPadding: 10,
      legendBottom: 200,
      legendLeft: 825,
      legendRectHeight: 12, 
      legendRectWidth: 150
    };
    this.data = _data;
    this.selectedVariable = 'poverty_perc'; // Default selected variable

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
        .text('Legend Title');

    // Render the visualization
    vis.renderVis();
  }

  updateVis() {
    let vis = this;
  
    console.log('Updating visualization with selected column:', vis.selectedVariable);
  
    const counties = topojson.feature(vis.data, vis.data.objects.counties);
    console.log('vis data:', vis.data);
    // Filter out undefined values before computing the extent
    const dataValues = counties.features.map(d => d.properties[vis.selectedVariable]).filter(d => !isNaN(d));

    console.log('Data values for selected column:', dataValues);
  
    vis.colorScale.domain(d3.extent(dataValues));
  
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
    const dataValuesExtent = d3.extent(dataValues);
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
              if(d.properties[vis.selectedVariable] == d.properties.urbanRuralStatus){
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
    // Implement legend update if needed
  }

  initLegend() {
    // Implement legend initialization if needed
  }

  clicked() {
    // Implement click event handling if needed
  }
}
