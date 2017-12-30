#!/usr/bin/env bash

set -e

wget -O sessions.json.new http://data.c3voc.de/34C3/sessions_complete.json
jq . < sessions.json.new > sessions.json

wget -O schedule.json.new https://events.ccc.de/congress/2017/Fahrplan/schedule.json
jq . < schedule.json.new > schedule.json
