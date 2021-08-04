/* GLOBAL VARIABLES */

/* global alert, Stripe, $ */
let clientId, creditCardInput, stripe, tabData

const footerConfig = {
  ctaHeader: null,
  ctaText: null,
  amounts: null
}

/* HELPERS */

// Dynamically update the parent window's iframe height
let iframeHeight
const adjustFooterHeight = (explicitHeight) => {
  const footerHeight = explicitHeight || document.getElementById('cto-footer').offsetHeight
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
    // console.log(clientId)
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
      $('#cto-cta-title').text(footerConfig.ctaHeader)
    }
    if (footerConfig.ctaText) {
      $('#cto-cta-text').text(footerConfig.ctaText)
    }
    if (footerConfig.amounts) {
      for (var i = 0; i < 4; i++) {
        $(`[for=cto-amount-${i + 1}]`).text('$' + footerConfig.amounts[i])
        $(`#cto-amount-${i + 1}`).val(footerConfig.amounts[i] * 100)
      }
    }
    $('#cto-footer').show()
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
$('#cto-custom-amount-placeholder').click(function (e) {
  $('#cto-custom-amount-placeholder').hide()
})

// Select custom amount input if the user clicks on it
$('#cto-custom-amount').click(function () {
  $('.cto-chooseAmount__radioInput').prop('checked', false)
  $('#cto-custom-amount').addClass('selected')
  $('#cto-custom-amount-input').focus()
})

// Enforce min & max value for input
$('#cto-custom-amount-input').on('input', function () {
  const value = $(this).val()
  if ((value !== '') && (value.indexOf('.') === -1)) {
    $(this).val(Math.max(Math.min(value, 999), 1))
  }
})

// Reset custom amount input if the user clicks a preset amount
$('#cto-amounts').click(function () {
  $('#cto-custom-amount').removeClass('selected')
  $('#cto-custom-amount-input').val('')
  $('#cto-custom-amount-placeholder').css('display', 'flex')
})

// Reset custom amount input if it is empty
$('#cto-custom-amount-input').blur(function (e) {
  const isEmpty = !e.target.value
  if (isEmpty) {
    $('#cto-custom-amount').removeClass('selected')
    $('#cto-custom-amount-placeholder').css('display', 'flex')
    $('#cto-amount-1').prop('checked', true)
  }
})

// Close the footer if the user clicks on the X
$('#cto-close-button').click(function () {
  $('#cto-footer').hide()
  window.parent.postMessage({ ctoFooterDismissed: true }, '*')
})

// What happens when the user confirms the contribution amount
$('#cto-confirm-amount').click(function (e) {
  e.preventDefault()
  // Display optionsGroup (in case it's hidden)
  $('.cto-chooseAmount__optionsGroup').css('display', 'flex')
  // Make footer full-page
  $('#cto-footer').css('min-height', '100vh')
  $('#cto-confirm-amount').hide()
  adjustFooterHeight('100vh')
  setTimeout(function () {
    $('#cto-footer-bottom').css('display', 'flex')
    $('#cto-name-input').focus()
  }, 200)
})

// What happens when the user starts the payment process
$('#cto-userData-form').submit(function (e) {
  e.preventDefault()

  // Add loading state to button
  $('#cto-start-payment').prop('disabled', true).text('Processing...')

  // Calculate amount
  let amount
  const isCustomAmountSelected = !!$('#cto-custom-amount.selected').length
  if (isCustomAmountSelected) {
    amount = $('#cto-custom-amount-input').val().replace('$', '')
    amount = parseFloat(amount) * 100
  } else {
    amount = $('input[name="amount"]:checked').val().replace('$', '')
    amount = parseInt(amount)
  }
  if (amount < 100 || isNaN(amount)) {
    amount = 100 // minimum contribution $1
  }

  // Prepare data for AJAX request
  tabData = {
    amount,
    name: $('#cto-name-input').val(),
    email: $('#cto-email-input').val()
  }

  // Make request to Tapper API
  $.post(
    'https://x8ki-letl-twmt.n7.xano.io/api:C1-jqt83/contribute', // 'https://tapper-contribution-endpoint.vercel.app/api/start-payment',
    {
      amount,
      client_id: clientId,
      user_email: $('#cto-email-input').val(),
      user_name: $('#cto-name-input').val()
    },
    // success callback
    function (data) {
      tabData.clientSecret = data.client_secret
      tabData.publishableKey = data.publishable_key

      console.log('Reponse from Tapper API', data)

      // Show payment form
      $('#cto-amount-form').hide()
      $('#cto-userData-form').hide()
      $('#cto-payment-form').css('display', 'flex')
      $('#cto-selected-amount').text('$' + amount / 100)

      // Initialize Stripe Elements
      stripe = Stripe(tabData.publishableKey)

      // Create payment request (Apple Pay)
      const paymentRequest = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Demo total',
          amount
        }
        // requestPayerName: true,
        // requestPayerEmail: true,
      })

      const elements = stripe.elements()
      const style = {
        base: {
          color: '#111',
          fontSize: '18px'
        }
      }

      // Mount Payment Request Button
      const prButton = elements.create('paymentRequestButton', {
        paymentRequest
      });
      (async () => {
        // Check the availability of the Payment Request API first.
        const result = await paymentRequest.canMakePayment()
        if (result) {
          prButton.mount('#payment-request-button')
        } else {
          document.getElementById('payment-request-button').style.display = 'none'
        }
      })()

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
      $('#cto-start-payment').prop('disabled', false).text('Pay by card')
    })

  console.log('Request to Tapper API', tabData)
})

// What happens when the user confirms the payment
$('#cto-payment-form').submit(function (e) {
  e.preventDefault()
  $('#cto-submit-payment').prop('disabled', true).text('Processing...')

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
      $('#cto-submit-payment').prop('disabled', false).text('Contribute')
    } else {
      // The payment has been processed!
      if (result.paymentIntent.status === 'succeeded') {
        // Show success message
        $('#cto-payment-form').hide()
        $('#cto-success').show()
        window.parent.postMessage({ ctoContributionMade: true }, '*')

        // Automatically close footer after 3 seconds
        setTimeout(function () {
          $('#cto-footer').fadeOut()
        }, 3000)
      }
    }
  })
})
