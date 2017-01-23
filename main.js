// TODO : http://stackoverflow.com/questions/38240504/refresh-expired-jwt-in-browser-when-using-google-sign-in-for-websites
// READ : http://stackoverflow.com/questions/3105296/if-rest-applications-are-supposed-to-be-stateless-how-do-you-manage-sessions
// READ : http://www.cloudidentity.com/blog/2014/03/03/principles-of-token-validation/

var profile;      // google user profile
var authResponse; // google user auth response

// this statement is a redirect for brackets development
if (window.location.hostname === '127.0.0.1') {
  window.location = 'http://localhost:1898';
}

// prepend the url of node.js server
function route(url) {
  return 'http://localhost:3000' + url;
}

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
  }

  post('/login', login);

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

function post(url, json, success, error) {
  console.log(authResponse.id_token);
  $.ajax({
    url : route(url),
    method : 'POST',
    data : json,
    headers : {
      'Authorization' : authResponse.id_token
    },
    success : function() {
      if(success) success();
    },
    error : function() {
      if(error) error();
    }
  });
}

