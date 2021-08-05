/* GLOBAL VARIABLES */

/* global alert, fetch, Stripe */
let clientId, creditCardInput, stripe, tabData

const footerConfig = {
  ctaHeader: null,
  ctaText: null,
  amounts: null
}

/* DOM ELEMENTS */

const Footer = document.getElementById('cto-footer')
const CloseButton = document.getElementById('cto-close-button')

const SelectAmountForm = document.getElementById('cto-amount-form')
const UserDataForm = document.getElementById('cto-userData-form')
const PaymentForm = document.getElementById('cto-payment-form')

const PresetAmountsContainer = document.getElementById('cto-preset-amounts')
const CustomAmountButton = document.getElementById('cto-custom-amount')
const CustomAmountInput = document.getElementById('cto-custom-amount-input')
const CustomAmountPlaceholder = document.getElementById('cto-custom-amount-placeholder')
const ConfirmAmountButton = document.getElementById('cto-confirm-amount')

const NameInput = document.getElementById('cto-name-input')
const EmailInput = document.getElementById('cto-email-input')
const StartPaymentButton = document.getElementById('cto-start-payment')
const SubmitPaymentButton = document.getElementById('cto-submit-payment')
const SuccessMessage = document.getElementById('cto-success')

/* HELPERS */

// Dynamically update the parent window's iframe height
let iframeHeight
const adjustFooterHeight = (explicitHeight) => {
  const footerHeight = explicitHeight || Footer.offsetHeight
  if (iframeHeight !== footerHeight) {
    iframeHeight = footerHeight
    window.parent.postMessage({ ctoIframeHeight: iframeHeight }, '*')
  }
}
window.onload = () => adjustFooterHeight()
window.onresize = () => adjustFooterHeight()
window.onmessage = ({ data }) => {
  if (!data.clientId) {
    console.error('No client ID was specified. Contributions footer is hidden.')
  }
  clientId = data.clientId
  // console.log(clientId)
  Object.keys(footerConfig).forEach(key => {
    // Replace footerConfig defaults if a corresponding data attribute exists
    if (data[key]) footerConfig[key] = data[key]
  })
  const isConfigIncomplete = Object.values(footerConfig).some(value => !value) // returns true if at least one value is null
  if (isConfigIncomplete) {
    fetchFooterConfigFromDB(clientId)
    return
  }
  showFooter()
}

const showFooter = () => {
  if (clientId && footerConfig) {
    // Set up the footer based on the returned data object.
    if (footerConfig.ctaHeader) {
      const el = document.querySelector('#cto-cta-title')
      el.textContent = footerConfig.ctaHeader
    }
    if (footerConfig.ctaText) {
      const el = document.querySelector('#cto-cta-text')
      el.textContent = footerConfig.ctaText
    }
    if (footerConfig.amounts) {
      for (let i = 0; i < 4; i++) {
        const label = document.querySelector(`[for=cto-amount-${i + 1}]`)
        const input = document.querySelector(`#cto-amount-${i + 1}`)
        const amount = footerConfig.amounts[i]
        if (amount && !isNaN(amount) && amount < 1000) {
          label.textContent = '$' + amount
          input.value = amount * 100
          continue
        }
        // Delete DOM elements if no amount was provided
        label.remove()
        input.remove()
      }
    }
    Footer.style.opacity = 1
    adjustFooterHeight()
  }
}

const fetchFooterConfigFromDB = clientId => {
  // Fetch footer config for given clientId
  fetch('https://x8ki-letl-twmt.n7.xano.io/api:C1-jqt83/footers/' + clientId)
    .then(
      function (response) {
        if (response.status !== 200) {
          throw new Error(response.status)
        }
        // Success
        response.json().then(function (data) {
          // Populate empty footerConfig fields with data from the GET request
          Object.entries(footerConfig).forEach(([key, value]) => {
            const pascalCaseToSnakeCase = input => input.split(/(?=[A-Z])/).join('_').toLowerCase()
            const snakeKey = pascalCaseToSnakeCase(key)
            if (!value && data[snakeKey]) {
              footerConfig[key] = data[snakeKey]
            }
          })
          showFooter()
        })
      })
    .catch(function (err) {
      console.error('Invalid client ID. Contributions footer will stay hidden.', err)
    })
}

/* EVENT HANDLERS */

// Hide input placeholder if the user clicks on it
CustomAmountPlaceholder.addEventListener('click', function (e) {
  CustomAmountPlaceholder.style.display = 'none'
})

// Select custom amount input if the user clicks on it
CustomAmountButton.addEventListener('click', function (e) {
  const SelectedPresetAmount = document.querySelector('.cto-chooseAmount__radioInput:checked')
  if (SelectedPresetAmount) {
    SelectedPresetAmount.checked = false
  }
  CustomAmountButton.classList.add('selected')
  CustomAmountInput.focus()
})

