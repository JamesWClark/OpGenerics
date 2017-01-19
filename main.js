// this statement is a redirect for brackets development
if (window.location.hostname === '127.0.0.1') {
  window.location = 'http://localhost:1898';
}

function onSignIn(googleUser) {
  var profile = googleUser.getBasicProfile();
  var authResponse = googleUser.getAuthResponse();
  
  $('.g-signin2').hide();
  $('#email').html('<p>' + profile.getEmail() + '</p>');
  $('#photo').html('<img src="' + profile.getImageUrl() + '">');

  // properties from google
  console.log(profile.getId());
  console.log(profile.getName());
  console.log(profile.getGivenName());
  console.log(profile.getFamilyName());
  console.log(profile.getImageUrl());
  console.log(profile.getEmail());
  console.log(googleUser.getHostedDomain());
  console.log(authResponse.id_token);
  console.log(authResponse.expires_at);
  
  var json = {
    id: profile.getId(),
    name: profile.getName(),
    givenName: profile.getGivenName()
  };
  
  console.log(JSON.stringify(json));
  
  $.post('http://10.10.90.58:3000/signin', json, function(data) {
    $('#post-status').text(data);
  });
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