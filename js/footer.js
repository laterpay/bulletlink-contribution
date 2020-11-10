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

    if ($('input[name="type"]:checked').val() == 'single') {
        //document.cookie = 'laterpayFooter;expires='+now.toGMTString()+';path=/';
        document.location = "https://web.uselaterpay.com/dialog/contribute/pay_now?url=https%3A%2F%2Fjhvonline.com%2F&campaign_id=0cb6df18-eafc-4a16-91aa-dcec43ddba7d&permalink=1&cp=HwAA74fyGR8MKh7zNZ5JPK&title=Contribution+to+Jewish+Herald-Voice&hmac=499ce6740061cb4458b394e400544ee43d83e88a8d15029f83a60376&custom_pricing=USD"+ amount;
    }
    else {
        //contribute(500);
    }


});