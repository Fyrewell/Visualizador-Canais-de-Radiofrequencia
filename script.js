

function iniciarMapa() {
	
  var getmap = document.getElementById("map");
  var setcenter = new google.maps.LatLng(-29.697833,-52.437242);
  var mapOptions = {center: setcenter, zoom: 18};
  var map = new google.maps.Map(getmap, mapOptions);
 
  google.maps.event.addListener(map, 'click', function(event) {
    placeMarker(map, event.latLng);
    calcularCfeModeloMarcado();
  });
}

function placeMarker(map, location) {
	console.log(location.lat(),location.lng())
	var colors = ['#FF0000','#FFFF00','#008000'];
	var radii = [50,25,5];
	
	 for (i = 0; i < 3; i++) {
		 
		  var marker = new google.maps.Circle({
			  strokeOpacity: 0,
			  fillColor:colors[i],
			  fillOpacity: 0.35,
			  map: map,
			  center: location,
			  radius:radii[i]
		  });
	 }
 
}

function calcularCfeModeloMarcado () {
  
  var frequencia = document.querySelector('#frequencia').value
  var alturaBS = document.querySelector('#alturaBS').value
  var alturaMS = document.querySelector('#alturaMS').value
  var zona = document.querySelector('input[name=zona]:checked').value
  var raio = document.querySelector('#raio').value
  var PLval = 0;
  switch (document.querySelector('input[name=modelo]:checked').value){
    case 'okumuraHata':
      PLval = okumuraHata(frequencia, alturaBS, alturaMS, zonaInt(zona), raio)
    break
    case 'cost231Hata':
      PLval = cost231Hata()
    break
    case 'SUI':
      PLval = SUI()
    break
  }
  
  document.querySelector('#divForBindPathLoss').innerHTML = PLval.toFixed(8)
  
}

function zonaInt(zonaStr) {
  switch (zonaStr){
    case 'urbana':
      return 1;
    break;
    case 'suburbana':
      return 2;
    break;
    case 'rural':
      return 3;
    break;
  }
  return 1;
}

function okumuraHata(frequency, hb, hm, place, radius){
  // fator para cidades pequenas e medias, para grandes varia formula conforme frequencia...
  var a = function(hm, fc) {
    return (0.8 + ((1.1 * Math.log10(fc) - 0.7) * hm) - (1.56 * Math.log10(fc)))
  }

  var PL = 69.55+26.16*(Math.log10(frequency))-13.82*Math.log10(hb)-a(hm,frequency)+(44.9 - 6.55 * Math.log10(hb))*Math.log10(radius)
  if (place==1) {
    PL = 69.55+26.16*(Math.log10(frequency))-13.82*Math.log10(hb)-a(hm,frequency)+(44.9 - 6.55 * Math.log10(hb))*Math.log10(radius)
  }else if (place==2) {
    PL = PL-2*Math.pow(Math.log10(frequency/28),2)-5.4
  }else if (place==3) {
    PL = PL-4.78*Math.pow(Math.log10(frequency),2)-18.33*Math.log10(frequency)-40.98
  }

  return PL;
}

function cost231Hata(position, frequency, hb, hm, place, radius){
	
	
return;
}

function SUI(y1, y2, y3, y4, y5, y){
	
	
return;
}