/* schulsanierung.tursics.de - JavaScript file */

/*jslint browser: true*/
/*global $,L*/

var map = null;
var layerPopup = null;
var layerGroup = null;
var schools = null;
//var budget = null;
var data2017 = null;

// -----------------------------------------------------------------------------

String.prototype.startsWith = String.prototype.startsWith || function (prefix) {
	'use strict';

	return this.indexOf(prefix) === 0;
};

// -----------------------------------------------------------------------------

function mapAction() {
	'use strict';
}

// -----------------------------------------------------------------------------

function fixEuro(item) {
	'use strict';

	if (item === '') {
		return 0;
	} else if (item === null) {
		return 0;
	} else if ('undefined' === typeof item) {
		return 0;
	} else if ('number' === typeof item) {
		return item;
	} else if ('T€' === item.substring(item.length - 2)) {
		return parseInt(item.substring(0, item.length - 2).replace('.', '').replace(',', '.'), 10) * 1000;
	} else if ('€' === item.substring(item.length - 1)) {
		return parseInt(item.substring(0, item.length - 1).replace('.', '').replace('.', '').replace(',', '.'), 10);
	}
	return item;
}

// -----------------------------------------------------------------------------

function fixData(val) {
	'use strict';

	function fixComma(item) {
		if (item === '') {
			return 0;
		} else if (item === null) {
			return 0;
		}
		return parseFloat(String(item).replace('.', '').replace(',', '.'));
	}

	val.GebaeudeGesamt = fixEuro(val.GebaeudeGesamt);

	return val;
}

// -----------------------------------------------------------------------------

function formatNumber(txt) {
	'use strict';

	txt = String(parseInt(txt, 10));
	var sign = '',
		pos = 0;
	if (txt[0] === '-') {
		sign = '-';
		txt = txt.slice(1);
	}

	pos = txt.length;
	while (pos > 3) {
		pos -= 3;
		txt = txt.slice(0, pos) + '.' + txt.slice(pos);
	}

	return sign + txt;
}

// -----------------------------------------------------------------------------

function enrichMissingData(data) {
	'use strict';

	try {
		$.each(data, function (key, value) {
//			if ((value.lat === '') || (value.lng === '')) {
//				console.log('missing geocoordinate in ' + value.Gebaeudenummer);
//			}
//			if ((value.Ignorieren === 'WAHR') && (value.BemerkungSenBJW === '') && (value.GebaeudeGesamt === '0,00 €')) {
//				console.log(value.Schulname + ': ' + value.BemerkungSenBJW + value.GebaeudeGesamt);
//			}
		});
	} catch (e) {
//		console.log(e);
	}

	return data;
}

// -----------------------------------------------------------------------------

function createStatistics(data) {
	'use strict';

	var obj = {
		BezNr: 10,
		Schulname: 'Marzahn-Hellersdorf',
		Schulnummer: 'gesamt',
		StNr: '10',
		Gebaeudenummer: '10',
		MassnahmeNr: '10',
		Leistungsart: '',
		Standardleistung: '',
		Prio: 1,
		Menge: '1',
		Einheit: '',
		Mengenfaktor: '1',
		Preisfaktor: '1',
		Finanzierung: '',
		Ignorieren: 'FALSCH',
		BemerkungSenBJW: '',
		UnterpriorisierungDurchFMBauBAMarzHell: '',
		lat: 52.536686,
		lng: 13.604863
	},
		sum = [
			'GebaeudeGesamt'
		],
		id,
		len = 0;

	for (id in sum) {
		obj[sum[id]] = 0;
	}

	try {
		$.each(data, function (key, val) {
			val = fixData(val);
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
				var id,
					cond;
				for (id in val) {
					if (-1 < $.inArray(id, sum)) {
						obj[id] += parseInt(val[id], 10);
					}
				}
			}
		});

		len = data.length;

		data.push(obj);
	} catch (e) {
//		console.log(e);
	}
}