// Enforce min & max value for input
CustomAmountInput.addEventListener('input', function (e) {
  const value = CustomAmountInput.value
  if ((value !== '') && (value.indexOf('.') === -1)) {
    CustomAmountInput.value = Math.max(Math.min(value, 999), 1)
  }
})

// Reset custom amount input if the user selects a preset amount
PresetAmountsContainer.addEventListener('click', function (e) {
  CustomAmountButton.classList.remove('selected')
  CustomAmountInput.value = ''
  CustomAmountPlaceholder.style.display = 'flex'
})

// Reset custom amount input on blur (if it is empty)
CustomAmountInput.addEventListener('blur', function (e) {
  if (!CustomAmountInput.value) {
    CustomAmountButton.classList.remove('selected')
    CustomAmountPlaceholder.style.display = 'flex'
    const SelectedPresetAmount = document.querySelector('#cto-amount-1')
    SelectedPresetAmount.checked = true
  }
})

// Close footer if the user clicks on the X
CloseButton.addEventListener('click', function (e) {
  Footer.style.display = 'none'
  window.parent.postMessage({ ctoFooterDismissed: true }, '*')
})

// What happens when the user confirms the contribution amount
ConfirmAmountButton.addEventListener('click', function (e) {
  e.preventDefault()
  // Display contributions amount buttons (in case they're hidden)
  const OptionsGroup = document.querySelector('.cto-chooseAmount__optionsGroup')
  OptionsGroup.style.display = 'flex'
  // Expand footer
  Footer.style.minHeight = '100vh'
  adjustFooterHeight('100vh')
  setTimeout(function () {
    const BottomSection = document.querySelector('#cto-footer-bottom')
    BottomSection.style.display = 'flex'
    ConfirmAmountButton.style.display = 'none'
    NameInput.focus()
  }, 200)
})

// What happens when the user starts the payment process
UserDataForm.addEventListener('submit', function (e) {
  e.preventDefault()

  // Add loading state to button
  StartPaymentButton.disabled = true
  StartPaymentButton.textContent = 'Processing...'

  // Calculate amount
  let amount
  const isCustomAmountSelected = CustomAmountButton.classList.contains('selected')
  if (isCustomAmountSelected) {
    amount = CustomAmountInput.value
    amount = parseFloat(amount) * 100
  } else {
    const SelectedAmountInput = document.querySelector('input[name="amount"]:checked')
    amount = SelectedAmountInput.value
    amount = parseInt(amount)
  }
  if (amount < 100 || isNaN(amount)) {
    amount = 100 // minimum contribution $1
  }

  // Populate tabData object
  tabData = {
    amount,
    name: NameInput.value,
    email: EmailInput.value
  }

  // Prepare data for API request
  const requestBody = new URLSearchParams()
  requestBody.append('amount', amount)
  requestBody.append('client_id', clientId)
  requestBody.append('user_email', tabData.email)
  requestBody.append('user_name', tabData.name)

  // Send request to Tapper API
  fetch('https://x8ki-letl-twmt.n7.xano.io/api:C1-jqt83/contribute', {
    method: 'post',
    body: requestBody
  })
    .then(
      function (response) {
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' + response.status)
          return
        }

        // Success
        response.json().then(function (data) {
          // console.log('Reponse from Tapper API', data)

          tabData.clientSecret = data.client_secret
          tabData.publishableKey = data.publishable_key

          // Show payment form
          SelectAmountForm.style.display = 'none'
          UserDataForm.style.display = 'none'
          PaymentForm.style.display = 'flex'
          const SelectedAmountText = document.getElementById('cto-selected-amount')
          SelectedAmountText.textContent = '$' + amount / 100

          // Initialize Stripe Elements
          stripe = Stripe(tabData.publishableKey)
          const elements = stripe.elements()

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

          // Mount Payment Request Button (Apple Pay)
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
          creditCardInput = elements.create('card', {
            style: {
              base: {
                color: '#111',
                fontSize: '18px'
              }
            }
          })
          creditCardInput.mount('#card-element')
          setTimeout(function () {
            creditCardInput.focus()
          }, 200)
        })
      })
    .catch(function (err) {
      alert('An error occurred')
      console.log('Fetch Error', err)
      // Remove loading state from button
      StartPaymentButton.disabled = false
      StartPaymentButton.textContent = 'Pay by card'
    })
})

// What happens when the user confirms the payment
PaymentForm.addEventListener('submit', function (e) {
  e.preventDefault()
  SubmitPaymentButton.disabled = true
  SubmitPaymentButton.textContent = 'Processing...'

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
      SubmitPaymentButton.disabled = false
      SubmitPaymentButton.textContent = 'Contribute'
    } else {
      // The payment has been processed!
      if (result.paymentIntent.status === 'succeeded') {
        // Show success message
        PaymentForm.style.display = 'none'
        SuccessMessage.style.display = 'block'
        window.parent.postMessage({ ctoContributionMade: true }, '*')

        // Automatically close footer after 3 seconds
        setTimeout(function () {
          Footer.style.opacity = 0
        }, 3000)
      }
    }
  })
})
