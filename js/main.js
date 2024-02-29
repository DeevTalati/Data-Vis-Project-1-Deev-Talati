import { Histogram } from './histogram.js';
import { ScatterPlot } from './scatterPlot.js';

Promise.all([
  d3.json('data/counties-10m.json'),
  d3.csv('data/national_health_data.csv') // Updated CSV file name
]).then(data => {
  const geoData = data[0];
  const nationalHealthData = data[1];

  // Log the data to the console to check if it's loaded correctly
  console.log('Geo Data:', geoData);
  console.log('National Health Data:', nationalHealthData);
  
  // Combine both datasets by adding the new data attributes to the TopoJSON file
  geoData.objects.counties.geometries.forEach(d => {
    for (let i = 0; i < nationalHealthData.length; i++) {
      if (d.id === nationalHealthData[i].cnty_fips) { // Match based on 'cnty_fips'
        // Add the relevant data attributes to the properties of the county
        d.properties = {
          povertyPercentage: +nationalHealthData[i].poverty_perc,
          medianHouseholdIncome: +nationalHealthData[i].median_household_income,
          educationLessThanHighSchoolPercent: +nationalHealthData[i].education_less_than_high_school_percent,
          airQuality: +nationalHealthData[i].air_quality,
          parkAccess: +nationalHealthData[i].park_access,
          percentInactive: +nationalHealthData[i].percent_inactive,
          percentSmoking: +nationalHealthData[i].percent_smoking,
          elderlyPercentage: +nationalHealthData[i].elderly_percentage,
          numberOfHospitals: +nationalHealthData[i].number_of_hospitals,
          numberOfPrimaryCarePhysicians: +nationalHealthData[i].number_of_primary_care_physicians,
          percentNoHealthInsurance: +nationalHealthData[i].percent_no_heath_insurance,
          percentHighBloodPressure: +nationalHealthData[i].percent_high_blood_pressure,
          percentCoronaryHeartDisease: +nationalHealthData[i].percent_coronary_heart_disease,
          percentStroke: +nationalHealthData[i].percent_stroke,
          percentHighCholesterol: +nationalHealthData[i].percent_high_cholesterol,
          name: nationalHealthData[i].display_name
          // Add other health attributes similarly
        };
        if (nationalHealthData[i].urban_rural_status == "Rural"){
          d.properties.urbanRuralStatus = 1;
          d.properties.urbanRuralStatusString = "Rural";
        }

        if (nationalHealthData[i].urban_rural_status == "Small City"){
          d.properties.urbanRuralStatus = 2;
          d.properties.urbanRuralStatusString = "Small City";
        }
        
        if (nationalHealthData[i].urban_rural_status == "Suburban"){
          d.properties.urbanRuralStatus = 3;
          d.properties.urbanRuralStatusString = "Suburban";
        }

        if (nationalHealthData[i].urban_rural_status == "Urban"){
          d.properties.urbanRuralStatus = 4;
          d.properties.urbanRuralStatusString = "Urban";
        }
      }
    }
  });

  console.log('Merged Geo Data:', geoData);
  const choroplethMap = new ChoroplethMap({ 
    parentElement: '#map1',   
  }, geoData);

  const choroplethMap2 = new ChoroplethMap({ 
    parentElement: '#map2',   
  }, geoData);

  // Extract the data values from the geoData object
  // const dataValues = geoData.objects.counties.geometries.map(d => {
  //   return d.properties.povertyPercentage; // Change this to the desired property
  // });

  // console.log('Data passed to Histogram:', dataValues);
  // Update the part where the histogram is initialized
  const histogram = new Histogram({
    parentElement: '#histogram-container',
    containerWidth: 400,
    containerHeight: 250,
    margin: { top: 20, right: 20, bottom: 60, left: 70 }
  }, geoData); // Pass nationalHealthData instead of dataValues

   // Instantiate the scatter plot visualization
   const scatterPlot = new ScatterPlot({
    parentElement: '#scatterplot-container',
    width: 800,
    height: 500,
    margin: { top: 20, right: 20, bottom: 60, left: 100 }
  }, geoData); // Pass geoData as the initial dataset

  // Assume you have a dropdown menu with id "variable-dropdown"
  const dropdown1 = document.getElementById('dropdown1');

  // Add event listener to the dropdown
  dropdown1.addEventListener('change', function(event) {
    // Get the selected variable name from the dropdown
    const selectedVariable1 = event.target.value;
    console.log('Selected variable:', selectedVariable1);
    // Call updateData with the new variable name and associated data
    choroplethMap.updateData(selectedVariable1, geoData);
  });
  // Assume you have a dropdown menu with id "variable-dropdown"
  const dropdown2 = document.getElementById('dropdown2');

  // Add event listener to the dropdown
  dropdown2.addEventListener('change', function(event) {
    // Get the selected variable name from the dropdown
    const selectedVariable2 = event.target.value;
    console.log('Selected variable:', selectedVariable2);
    // Call updateData with the new variable name and associated data
    choroplethMap2.updateData(selectedVariable2, geoData);
  });
  
  const dropdown3 = document.getElementById('dropdown3');

   // Add event listener to the dropdown
   dropdown3.addEventListener('change', function(event) {
    // Get the selected variable name from the dropdown
    const selectedAttribute3 = event.target.value;
    console.log('Selected attribute:', selectedAttribute3);
    // Call updateVis with the selected attribute
    histogram.updateData(selectedAttribute3, geoData);
  });

  // Event listener for x-axis attribute change
  const xAttributeDropdown = document.getElementById('x-attribute-dropdown');
  xAttributeDropdown.addEventListener('change', function(event) {
    const selectedXAttribute = event.target.value;
    scatterPlot.updateData(selectedXAttribute, scatterPlot.yAttribute, geoData);
  });

  // Event listener for y-axis attribute change
  const yAttributeDropdown = document.getElementById('y-attribute-dropdown');
  yAttributeDropdown.addEventListener('change', function(event) {
    const selectedYAttribute = event.target.value;
    scatterPlot.updateData(scatterPlot.xAttribute, selectedYAttribute, geoData);
  });
})
.catch(error => console.error(error));
