// TODO:
// * geoloc

function status(s) {
    $('#status').text(s)
}

function loadData() {
    $.ajax({
        url: "http://api.conference.bits.io/api/camp15/sessions",
        success: function(data) {
            sessions = data.data
            $.ajax({
                url: "http://api.conference.bits.io/api/camp15/pois",
                success: function(data) {
                    data.data.forEach(function(poi) {
                        if (poi.location && poi.location.id)
                          pois[poi.location.id] = poi
                    })
                    status("All received")

                    displaySessions()
                    $('#status').slideUp()
                },
                error: function(xhr, status) {
                    status("Error: " + status)
                }
            })
        },
        error: function(xhr, status) {
            status("Error: " + status)
        }
    })
    status("Loading re-data...")
}
loadData()

var pois = {}
var sessions = []
function addSession(data) {
    sessions.push(data)
}

var currentDay
function displaySessions() {
    sessions = sessions.sort(function(a, b) {
        return Date.parse(a.begin) - Date.parse(b.begin)
    })
    var parent = $('#sessions')
    var nav = $('<nav><p>Jump to:</p> <ul></ul></nav>')
    $('body').prepend(nav)
    nav = nav.find('ul')
    sessions.forEach(function(data) {
        // Day headings
        var day = days[new Date(data.begin).getDay()]
        if (day !== currentDay) {
            var dayHead = $('<h1></h1>')
            dayHead.
              attr('id', "day-" + day).
              text(day)
            parent.append(dayHead)
            var navEl = $('<li><a></a></li>')
            navEl.find('a').
              attr('href', "#day-" + day).
              text(day)
            nav.append(navEl)
            currentDay = day
        }

        // Session article
        var el = $('<article><p class="fave"></p><h2><a></a></h2><div class="r"></div><div class="l"></div></article>')

        var storageKey = 'fav-' + data.id
        function refreshFav() {
            if (localStorage[storageKey]) {
                el.addClass('faved')
            } else {
                el.removeClass('faved')
            }
        }
        el.find('.fave').click(function() {
            if (localStorage[storageKey]) {
                delete localStorage[storageKey]
            } else {
                localStorage[storageKey] = true
            }
            refreshFav()
        })
        refreshFav()

        el.css('background-color', "rgb(" + data.track.color.slice(0, 3).join(",") + ")")
        el.find('h2 a').
          attr('href', getUrl(data)).
          text(data.title)
        function addP(parentKlass, klass, s) {
            if (!s) return

            var p = $('<p></p>')
            p.
              attr('class', klass).
              text(s)
            el.find("." + parentKlass).append(p)
        }
        addP('r', 'time', formatDate(data.begin, true) + " - " + formatDate(data.end))
        addP('l', 'subtitle', data.subtitle)
        addP('r', 'location', data.location.label_en || data.location.label_de || data.location.label_id)
        addP('l', 'speakers', data.speakers.map(function(s) { return s.name }).join(", "))
        parent.append(el)

        var poi = pois[data.location.id]
        var eventCoords = poi &&
            [poi.geo_position.long, poi.geo_position.lat]
        var locationEl
        if (eventCoords) {
            data.updateLocation = function(geo) {
                if (!locationEl) {
                    locationEl = $('<div class="geo"><p class="arrow"><span>➢</span></p><p class="dist"></p></div>')
                    el.find('.r').append(locationEl)
                }

                var bearing = -180.0 * Math.atan2(
                    eventCoords[1] - geo.coords.latitude,
                    eventCoords[0] - geo.coords.longitude
                ) / Math.PI
                // console.log("bearing between " + geo.coords.latitude + "," + geo.coords.longitude + " and " + eventCoords[1] + "," + eventCoords[0] + ": " + bearing)

                if (typeof geo.heading === 'number')
                  locationEl.find('.arrow span').text("➡")
                locationEl.find('.arrow span').css('transform', 'rotate(' + (bearing - (geo.heading || 0)) + 'deg)')
                    
                var distance = Math.round(WGS84Util.distanceBetween(
                    { coordinates: [geo.coords.longitude, geo.coords.latitude] },
                    { coordinates: eventCoords }
                ))
                locationEl.find('.dist').text(distance + "m")
            }
            if (lastGeo)
              data.updateLocation(lastGeo)
        } else {
            console.warn("No such poi: " + data.location.id + " => " + data.location.id)
        }
    })
}

var lastGeo
function onGeo(geo) {
    if (true || geo.accuracy <= 1000) {
        if (lastGeo && lastGeo.heading && typeof geo.heading !== 'number')
          geo.heading = lastGeo.heading
        lastGeo = geo
        sessions.forEach(function(session) {
            if (session.updateLocation)
              session.updateLocation(geo)
        })
    }
}
navigator.geolocation.getCurrentPosition(function(geo) {
    onGeo(geo)
    navigator.geolocation.watchPosition(onGeo, null, {
        enableHighAccuracy: true
    })
})

function getUrl(data) {
    return data.links.filter(function(l) {
        return l.type === 'session-link'
    }).map(function(l) {
        return l.url
    })[0] || data.url
}

var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
function formatDate(date, withDay) {
    var d = new Date(date)
    return (withDay ? (days[d.getDay()] + " ") : "") + d.getHours() + ":" + padLeft(d.getMinutes(), 2, "0")
}

function padLeft(s, l, p) {
    s = "" + s
    while(s.length < l) {
        s = p + s
    }
    return s
}
