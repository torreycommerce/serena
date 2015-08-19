
var cartCloseTimeout;
var cartTriggerTimeout;

$('button[value=cart]').click(function(event) {
    event.preventDefault();
    // Sum product quantities
    var sum = 0;
    $('#productForm .quantity-selector').each(function() {
        if (!isNaN($(this).val())) {
            sum += parseInt($(this).val());
        }
    });

    if (sum === 0) {
        alert('Need to enter a quantity!');
        return false;
    }

    // Disable submit button
    $('button[value=cart]').attr('disabled',true);
    $.post(acendaBaseUrl + '/product/route',
        $('#productForm').serialize())
    .always(function(data) {
        // Make sure to reenable it, success or failure
        $('button[value=cart]').attr('disabled',false);
        $("html, body").animate({ scrollTop: 0 }, 600);
    })
    .fail(function() {
        alert("Failed to add item(s) to cart.");
    })
    .success(function(){
        var items = parseInt($("header#main section#branding .nav-header .nav-icon-outline.cart.pull-right .badge").text());
        $("header#main section#branding .nav-header .nav-icon-outline.cart.pull-right .badge").text(String((items+sum)));
    });
});