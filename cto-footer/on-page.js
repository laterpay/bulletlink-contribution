/* global localStorage, sessionStorage */

// Check browser support for Web Storage
const browserSupportsWebStorage = typeof Storage !== 'undefined'

const waitForBody = (callback) => {
  if (document.body) {
    callback()
  } else {
    setTimeout(() => {
      waitForBody(callback)
    }, 100)
  }
}

// Determine if footer should be displayed
const shouldShowFooter = (function () {
  if (!browserSupportsWebStorage) {
    return false
  }
  const dismissed = !!sessionStorage.cto_footer_dismissed
  const day = 60 * 60 * 24 * 1000
  const month = day * 30
  const monthAgo = Date.now() - month
  const lastContributionAt = parseInt(localStorage.cto_last_contribution_at)
  const contributedThisMonth = lastContributionAt && lastContributionAt > monthAgo
  // Footer will be hidden if the user has made a contribution in the last 30 days
  const showFooter = !dismissed && !contributedThisMonth
  return showFooter
})()

if (shouldShowFooter) {
  // Insert iframe
  const iframe = document.createElement('iframe')
  iframe.id = 'contributions-iframe'
  iframe.style.cssText = 'width: 100%; border: none; max-height: 100vh; position: fixed; bottom: 0; left: 0; right: 0; z-index: 999999999;'
  iframe.src = './iframe/footer.html'
  // Only append iframe once body has loaded
  waitForBody(() => document.body.appendChild(iframe))

  // Get all data attributes from script tag and pass them down to the iframe
  const scriptTag = document.getElementById('cto-footer')
  const footerConfig = { ...scriptTag.dataset }
  iframe.onload = function () {
    if (footerConfig.amounts) {
      // Convert amounts string into an array
      footerConfig.amounts = footerConfig.amounts.split(',')
    }
    iframe.contentWindow.postMessage(footerConfig, '*')
  }

  // Adjust the iframe's height dynamically
  window.onmessage = (e) => {
    if (iframe) {
      const { ctoIframeHeight, ctoFooterDismissed, ctoContributionMade } = e.data
      if (ctoIframeHeight === '100vh') {
        iframe.style.minHeight = '100vh'
      } else if (ctoIframeHeight) {
        iframe.style.height = `${e.data.ctoIframeHeight}px`
      }
      if (ctoFooterDismissed) {
        setFooterDismissed()
      }
      if (ctoContributionMade) {
        setLastContribution()
      }
    }
  }

  const setFooterDismissed = () => {
    sessionStorage.cto_footer_dismissed = 1
    iframe.style.display = 'none'
  }

  const setLastContribution = () => {
    // Save timestamp in local storage
    localStorage.cto_last_contribution_at = Date.now()
  }
}