// -----------------------------------------------------------------------------

function updateMapSelectItem(data) {
	'use strict';

	function setText(key, txt) {
		var item = $('#rec' + key);

		if (item.parent().hasClass('number')) {
			txt = formatNumber(txt);
		} else if (item.parent().hasClass('boolean')) {
			txt = (txt === 1 ? 'ja' : 'nein');
		}

		item.text(txt);
	}

	mapAction();

	var key,
		date = new Date(),
		dateD = date.getDate(),
		dateM = date.getMonth() + 1,
		dateY = date.getFullYear(),
		dateH = date.getHours(),
		dateMin = date.getMinutes(),
		dateSec = date.getSeconds(),
		id,
		building,
		buildingSummary = [],
		bs,
		districtSummary = [],
		ds,
		str,
		strDiff,
		item,
		menge,
		kosten,
		sum = 0,
		sum2 = 0,
		isDistrict = (data.Gebaeudenummer === '10');

	for (key in data) {
		setText(key, data[key]);
	}

	id = 0;
	for (building in schools) {
		item = schools[building];
		if (((item.Schulnummer === data.Schulnummer) || isDistrict) && (item.Gebaeudenummer !== '10')) {
			if ((item.Ignorieren === 'WAHR') && (item.BemerkungSenBJW === '') && (item.GebaeudeGesamt === 0)) {
				continue;
			}
			for (bs = 0; bs < buildingSummary.length; ++bs) {
				if (buildingSummary[bs].Gebaeudenummer === item.Gebaeudenummer) {
					buildingSummary[bs].title = 'Gebäude';
					buildingSummary[bs].sum += item.GebaeudeGesamt;

					break;
				}
			}
			if (bs === buildingSummary.length) {
				key = item.Leistungsart.toLowerCase();
				buildingSummary.push({
					Gebaeudenummer: item.Gebaeudenummer,
					title: (-1 !== key.indexOf('schulhof') ? 'Schulhof' :
							(-1 !== key.indexOf('sportplatz') ? 'Sportplatz' :
									(-1 !== key.indexOf('sporthalle') ? 'Sporthalle' : 'Gebäude'))),
					sum: item.GebaeudeGesamt
				});
			}
		}

		if (isDistrict) {
			if (item.Gebaeudenummer !== '10') {
				str = item.Standardleistung;
				menge = parseInt(item.Menge, 10);
				if (0 === item.Standardleistung.indexOf('Fenster (')) {
					str = 'Fenster';
				} else if (0 === item.Standardleistung.indexOf('Fassade (')) {
					str = 'Fassaden';
				} else if (('Flachdach' === item.Standardleistung) || ('Steildach' === item.Standardleistung)) {
					str = 'Dächer';
				} else if ('Aufzugsanlage einbauen' === item.Standardleistung) {
					str = 'Aufzugsanlagen';
				} else if ('Rampe errichten' === item.Standardleistung) {
					str = 'Rampen';
				} else if (0 === item.Standardleistung.indexOf('Zweiter Rettungsweg errichten')) {
					str = 'Zweite Rettungswege';
				} else if ('Tür behindertengerecht umbauen (20/Gebäude)' === item.Standardleistung) {
					str = 'Barrierefreie Türen';
				} else if ('WC behindertengerecht umbauen (4/Gebäude)' === item.Standardleistung) {
					str = 'Barrierefreie Toiletten';
				} else if ('Eingangsbereiche umbauen' === item.Standardleistung) {
					str = 'Barrierefreie Eingänge';
				} else if ('Sanitärbereich' === item.Standardleistung) {
					str = 'Sanitärbereiche';
				} else if (('Grundschulraum' === item.Standardleistung) || ('Oberschulraum' === item.Standardleistung)) {
					str = 'Räume';
				} else if (0 === item.Standardleistung.indexOf('Schulhof ')) {
					str = 'Schulhöfe';
				} else if (0 === item.Standardleistung.indexOf('Sportplatz ')) {
					str = 'Sportplätze';
				} else if (0 === item.Standardleistung.indexOf('Sporthalle ')) {
					str = 'Sporthallen';
				}

				for (ds = 0; ds < districtSummary.length; ++ds) {
					if (districtSummary[ds].Standardleistung === str) {
						districtSummary[ds].Menge += menge;
						districtSummary[ds].GebaeudeGesamt += item.GebaeudeGesamt;

						break;
					}
				}
				if (ds === districtSummary.length) {
					key = item.Leistungsart.toLowerCase();
					districtSummary.push({
						Standardleistung: str,
						Menge: menge,
						Einheit: item.Einheit,
						GebaeudeGesamt: item.GebaeudeGesamt
					});
				}
			}
		} else if (item.Gebaeudenummer === data.Gebaeudenummer) {
			if ((item.Ignorieren === 'WAHR') && (item.BemerkungSenBJW === '') && (item.GebaeudeGesamt === 0)) {
				continue;
			}
			str = '';

			menge = item.Menge;
			if ('1' !== item.Mengenfaktor) {
				menge = (parseInt(parseFloat(item.Mengenfaktor.replace('.', '').replace(',', '.')) * 100, 10) / 100) + ' x ' + menge;
			}

			str += '<div><span class="half">' + item.Standardleistung + '</span><span class="number">' + formatNumber(item.GebaeudeGesamt) + ' EUR</span></div>';
			if ('1' === item.Preisfaktor) {
				str += '<div class="sub"><span class="full">' + menge + ' ' + item.Einheit + '</span></div>';
			} else {
				str += '<div class="sub"><span class="full">' + menge + ' ' + item.Einheit + ', Preisfaktor ' + (parseInt(parseFloat(item.Preisfaktor.replace('.', '').replace(',', '.')) * 100, 10) / 100) + '</span></div>';
			}
			if (('' === item.UnterpriorisierungDurchFMBauBAMarzHell) || ('_' === item.UnterpriorisierungDurchFMBauBAMarzHell)) {
				str += '<div class="sub"><span class="full">Priorität: ' + item.Prio + ' von 4</span></div>';
			} else {
				str += '<div class="sub"><span class="full">Priorität: ' + item.Prio + ' von 4 (Unterpriorität ' + item.UnterpriorisierungDurchFMBauBAMarzHell + ')</span></div>';
			}
//			item.Leistungsart
//			item.MassnahmeNr
//			if (item.Finanzierung !== '') {
//				str += '<div class="sub"><span class="full">' + item.Finanzierung + '</span></div>';
//			}
			if ((item.Ignorieren !== 'FALSCH') && (item.GebaeudeGesamt > 0)) {
				str += '<div class="sub"><span class="half">Ignorieren</span><span class="string">Ja</span></div>';
			}
			if (item.BemerkungSenBJW !== '') {
				str += '<div class="sub"><span class="full" style="white-space:normal;color:#f69730;">„' + item.BemerkungSenBJW + '“</span></div>';
			}
			$('#item' + id).html(str).show();
			++id;
			sum += item.GebaeudeGesamt;
		}
	}
	districtSummary.sort(function (a, b) {
		if (a.GebaeudeGesamt === b.GebaeudeGesamt) {
			return a.Standardleistung > b.Standardleistung ? 1 : -1;
		}

		return a.GebaeudeGesamt < b.GebaeudeGesamt ? 1 : -1;
	});
	for (ds = 0; ds < districtSummary.length; ++ds) {
		item = districtSummary[ds];
		str = '';
		str += '<div><span class="half">' + item.Standardleistung + '</span><span class="number">' + formatNumber(item.GebaeudeGesamt) + ' EUR</span></div>';
		str += '<div class="sub"><span class="full">' + formatNumber(item.Menge) + ' ' + item.Einheit + '</span></div>';

		$('#item' + id).html(str).show();
		++id;
		sum += item.GebaeudeGesamt;
	}
	for (id; id < 20; ++id) {
		$('#item' + id).hide();
	}

	setText('GebaeudeGesamt', sum);

	if (dateD < 10) {
		dateD = '0' + dateD;
	}
	if (dateM < 10) {
		dateM = '0' + dateM;
	}
	if (dateH < 10) {
		dateH = '0' + dateH;
	}
	if (dateMin < 10) {
		dateMin = '0' + dateMin;
	}
	setText('Now_', dateD + '.' + dateM + '.' + dateY + ' ' + dateH + ':' + dateMin);

	strDiff = '';
	sum = 0;
	for (bs = 0; bs < buildingSummary.length; ++bs) {
		if (isDistrict) {
			buildingSummary[bs].sum = buildingSummary[bs].sum;
		} else {
			buildingSummary[bs].sum = Math.round(buildingSummary[bs].sum / 10000) * 10000;
		}

		item = buildingSummary[bs];
		if (item.title === 'Gebäude') {
			sum += item.sum;
			if (!isDistrict) {
				strDiff += '<div class="sub"><span class="half">' + item.title + '</span><span class="number">' + formatNumber(item.sum) + ' EUR</span></div>';
			}
		}
	}
	if (isDistrict) {
		sum = Math.round(sum / 10000) * 10000;
		strDiff += '<div class="sub"><span class="half">Gebäude</span><span class="number">' + formatNumber(sum) + ' EUR</span></div>';
		sum2 += sum;
		sum = 0;
	}
	for (bs = 0; bs < buildingSummary.length; ++bs) {
		item = buildingSummary[bs];
		if (item.title === 'Sporthalle') {
			sum += item.sum;
			if (!isDistrict) {
				strDiff += '<div class="sub"><span class="half">' + item.title + '</span><span class="number">' + formatNumber(item.sum) + ' EUR</span></div>';
			}
		}
	}
	if (isDistrict) {
		sum = Math.round(sum / 10000) * 10000;
		strDiff += '<div class="sub"><span class="half">Sporthallen</span><span class="number">' + formatNumber(sum) + ' EUR</span></div>';
		sum2 += sum;
		sum = 0;
	}
	for (bs = 0; bs < buildingSummary.length; ++bs) {
		item = buildingSummary[bs];
		if (item.title === 'Schulhof') {
			sum += item.sum;
			if (!isDistrict) {
				strDiff += '<div class="sub" style="color:#f69730;"><span class="half">' + item.title + '</span><span class="number">' + formatNumber(item.sum) + ' EUR</span></div>';
			}
		}
	}
	if (isDistrict) {
		sum = Math.round(sum / 10000) * 10000;
		strDiff += '<div class="sub" style="color:#f69730;"><span class="half">Schulhöfe</span><span class="number">' + formatNumber(sum) + ' EUR</span></div>';
		sum2 += sum;
		sum = 0;
	}
	for (bs = 0; bs < buildingSummary.length; ++bs) {
		item = buildingSummary[bs];
		if ((item.title !== 'Gebäude') && (item.title !== 'Sporthalle') && (item.title !== 'Schulhof')) {
			sum += item.sum;
			if (!isDistrict) {
				strDiff += '<div class="sub" style="color:#f69730;"><span class="half">' + item.title + '</span><span class="number">' + formatNumber(item.sum) + ' EUR</span></div>';
			}
		}
	}
	if (isDistrict) {
		sum = Math.round(sum / 10000) * 10000;
		strDiff += '<div class="sub" style="color:#f69730;"><span class="half">Sportplätze</span><span class="number">' + formatNumber(sum) + ' EUR</span></div>';
		sum2 += sum;
		sum = sum2;
	}
	strDiff = '<div><span class="half">' + (isDistrict ? 'Schulen' : 'Schule') + ' (insgesamt)</span><span class="number">' + formatNumber(sum) + ' EUR</span></div>' + strDiff;
	$('#schoolSum').html(strDiff);

	strDiff = '';
	for (bs = 0; bs < buildingSummary.length; ++bs) {
		if (buildingSummary[bs].Gebaeudenummer === data.Gebaeudenummer) {
			if ('Gebäude' === buildingSummary[bs].title) {
				strDiff = 'Kosten für dieses ' + buildingSummary[bs].title;
			} else if (('Schulhof' === buildingSummary[bs].title) || ('Sportplatz' === buildingSummary[bs].title)) {
				strDiff = 'Kosten für diesen ' + buildingSummary[bs].title;
			} else {
				strDiff = 'Kosten für diese ' + buildingSummary[bs].title;
			}
		}
	}
	if (isDistrict) {
		strDiff = 'Kosten für diesen Bezirk';
	}
	$('#buildingPart').html(strDiff);

	strDiff = '';
	sum2 = 0;
	$('#schoolSenat').html(strDiff);
	for (id in data2017) {
		item = data2017[id];
		if ((item.Schulnummer === data.Schulnummer) || (isDistrict && (item.Schulnummer.indexOf(data.Gebaeudenummer) === 0))) {
			kosten = parseFloat(String(item.Kosten).replace('.', '').replace('.', '').replace(',', '.'));
			if (isNaN(kosten)) {
				kosten = 0;
			}
			sum2 += kosten;
			if (!isDistrict) {
				strDiff += '<div><span class="half">Schule (laut Senat)</span><span class="number">' + formatNumber(kosten) + ' EUR</span></div>';
				strDiff += '<div class="sub" style="color:#f69730;"><span class="full" style="white-space:normal;">Die Kosten für Schulhöfe und Sportplätze wurden heraus gerechnet.</span></div>';
				$('#schoolSenat').html(strDiff);
				strDiff = '';
				strDiff += '<div><span class="half"></span><span class="number">---------------</span></div>';
				strDiff += '<div><span class="half"></span><span class="number">' + (kosten > sum ? '+' : '') + formatNumber(kosten - sum) + ' EUR</span></div>';

				setText('Schulart', item.Schulart);
				setText('Strasse', item.Strasse);
				setText('PLZ', item.PLZ);
			}
		}
	}
	if (isDistrict) {
		strDiff += '<div><span class="half">Schulen (laut Senat)</span><span class="number">' + formatNumber(sum2) + ' EUR</span></div>';
		strDiff += '<div class="sub" style="color:#f69730;"><span class="full" style="white-space:normal;">Die Kosten für Schulhöfe und Sportplätze wurden heraus gerechnet.</span></div>';
		$('#schoolSenat').html(strDiff);
		strDiff = '';
		strDiff += '<div><span class="half"></span><span class="number">---------------</span></div>';
		strDiff += '<div><span class="half"></span><span class="number">' + (sum2 > sum ? '+' : '') + formatNumber(sum2 - sum) + ' EUR</span></div>';

		setText('Schulart', 'Bezirk');
		setText('Strasse', '');
		setText('PLZ', '');
	}
	$('#rec2017_').html(strDiff);

	$('#receiptBox').css('display', 'block');
	$('#receiptBox .finished').css('display', [1160202, 1110701].indexOf(data.Gebaeudenummer) !== -1 ? 'block' : 'none');
}

