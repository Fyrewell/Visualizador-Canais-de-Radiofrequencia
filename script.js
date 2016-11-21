

var arrAntenas = []
var arrEstacoesMoveis = []

function iniciarMapa() {
	
  var getmap = document.getElementById("map");
  var setcenter = new google.maps.LatLng(-29.697833,-52.437242);
  var mapOptions = {center: setcenter, zoom: 18};
  var map = new google.maps.Map(getmap, mapOptions);
 
  google.maps.event.addListener(map, 'click', function(event) {
    if (document.querySelector('input[name=optPlace]:checked').value=='mobile'){
      placeEstacaoMovel(map, event.latLng);
    } else {
      placeMarker(map, event.latLng);
    }
    calcularCfeModeloMarcado();
  });
}

function placeMarker(map, location) {
	
	var colors = ['#FF0000','#FF6347','#FF7F50',// Vermelho
	'#CD853F','#D2691E','#F4A460','#FFDEAD', // Amarelo
	'#ADFF2F','#7CFC00','#32CD32','#006400'];//Verde 
	var raio = document.querySelector('#raio').value;
  console.log(raio)
  var mult = raio/11;
  var valores_limiares = "";
	for (i = 0; i < 11; i++) {
		var marker = new google.maps.Circle({
			strokeOpacity: 0,
			fillColor:colors[i],
			fillOpacity: 0.5,
			map: map,
			center: location,
			position: location,
			radius: raio*1000
		});
    raio-=mult;
    if (raio<=0.01) raio=0.1;
    valores_limiares += calcularCfeModeloMarcado(raio) + " ";
		marker.addListener('click', function(event){
			if (document.querySelector('input[name=optPlace]:checked').value=='mobile'){
				placeEstacaoMovel(map, event.latLng);
			} else {
				placeMarker(map, event.latLng);
			}
		});
		arrAntenas.push(marker);

  }
  alert(valores_limiares);
}

function placeEstacaoMovel(map, location) {

  var marker = new google.maps.Marker({
    position: location,
    icon: 'cell-icon.png',
    map: map
  });
  arrEstacoesMoveis.push(marker);

  // Procurar onde se conectar
  var menor = Infinity;
  var antenaPerto = {}
  arrAntenas.forEach(function(el, ind, arr){
    console.log(marker.position.lat(), marker.position.lng(), el.position.lat(), el.position.lng())
    var menor_t = haversineDistance(marker.position.lat(), marker.position.lng(), el.position.lat(), el.position.lng())
    if (menor_t < menor){
      menor = menor_t
      antenaPerto = el
    }
  });

  var line = new google.maps.Polyline({
    path: [
        new google.maps.LatLng(marker.position.lat(), marker.position.lng()), 
        new google.maps.LatLng(antenaPerto.position.lat(), antenaPerto.position.lng())
    ],
    strokeColor: "#000",
    strokeOpacity: 1.0,
    strokeWeight: 8,
    map: map
  });

}

function haversineDistance(latitudeFrom, longitudeFrom, latitudeTo, longitudeTo, earthRadius = 6371000) {

    latFrom = deg2rad(latitudeFrom);
    lonFrom = deg2rad(longitudeFrom);
    latTo = deg2rad(latitudeTo);
    lonTo = deg2rad(longitudeTo);

    latDelta = latTo - latFrom;
    lonDelta = lonTo - lonFrom;

    angle = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(latDelta / 2), 2) +
      Math.cos(latFrom) * Math.cos(latTo) * Math.pow(Math.sin(lonDelta / 2), 2)));
    return angle * earthRadius;
}

function deg2rad(angle) {
  return angle * 0.017453292519943295
}

function calcularCfeModeloMarcado (raio) {
  
  var frequencia = document.querySelector('#frequencia').value
  var alturaBS = document.querySelector('#alturaBS').value
  var alturaMS = document.querySelector('#alturaMS').value
  var zona = document.querySelector('input[name=zona]:checked').value
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
  
  return PLval;
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
  http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.303.4057&rep=rep1&type=pdf
*/
function okumuraHata(frequency, hb, hm, place, radius){
  // fator para cidades pequenas e medias, para grandes varia formula conforme frequencia...
  var a = function(hm, fc) {
    return ((1.1*Math.log10(fc-0.7))*hm-(1.56*Math.log10(fc)-0.8))
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
  http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.303.4057&rep=rep1&type=pdf
*/
function cost231Hata(frequency, hb, hm, place, radius){

  var a = function(hm, fc) {
    return ((1.1*Math.log10(fc-0.7))*hm-(1.56*Math.log10(fc)-0.8))
  }

  var C = function(pv) {
    if (pv==1) return 3;
    return 0;
  }
  L = 46.3+33.9*Math.log10(frequency)-13.82*Math.log10(hb)-a(hm,frequency)+(44.9-6.55*Math.log10(hb))*Math.log10(radius)+C(place)

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