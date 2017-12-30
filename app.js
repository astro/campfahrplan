function status(s) {
    $('#status').text(s)
}

var TZ_OFFSET = 1 * 3600 * 1000

function loadData() {
    $.ajax({
        url: "schedule.json",
        success: function(data) {
            data.schedule.conference.days.forEach(function(day) {
                Object.keys(day.rooms).forEach(function(room) {
                    day.rooms[room].forEach(function(event) {
                        var begin = new Date(event.date)
                        var ds = event.duration.split(/:/)
                            .map(function(d) { return parseInt(d, 10) })
                        var duration = ((ds[0] * 60) + ds[1]) * 60 * 1000
                        addSession({
                            id: event.id,
                            title: event.title,
                            subtitle: event.subtitle,
                            begin: begin,
                            end: new Date(begin.getTime() + duration),
                            track: event.track,
                            location: room,
                            speakers: event.persons.map(function(person) {
                                return person.public_name || person.name
                            }),
                            link: event.url,
                        })
                    })
                })
            })
            displaySessions()

            $.ajax({
                url: "sessions.json",
                success: function(data) {
                    Object.keys(data).forEach(function(key) {
                        var session = data[key]
                        var name = key.replace(/^Session:/, "")
                            .replace(/#.*/, "")
                        function getProp(label) {
                            var r = session[label]
                            return r && r[0]
                        }
                        var location = getProp('Has session location')
                        location = location && location.fulltext
                        location = ("" + location)
                            .replace(/^Room:/, "")
                            .replace(/^Assembly:/, "")
                        addSession({
                            id: key,
                            title: name,
                            subtitle: getProp('Has description'),
                            location: location,
                            begin: new Date(parseInt(getProp('Has start time'), 10) * 1000 - TZ_OFFSET),
                            end: new Date(parseInt(getProp('Has end time'), 10) * 1000 - TZ_OFFSET),
                            duration: getProp('Has duration'),
                            link: session.fullurl,
                            speakers: (session['Is organized by'] || []).map(function(o) {
                                return o.fulltext.replace(/^User:/, "")
                            }),
                        })
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
    parent.empty()
    $('nav').remove()
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

        el.css('background-color', /^Session:/.test(data.id) ?
               '#7f3f1f' : '#3f1f7f')
        el.find('h2 a').
          attr('href', data.link).
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
        addP('r', 'location', data.location)
        addP('l', 'speakers', data.speakers.join(", "))
        parent.append(el)
    })
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