// -----------------------------------------------------------------------------

function updateMapHoverItem(coordinates, data, icon) {
	'use strict';

	var options = {
		closeButton: false,
		offset: L.point(0, -32),
		className: 'printerLabel'
	},
		str = '',
		sum = 0,
		prio = 4,
		item,
		building;

	for (building in schools) {
		item = fixData(schools[building]);
		if (item.Gebaeudenummer === data.Gebaeudenummer) {
			sum += item.GebaeudeGesamt;
			prio = Math.min(prio, item.Prio);
		}
	}

	str += '<div class="top ' + icon.options.markerColor + '">' + data.Schulname + '</div>';
	str += '<div class="middle">€' + formatNumber(sum) + '</div>';
	str += '<div class="bottom ' + icon.options.markerColor + '">Priorität ' + prio + '</div>';

	layerPopup = L.popup(options)
		.setLatLng(coordinates)
		.setContent(str)
		.openOn(map);
}

// -----------------------------------------------------------------------------

function updateMapVoidItem(data) {
	'use strict';

	if (layerPopup && map) {
		map.closePopup(layerPopup);
		layerPopup = null;
    }
}

// -----------------------------------------------------------------------------

function createMarker(data) {
	'use strict';

	try {
		var markerBlue = L.AwesomeMarkers.icon({
			icon: 'fa-building-o',
			prefix: 'fa',
			markerColor: 'blue'
		}),
			markerOrange = L.AwesomeMarkers.icon({
				icon: 'fa-building-o',
				prefix: 'fa',
				markerColor: 'orange'
			}),
			markerGreen = L.AwesomeMarkers.icon({
				icon: 'fa-building-o',
				prefix: 'fa',
				markerColor: 'green'
			}),
			markerRed = L.AwesomeMarkers.icon({
				icon: 'fa-building-o',
				prefix: 'fa',
				markerColor: 'red'
			}),
			building,
			buildings = [],
			item,
			prio;

		layerGroup = L.featureGroup([]);
		layerGroup.addTo(map);

		layerGroup.addEventListener('click', function (evt) {
			updateMapSelectItem(evt.layer.options.data);
		});
		layerGroup.addEventListener('mouseover', function (evt) {
			updateMapHoverItem([evt.latlng.lat, evt.latlng.lng], evt.layer.options.data, evt.layer.options.icon);
		});
		layerGroup.addEventListener('mouseout', function (evt) {
			updateMapVoidItem(evt.layer.options.data);
		});

		$.each(data, function (key, val) {
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined') && (val.lat !== '') && (val.lng !== '')) {
				if (-1 === buildings.indexOf(val.Gebaeudenummer)) {
					if ((val.Ignorieren === 'WAHR') && (val.BemerkungSenBJW === '') && (val.GebaeudeGesamt === 0)) {
						return;
					}
					buildings.push(val.Gebaeudenummer);

					prio = 4;
					for (building in schools) {
						item = fixData(schools[building]);
						if (item.Gebaeudenummer === val.Gebaeudenummer) {
							prio = Math.min(prio, val.Prio);
						}
					}

					var isDistrict = (val.StNr === '10'),
						marker = L.marker([parseFloat(val.lat), parseFloat(val.lng)], {
							data: fixData(val),
							icon: prio === 1 ? markerRed :
									prio === 2 ? markerOrange :
											prio === 3 ? markerBlue :
													markerGreen,
							opacity: isDistrict ? 0 : 1,
							clickable: isDistrict ? 0 : 1
						});
					layerGroup.addLayer(marker);
				}
			}
		});
	} catch (e) {
//		console.log(e);
	}
}

