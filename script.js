

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
      PLval = cost231Hata(frequencia, alturaBS, alturaMS, zonaInt(zona), raio)
    break
    case 'SUI':
      PLval = SUI(frequencia, alturaBS, alturaMS, zonaInt(zona), raio)
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

/* range of parameters
  frequency : 150–1500 MHz
  hb : 1–10 m
  hm : 30–200 m
  radius : lkm-10 km
*/
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

/* range of parameters
  frequency : 1500–2000 MHz
  hb : lm to lOm
  hm : 3Om to 200m
  radius : lkm to 20 km
*/
function cost231Hata(frequency, hb, hm, place, radius){

  var a = function(hm, fc) {
    return (0.8 + ((1.1 * Math.log10(fc) - 0.7) * hm) - (1.56 * Math.log10(fc)))
  }
  var C = function(pv) {
    if (pv==1) return 3;
    return 0;
  }
  L = 46.3-33.9*Math.log10(frequency)-13.82*Math.log10(hb)-a(hm,frequency)+(44.9-6.55*Math.log10(hb))*Math.log10(radius)+C(place)

  return L;
}

/* range of parameters
  frequency : <=2000 MHz
  hb : l0m to 80m
  radius : lkm to 10 km
*/
function SUI(frequency, hb, hm, place, radius){
  var d0 = 100
  var Xrho = 6
  var Y = function(i,hb) {
    var a = [0, 4.6, 4, 3.6]
    var b = [0, 0.0075, 0.0065, 0.005]
    var c = [0, 12.6, 17.1, 20]
    return a[i]-(b[i]*hb)+(c[i]/hb)
  }
  var PL = 20*Math.log10(4*Math.PI*d0*frequency/300) + 10*Y(place,hb)*Math.log10(radius/d0) + Xrho;

  return PL;
}