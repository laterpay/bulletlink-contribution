/* GLOBAL VARS */

/* global alert, Stripe, $ */
let clientId, creditCardInput, stripe, tabData
const footerConfig = {
  ctaHeader: null,
  ctaText: null,
  buttonText: null,
  customAmountText: null,
  amounts: null,
  highlightColor: null
}

/* HELPERS */

// Dynamically update the parent window's iframe height
let iframeHeight
const adjustFooterHeight = (explicitHeight) => {
  const footerHeight = explicitHeight || document.getElementById('lp-footer').offsetHeight
  if (iframeHeight !== footerHeight) {
    iframeHeight = footerHeight
    window.parent.postMessage({ ctoIframeHeight: iframeHeight }, '*')
  }
}
window.onload = () => adjustFooterHeight()
window.onresize = () => adjustFooterHeight()
window.onmessage = ({ data }) => {
  if (data.clientId) {
    clientId = data.clientId
    console.log(clientId)
    Object.keys(footerConfig).forEach(key => {
      // Replace footerConfig defaults if a corresponding data attribute exists
      if (data[key]) footerConfig[key] = data[key]
    })
    const isConfigIncomplete = !!Object.values(footerConfig).filter(value => !value).length // returns true if at least one value is null
    if (isConfigIncomplete) {
      fetchFooterConfigFromDB(clientId)
      return
    }
    showFooter()
  }
  if (!clientId) {
    console.error('No client ID was specified. Contributions footer will stay hidden.')
  }
}

const showFooter = () => {
  if (clientId && footerConfig) {
    // Set up the footer based on the returned data object.
    if (footerConfig.ctaHeader) {
      $('#lp-cta-title').text(footerConfig.ctaHeader)
    }
    if (footerConfig.ctaText) {
      $('#lp-cta-text').text(footerConfig.ctaText)
    }
    if (footerConfig.amounts) {
      for (var i = 0; i < 4; i++) {
        $(`[for=lp-amount-${i + 1}]`).text('$' + footerConfig.amounts[i])
        $(`#lp-amount-${i + 1}`).val(footerConfig.amounts[i] * 100)
      }
    }
    if (footerConfig.customAmountText) {
      $('#lp-custom-amount-placeholder').text(footerConfig.customAmountText)
    }
    if (footerConfig.buttonText) {
      $('#lp-confirm-amount').text(footerConfig.buttonText)
      $('#lp-submit-payment').text(footerConfig.buttonText)
    }
    if (footerConfig.highlightColor && footerConfig.highlightColor.startsWith('#')) {
      $('#lp-footer').css('border-color', footerConfig.highlightColor)
    }
    $('#lp-footer').show()
    adjustFooterHeight()
  }
}

const fetchFooterConfigFromDB = clientId => {
  // Fetch footer options for given clientId
  $.get(
    'https://x8ki-letl-twmt.n7.xano.io/api:C1-jqt83/footers/' + clientId,
    undefined,
    // success callback
    function (data) {
      // Populate empty footerConfig fields with data from the GET request
      Object.entries(footerConfig).forEach(([key, value]) => {
        const pascalCaseToSnakeCase = input => input.split(/(?=[A-Z])/).join('_').toLowerCase()
        const snakeCaseKey = pascalCaseToSnakeCase(key)
        if (!value && data[snakeCaseKey]) {
          footerConfig[key] = data[snakeCaseKey]
        }
      })
      showFooter()
    })
    .fail(function () {
      console.error('Invalid client ID. Contributions footer will stay hidden.')
    })
}

/* EVENT HANDLERS */

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
  window.parent.postMessage({ ctoFooterDismissed: true }, '*')
})

// What happens when the user confirms the contribution amount
$('#lp-confirm-amount').click(function (e) {
  e.preventDefault()
  // Make footer full-page
  $('#lp-footer').css('min-height', '100vh')
  $('#lp-confirm-amount').hide()
  adjustFooterHeight('100vh')
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
    amount = parseFloat(amount) * 100
    if (amount < 100) amount = 100 // minimum contribution $1
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
    'https://x8ki-letl-twmt.n7.xano.io/api:C1-jqt83/contribute', // 'https://tapper-contribution-endpoint.vercel.app/api/start-payment',
    {
      amount,
      client_id: clientId,
      user_email: $('#lp-email-input').val(),
      user_name: $('#lp-name-input').val()
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
      creditCardInput = elements.create('card', { style: style })
      creditCardInput.mount('#card-element')
      setTimeout(function () {
        creditCardInput.focus()
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
        card: creditCardInput,
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
      $('#lp-submit-payment').prop('disabled', false).text(footerConfig.buttonText)
    } else {
      // The payment has been processed!
      if (result.paymentIntent.status === 'succeeded') {
        // Show success message
        $('#lp-payment-form').hide()
        $('#lp-success').show()
        window.parent.postMessage({ ctoContributionMade: true }, '*')

        // Automatically close footer after 3 seconds
        setTimeout(function () {
          $('#lp-footer').fadeOut()
        }, 3000)
      }
    }
  })
})