// -----------------------------------------------------------------------------

function selectSuggestion(selection) {
	'use strict';

	$.each(layerGroup._layers, function (key, val) {
		if (val.options.data.Gebaeudenummer === selection) {
			map.panTo(new L.LatLng(val.options.data.lat, val.options.data.lng));
			updateMapSelectItem(val.options.data);
		}
	});
}

//-----------------------------------------------------------------------------

function initSearchBox(data) {
	'use strict';

	var schools = [],
		buildings = [];

	try {
		$.each(data, function (key, val) {
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
				if (-1 === buildings.indexOf(val.Gebaeudenummer)) {
					if ((val.Ignorieren === 'WAHR') && (val.BemerkungSenBJW === '') && (val.GebaeudeGesamt === 0)) {
						return;
					}
					buildings.push(val.Gebaeudenummer);

					var name = val.Schulname,
						color = '',
						desc = '';
					if ('' !== val.Gebaeudenummer) {
						desc = val.Gebaeudenummer;
					}
					color = 'gray';
					schools.push({ value: name, data: val.Gebaeudenummer, color: color, desc: desc });
				}
			}
		});
	} catch (e) {
//		console.log(e);
	}

	schools.sort(function (a, b) {
		if (a.value === b.value) {
			return a.data > b.data ? 1 : -1;
		}

		return a.value > b.value ? 1 : -1;
	});

	$('#autocomplete').focus(function () {
		mapAction();

		window.scrollTo(0, 0);
		document.body.scrollTop = 0;
		$('#pageMap').animate({
			scrollTop: parseInt(0, 10)
		}, 500);
	});
	$('#autocomplete').autocomplete({
		lookup: schools,
		onSelect: function (suggestion) {
			selectSuggestion(suggestion.data);
		},
		formatResult: function (suggestion, currentValue) {
			var color = suggestion.color,
				icon  = 'fa-building-o',
				str = '';

			str += '<div class="autocomplete-icon back' + color + '"><i class="fa ' + icon + '" aria-hidden="true"></i></div>';
			str += '<div>' + suggestion.value.replace(new RegExp(currentValue.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'gi'), '<strong>' + currentValue + '</strong>') + '</div>';
			str += '<div class="' + color + '">' + suggestion.desc + '</div>';
			return str;
		},
		showNoSuggestionNotice: true,
		noSuggestionNotice: '<i class="fa fa-info-circle" aria-hidden="true"></i> Geben sie den Namen einer Schule ein'
	});
}

