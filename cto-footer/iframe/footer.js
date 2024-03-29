/* global alert, fetch, Stripe */

let clientId, creditCardInput, stripe, tabData

const footerConfig = {
  ctaHeader: null,
  ctaText: null,
  amounts: null,
  clientId: null
}

console.log(footerConfig);
/* DOM ELEMENTS */

const Footer = document.getElementById('cto-footer')
const CloseButton = document.getElementById('cto-close-button')

// Step 1: Select amount
//const SelectAmountForm = document.getElementById('cto-amount-form')
//const PresetAmountsContainer = document.getElementById('cto-preset-amounts')
//const CustomAmountButton = document.getElementById('cto-custom-amount')
//const CustomAmountInput = document.getElementById('cto-custom-amount-input')
//const CustomAmountPlaceholder = document.getElementById('cto-custom-amount-placeholder')
const ConfirmAmountButton = document.getElementById('cto-confirm-amount')

// Step 2: Enter user data
const UserDataForm = document.getElementById('cto-userData-form')
const SelectedAmountText = document.getElementById('cto-selected-amount')
const NameInput = document.getElementById('cto-name-input')
const EmailInput = document.getElementById('cto-email-input')
const StartPaymentButton = document.getElementById('cto-start-payment')

// Step 3: Enter credit card info and submit payment
const PaymentForm = document.getElementById('cto-payment-form')
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
  if (!data || !data.clientId) {
    // console.error('No client ID was specified. Contributions footer is hidden.')
    return
  }
  clientId = data.clientId
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
      const el = document.getElementById('cto-cta-title')
      el.textContent = footerConfig.ctaHeader
    }
    if (footerConfig.ctaText) {
      const el = document.getElementById('cto-cta-text')
      el.textContent = footerConfig.ctaText
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
//CustomAmountPlaceholder.addEventListener('click', function (e) {
//  CustomAmountPlaceholder.style.display = 'none'
//})

// Select custom amount input if the user clicks on it
//CustomAmountButton.addEventListener('click', function (e) {
// const SelectedPresetAmount = document.querySelector('.cto-chooseAmount__radioInput:checked')
//  if (SelectedPresetAmount) {
//    SelectedPresetAmount.checked = false
//  }
//  CustomAmountButton.classList.add('selected')
//  CustomAmountInput.focus()
//})

// Enforce min & max value for input
//CustomAmountInput.addEventListener('input', function (e) {
//  const value = CustomAmountInput.value
//  if ((value !== '') && (value.indexOf('.') === -1)) {
//    CustomAmountInput.value = Math.max(Math.min(value, 999), 1)
//  }
//})

// Reset custom amount input if the user selects a preset amount
//PresetAmountsContainer.addEventListener('click', function (e) {
//  CustomAmountButton.classList.remove('selected')
//  CustomAmountInput.value = ''
//  CustomAmountPlaceholder.style.display = 'flex'
//})

// Reset custom amount input on blur (if it is empty)
//CustomAmountInput.addEventListener('blur', function (e) {
//  if (!CustomAmountInput.value) {
//    CustomAmountButton.classList.remove('selected')
//   CustomAmountPlaceholder.style.display = 'flex'
//    const FirstPresetAmount = document.querySelector('.cto-chooseAmount__radioInput')
//    FirstPresetAmount.checked = true
//  }
//})

  // Set the button to go to the contribute.to card


  ConfirmAmountButton.addEventListener('click', function (e) {
    if (footerConfig.clientId.includes("https")) {
      window.open(footerConfig.clientId)
      Footer.style.display = 'none'

    }
    else {
      window.open('https://' + footerConfig.clientId)
      Footer.style.display = 'none'
    }
    
   })


// Close footer if the user clicks on the X
CloseButton.addEventListener('click', function (e) {
  Footer.style.display = 'none'
  window.parent.postMessage({ ctoFooterDismissed: true }, '*')
})
