var inventory = {};
var recipeList = {};
var notified;

$(function() {
    url = "http://192.168.10.79/fridgeio/getInventory.php";
    data = "";
    dataType = "json";
    var response = callToServer(url,data,dataType);
    console.log(response);
    inventory = response;
    notified = false;
    $('a[href="#home"]').click();
    loopLoadDataFromServer();
    window.setInterval(function(){
        loopLoadDataFromServer();
    }, 3000);

});

function loopLoadDataFromServer() {

    url = "http://192.168.10.79/fridgeio/getInventory.php";
    data = "";
    dataType = "json";

    var response = callToServer(url,data,dataType);
    console.log(response);
    inventory = response;
    createInventoryItems(inventory);

    let items = checkIfItemsWillExpireSoon();
    notifyUserItemsWillExpire(items);

}

function checkIfItemsWillExpireSoon(){

    const minDaysBeforeAlerting = 2;
    let expiringSoon = [];
    for(let i = 0; i < inventory.length; i++) {
        let expiresIn = inventory[i].time;
        if(expiresIn <= minDaysBeforeAlerting) {
            expiringSoon.push(i);
        }
    }
    return expiringSoon;
}

function notifyUserItemsWillExpire(items) {

    if(notified === false) {
        for (let i = 0; i < items.length; i++) {
            let name = inventory[items[i]].item;
            $(function () {
                new PNotify({
                    title: 'Hey!',
                    addclass: 'translucent',
                    text: 'Your ' + name + 's will expire soon! Check out some recipes.',
                });
            });
        }
        notified = true;
    }
}

$('#myTab').on("click", "li", function (event) {
    let activeTab = $(this).find('a').attr('href');

    if(activeTab === "#inventory") {
        createInventoryItems();
    }
    else if(activeTab === "#recipe") {
        getRecipe();
    }
    else if(activeTab === "#home") {
        loadRecipeForNearlyExpiredItems();
    }
});

function loadRecipeForNearlyExpiredItems() {

  let ingredientList = "";
    let expiringSoon = checkIfItemsWillExpireSoon();
    for(let i = 0; i < expiringSoon.length; i++) {
    ingredientList += inventory[expiringSoon[i]].item;
    ingredientList += ",";
    }
    createHomePageRecipes(ingredientList);
}

function createHomePageRecipes(ingredientList) {

    let recipes;
    $.ajax({
        url: 'https://api.edamam.com/search?q=' + ingredientList + '&app_id=bb749091&app_key=d64b159f943cae2300647598afd55894',
        dataType: "json",
        async: false,
    }).then(function(response) {
        recipes = response.hits;

        $('.recipe-card-home').remove();
        $('.home-message').remove();

        if(recipes.length > 0) {
            $('#homeRecipeList').append("<h1 class=\"card-header home-message\">Hey... you should make this tonight.</h1>" +
            " <div class=\"space-block\"></div>");
            for (let i = 0; i < recipes.length; i++) {
                let title = recipes[i].recipe.label;
                let image = recipes[i].recipe.image;
                let calories = parseInt(recipes[i].recipe.calories);

                $('#homeRecipeList').append("<div class=\"card recipe-card-home\" >\n" +
                    "  <img class=\"card-img-top\" src='" + image + "' alt=\"Card image cap\">\n" +
                    "  <div class=\"card-body\">\n" +
                    "    <h5 class=\"card-title recipe-card-title\"><b>" + title + "</b></h5>\n" +
                    "    <p class=\"card-text recipe-card-text\">Calories: " + calories + "</p>\n" +
                    "    <a href=\"#\" class=\"btn btn-primary recipe-card-button\" id='recp_" + i + "' onclick=\"getRecipeDetails(this.id)\" class=\"btn btn-primary recipe-card-button\">View Recipe</a>\n" +
                    "  </div>\n" +
                    "</div>")
            }
        }
        else {
            $('#homeRecipeList').append("<div class=\"card recipe-card-home\" >\n" +
                "    <h1 class=\"card-header home-message\">No produce will expire soon.</h1>\n" +
                "</div>")
        }

    });


}
function callToServer(url,data, datsaType) {

    var response;
    $.ajax({
        url: url,
        type: 'POST',
        data: data,
        async: false,
        dataType: dataType,
        success: function(data) {
            response = data;
        },
    });
    return response;
}

function createInventoryItems() {

    $('.inventory-items').remove();
    for(let i = 0; i < inventory.length; i++) {
        let item = inventory[i].item;
        let quantity = inventory[i].quantity;
        let expiry = inventory[i].expiry_date;

        $('#inventoryList').append( "<button type=\"button\" id=\"item_" + i +"\" data-toggle=\"modal\" class=\"inventory-items\" data-target=\"#itemModal\" onclick=\"createItemModal(this.id)\" class=\"list-group-item list-group-item-action\">\n" +
            "                        <div class=\"container\">\n" +
            "                            <div class=\"row inventory-item\">\n" +
            "                                <div class=\"col col-sm-4 item-main\"><b>"+ item + "</b></div>\n" +
            "                                <div class=\"col col-sm-3 item-sub\">Qty: "+ quantity +"</div>\n" +
            "                                <div class=\"col col-sm item-sub\">Expires: " + expiry + "</div>\n" +
            "                            </div>\n" +
            "                        </div>\n" +
            "                    </button>")
    }
}

