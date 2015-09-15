$(function() {
    if(VariantsData.isCollection){
        $.each(VariantsData.products, function(index, product){
            new VariantsManager(product.variants, product.variant_options, true).init();
        });
    }else{
        new VariantsManager(VariantsData.products[0].variants, VariantsData.products[0].variant_options, false).init();
    }
});

var disabled_cart_button = 0;

function VariantsManager (variants, variant_options, isCollection) {
    var self = this;
    this.variants = variants;
    this.variant_options = variant_options;
    this.isCollection = isCollection;
    this.product_id = this.variants[0].product_id;
    this.selector = "[id=variation-selector-"+this.product_id+"]";
    this.selectsData = {};
    this.selectedValues = {};
    this.disabled = false;
    this.outOfStock = "Out of stock, please try another combination";

    this.jqSelector = function(str){
        var temp = str.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
        return temp;
    }

    this.getVariationSelector = function(selectName, optionValue){
        return "[id=variation-selector-"+ this.jqSelector(self.product_id+"-"+selectName+"-"+optionValue) +"]";
    }
    this.getSelectedValue = function(selectName){
        return "[id=selected-"+ this.jqSelector(selectName+"-"+self.product_id) +"]";
    }
    this.getProductVariation = function(variant_id){
        return "[id=product-" + variant_id + "]";
    }

    this.updateChips = function(){
        var self = this;
        $.each(self.selectsData, function(name, optionArray){
            var selectedValues2 = {};

            $.each(self.selectsData, function(name2, optionArray2){
                if(name2 != name){
                    if(self.selectedValues[name2]){
                        selectedValues2[name2] = self.selectedValues[name2];
                    }
                }
            });
            
            var filteredVariants = self.getFilteredVariants(selectedValues2);
            var generatedSelectsData = self.generateSelectsData(filteredVariants);

            $.each(optionArray, function(index, value){

                if(generatedSelectsData[name].indexOf(value) < 0){
                    if(self.selectedValues[name] == value){
                        // Selected, not available
                        $(self.getVariationSelector(name, value)).attr("class", "notavailable-selected");
                        $(self.getVariationSelector(name, value)).tooltip();
                    }else{
                        //not selected not available
                        $(self.getVariationSelector(name, value)).attr("class", "notavailable");
                        $(self.getVariationSelector(name, value)).tooltip();
                    }
                }else{
                    if(self.selectedValues[name] == value){
                        //Selected, available
                        $(self.getVariationSelector(name, value)).attr("class", "selected");
                        $(self.getVariationSelector(name, value)).tooltip("destroy");
                    }else{
                        //not Selected available
                        $(self.getVariationSelector(name, value)).attr("class", "");
                        $(self.getVariationSelector(name, value)).tooltip("destroy");
                    }
                }
            });

            //Update option value selected
            $(self.getSelectedValue(name)).text(self.selectedValues[name]);
        });

        //hide and show variant div to display proper variant picture
        var filteredVariants = self.getFilteredVariants(self.selectedValues);

        if(filteredVariants.length == 1){
            
            //hide and show proper variant, set quantity inputs
            $.each(self.variants, function(index, variant){
                var id = self.getProductVariation(variant.id);
                var quantityInput = "input[name='items["+ variant.id +"]']";
                if(variant.id == filteredVariants[0].id){
                    $(id).show();
                    if(self.isCollection){
                        $(quantityInput).val(0);
                    }else{
                        $(quantityInput).val(1);
                    }
                    
                }else{
                    $(quantityInput).val(0);
                    $(id).hide();
                }
            });

            //Disable/Enable button according to variants availability            
            if(self.isCollection){
                if(this.disabled == true){
                    this.disabled = false;
                    disabled_cart_button--;
                    if(disabled_cart_button == 0){
                        self.disableAddToCart(false);
                    }
                }
            }else{
                if(filteredVariants[0].has_stock){
                    self.disableAddToCart(false);
                }else{
                    self.disableAddToCart(true);
                } 
            } 
        }else{
            if(self.isCollection){
                if(this.disabled == false){
                    this.disabled = true;
                    self.disableAddToCart(true);
                    disabled_cart_button++;
                }
            }else{
                self.disableAddToCart(true);
            }
        }
    }

    this.disableAddToCart = function(boolean){
        $('button[value=cart]').attr('disabled',boolean);
        $('button[value=registry]').attr('disabled',boolean);
        $('button[value=wishlist]').attr('disabled',boolean);
    }

    this.updateVariants = function(selectName, optionValue){
        var self = this;

        self.selectedValues[selectName] = optionValue;
        var filteredVariants = self.getFilteredVariants(self.selectedValues);

        if(filteredVariants.length == 0 ){
            // display the default variant evalable 
            var temp = {};
            temp[selectName] = optionValue;
            filteredVariants = self.getFilteredVariants( temp );
            //Default selected variant with the new selected value
            if(filteredVariants.length != 0){
                $.each(self.selectsData, function(selectName, optionArray){
                    self.selectedValues[selectName] = filteredVariants[0][selectName];
                });
            }
        }
        self.updateChips();
    }

    this.generateSelectsData = function(filteredVariants){
        var self = this;
        var selects = {};
        $.each( this.selectsData, function(optionName, values){
            selects[optionName] = [];
        });
        $.each( filteredVariants, function(index, variant){
            $.each( selects, function(optionName, values){
                if( values.indexOf(variant[optionName])<0 )
                    values.push(variant[optionName]);
            });
        });

        return selects;
    }

    this.getFilteredVariants = function(selectedValues){
        var filteredVariants = [];
        var self = this;

        $.each( this.variants, function(index, variant){
            var passfilter = true;
            if(variant.price > 0){
                $.each( selectedValues, function(selectName, selectValue){
                    if(selectValue != ""){
                        if(variant[selectName]){
                            if(variant[selectName] != selectValue){
                                passfilter = false;
                            }
                        }else{
                            passfilter = false;
                        }
                    }
                });
            }else{
                passfilter = false;
            }
            if(passfilter) filteredVariants.push(variant);
        });
        return filteredVariants;
    }

    this.getATag = function(selectName, optionValue){
        var self = this;
        return tag =  $('<a>', {class: ""}).text(optionValue);
    }

    this.getAColorTag = function(selectName, optionValue, color){
        var self = this;
        return tag =  $('<a>', {class: "", style:"background-color:"+color});
    }

    this.buildChips = function(variant_options){
        var self = this;
        $.each(variant_options, function(index, option){
            var selectName = option.name;
            var optionArray = option.values;

            //Color styling
            if( selectName.toLowerCase() == "color"){
                if(self.isCollection){
                    var div = $('<div>', {id: "variation-selector-"+self.product_id+"-"+selectName, name: selectName, class: "dropdown"}); 
                }else{
                    var div = $('<div>', {id: "variation-selector-"+self.product_id+"-"+selectName, name: selectName, class: "dropdown"});
                }
     
                var ul = $('<ul>', {class: ""});  
                var button = $('<div>', {    class: "dropdown-trigger", 
                                                onclick: "dropdown_trigger(event, "+"'variation-selector-"+self.product_id+"-"+selectName+"')"
                                            }).append(
                                                $('<strong>', {}).text(selectName.slice(0,1).toUpperCase()+selectName.slice(1,selectName.length) + ":  ") 
                            ); 

            }else{//size (default) styling
                var div = $('<div>', {id: "variation-selector-"+self.product_id+"-"+selectName, name: selectName, class: "dropdown"});           
                var ul = $('<ul>', {class: ""});  
                var button = $('<div>', {    class: "dropdown-trigger", 
                                                onclick: "dropdown_trigger(event, "+"'variation-selector-"+self.product_id+"-"+selectName+"')"
                                            }).append(
                                $('<strong>', {}).text(selectName.slice(0,1).toUpperCase()+selectName.slice(1,selectName.length) + ":  ")
                            );
            }

            $.each(optionArray, function(index, optionValue){
                ul.append( 
                    $('<li>', { id: "variation-selector-"+self.product_id+"-"+selectName+"-"+optionValue, 
                                class: "",
                                "data-tooltip": "",
                                "data-toggle": "tooltip",
                                "data-placement":"top",
                                "title": self.outOfStock,
                                onclick: "dropdown_trigger("+"'variation-selector-"+self.product_id+"-"+selectName+"')"
                    })
                    // .append(
                    //         self.getATag(selectName, optionValue)
                    // )
                    .text(optionValue.toUpperCase())
                    .click(function(){
                        self.updateVariants(selectName, optionValue);
                    })  
                );
            });

            var content = $('<div>', {id: "variation-selector-"+self.product_id+"-"+selectName+"-content", name: selectName, class: "dropdown-content"});
            content.append(ul);

            var span_selected = $('<span>', {class: "", id: "selected-"+selectName+"-"+self.product_id}).text("");
            button.append(span_selected);
            var i = $('<i>', {class: "fa fa-caret-up pull-right"});
            button.append(i);
            i = $('<i>', {class: "fa fa-caret-down pull-right"});
            button.append(i);
            div.append(button);
            div.append(content);

            if(self.isCollection){
                $(self.selector).append(div);
            }else{
                // var row = $('<div>', {class: "row no-margin"});
                // row.append(div);
                // var div = $('<div>', {class: "col-md-6 no-padding"});
                // div.append(row);
                $(self.selector).append(div);
            }
        });

        $('[data-toggle="tooltip"]').tooltip();
        self.updateChips();
    }

    this.orderOptions = function(options){
        var ordered_options = [];
        $.each( options, function(index, option){
            var indexToInsert=0;
            for(var i=0; i<ordered_options.length; i++){
                if(ordered_options[i].position<option.position){
                    //next
                    indexToInsert = i+1;
                }else if(ordered_options[i].position>option.position){
                    break;
                }else if(ordered_options[i].position==option.position){
                    indexToInsert = i;
                    break;
                }
            }
            ordered_options.splice(indexToInsert,0,option);
        });

        return ordered_options;
    }

    this.init = function(){
        var self = this;
        //Options ordering
        self.variant_options = self.orderOptions(self.variant_options);

        //Build selectsData
        $.each( self.variant_options, function(index, option){
            self.selectsData[option.name] = [];
            $.each( option.values, function(index, value){
                self.selectsData[option.name].push(value);
            });
        });

        var selected_variant = self.variants[0];

        $.each(self.variants, function(index,variant){
            if(variant.price > 0 && variant.has_stock){
                selected_variant = variant;
                return false;
            }
        });

        //Default selected variant
        $.each(self.selectsData, function(selectName,optionArray){
            self.selectedValues[selectName] = selected_variant[selectName];
        });
        //Bluilding HTML Select elements
        self.buildChips(self.variant_options);
    }
}

/*
 * Dropdown for variant options management
 */

$(document).click(function() {
    // all dropdowns content
    $('.dropdown').removeClass("dropdown-open");
});

function dropdown_trigger(event, dropdown_content_id){
    event.stopPropagation();
    var selector = "#"+dropdown_content_id;
    var elem = $(selector);
    if(elem.hasClass("dropdown-open")){
        elem.removeClass("dropdown-open");
    }else{
        $('.dropdown').removeClass("dropdown-open");
        elem.toggleClass("dropdown-open");
    }
}