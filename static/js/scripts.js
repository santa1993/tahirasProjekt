
var x,y, cat;
var marker_x, marker_y;
var k;
var markers = []; 

 // initialize the map
  var myCenter = new L.LatLng(48.52, 9.057);
  var map = L.map('map', {center: myCenter, zoom: 8});

  // load a tile layer
L.tileLayer( 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
}).addTo( map );


//zeige Koordinaten von Maus Klick
function onMapClick(e) {
    alert("You clicked the map at " + e.latlng);
}

map.on('click', onMapClick);

//Icon für marker1
var my_icon = L.icon({
  iconUrl: 'http://cdn.mysitemyway.com/icons-watermarks/flat-circle-white-on-red/broccolidry/broccolidry_house/broccolidry_house_flat-circle-white-on-red_512x512.png',
  iconSize: [38, 35],
  iconAnchor: [0, 0],
  
});

//Icon for marker2
var my_icon2 = L.icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Map-icon-shop.svg',
  iconSize: [25, 32],
  iconAnchor: [0, 0],
  
});


//Create variable for Leaflet.draw features
var drawnItems = new L.FeatureGroup();

map.addLayer(drawnItems);

//Create Leaflet Draw Control for draw tools and toolbox
var drawControl = new L.Control.Draw({
  draw: {
    polygon: false,
    polyline: false,
    rectangle: false,
    circle: false
  },
  edit: {
    featureGroup: drawnItems,
    edit: false
  }
 

});

map.addControl(drawControl);

//draw marker on map
map.on('draw:created', function (e){
  var type = e.layerType;
  layer = e.layer;
  var marker_y = layer.getLatLng().lat;
  var marker_x = layer.getLatLng().lng;

  var tempMarker = drawnItems.addLayer(layer);
  

//on mousover display popup, in order to add new address
tempMarker.on('mouseover', function (e){

  var popupContent = 

    '<form role="form" id="form" enctype="multipart/form-data" class ="form-horizontal" >'+ 
    '<h1>Beschreibung</h1>' +
    '<label>Adresse <input type="text" name="desc" id="desc"></label>' + '<br/>'  +
    '<button type="button" class="btn btn-warning" id="submit">Add to Database</button>'+
    '</form>';

  
  var popup = L.popup()
    .setLatLng(e.latlng)
    .setContent(popupContent)
    .openOn(map); 

  }); 

  map.addLayer(layer);

  //transform drawed geographic coordinates in UTM 
  var source2 = new Proj4js.Proj('EPSG:4326'); 
  var dest2 = new Proj4js.Proj('EPSG:3857');
  var k = new Proj4js.Point(marker_x, marker_y);
  Proj4js.transform(source2, dest2, k);


//attach a handler to event that match the selector, now or in the future, 
//based on a specific set of root elements
$(document).delegate('#submit', 'click', function(event) {
  event.preventDefault();
  var desc = $('#desc').val();
  
  map.closePopup();


//for drawed Marker, use POST request and send long lat data and argument ("desc")  to server 
$.ajax({
      url: 'http://127.0.0.1:5000/draw?' + 'desc=' + desc,
      type: "POST",
      data: {"x": k.x, "y": k.y},
      success: function(data) {

          console.log("success");

        },   
      error: function(xhr) {
        console.log("leider nicht geklappt")
        }
  
      });

    });

});


//function, in order to remove old markers, if user searchs new address
function removeMarkers(){
  for (i = 0; i <markers.length; i++){
    map.removeLayer(markers[i]);
    }
  }


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// if click on ok button, catch arguments
$("#ok").click(function(event) {

  removeMarkers();

  var text = $('#strasse').val();
  var dist = $('#dist').val();
  var cat = $('#selectid').val();



  var zoom = 16;
  
  //send get request to server, in order to get long lat data from adress
  $.get('http://127.0.0.1:5000/adress?' + 'c=' + text, function(data) {

    mydata2 = JSON.parse(data);

    for (var i = 0; i <mydata2.length; i++){ 

      y = mydata2[i][1];
      x = mydata2[i][0];
      name = mydata2[i][3];
    }
    //transform UTM coordinates to geographic coordinates, cause in Leaflet it is not possible to create markers with UTM coor.
    var source = new Proj4js.Proj('EPSG:3857'); 
    var dest = new Proj4js.Proj('EPSG:4326');

    var p = new Proj4js.Point(x,y);
    Proj4js.transform(source, dest, p);

      //create marker
      marker1 = L.marker([p.y, p.x], {
        icon: my_icon,
        zIndexOffset:100

      }).addTo(map);
      marker1.bindPopup("Name: " + name);
      //set view on marker 
      //map.setView([p.y, p.x], zoom);
      //push markers in list
      markers.push(marker1);
  


  
  //POST request, send distance from search box as argument to server, in order to get all markers which are within the radius
  $.ajax({
      url: 'http://127.0.0.1:5000/long_lat?' + 'distanz=' + dist + '&' + 'selectid=' + cat,
      type: "POST", 
      //send x y coordinates
      data: {"x": x, "y": y},
      success: function(data) {
        //get markers within radius
        mydata3 = JSON.parse(data);

        for (var a = 0; a <mydata3.length; a++){
          var y2 = mydata3[a][1];
          var x2 = mydata3[a][0];
          var name = mydata3[a][2];
          
        //transform UTM coordinates to Geographic
        var p2 = new Proj4js.Point(x2,y2);
        Proj4js.transform(source, dest, p2);
        geog_x = p2.x;
        geog_y= p2.y;
        //display marker on map
        marker2 = L.marker([geog_y, geog_x], {icon: my_icon2});
        map.addLayer(marker2);
        marker2.bindPopup("Adresse: " + name);
        //set view
        //map.setView([geog_y, geog_x], zoom);
        //push displayed to list
        markers.push(marker2);
        }
          console.log("success");
        
        },   
      error: function(xhr) {
        console.log("leider nicht geklappt")
        }
        });
    });
  });


  $(document).on('change','select', function (){

  cat = $(this).find('option:selected').val();
  console.log(cat);
});


/**/