function createItemModal(itemID) {

    let itemIndex = parseItemID(itemID);
    let itemName = inventory[itemIndex].item;
    let quantity = inventory[itemIndex].quantity;
    let insertDate = inventory[itemIndex].input_date;
    let expiryDate = inventory[itemIndex].expiry_date;


$('#itemModalBox').append( "<div class=\"modal \" id=\"itemModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"exampleModalLabel\" aria-hidden=\"true\">\n" +
    "  <div class=\"modal-dialog\" role=\"document\">\n" +
    "    <div class=\"modal-content\">\n" +
    "      <div class=\"modal-header\">\n" +
    "        <h5 class=\"modal-title\" id=\"\">" + itemName + "</h5>\n" +
    "        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">\n" +
    "          <span aria-hidden=\"true\">&times;</span>\n" +
    "        </button>\n" +
    "      </div>\n" +
    "      <div class=\"modal-body\">\n" +
    "      <h5 class=\"modal-item\" id=\"\">Quantity: " + quantity + "</h5>\n" +
    "      <h5 class=\"modal-item\" id=\"\">Date Added:" + insertDate + "</h5>\n" +
    "      <h5 class=\"modal-item\" id=\"\">Expiry Date:" + expiryDate + "</h5>\n" +
    "      </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>")

}

function parseItemID(itemID) {

    let noChars = itemID.substring(5);
    console.log(noChars);
    let index = parseInt(noChars);
    return index;

}

function loadRecipesForSpecificItem(index) {



}
function getRecipe(){

    let ingredients = "";
    let min = 0;
    let max = inventory.length;
    const numIngredients = 3;
    /* Ingredient values */
    for(let i = 0; i <numIngredients; i++) {

        let random =Math.floor(Math.random() * (+max - +min)) + +min;
        let ingredient = inventory[random].item;
        ingredients += ingredient;
        ingredients += ",";
    }
    $.ajax({
        url: 'https://api.edamam.com/search?q=' + ingredients + '&app_id=bb749091&app_key=d64b159f943cae2300647598afd55894',
        dataType: "json",
        async: false,
    }).then(function(response) {
        console.log(response);
        var results = response.hits;
        createRecipeList(results);
    });
}

function createRecipeList(recipes) {

    $('.recipe-card').remove();
    recipeList = recipes;
    for (let i = 0; i < recipes.length; i++) {
        let title = recipes[i].recipe.label;
        let image = recipes[i].recipe.image;
        let calories = parseInt(recipes[i].recipe.calories);

        $('#recipeList').append("<div class=\"card recipe-card\" >\n" +
            "  <img class=\"card-img-top\" src='" + image +"' alt=\"Card image cap\">\n" +
            "  <div class=\"card-body\">\n" +
            "    <h5 class=\"card-title recipe-card-title\"><b>" + title + "</b></h5>\n" +
            "    <p class=\"card-text recipe-card-text\">Calories: " + calories + "</p>\n" +
            "    <a href=\"#\" class=\"btn btn-primary recipe-card-button\" id='recp_" + i + "' onclick=\"getRecipeDetails(this.id)\" class=\"btn btn-primary recipe-card-button\">View Recipe</a>\n" +
            "  </div>\n" +
            "</div>")
    }
}

function getRecipeDetails(id) {

    let recipeID  = parseItemID(id);
    let url = recipeList[recipeID].recipe.url;
    window.open(url);
    // let itemName = inventory[itemIndex].item;
    // let quantity = inventory[itemIndex].quantity;
    // let insertDate = inventory[itemIndex].input_date;
    // let expiryDate = inventory[itemIndex].expiry_date;

    //
    // $('#itemModalBox').append( "<div class=\"modal \" id=\"itemModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"exampleModalLabel\" aria-hidden=\"true\">\n" +
    //     "  <div class=\"modal-dialog\" role=\"document\">\n" +
    //     "    <div class=\"modal-content\">\n" +
    //     "      <div class=\"modal-header\">\n" +
    //     "        <h5 class=\"modal-title\" id=\"\">" + itemName + "</h5>\n" +
    //     "        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">\n" +
    //     "          <span aria-hidden=\"true\">&times;</span>\n" +
    //     "        </button>\n" +
    //     "      </div>\n" +
    //     "      <div class=\"modal-body\">\n" +
    //     "      <h5 class=\"modal-item\" id=\"\">Quantity: " + quantity + "</h5>\n" +
    //     "      <h5 class=\"modal-item\" id=\"\">Date Added:" + insertDate + "</h5>\n" +
    //     "      <h5 class=\"modal-item\" id=\"\">Expiry Date:" + expiryDate + "</h5>\n" +
    //     "      </div>\n" +
    //     "      <div class=\"modal-footer\">\n" +
    //     "           <div class=\"deleteButton\">\n" +
    //     "        <button type=\"button\" class=\"btn btn-secondary delete\" data-dismiss=\"modal\">Delete</button>\n" +
    //     "      </div>\n" +
    //     "           <div class=\"getRecipeButton\">\n" +
    //     "        <button type=\"button\" class=\"btn btn-primary find-recipe\">Find Me A Recipe!</button>\n" +
    //     "      </div>\n" +
    //     "      </div>\n" +
    //     "    </div>\n" +
    //     "  </div>\n" +
    //     "</div>")

}