// -----------------------------------------------------------------------------

function printerLabelClick() {
	if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && (location.hostname === this.hostname)) {
		var hash = this.hash,
			schoolId = hash.lastIndexOf('='),
			target;

		if (-1 === schoolId) {
			schoolId = '';
		} else {
			hash = this.hash.substr(0, schoolId);
			schoolId = this.hash.substr(schoolId + 1);
		}

		target = $(hash);
		target = target.length ? target : $('[name=' + hash.slice(1) + ']');
		if (target.length) {
			$('#pageMap').animate({
				scrollTop: parseInt(target.offset().top, 10)
			}, 500, function () {
				selectSuggestion(parseInt(schoolId, 10));
			});
			return false;
		}
	}
}

// -----------------------------------------------------------------------------

function initSocialMedia() {
	'use strict';

	setTimeout(function () {
		$.ajax('http://www.tursics.de/v5shariff.php?url=http://schulsanierung.tursics.de/')
			.done(function (json) {
				$('.social .facebook span').html(json.facebook);
				if (json.facebook > 0) {
					$('.social .facebook span').addClass('active');
				}

				$('.social .twitter span').html(json.twitter);
				if (json.twitter > 0) {
					$('.social .twitter span').addClass('active');
				}
			});
	}, 1000);
}

