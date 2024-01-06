//for the options list
var stations = {};
var stnList = {}; //for the dictionary of station names

//get the lines information
fetch("lines.json").then(
  response => {
    response.json().then(lines => {
      //step 4: build the option selection lists for each MTR line
      lines.forEach(line => {
        let stationOptionsList = "";
        let linename = Object.keys(line)[0];
        let linelist = Object.values(line)[0];
        for(const station in linelist) {
          stationOptionsList += `<option class="${linename}" value="${station}">${linelist[station]}</option>`;
          //create the dictionary of station names
          stnList[station] = linelist[station];
        }
        stations[linename] = stationOptionsList;
      });
      //step 5: install an event handler for changing the station list
      let currentClass = "KTL";
      let line = document.getElementById('line');
      line.addEventListener('change', (evt) => {
        let selected = line.value;
        //if there is a change in line
        if (selected != currentClass) {
          let station = document.querySelector('#station');
          station.innerHTML = stations[selected];
          currentClass = selected;
        }
      });
      //step 6: install an event handler for handling the "Get Train Data" button
      let bttn = document.getElementById('bttn');
      bttn.addEventListener('click', fRequest);

      function fRequest() {
        let line = document.getElementById('line').value;
        let station = document.getElementById('station').value;
        fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${line}&sta=${station}`)
          .then(response => {
            //if response is received successfully
            if (response.status == 200) {
              response.json().then(schedule => {
                let output = "";
                if (schedule.status == 0) {
                  //special train service
                  output += schedule.message;
                  if (schedule.url) {
                    output += `<br><a href='${schedule.url}'>${schedule.url}</a>`
                  }
                }
                else {
                  //data absence or delayed service
                  if (schedule.isdelay == 'Y') {
                    output = 'No data available due to train service delay';
                  }
                  else {
                    //normal response
                    let dataUP = schedule.data[line+'-'+station].UP;
                    let dataDN = schedule.data[line+'-'+station].DOWN;
                    if (dataUP) {
                      for (let train of dataUP) {
                        let time = train.time.substr(11, 5);
                        output += '<span>Time: ' + time + '</span>';
                        output += '<span> Platform: ' + train.plat + '</span>';
                        output += '<span> Destination: ' + stnList[train.dest];
                        if (train.route == 'RAC') {
                          var upStnBeforeRAC = ['ADM', 'EXC', 'HUH', 'MKK', 'KOT', 'TAW', 'SHT'];
                          if (upStnBeforeRAC.includes(station)) {
                            output += ' via Racecourse';
                          }
                        }
                        output += '<br></span>';
                      }
                      output += '<br>';
                    }
                    if (dataDN) {
                      for (let train of dataDN) {
                        if (Object.keys(train).length) {
                          //need to double check since may not have data due to last train
                          let time = train.time.substr(11, 5);
                          output += '<span>Time: ' + time + '</span>';
                          output += '<span> Platform: ' + train.plat + '</span>';
                          output += '<span> Destination: ' + stnList[train.dest];
                          if (train.route == 'RAC') {
                            var dnStnBeforeRAC = ['LOW', 'LMC', 'SHS', 'FAN', 'TWO', 'TAP', 'UNI'];
                            if (dnStnBeforeRAC.includes(station)) {
                              output += ' via Racecourse';
                            }
                          }
                          output += '<br></span>';
                        }
                      }
                    }
                  }
                  document.getElementById('output').innerHTML = output;
                };
              })
            }
            else {
              console.log("HTTP return status: " + response.status);
            }
          });
      }
    });
  }
)
