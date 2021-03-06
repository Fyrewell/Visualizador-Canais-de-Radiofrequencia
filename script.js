
function TxtOverlay(pos, txt, cls, map) {

  this.pos = pos;
  this.txt_ = txt;
  this.cls_ = cls;
  this.map_ = map;

  this.div_ = null;

  this.setMap(map);
}



var arrAntenas = []
var arrEstacoesMoveis = []

function iniciarMapa() {
  arrAntenas = []
  arrEstacoesMoveis = []
  var getmap = document.getElementById("map");
  var setcenter = new google.maps.LatLng(-29.697833,-52.437242);
  var mapOptions = {center: setcenter, zoom: 14};
  var map = new google.maps.Map(getmap, mapOptions);
 
  google.maps.event.addListener(map, 'click', function(event) {
    if (document.querySelector('input[name=optPlace]:checked').value=='mobile'){
      placeEstacaoMovel(map, event.latLng);
    } else {
      placeMarker(map, event.latLng);
    }
    
    var frequencia = document.querySelector('#frequencia').value
    var alturaBS = document.querySelector('#alturaBS').value
    var alturaMS = document.querySelector('#alturaMS').value
    var zona = document.querySelector('input[name=zona]:checked').value
    var modelo = document.querySelector('input[name=modelo]:checked').value
    new TxtOverlay(event.latLng,
    "<div>Modelo: "+modelo+"<br/>\
    Frequencia: "+frequencia+"<br/>\
    Altura da BS: "+alturaBS+"<br/>\
    Altura da MS: "+alturaMS+"<br/>\
    Zona: "+zona+"<br/>\
    </div>", 
    "customBox2", map)
    
  });
  


  TxtOverlay.prototype = new google.maps.OverlayView();

  TxtOverlay.prototype.onAdd = function() {
    var div = document.createElement('DIV');
    div.className = this.cls_;
    div.innerHTML = this.txt_;
    this.div_ = div;
    var overlayProjection = this.getProjection();
    var position = overlayProjection.fromLatLngToDivPixel(this.pos);
    div.style.left = position.x + 'px';
    div.style.top = position.y + 'px';
    var panes = this.getPanes();
    panes.floatPane.appendChild(div);
  }
  TxtOverlay.prototype.draw = function() {
    var overlayProjection = this.getProjection();
    var position = overlayProjection.fromLatLngToDivPixel(this.pos);
    var div = this.div_;
    div.style.left = position.x + 'px';
    div.style.top = position.y + 'px';
  }
  TxtOverlay.prototype.onRemove = function() {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
  TxtOverlay.prototype.hide = function() {
    if (this.div_) {
      this.div_.style.visibility = "hidden";
    }
  }
  TxtOverlay.prototype.show = function() {
    if (this.div_) {
      this.div_.style.visibility = "visible";
    }
  }
  TxtOverlay.prototype.toggle = function() {
    if (this.div_) {
      if (this.div_.style.visibility == "hidden") {
        this.show();
      } else {
        this.hide();
      }
    }
  }
  TxtOverlay.prototype.toggleDOM = function() {
    if (this.getMap()) {
      this.setMap(null);
    } else {
      this.setMap(this.map_);
    }
  }

}

function placeMarker(map, location) {
	
	var colors = ['#FF0000','#FF6347','#FF7F50',// Vermelho
	'#CD853F','#D2691E','#F4A460','#FFDEAD', // Amarelo
	'#ADFF2F','#7CFC00','#32CD32','#006400'];//Verde 
	var raio = document.querySelector('#raio').value;
  var mult = raio/11;
	for (i = 0; i < 11; i++) {
		var marker = new google.maps.Circle({
			strokeOpacity: 0,
			fillColor:colors[i],
			fillOpacity: 0.2,
			map: map,
			center: location,
			position: location,
			radius: raio*1000,
      zIndex: i
		});
		marker.addListener('click', function(event){
			if (document.querySelector('input[name=optPlace]:checked').value=='mobile'){
				placeEstacaoMovel(map, event.latLng);
			} else {
				placeMarker(map, event.latLng);
			}
		});
    marker.pathloss = calcularCfeModeloMarcado(raio);
    locationx = getLatLngBordaCirculo(location, raio)
    marker.LatLngBorda = locationx
    arrAntenas.push(marker);
    
    new TxtOverlay(locationx, "<div>"+marker.pathloss.toFixed(2)+"dB</div>", "customBox", map)
    raio-=mult;
  }
}

function getLatLngBordaCirculo(location, raio) {
  lat = location.lat()
  lon = location.lng()
  R=6371000
  dn = raio*710
  de = raio*710
  dLat = dn/R
  dLon = de/(R*Math.cos(Math.PI*lat/180))
  latO = lat + dLat * 180/Math.PI
  lonO = lon + dLon * 180/Math.PI
  return new google.maps.LatLng(latO, lonO)
}

function placeEstacaoMovel(map, location) {

  var marker = new google.maps.Marker({
    position: location,
    icon: 'cell-icon.png',
    map: map
  });
  arrEstacoesMoveis.push(marker);

  // Procurar onde se conectar
  /* POR DISTANCIA
  var menor = Infinity;
  var antenaPerto = {}
  arrAntenas.forEach(function(el, ind, arr){
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
*/
  // POR QUALIDADE DE SINAL
  var menor = Infinity;
  var antenaSinal = {}
  arrAntenas.forEach(function(el, ind, arr){
    var distEstacaoCentroAntena = haversineDistance(marker.position.lat(), marker.position.lng(), el.position.lat(), el.position.lng())
    var distBordaCentroAntena = haversineDistance(el.LatLngBorda.lat(), el.LatLngBorda.lng(), el.position.lat(), el.position.lng())
    if ( distEstacaoCentroAntena < distBordaCentroAntena) { // está contido
      var menor_t = el.pathloss
      if (menor_t < menor){
        menor = menor_t
        antenaSinal = el
      }
    }
  });
  if (antenaSinal!={}) {
    var line = new google.maps.Polyline({
      path: [
          new google.maps.LatLng(marker.position.lat(), marker.position.lng()), 
          new google.maps.LatLng(antenaSinal.position.lat(), antenaSinal.position.lng())
      ],
      strokeColor: "#000",
      strokeOpacity: 1.0,
      strokeWeight: 8,
      map: map
    });
  }
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
  hb : 30–200 m
  hm : 1–10 m
  radius : lkm-10 km
  http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.303.4057&rep=rep1&type=pdf
*/
function okumuraHata(frequency, hb, hm, place, radius){
  // fator para cidades pequenas e medias, para grandes varia formula conforme frequencia...
  var a = function(hm, fc) {
    return (0.8 + (1.1*Math.log10(fc)-0.7)*hm - (1.56*Math.log10(fc)))
  }

  var PL = 69.55+26.16*(Math.log10(frequency))-13.82*Math.log10(hb)-a(hm,frequency)+(44.9 - 6.55 * Math.log10(hb))*Math.log10(radius)
  if (place==2) {
    PL = PL-2*Math.pow(Math.log10(frequency/28),2)-5.4
  }else if (place==3) {
    PL = PL-4.78*Math.pow(Math.log10(frequency),2)+18.33*Math.log10(frequency)-40.98
  }

  return PL;
}

/* range of parameters
  frequency : 1500–2000 MHz
  hb : 3Om to 200m
  hm : lm to lOm
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
function SUI_old_MathLab(frequency, hb, hm, place, radius){
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

/*
https://www.cl.cam.ac.uk/research/dtg/www/files/publications/public/vsa23/VTC05_Empirical.pdf
*/
function SUI(frequency, hb, hm, place, radius){
  var d0 = 100
  //var Xrho = 6
  var Y = function(i,hb) {
    var a = [0, 4.6, 4, 3.6]
    var b = [0, 0.0075, 0.0065, 0.005]
    var c = [0, 12.6, 17.1, 20]
    return a[i]-(b[i]*hb)+(c[i]/hb)
  }
  
  function Xf(frequency) {
    return 6*Math.log10(frequency/2000)
  }
  
  function Xh(i,hm) {
    var opt = [0, -10.8*Math.log10(hm/2000), -10.8*Math.log10(hm/2000), -20*Math.log10(hm/2000)]
    return opt[i]
  }
  
  function s() {
    return Math.floor(Math.random() * (10.6 - 8.2)) + 8.2;
  }
  
  var PL = 20*Math.log10(4*Math.PI*d0*frequency/300) + 10*Y(place,hb)*Math.log10(radius/d0) + Xf(frequency) + Xh(place,hm) + s();

  return PL;
}


function reiniciarMap() {
  iniciarMapa();
}