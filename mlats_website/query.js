// Taken from query-interface.html
var treatyList = [];
var blats = {};
var mlats = {};
var parentDeps = {};
var depParents = {};

$(document).ready(function () {
  google.charts.load('current', {
        'packages':['geochart'],
      });
  google.charts.setOnLoadCallback(drawRegionsMap);
  var chart = null;

  var select = $('#spreadsheet-query');
  var countriesDataBy2Code = {};
  var $tableBodyEl = $('#tbody');
  var $msgEl = $('#msg');
  let all_country_data = [];
  let bilat_country_data = [];
  let treaty_type = $('#query-type');

  // redraws map with country selected from dropdown
  select.on('change', function(){
    drawRegionsMap();
  });
  
  // redraws map with treaty type selected
  treaty_type.on('change', function(){
    drawRegionsMap();
  });

  // creates countries selector
  function countrySelector(countries){
    for (let i = 0; i < countries.length; i++){
      if (countries[i].ISOCountryName != "Total"){
        var option = document.createElement('option');
        option.value = countries[i].ISOTwoLetterCode;
        option.innerHTML = countries[i].ISOCountryName;
        select.append(option);
      }
    }
  }

  fetch('https://opensheet.vercel.app/1tbSr9BfcGrWfsaU6t-1XTeN_PH61xQDgMUmLyjkW5QQ/42TotByCntry')
  .then(res => res.json())
  .then(data => {
      countrySelector(data);
  }).catch(err => {
    // Do something for an error here
    console.log("Error");
  });

  // fill variable all_country_data with countries and their treaty info

  fetch('https://opensheet.vercel.app/1tbSr9BfcGrWfsaU6t-1XTeN_PH61xQDgMUmLyjkW5QQ/39All2014')
    .then(res => res.json())
    .then (data => {
      all_country_data = getDataTable(data);
    }).catch(err => {
      // Do something for an error here
      console.log("Error");
    });

  // fill variable bilat_country_data with countries and their bilateral treaty info

  fetch('https://opensheet.vercel.app/1tbSr9BfcGrWfsaU6t-1XTeN_PH61xQDgMUmLyjkW5QQ/412014BiLatAll')
  .then(res => res.json())
  .then (data => {
    bilat_country_data = getDataTable(data);
  }).catch(err => {
    // Do something for an error here
    console.log("Error");
  });

  function fillCountriestoDraw(country_data){
    const arr = [['Country', 'Value']];
    const selected_country = $('#spreadsheet-query').val()
    arr.push([selected_country, 0]);
    for (let i = 0; i < country_data.length; i++) {
      if (country_data[i].ISOTwoLetterCode == selected_country){
        for (let j = 0; j < country_data[i].Treaties.length; j++) {
          arr.push([country_data[i].Treaties[j], 1]);
        }
      }
    }
    
    return arr;
  }

  // draws map with countries 

  function drawRegionsMap() {
    var data;
    if (treaty_type.val() == 1){
      data = google.visualization.arrayToDataTable(fillCountriestoDraw(bilat_country_data));
    }
    else{
      data = google.visualization.arrayToDataTable(fillCountriestoDraw(all_country_data));
    }

    var options = {
      colorAxis: {values: [0, 1], colors: ['green', '#f44336']},
      backgroundColor: '#81d4fa',
      datalessRegionColor: '#ccc',
      defaultColor: 'yellow',
      legend: 'none'
    };

    if (!chart) {
      chart = new google.visualization.GeoChart(document.getElementById('geochart'));
      google.visualization.events.addListener(chart, 'regionClick', onRegionClick);
    }
    chart.draw(data, options);

  };

  // selects countries

  function onRegionClick (e) {
    var region = e.region || '';
    console.log('regionClick', e);
    $('#spreadsheet-query').val(region);
    updateResultTable(region);
  }

  function getDataTable(cellFeed) {
    const country_table = [];
    for (let i = 0; i < cellFeed.length; i++){
      if (cellFeed[i].ISOCountryName != ""){
        const treaty_countries = [];
        for (const [key, value] of Object.entries(cellFeed[i])){
          if (value >= "1"){
            treaty_countries.push(key);
          }
        }
        const country_dict = {
          ISOTwoLetterCode: cellFeed[i].ISOTwoLetterCode,
          ISOThreeLetterCode: cellFeed[i].ISOThreeLetterCode,
          ISOCountryName: cellFeed[i].ISOCountryName,
          Treaties: treaty_countries
        };

        country_table.push(country_dict);
      }

    }

    return country_table;
    
  }

  function getObjectKeys (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res
  }

  function getTreatyListElement (treaty) {
    if (treaty.url) {
      return '<li><a href="' + treaty.url + '">' + treaty.name + '</a></li>';
    }
    return '<li>' + treaty.name + '</li>';
  }

  function fillTreatiesToBody ($tableBody, selected, country, index, includeBlats, includeMlats) {
    var countryData = countriesDataBy2Code[country];
    var urlsPassed = {};
    var treatyHtml = '<ul>';

    function processTreaties (colleciton) {
      for (var i = 0, l = colleciton.length; i < l; i ++) {
        var treaty = colleciton[i];
        if (treaty.url in urlsPassed) continue;
        urlsPassed[treaty.url] = {};
        treatyHtml += getTreatyListElement(treaty);
      }
    }

    if (includeBlats && blats[selected][country]) {
      processTreaties(blats[selected][country]);
    }
    if (includeMlats && mlats[selected][country]) {
      processTreaties(mlats[selected][country]);
    }

    treatyHtml += '</ul>';
    $row = $('<tr></tr>');
    $row.append('<td>' + (index + 1) + '</td>');
    $row.append('<td>' + countryData[2] + '</td>');
    $row.append('<td>' + countryData[1] + '</td>');
    $row.append('<td>' + countryData[0] + '</td>');
    $row.append('<td>' + treatyHtml + '</td>');
    $tableBodyEl.append($row);
  }

  function fillTableBody($tableBody, selected, includeBlats, includeMlats) {
    treatyList = [];
    if (includeBlats && blats[selected]) {
      treatyList.push.apply(treatyList, getObjectKeys(blats[selected]));
    }
    if (includeMlats && mlats[selected]) {
      treatyList.push.apply(treatyList, getObjectKeys(mlats[selected]));
    }
    treatyList.sort();
    for (var i = 0, l = treatyList.length; i < l; i += 1) {
      fillTreatiesToBody($tableBody, selected, treatyList[i], i, includeBlats, includeMlats);
    }
    treatyList.push(selected);
  }

  function updateResultTable (selected) {
    $tableBodyEl.empty();
    treatyList = [];
    var selectedCountry;
    var queryType = $('#query-type').val();
    var includeBlats = queryType & 1;
    var includeMlats = queryType & 2;
    if (selected in depParents) {
      selectedCountry = depParents[selected];
    }
    else {
      selectedCountry = selected;
    }

    if (!(includeBlats && (selectedCountry in blats)) &&
        !(includeMlats && (selectedCountry in mlats))) {
      $msgEl.text('No treaties returned.');
      $('#result-table').hide();
      if (chart) {
        drawRegionsMap();
      }
      return;
    }

    $('#result-table').show();
    var selectedCountryData = countriesDataBy2Code[selected];
    $msgEl.text('MLAT Treaties for ' + selectedCountryData[2] + ', ' + selectedCountryData[1] +
      ', ' + selectedCountryData[0]);

    fillTableBody($tableBodyEl, selectedCountry, includeBlats, includeMlats);
    if (chart) {
      drawRegionsMap();
    }
  }

  function updateSelection () {
    var selectedIsoCode = $select.val();
    updateResultTable(selectedIsoCode);
  }

  function enableSelect () {
    $select.removeAttr('disabled').on('change', updateSelection);
    $('#query-type').on('change', updateSelection);
  }

  function fillCountries (dataTable) {
    var countryRe = /^\((.+)\)\((.+)\)\((.+)\)$/;
    $select.empty().append('<option>Select country</option>');
    for (var i = 1, l = dataTable.length; i < l; i += 1) {
      var cur = dataTable[i][3];
      if (!cur) break;
      var group = countryRe.exec(cur);
      if (!group) break;
      var code2 = group[1];
      var name = group[3];
      var countryData = [code2, group[2], name];
      countriesDataBy2Code[code2] = countryData;
      $select.append('<option value="' + code2 + '">' + name + '</option>');
    }
    countriesDataBy2Code['EU'] = ['EU', 'EUR', 'European Union'];
    countriesDataBy2Code['AN'] = ['AN', 'ANT', 'Netherlands Antilles'];
  }

  function parseTreatyString (treatyString) {
    treatyString = treatyString.replace(/\n+/g, '');
    var treatyRe = /^(.*)\(([^\)]*)\)\[(.+)\]$/g;
    var group = treatyRe.exec(treatyString);
    if (!group) console.error(treatyString)
    return {
      name: group[1] || 'Treaty',
      url: group[2] || '',
      countries: group[3].split(',')
    };
  }

  function pushTreaty (dest, country1, country2, treaty) {
    if (!dest[country1]) dest[country1] = {};
    if (!dest[country2]) dest[country2] = {};
    if (!dest[country1][country2]) dest[country1][country2] = [];
    if (!dest[country2][country1]) dest[country2][country1] = [];
    dest[country1][country2].push(treaty);
    dest[country2][country1].push(treaty);
  }

  function fillTreaties (dataTable, col, dest) {
    for (var i = 1, l = dataTable.length; i < l; i += 1) {
      var cur = dataTable[i][col];
      if (!cur) return;
      var treaty = parseTreatyString(cur);

      var countries = treaty.countries;
      for (var j = 0, sz = countries.length; j < sz; j += 1) {
        for (var k = j + 1; k < sz; k += 1) {
          pushTreaty(dest, countries[j], countries[k], treaty);
        }
      }
    }
  }

  function fillDependencies (dataTable) {
    for (var i = 1, l = dataTable.length; i <= l; i ++) {
      var depRe = /^([^\(]+)\(([^\)]+)\)$/g;
      var depStr = dataTable[i][4];
      if (!depStr) break;
      var group = depRe.exec(depStr);
      if (!group) break;
      var parent = group[1];
      var dependencies = group[2].split(',');
      parentDeps[parent] = dependencies;
      for (var j = 0, depSize = dependencies.length; j < depSize; j ++) {
        var dependency = dependencies[j];
        depParents[dependency] = parent;
      }
    }
  }

  
  $.get('https://spreadsheets.google.com/feeds/cells/1NR2EMNs_sHydOn4UJ4C0q6YeW7xjWFhuODUFxf5HE0U/odh6i6f/public/full?alt=json')
    .then(function (data) {
      var dataTable = getDataTable(data.feed);
      fillDependencies(dataTable);
      fillCountries(dataTable);
      fillTreaties(dataTable, 1, blats);
      fillTreaties(dataTable, 2, mlats);
      enableSelect();
    }); 

});

