/* global localStorage, sessionStorage, $ */

// This code is for demo purposes only and not part of the integration.

// Check browser support for Web Storage
var browserSupportsWebStorage = typeof Storage !== 'undefined'

if (browserSupportsWebStorage) {
  $('body').prepend("<div id='demo-info'></div>")
  $('#demo-info').css({
    color: 'white',
    'font-size': '1.25rem',
    'text-align': 'center',
    'padding-top': '10rem'
  })
  var footerDismissed = sessionStorage.lp_footer_dismissed
  var lastContributionAt = localStorage.lp_last_contribution_at
  if (footerDismissed) {
    $('#demo-info').text('Footer has been dismissed. Open this page in a new tab to start a new session.')
  }
  if (lastContributionAt) {
    var date = new Date(parseInt(lastContributionAt))
    var localizedDate = date.toLocaleString('en-US', {
      weekday: 'short', // "Sat"
      month: 'long', // "June"
      day: '2-digit', // "01"
      year: 'numeric' // "2019"
    })
    $('#demo-info').text('You made a contribution on ' + localizedDate + '.')
    $('#demo-info').append('<p>Delete <code>localStorage.lp_last_contribution_at</code> to show the footer again.</p>')
  }
}
