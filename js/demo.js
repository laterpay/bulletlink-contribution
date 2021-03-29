/* global localStorage, sessionStorage */

// This code is for demo purposes only and not part of the integration.

// Check browser support for Web Storage
var browserSupportsWebStorage = typeof Storage !== 'undefined'
var footerDismissed = sessionStorage.lp_footer_dismissed
var lastContributionAt = localStorage.lp_last_contribution_at

if (browserSupportsWebStorage && (footerDismissed || lastContributionAt)) {
  const node = document.createElement('DIV')
  node.id = 'demo-info'
  node.style.color = 'white'
  node.style.fontSize = '1.75rem'
  node.style.textAlign = 'center'
  node.style.paddingTop = '10rem'

  if (footerDismissed) {
    node.innerHTML = 'Footer has been dismissed. Open this page in a new tab to start a new session.'
  }
  if (lastContributionAt) {
    var date = new Date(parseInt(lastContributionAt))
    var localizedDate = date.toLocaleString('en-US', {
      weekday: 'short', // "Sat"
      month: 'long', // "June"
      day: '2-digit', // "01"
      year: 'numeric' // "2019"
    })
    node.innerHTML = `You made a contribution on ${localizedDate}.<br/>
    Delete <code>localStorage.lp_last_contribution_at</code> to show the footer again.`
  }

  // Add element to DOM
  document.body.prepend(node)
}
