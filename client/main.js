// TODO : http://stackoverflow.com/questions/38240504/refresh-expired-jwt-in-browser-when-using-google-sign-in-for-websites
// OR   : http://stackoverflow.com/questions/32150845/how-to-refresh-expired-google-sign-in-logins?rq=1
// READ : http://stackoverflow.com/questions/3105296/if-rest-applications-are-supposed-to-be-stateless-how-do-you-manage-sessions
// READ : http://www.cloudidentity.com/blog/2014/03/03/principles-of-token-validation/

// this statement is a redirect for brackets development
if (window.location.hostname === '127.0.0.1') {
  window.location = 'http://localhost:1898/client/';
}

// prepend the url of node.js server
function route(url) {
  return 'http://localhost:3000' + url;
}

var profile;      // google user profile
var authResponse; // google user auth response
  
function onSignIn(googleUser) {
  profile       = googleUser.getBasicProfile();
  authResponse  = googleUser.getAuthResponse();
  
  var login = {
      'id'            : profile.getId(),
      'name'          : profile.getName(),
      'givenName'     : profile.getGivenName(),
      'familyName'    : profile.getFamilyName(),
      'imageUrl'      : profile.getImageUrl(),
      'email'         : profile.getEmail(),
      'hostedDomain'  : googleUser.getHostedDomain()
  };

  http.post('/login', login);

  $('.g-signin2').hide();
  $('#email').html('<p>' + profile.getEmail() + '</p>');
  $('#photo').html('<img src="' + profile.getImageUrl() + '">');
}

function signOut() {
  gapi.auth2.getAuthInstance().signOut();
  $('.g-signin2').show();
  $('#email').html('');
  $('#photo').html('');
}

function disconnect() {
  gapi.auth2.getAuthInstance().disconnect();
  $('.g-signin2').show();
  $('#email').html('');
  $('#photo').html('');
}

var http = {};

http.post = function(url, json, success, error) {
    $.ajax({
        url: route(url),
        method: 'POST',
        data: json,
        headers: {
            'Authorization': authResponse.id_token
        },
        success: function(data, statusText, jqXHR) {
            if (success) success(data, statusText, jqXHR);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (error) error(jqXHR, textStatus, errorThrown);
        }
    });
};

http.get = function(url, success, error) {
    $.ajax({
        url: route(url),
        method: 'GET',
        headers: {
            'Authorization': authResponse.id_token
        },
        success: function(data, statusText, jqXHR) {
            if (success) success(data, statusText, jqXHR);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (error) error(jqXHR, textStatus, errorThrown);
        }
    });
};

http.put = function(url, json, success, error) {
    $.ajax({
        url: route(url),
        method: 'PUT',
        data: json,
        headers: {
            'Authorization': authResponse.id_token
        },
        success: function(data, statusText, jqXHR) {
            if (success) success(data, statusText, jqXHR);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (error) error(jqXHR, textStatus, errorThrown);
        }
    });
};

http.delete = function(url, success, error) {
    $.ajax({
        url: route(url),
        method: 'DELETE',
        headers: {
            'Authorization': authResponse.id_token
        },
        success: function(data, statusText, jqXHR) {
            if (success) success(data, statusText, jqXHR);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (error) error(jqXHR, textStatus, errorThrown);
        }
    });
};