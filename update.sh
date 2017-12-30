#!/usr/bin/env bash

set -e

wget -O sessions.json.new "https://events.ccc.de/congress/2017/wiki/index.php/Special:Ask/-5B-5BHas-20object-20type::Event-5D-5D/-3FHas-20event-20title%3Dsummary/-3FHas-20start-20time%3Dstart/-3FHas-20end-20time%3Dend/-3FHas-20duration%3Dduration/-3FHas-20session-20location%3Dlocation/-3FHas-20url%3Durl/-3FHas-20description%3Ddescription/format%3Djson/limit%3D500/sort%3DHas-20start-20time/searchlabel%3DExport-20this-20calendar-20as-20iCal/offset%3D0"
jq . < sessions.json.new > sessions.json

wget -O schedule.json.new https://events.ccc.de/congress/2017/Fahrplan/schedule.json
jq . < schedule.json.new > schedule.json
