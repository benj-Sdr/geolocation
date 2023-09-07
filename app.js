const express = require('express')
const app = express()

const fetch  = require('node-fetch')


const visitors = {}

const info = {}

//Function key identifier
function keyIdentifier(city, i = 0, result = []) {
  const allkeys = Object.keys(info)
 
  if(i >= allkeys.length) return result
    
  if(info[allkeys[i]]['city'] === city) {
      result.push(allkeys[i])
  }
  
  return keyIdentifier(city, i + 1, result)
}

app.use(async (req, res, next) => {
  try {
    const forwardedFor = req.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : req.socket.remoteAddress;
    const visitorIpAddress = ip.replace('::ffff:', '');
    let visitorsData = visitors[visitorIpAddress];

    if (!visitorsData) {
      const response = await fetch(`https://js5.c0d3.com/location/api/ip/${visitorIpAddress}`);
      visitorsData = await response.json();
      visitors[visitorIpAddress] = visitorsData;
      info[visitorIpAddress] = {
        'cityInfo': visitorsData.cityStr,
        'count': visitorsData.count,
        'city': visitorsData.city,
        'country': visitorsData.country,
        'll': [visitorsData.ll]
      };
    }
    next();
  } catch (error) {
    next(error); // Pass the error to Express to handle it
  }
});


app.get('/visitors', async(req, res) => {
  const currentCity = Object.values(visitors)[0]
  const infoArray = Object.values(info)
  const displayVisitors = infoArray.reduce((acc, val) => {
    
    return acc + `
      <a href='/city/:${val.city}' class='visitors'><h2>${val.city}-${val.country}-${val.count}</h2></a> 
    `
  } ,'')
  console.log(displayVisitors)
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossorigin=""/>
          <!-- Make sure you put this AFTER Leaflet's CSS -->
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossorigin=""></script>
        <title>Document</title>
        <style>
          #map {
            height: 400px;
          }
          a {
            text-decoration: none;
          }
        </style>
    </head>
    <body>
      <h1>You are visting from ${currentCity.cityStr}</h1>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${currentCity.ll[0]}, ${currentCity.ll[1]}], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);
        var marker = L.marker([${currentCity.ll[0]}, ${currentCity.ll[1]}]).addTo(map);
      </script>
        <div>
          <h1>The cities our visitors come from</h1>
          ${displayVisitors}
        </div>
    </body>
    </html>
  `)
 
})

//API Data
app.get('/api/visitors', (req, res) => {
  res.json(info)
})
//
// Add this code after the existing routes

app.get('/city/:cityName', (req, res) => {
  const cityName = req.params.cityName.replace(':', '')
  console.log(keyIdentifier(cityName))
  const cityInfo = info[keyIdentifier(cityName)]
  console.log(cityInfo)
  if (!cityInfo) {
   
    return res.status(404).send('City not found')
  }
  const infoArray = Object.values(info)
  const displayVisitors = infoArray.reduce((acc, val) => {
    
    return acc + `
      <a href='/city/:${val.city}' class='visitors'><h2>${val.city}-${val.country}-${val.count}</h2></a> 
    `
  } ,'')
  console.log(displayVisitors)

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossorigin=""/>
          <!-- Make sure you put this AFTER Leaflet's CSS -->
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossorigin=""></script>
        <title>Document</title>
        <style>
          #map {
            height: 400px;
          }
          a {
            text-decoration: none;
          }
        </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Initialize and display the map centered at the city's coordinates
        var map = L.map('map').setView([${cityInfo.ll[0]}, ${cityInfo.ll[1]}], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);
        var marker = L.marker([${cityInfo.ll[0]}, ${cityInfo.ll[1]}]).addTo(map);
      </script>
        <div>
          <h1>The cities our visitors come from</h1>
          ${displayVisitors}
        </div>
    </body>
    </html>
  `);
});


app.listen(3000, () => {
    console.log('The server is running at PORT 3000')
})
