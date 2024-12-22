# Overview
                                                                                       
This project visualizes the relationship between global energy consumption and GDP efficiency using interactive maps and charts. It highlights the impact of renewable energy on economic growth and provides an engaging, data-driven experience for users to explore country-level insights.


## **Features:**	

**Interactive World Map:** Displays energy consumption data by country for selected years.    
**Year Slider:** Allows users to view energy consumption trends over time (1990–2014).  
**Bar chart:** Visualizes rankings of top and bottom countries based on energy consumption.  
**Line and Scatter Plot Tooltips:** Offers detailed insights into GDP per energy unit and energy consumption vs. GDP correlations.  
**Country Selector:** Compare energy and GDP data for multiple countries in a single view.    
**Toggle charts:** Switch between views of highest and lowest energy-consuming countries.    
## Technologies Used
**HTML5:** Structure of the webpage.    
**CSS3:** Styling and layout, including responsive design.  
**JavaScript:** Client-side interactivity.  
**D3.js:** Data-driven visualizations and dynamic interactions.  
**ECharts:** Advanced charting for detailed data insights.  
**TopoJSON:** Efficient encoding of geographic data for the map.  


## **Prerequisites**  
Modern web browser (e.g., Chrome, Firefox, Edge)  
A text editor or IDE (e.g., VS Code) for editing.  
Local web server (optional for advanced use)
## Setup Instructions
Follow these steps to set up and run the project on your local machine:  

**Step 1: Clone or Download the Project**  
  * clone the repository using git  
  ``` git clone https://github.com/your-username/energy-gdp-analysis.git ```
Or download the project as a ZIP file and extract it to your desired folder.

**Step 2:** After cloning or extracting,Open the Project

**Option 1:** Run the Project Locally Without a Server  
* Navigate to the folder where you saved the project.
* Open index.html in your browser (just double-click the file).

**Option 2:** Run the Project Using a Local Web Server (Recommended)  
Some features, like fetching data from external files, may require a local server. To set this up:  
* Install Node.js if you don’t already have it. [Download Node.js](https://nodejs.org/en)
* Install a simple web server:
`npm install -g http-server`
* Serve the project folder:
`http-server .`
* Open the link provided by http-server (usually http://127.0.0.1:8080) in your browser

## How to Use the Project
**1. Select a Year:**  
  * Use the slider at the top of the page to select a year (1990–2014). The map and charts will update dynamically.

**2. Explore Data**
* Hover over countries on the map to see energy consumption and GDP data for the selected year.
* View detailed insights in the line and scatter plot tooltips.

**3. Toggle Views:**
* Click the "Toggle Chart" button to switch between the top 10 and bottom 10 energy-consuming countries.
* Use the "Toggle Data" button to alternate between GDP and energy consumption visualizations.

**4. Compare Countries:**
* Use the country selector on the right side to choose specific countries for comparison.

**5. Zoom and Pan:**  
* Drag the map to explore different regions. The zoom is disabled to maintain consistent scale.



