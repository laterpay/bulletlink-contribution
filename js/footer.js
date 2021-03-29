/* global alert, localStorage, sessionStorage, Stripe, $ */

const footerOptions = {
  ctaHeader: 'ABC needs your support',
  ctaText: 'We are working hard to bring you news that matters. Your contribution will help us continue to provide vital coverage during these important times.',
  customAmountText: 'Custom amount',
  buttonText: 'Contribute',
  amounts: ['4', '8', '10', '12']
}

// Set up the footer based on the footerOptions object.
$('#lp-cta-title').text(footerOptions.ctaHeader)
$('#lp-cta-text').text(footerOptions.ctaText)
$('[for=lp-amount-1]').text('$' + footerOptions.amounts[0])
$('[for=lp-amount-2]').text('$' + footerOptions.amounts[1])
$('[for=lp-amount-3]').text('$' + footerOptions.amounts[2])
$('[for=lp-amount-4]').text('$' + footerOptions.amounts[3])
$('#lp-amount-1').val(footerOptions.amounts[0] * 100)
$('#lp-amount-2').val(footerOptions.amounts[1] * 100)
$('#lp-amount-3').val(footerOptions.amounts[2] * 100)
$('#lp-amount-4').val(footerOptions.amounts[3] * 100)
$('#lp-custom-amount-placeholder').text(footerOptions.customAmountText)
$('#lp-confirm-amount').text(footerOptions.buttonText)
$('#lp-submit-payment').text(footerOptions.buttonText)

// Dynamically update the parent window's iframe height
let frameHeight
const updateFrameHeight = (explicitHeight) => {
  const footerHeight = explicitHeight || document.getElementById('lp-footer').offsetHeight
  if (frameHeight !== footerHeight) {
    frameHeight = footerHeight
    window.parent.postMessage({ frameHeight }, '*')
  }
}
const makeFullHeight = () => {
  window.parent.postMessage({ isFullHeight: true }, '*')
}
window.onload = () => updateFrameHeight()
window.onresize = () => updateFrameHeight()

let lpCreditCardInput, stripe, tabData

// Check browser support for Web Storage
const browserSupportsWebStorage = typeof Storage !== 'undefined'

// Determine if footer should be displayed
const shouldShowFooter = (function () {
  if (!browserSupportsWebStorage) {
    return false
  }
  const dismissed = !!sessionStorage.lp_footer_dismissed
  const day = 60 * 60 * 24 * 1000
  const month = day * 30
  const monthAgo = Date.now() - month
  const lastContributionAt = parseInt(localStorage.lp_last_contribution_at)
  const contributedThisMonth = lastContributionAt && lastContributionAt > monthAgo
  /*
  The footer will stay hidden if...
    - the user has dismissed it in the last 24 hours (by clicking on the X)
    - the user has made a contribution in the last 30 days
  */
  const showFooter = !dismissed && !contributedThisMonth
  return showFooter
})()

if (shouldShowFooter) {
  $('#lp-footer').show()
}

// Hide input placeholder if the user clicks on it
$('#lp-custom-amount-placeholder').click(function (e) {
  $('#lp-custom-amount-placeholder').hide()
})

// Select custom amount input if the user clicks on it
$('#lp-custom-amount').click(function () {
  $('.lp-chooseAmount__radioInput').prop('checked', false)
  $('#lp-custom-amount').addClass('selected')
  $('#lp-custom-amount-input').focus()
})

// Enforce min & max value for input
$('#lp-custom-amount-input').on('input', function () {
  const value = $(this).val()
  if ((value !== '') && (value.indexOf('.') === -1)) {
    $(this).val(Math.max(Math.min(value, 999), 1))
  }
})

// Reset custom amount input if the user clicks a preset amount
$('#lp-amounts').click(function () {
  $('#lp-custom-amount').removeClass('selected')
  $('#lp-custom-amount-input').val('')
  $('#lp-custom-amount-placeholder').css('display', 'flex')
})

