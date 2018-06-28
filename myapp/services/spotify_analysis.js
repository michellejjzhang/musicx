var request = require('request'); // "Request" library
var querystring = require('querystring');
var control = require('./lifx');

var analysis = {
    previousTrackId: "",
    displayInfo: {},
    findTrackName: function(access_token){
        if (access_token){
            var options = {
                url: 'https://api.spotify.com/v1/me/player/currently-playing',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
            };
            // use the access token to access the Spotify Web API
            request.get(options, function(error, response, body) {
                if(!body['error'] && body['item'] != null){
                    analysis.setNewColor(body, access_token);
                    var songName = body['item']['name'];
                    analysis.displayInfo['songName'] = songName;
                }
            });
        }
    },
    setNewColor: function(body, access_token){
        var trackId = body['item']['id'];

        var options = {
            url: 'https://api.spotify.com/v1/audio-features/' + trackId,
            headers: {'Authorization':'Bearer ' + access_token },
            json: true
        };

        if (trackId != null && analysis.previousTrackId != trackId){
            var requestOptions = "";
            request.get(options, function(error, response, body){
                if (!body['error']){
                    requestOptions += 'rgb:'+analysis.analyzeColorOfTrack(body);
                    requestOptions += ' saturation:'+analysis.analyzeSaturationOfTrack(body);
                    control.setColor(requestOptions);
                    analysis.displayInfo['songAnalysis']= body;
                } else {
                    console.log("error1");
                    console.log(body['error']);
                }
            });
            analysis.previousTrackId = trackId;
        }
    },
    analyzeColorOfTrack: function(body){
        var rgbValue = {'red': 255, 'green': 255, 'blue': 255};

        var acousticness = body['acousticness'];
        rgbValue['red'] = rgbValue['red'] * (1-acousticness);

        var danceability = body['danceability'];
        rgbValue['blue'] = rgbValue['blue'] * (1-danceability);

        var energy = body['energy'];
        rgbValue['green'] = rgbValue['green'] * energy;

        var majorOrMinor = body['mode'];
        if (majorOrMinor == 0){
            rgbValue['blue'] = (rgbValue['blue'] + 255)/2;
        }

        var tempo = body['tempo'];
        if (tempo > 100 && tempo < 150){
            rgbValue['green'] = (rgbValue['green'] + 255)/2;
        } else if (tempo >= 150){
            rgbValue['red'] = (rgbValue['red'] + 255)/2;
        } else if (tempo <= 100){
            rgbValue['blue'] = (rgbValue['blue'] + 255)/2;
        }

        var postivity = body['valence'];
        rgbValue['green'] = (rgbValue['green'] + 255 * postivity)/2;

        var rgb = Math.round(rgbValue['red']) + "," + Math.round(rgbValue['green']) + "," + Math.round(rgbValue['blue']);
        return rgb;
    },
    analyzeSaturationOfTrack: function(body){
        var energy = body['energy'];
        var saturation = energy;

        var speechiness = body['speechiness'];
        saturation = (saturation + (1-speechiness))/2;
        return saturation;
    },
    returnDisplayData: function(){
        return analysis.displayInfo;
    }
};

module.exports = analysis;