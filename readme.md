# On-page contributions footer

## How to use it?

Just add the following script tag to your site:

```html
  <script
    id="cto-footer"
    src="http://niklas.laterpaydemo.com/cto-footer/on-page.js"
    data-client-id="client.5c8ead95-9fff-48ca-ae87-53f5d3d3429e"
    data-cta-header="ABC needs your support"
    data-cta-text="We are working hard to bring you news that matters. Your contribution will help us continue to provide vital coverage during these important times."
    data-custom-amount-text="Custom amount"
    data-button-text="Contribute"
    data-amounts="4,8,10,15"
  >
  </script>
```
The following attributes are required: `id`, `src`, `data-client-id`

All other attributes are optional. They can be used to customize the appearance of the footer.

If at least one optional attribute isn't specified, the script will attempt to retrieve a value by making a GET request to `https://x8ki-letl-twmt.n7.xano.io/api:C1-jqt83/footers/{client_id}`. If that endpoint doesn't return a value either, the footer will just show a default value.


## How does it work?

The script will add an iframe to the page, which contains the contributions footer. There are no page redirects. The entire payment flow takes place on the merchant's site.

When a user clicks the **✕** symbol in the top right corner, the footer will disappear and won't be displayed again for the remainder of the browser session.

When a user makes a contribution, they will see a thank you message for 3 seconds. After that, the footer will disappear and won't be displayed again for the next 30 days.


## Testing

Use the [test credit card numbers provided by Stripe](https://stripe.com/docs/testing).