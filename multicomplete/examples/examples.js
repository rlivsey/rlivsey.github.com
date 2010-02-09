document.observe('dom:loaded', function(){
  
  // some local data to use
  var data = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  
  // text field with inline data
  new MultiComplete.Base({
    data: data,
    input: $$('#single_inline input').first()
  });
  
  // use data from a select box
  new MultiComplete.SimpleSelect($$('#single_select_box select').first());

  // multiple select getting data from a select box
  var select = $$('#multi_select_box select').first();
  var input  = $$('#multi_select_box input').first();
  new MultiComplete.MultipleSelect(select, input);
  
  new MultiComplete.AjaxLoader({
    url: "data.js",
    input: $$('#single_ajax input').first()
  });
  
  new MultiComplete.Adder({
    data: data,
    input: $$('#local_adder input').first(),
    selected_list: $('local_adder_selections')
  });
    
});


// get data from a select box
// builds its own text field
// override the template for each item
// overrides the finder method
// select the corresponding item in the select box on completion
MultiComplete.SimpleSelect = Class.create(MultiComplete.Base, {
  
  initialize: function($super, select)
  {    
    this.select_box = select;
    
    var data = $A(this.select_box.options).collect(function(opt){
      return {
        id: opt.value,
        name: opt.text
      };
    });

    var text_field = new Element('input', {'type': 'text'});
    this.select_box.insert({after: text_field});

    $super({
      data: data,
      input: text_field
    });
  },
  
  html_for_item: function(item, search_text)
  {
    if (!this._html_for_item_template)
    {
      this._html_for_item_template = new Template([
        '<li>',
          '#{name}',
        '</li>'
      ].join(''));      
    }
    return this._html_for_item_template.evaluate(item);
  },
  
  finder: function(value, item)
  {
    return item.name.toLowerCase().match(value);
  },
  
  select_current: function()
  {
    var item = this.current_value();
    this.input.value = '';
    this.select_box.selectedIndex = $A(this.select_box.options).map(function(x){ return x.value; }).indexOf(item.id);
    this.reset();
  },
  
});

// tied to a select box, so it gets its data from that
// only shows items which haven't already been selected
MultiComplete.MultipleSelect = Class.create(MultiComplete.Base, {
  
  initialize: function($super, select, input)
  {
    this.select_box = select;
    
    $super({
      input: input
    });
  },
  
  find_items_matching: function(text)
  {
    text = this.escape_regex(text.toLowerCase());
    
    // get all the options from the select box to use as data
    var items = $A(this.select_box.options).findAll(this.finder.bind(this, text)).slice(0, this.num_results);    

    this.found_items(items, text);
  },
  
  // find anything whose value matches the text and isn't already selected
  finder: function(value, item)
  {
    if (item.selected)
    {
      return false;
    }
    
    return item.text.toLowerCase().match(value);
  },
  
  // the item here is a HTMLOptionElement so adjust the template accordingly
  html_for_item: function(item, search_text)
  {
    if (!this._html_for_item_template)
    {
      this._html_for_item_template = new Template([
        '<li>',
          '#{name}',
        '</li>'
      ].join(''));      
    }
    return this._html_for_item_template.evaluate({name: item.text});
  },  
  
  // select the item in the select box
  select_current: function()
  {
    var item = this.current_value();
    this.input.value = '';
    item.selected = true;
    this.reset();
  }
  
});


// load data by Ajax when the page loads
MultiComplete.AjaxLoader = Class.create(MultiComplete.Base, {
  
  initialize: function($super, config)
  {
    $super(config);
    
    this.input.value = "loading";
    
    new Ajax.Request(this.url, {
      onComplete: this.loaded.bind(this)
    });
  },
  
  loaded: function(transport)
  {
    this.input.value = "";    
    this.data = transport.responseText.evalJSON();
  }
  
});


// this is the most complex example
// it builds a list of items which have been selected and allows you to remove them 
// by clicking a remove link
// it also allows adding items which aren't in the data and then adds them to the data 
// so they are there on the next search. 
MultiComplete.Adder = Class.create(MultiComplete.Base, {

  initialize: function($super, config)
  {
    this.selected_items = [];
    $super(config);
  },

  add_events: function($super)
  {
    $super();
    this.selected_list.observe("click", this.selected_list_clicked.bind(this));
  },

  // restrict to ones not already selected
  finder: function(value, item)
  {
    if (this.selected_items.include(item))
    {
      return false;
    }
    
    return item.toLowerCase().match(value);
  },

  select_current: function()
  {
    var item = this.current_value();
    
    if (!item)
    {
      // it's a new item, add it to the list
      // this could be an ajax request to persist it etc...
      // the you could add to the list when the request returns
      var value = this.input.value;
      
      if (value.strip() === "")
      {
        return;
      }
      
      this.data.push(value);
      this.add_to_list(value, true);
    }
    else
    {
      this.add_to_list(item, false);
    }
    
    this.input.value = "";
    this.reset();
  },
  
  html_for_list_item: function(item, is_new)
  {
    if (!this._html_for_list_item_template)
    {
      this._html_for_list_item_template = new Template([
        '<li class="#{new}">',
          '<span>#{name}</span> (#{new}) - <a href="#">remove</a>',
        '</li>'
      ].join(''));      
    }
    
    var data = {name: item};
    data["new"] = is_new ? "new" : "existing";
    
    return this._html_for_list_item_template.evaluate(data);
  },
    
  add_to_list: function(item, is_new)
  {
    var html = this.html_for_list_item(item, is_new);
    this.selected_items.push(item);
    this.selected_list.insert({bottom: html});
  },
  
  selected_list_clicked: function(e)
  {
    var element = e.element();
    if (element.nodeName != 'A')
    {
      return;
    }
    
    e.stop();
    
    // remove the item from the selected items
    // this could be fancier and use the element ID or something
    var value = element.up('li').down("span").innerHTML;
    var index = this.selected_items.indexOf(value);
    this.selected_items.splice(index, 1);
    
    element.up("li").remove();  
  },
  
  // this displays an indicator when your're searching
  // to say whether you're going to add a new item or not
  
  reset: function($super)
  {
    $super();
    $('new_indicator').update("");
  },
  
  search: function($super)
  {
    var value = this.input.value;
    
    if (value.strip() === "")
    {
      $('new_indicator').update("");
    }
    
    $super();
  },
  
  found_items: function($super, items)
  {
    if (items.length === 0)
    {
      $('new_indicator').update("no matches, add new item?");
    }
    else
    {
      $('new_indicator').update("");      
    }
    
    $super(items);
  }
  
});
