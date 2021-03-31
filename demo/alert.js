/* global localStorage, sessionStorage */

// This code is for demo purposes only and not part of the integration.

(function () {
  // Check browser support for Web Storage
  var browserSupportsWebStorage = typeof Storage !== 'undefined'
  var footerDismissed = sessionStorage.lp_footer_dismissed
  var lastContributionAt = localStorage.lp_last_contribution_at

  if (browserSupportsWebStorage && (footerDismissed || lastContributionAt)) {
    const alert = document.getElementById('demo-alert')
    alert.style.display = 'block'
    if (footerDismissed) {
      alert.innerHTML = 'Footer has been dismissed. Open this page in a new tab to start a new session.'
    }
    if (lastContributionAt) {
      var date = new Date(parseInt(lastContributionAt))
      var localizedDate = date.toLocaleString('en-US', {
        weekday: 'short', // "Sat"
        month: 'long', // "June"
        day: '2-digit', // "01"
        year: 'numeric' // "2019"
      })
      alert.innerHTML = `You made a contribution on ${localizedDate}. The footer will be hidden for 30 days.<br/>
      Delete <code>localStorage.lp_last_contribution_at</code> to show the footer again.`
    }

    // Add element to DOM
    document.body.prepend(alert)
  }
})()
