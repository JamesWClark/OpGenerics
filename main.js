// this statement is a redirect for brackets development
if (window.location.hostname === '127.0.0.1') {
  window.location = 'http://localhost:1898';
}

var auth2;

function appStart() {
  gapi.load('auth2', initSigninV2);
}

function initSigninV2() {
  auth2 = gapi.auth2.getAuthInstance();
  auth2.isSignedIn.listen(signinChanged);
  auth2.currentUser.listen(userChanged);
  if (auth2.isSignedIn.get() == true) {
    auth2.signIn();
  }
}

function signinChanged(isSignedIn) {
  console.log('signinChanged() = ' + isSignedIn);
  if (isSignedIn) {
    console.log('the user must be signed in to print this');
    var googleUser = auth2.currentUser.get();
    var authResponse = googleUser.getAuthResponse();
    var profile = googleUser.getBasicProfile();
    
    $('#email').html('<p>' + profile.getEmail() + '</p>');
    $('#photo').html('<img src="' + profile.getImageUrl() + '">');
    
    // some other properties
    console.log(profile.getId());
    console.log(profile.getName());
    console.log(profile.getGivenName());
    console.log(profile.getFamilyName());
    console.log(profile.getImageUrl());
    console.log(profile.getEmail());
    console.log(googleUser.getHostedDomain());
    console.log(authResponse.id_token);
    console.log(authResponse.expires_at);

  } else {
    console.log('the user must not be signed in if this is printing');
  }
}

function userChanged() {
  console.log('userChanged()');
}

function onSignIn(googleUser) {
  var profile = googleUser.getBasicProfile();
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail());
  $('.g-signin2').hide();
}

function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
  $('.g-signin2').show();
}