// -----------------------------------------------------------------------------

var ControlInfo = L.Control.extend({
	options: {
		position: 'bottomright'
	},

	onAdd: function (map) {
		'use strict';

		var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

		container.innerHTML = '<a style="font-size:1.2em" href="#popupShare" title="Teilen" data-rel="popup" data-position-to="window" data-transition="pop"><i class="fa fa-share-alt" aria-hidden="true"></i></a>';
		container.innerHTML += '<a style="font-size:1.2em" href="#popupInfo" title="Info" data-rel="popup" data-position-to="window" data-transition="pop"><i class="fa fa-info" aria-hidden="true"></i></a>';

		return container;
	}
});

// -----------------------------------------------------------------------------

function initMap(elementName, lat, lng, zoom) {
	'use strict';

	if (null === map) {
		var mapboxToken = 'pk.eyJ1IjoidHVyc2ljcyIsImEiOiI1UWlEY3RNIn0.U9sg8F_23xWXLn4QdfZeqg',
			mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v4/tursics.l7ad5ee8/{z}/{x}/{y}.png?access_token=' + mapboxToken, {
				attribution: '<a href="http://www.openstreetmap.org" target="_blank">OpenStreetMap-Mitwirkende</a>, <a href="https://www.mapbox.com" target="_blank">Mapbox</a>'
			}),
			dataUrl = 'data/gebaeudescan2017-mahe.json';

		map = L.map(elementName, {zoomControl: false, scrollWheelZoom: true})
			.addLayer(mapboxTiles)
			.setView([lat, lng], zoom);

		map.addControl(L.control.zoom({ position: 'bottomright'}));
		map.addControl(new ControlInfo());
		map.once('focus', mapAction);

		$.getJSON(dataUrl, function (data) {
			schools = enrichMissingData(data);
			createStatistics(schools);
//			createMarker(schools);
			initSearchBox(schools);
			initSocialMedia();

//			var budgetUrl = 'data/gebaeudesanierungen.json';
//			$.getJSON(budgetUrl, function (budgetData) {
//				budget = budgetData;
//			});

			var data2017Url = 'data/gebaeudescan2017-03.json';
			$.getJSON(data2017Url, function (data2017Data) {
				data2017 = data2017Data;
				createMarker(schools);
			});
		});
	}
}

