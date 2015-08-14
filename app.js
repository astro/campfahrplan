// TODO:
// * faves
// * geoloc

function status(s) {
    $('#status').text(s)
}

function loadData() {
    $.ajax({
        url: "http://api.conference.bits.io/api/camp15/sessions",
        success: function(data) {
            status("All received")
            console.log("data", data)  // TODO: rm

            sessions = data.data
            displaySessions()
            $('#status').slideUp()
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
    var nav = $('<nav><ul></ul></nav>')
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
        var el = $('<article><h2><a></a></h2><div class="r"></div><div class="l"></div></article>')
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
    })
}

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
