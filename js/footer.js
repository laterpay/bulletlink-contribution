var footerOptions = {
	"lpid": "",
	"ctaHeader": "The JHV needs your support",
	"ctaText": "We are working hard to bring you news that matters to the Houston Jewish community. Your contribution will help the JHV continue to provide vital coverage during these important times.",
	"otherText": "OTHER",
	"buttonText": "CONTRIBUTE",
	"amounts": ["4","8","10","12"]
}	


//Set up the footer based on the footerOptions object.
jQuery('#label-1').text('$' + footerOptions.amounts[0]);
jQuery('#label-2').text('$' + footerOptions.amounts[1]);
jQuery('#label-3').text('$' + footerOptions.amounts[2]);
jQuery('#label-4').text('$' + footerOptions.amounts[3]);
jQuery('#amount-1').val(footerOptions.amounts[0]*100);
jQuery('#amount-2').val(footerOptions.amounts[1]*100);
jQuery('#amount-3').val(footerOptions.amounts[2]*100);
jQuery('#amount-4').val(footerOptions.amounts[3]*100);
jQuery('.lp-footer-text-header').text(footerOptions.ctaHeader);
jQuery('.lp-footer-text').text(footerOptions.ctaText);
jQuery('#amount-other').val(footerOptions.otherText);
jQuery('#submit').text(footerOptions.buttonText);

// If the laterPayFooter cookie is not set, show the footer.
if (document.cookie.indexOf("laterpayFooter") === -1){
    jQuery('#footer-header').css("display", "block");
}

jQuery('#amount-other').click(function(){
    jQuery('#amount-other').val('$ ');
    jQuery(".lp-radio-amount").prop('checked', false);
});

jQuery('#amount-other').blur(function(){
    //jQuery('#amount-other').val('OTHER');
    //jQuery("#amount-3").prop('checked', true);
});

// Close the footer if the user clicks on the X
jQuery(".lp-footer-close").click(function() {
    document.cookie = "laterpayFooter";
    jQuery("#lp-footer").css("display","none");
});

// What happens when they click on the "contirbute" button
jQuery('.lp-amount-contribute').click(function(){

    if (jQuery('#amount-other').val() == 'OTHER') {
        var amount = $('input[name="amount"]:checked').val();
    }
    else {         
        var amount =  jQuery('#amount-other').val();
        amount = amount.replace("$","");
        amount = amount.replace(/\.\d+/g, "");
        amount = amount.replace(".","");
        amount = parseInt(amount)*100;
    }


    var now = new Date();
    var now = new Date();
    var time = now.getTime();
    var expireTime = time + 1000*1209600;
    now.setTime(expireTime);

        //document.cookie = 'laterpayFooter;expires='+now.toGMTString()+';path=/';
              document.location = "https://jwt.laterpay.net/test/?amount="+ amount;

});