// old code
  /*
  function drawRegionsMap() {
    console.log('drawRegionMap', treatyList);
    var arr = [['Country']];
    for (var i = 0; i < treatyList.length; i++) {
      var country = treatyList[i];
      arr.push([country]);
      var deps = parentDeps[country];
      if (deps) {
        for (var j = 0, depsSize = deps.length; j < depsSize; j ++) {
          country = deps[j];
          arr.push([country]);
        }
      }
    }
    
    arr.push([$('#spreadsheet-query').val()]);
    var data = google.visualization.arrayToDataTable(arr);

    var options = {
      colorAxis: {colors: ['#f44336']},
      backgroundColor: '#81d4fa',
      datalessRegionColor: '#ccc',
      defaultColor: 'red'
    };

    if (!chart) {
      chart = new google.visualization.GeoChart(document.getElementById('geochart'));
      google.visualization.events.addListener(chart, 'regionClick', onRegionClick);
    }
    chart.draw(data, options);
  }; 

  
  function getDataTable(cellFeed) {
    var rowCount = parseInt(cellFeed['gs$rowCount']['$t']);
    var colCount = parseInt(cellFeed['gs$colCount']['$t']);
    var table = new Array(rowCount + 2);
    for (var i = 0; i < rowCount + 2; i++) {
      table[i] = new Array(colCount + 2);
    }
    for (var i = 0, entry; entry = cellFeed.entry[i]; i++) {
      var cell = entry['gs$cell'];
      var row = parseInt(cell.row);
      var col = parseInt(cell.col);

      table[row][col] = cell.inputValue;
    }
    return table;
  } 
  
  */