// Reset custom amount input if it is empty
$('#lp-custom-amount-input').blur(function (e) {
  const isEmpty = !e.target.value
  if (isEmpty) {
    $('#lp-custom-amount').removeClass('selected')
    $('#lp-custom-amount-placeholder').css('display', 'flex')
    $('#lp-amount-1').prop('checked', true)
  }
})

// Close the footer if the user clicks on the X
$('#lp-close-button').click(function () {
  $('#lp-footer').hide()
  if (browserSupportsWebStorage) {
    // Save dismissed timestamp in local storage
    sessionStorage.lp_footer_dismissed = 1
    updateFrameHeight(0)
  }
})

// What happens when the user confirms the contribution amount
$('#lp-confirm-amount').click(function (e) {
  e.preventDefault()
  // Make footer full-page
  $('#lp-footer').css('min-height', '100vh')
  $('#lp-confirm-amount').hide()
  makeFullHeight()
  setTimeout(function () {
    $('#lp-footer-bottom').css('display', 'flex')
    $('#lp-name-input').focus()
  }, 200)
})

// What happens when the user starts the payment process
$('#lp-userData-form').submit(function (e) {
  e.preventDefault()

  // Add loading state to button
  $('#lp-start-payment').prop('disabled', true).text('Loading...')

  // Calculate amount
  let amount
  const isCustomAmountSelected = !!$('#lp-custom-amount.selected').length
  if (isCustomAmountSelected) {
    amount = $('#lp-custom-amount-input').val()
    amount = parseInt(amount) * 100
  } else {
    amount = $('input[name="amount"]:checked').val()
    amount = parseInt(amount)
  }

  // Prepare data for AJAX request
  tabData = {
    amount,
    name: $('#lp-name-input').val(),
    email: $('#lp-email-input').val()
  }

  // Make request to Tapper API
  $.post(
    'https://tapper-contribution-endpoint.vercel.app/api/start-payment',
    {
      amount,
      name: $('#lp-name-input').val(),
      email: $('#lp-email-input').val()
    },
    // success callback
    function (data) {
      tabData.clientSecret = data.client_secret
      tabData.publishableKey = data.publishable_key

      console.log('Reponse from Tapper API', data)

      // Show payment form
      $('#lp-amount-form').hide()
      $('#lp-userData-form').hide()
      $('#lp-payment-form').css('display', 'flex')
      $('#lp-selected-amount').text('$' + amount / 100)

      // Initialize Stripe Elements
      stripe = Stripe(tabData.publishableKey)
      const elements = stripe.elements()
      const style = {
        base: {
          color: '#111',
          fontSize: '18px'
        }
      }

      // Mount credit card input
      lpCreditCardInput = elements.create('card', { style: style })
      lpCreditCardInput.mount('#card-element')
      setTimeout(function () {
        lpCreditCardInput.focus()
      }, 200)
    })
    .fail(function () {
      alert('An error occurred')
      // Remove loading state from button
      $('#lp-start-payment').prop('disabled', false).text('Pay by card')
    })

  console.log('Request to Tapper API', tabData)
})

// What happens when the user confirms the payment
$('#lp-payment-form').submit(function (e) {
  e.preventDefault()
  $('#lp-submit-payment').prop('disabled', true).text('Loading...')

  stripe.confirmCardPayment(
    tabData.clientSecret,
    {
      payment_method: {
        card: lpCreditCardInput,
        billing_details: {
          email: tabData.email,
          name: tabData.name
        }
      },
      receipt_email: tabData.email
    }
  ).then(function (result) {
    if (result.error) {
      // Show error to your customer (e.g., insufficient funds)
      alert(result.error.message)
      // Remove loading state from button
      $('#lp-submit-payment').prop('disabled', false).text(footerOptions.buttonText)
    } else {
      // The payment has been processed!
      if (result.paymentIntent.status === 'succeeded') {
        // Show success message
        $('#lp-payment-form').hide()
        $('#lp-success').show()

        if (browserSupportsWebStorage) {
          // Save contribution timestamp in local storage
          localStorage.lp_last_contribution_at = Date.now()
        }

        // Automatically close footer after 3 seconds
        setTimeout(function () {
          $('#lp-footer').fadeOut()
        }, 3000)
      }
    }
  })
})