// -----------------------------------------------------------------------------

$(document).on("pagecreate", "#pageMap", function () {
	'use strict';

	// center the city hall
//	initMap( 'mapContainer', 52.515807, 13.479470, 16);
});

// -----------------------------------------------------------------------------

$(document).on("pageshow", "#pageMap", function () {
	'use strict';

	function updateEmbedURI() {
		var size = $('#selectEmbedSize').val().split('x'),
			x = size[0],
			y = size[1],
			html = '<iframe src="http://schulsanierung.tursics.de/karte-mahe-2017.html" width="' + x + '" height="' + y + '" frameborder="0" style="border:0" allowfullscreen></iframe>';

		$('#inputEmbedURI').val(html);
		if (-1 === $('#embedMap iframe')[0].outerHTML.indexOf('width="' + x + '"')) {
			$('#embedMap iframe')[0].outerHTML = html;
			$('#embedMap input').focus().select();
		}
	}

	// center the city hall
	initMap('mapContainer', 52.536686, 13.604863, 16);

	$('#autocomplete').val('');
	$('#receipt .group').on('click', function (e) {
		$(this).toggleClass('groupClosed');
	});
	$('#receiptClose').on('click', function (e) {
		$('#receiptBox').css('display', 'none');
	});
	$('#searchBox .sample a:nth-child(1)').on('click', function (e) {
		$('#autocomplete').val('Sartre-Gymnasium');
		selectSuggestion('10Y08-01-HOF');
	});
	$('#searchBox .sample a:nth-child(2)').on('click', function (e) {
		$('#autocomplete').val('Marzahn-Hellersdorf');
		selectSuggestion('10');
	});

	$("#popupShare").on('popupafteropen', function(e, ui) {
		$('#shareLink input').focus().select();
	});
	$('#tabShareLink').on('click', function (e) {
		$('#popupShare').popup('reposition', 'positionTo: window');
		$('#shareLink input').focus().select();
	});
	$('#tabEmbedMap').on('click', function (e) {
		updateEmbedURI();
		$('#popupShare').popup('reposition', 'positionTo: window');
		$('#embedMap input').focus().select();
	});

	$('#selectEmbedSize').val('400x300').selectmenu('refresh');
	$('#selectEmbedSize').on('click', function (e) {
		updateEmbedURI();
		$('#popupShare').popup('reposition', 'positionTo: window');
	});
});

// -----------------------------------------------------------------------------

$(function () {
	'use strict';

	$('a[href*="#"]:not([href="#"])').click(printerLabelClick);

	var isIFrame = true;
	try {
		isIFrame = window.self !== window.top;
	} catch (e) {
		isIFrame = true;
	}
});

// -----------------------------------------------------------------------------
