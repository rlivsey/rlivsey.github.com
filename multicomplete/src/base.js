var MultiComplete = {};
MultiComplete.Base = Class.create({
  
  // just takes a hash of configuration
  // this gets mixed into the instance so you can override anything
  initialize: function(config)
  {    
    // the data we're searching through
    // can override 'search' to do something different
    this.data = [];
    
    // list of items matching the text entered
    this.current_matches = [];
    
    // index of the currently selected item (if any)
    this.current_index = false;
    
    // how many results to show
    this.num_results = 10;
    
    // the input field we're monitoring
    this.input = null;
    
    // this is where the suggestions will go
    this.suggestions_container = null;
    
    // anything passed in the config
    Object.extend(this, (config || {}));
    
    this.build();
    this.add_events();
  },
  
  // builds the suggestions container etc...
  // override to do other things too
  build: function()
  {
    this.suggestions_container = new Element('div', {'class': 'autocomplete', 'style':'display: none'});
    this.input.insert({after: this.suggestions_container});
  },
  
  add_events: function()
  {
    this.input.observe('keydown',  this.key_down.bindAsEventListener(this));
    this.input.observe('keypress', this.key_press.bindAsEventListener(this));
    this.input.observe('keyup',    this.key_up.bindAsEventListener(this));
      
    document.observe('click',      this.clicked_outside.bindAsEventListener(this));
    
    this.suggestions_container.observe('mouseover', this.over_selections.bindAsEventListener(this));
    this.suggestions_container.observe('click',     this.clicked_selection.bindAsEventListener(this));    
  },
  
  show: function()
  {
    if (this.showing)
    {
      return;
    }
    
    this.showing = true;
    this.show_suggestions();
  },
  
  show_suggestions: function()
  {
    if(!this.suggestions_container.style.position || this.suggestions_container.style.position == 'absolute') 
    {
      this.suggestions_container.style.position = 'absolute';
      Position.clone(this.input, this.suggestions_container, {
        setHeight: false, 
        offsetTop: this.input.offsetHeight
      });
    }    
    
    this.suggestions_container.show();    
    this.fix_ie();
  },
  
  fix_ie: function()
  {
    if(!this.iefix && Prototype.Browser.IE && Element.getStyle(this.suggestions_container, 'position') == 'absolute')
    {
      new Insertion.After(this.suggestions_container, 
       '<iframe id="' + this.suggestions_container.id + '_iefix" '+
       'style="display:none;position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" ' +
       'src="javascript:false;" frameborder="0" scrolling="no"></iframe>');
      this.iefix = $(this.suggestions_container.id+'_iefix');
    }
    
    if(this.iefix)
    {
      setTimeout(this.fix_ie.bind(this), 50);
    }
  },
  
  // stolen from Scriptaculous autocomplete
  // fix overlapping issues with IE
  fix_ie_overlapping: function() {
    Position.clone(this.suggestions_container, this.iefix, {setTop:(!this.suggestions_container.style.height)});
    this.iefix.style.zIndex = 1;
    this.suggestions_container.style.zIndex = 2;
    Element.show(this.iefix);
  },
  
  hide: function()
  {
    this.showing = false;    
    this.current_index = null;
    this.suggestions_container.hide();
  },

  // called when we select something
  // otherwise just calling hide leaves the data there so you can hit down
  // and the selection will stay in place
  reset: function()
  {
    this.current_matches = [];
    this.hide();
  },
  
  key_down: function(e)
  {
    switch (e.keyCode)
    {   
      case Event.KEY_UP:
        this.up();
        e.stop();
        break;

      case Event.KEY_DOWN:
        this.down();
        e.stop();
        break;

      case Event.KEY_RETURN:
        e.stop();
        this.select_current();
        break;

      default: 
        break;
    }    
  },

  key_up: function(e)
  {
    switch (e.keyCode)
    {      
      case Event.KEY_RETURN:   
        this.enter_pressed(e);
        break;      

      // ignore these and pass on through
      case Event.KEY_UP:
      case Event.KEY_DOWN: 
        break;
      
      case Event.KEY_ESC:
        this.hide();
        break;
      
      // search if any of the above don't match
      default: 
        this.search();
        break;
    }    
  },
  
  // only stop enter from submitting if we're showing the form
  // override this if you want to never submit the form on enter
  enter_pressed: function(e)
  {
    if (this.showing)
    {
      e.stop();
    }
  },
  
  key_press: function(e)
  {
    if (e.keyCode == Event.KEY_RETURN)
    {   
      this.enter_pressed(e);
    }    
  },
  
  over_selections: function(e)
  {
    var element = e.element();
    if (element.nodeName != 'LI')
    {
      element = element.up('li');
    }

    if (!element)
    {
      return;
    }
    
    this.current_index = element.previousSiblings().length;
    
    this.highlight_selection(); 
  },
  
  clicked_selection: function(e)
  {
    var element = e.element();
    if (element.nodeName != 'LI')
    {
      element = element.up('li');
    }

    if (!element)
    {
      return;
    }
    
    this.current_index = element.previousSiblings().length;
    
    this.select_current();
  },
  
  clicked_outside: function(e)
  {
    var element = e.element();

    // did they click on the autocomplete suggestions?
    if (element.up('.autocomplete'))
    {
      return;
    }
    
    this.hide();    
  },
  
  // by default just populate the text field with the value
  // override to do something more interesting
  select_current: function()
  {
    var value = this.current_value();
    if (!value)
    {
      return;
    }
    this.input.value = value;
    this.reset();
  },
  
  // get the data for the current selected item
  current_value: function()
  {
    if (this.current_index == null)
    {
      return false;
    }
    
    return this.current_matches[this.current_index];
  },
  
  // prepare to search for items matching the text in the field
  // does the actual search in find_items_matching so that it can be
  // easily overriden for ajax, just has to call "found_items" with any result
  search: function()
  {
    var text = this.input.value;
    if (text.strip() === '')
    {
      this.hide();
      return;
    }
    
    this.current_index = null;
    this.current_matches = [];
    this.find_items_matching(text);
  },
  
  found_items: function(items, search_text)
  {
    this.current_matches = items;
    
    if (this.current_matches.length === 0)
    {
      this.hide();
    }
    else
    {
      var html = this.html_for_items(search_text);
      this.suggestions_container.update(html);
      this.show(); 
    }    
  },
  
  // return the HTML you want to use for your autocomplete list
  // by default we assume this will be a UL with an LI element per item
  html_for_items: function(search_text)
  {
    var html = "";
    this.current_matches.each(function(item){
      html += this.html_for_item(item, search_text);
    }.bind(this));
    
    return "<ul>"+html+"</ul>";
  },

  // return the HTML for one individual item in the list
  // assumes the item is a single string of text, but can just as easily
  // override and work with an object etc...
  html_for_item: function(item, search_text)
  {
    if (!this._html_for_item_template)
    {
      this._html_for_item_template = new Template([
        '<li>',
          '#{item}',
        '</li>'
      ].join(''));      
    }
    return this._html_for_item_template.evaluate({item: item});
  },
  
  up: function()
  {
    if (!this.showing || this.current_index === null)
    {
      return;
    }
    
    this.current_index -= 1;
    
    if (this.current_index < 0)
    {
      this.current_index = null;
    }
    
    this.highlight_selection();
  },
  
  down: function()
  {
    if (this.current_matches.length == 0)
    {
      return;
    }
    
    if (this.current_index == null)
    {
      this.current_index = 0;
    }
    else
    {
      this.current_index += 1;
      if (this.current_index > (this.current_matches.length - 1))
      {
        this.current_index = this.current_matches.length - 1;
      }      
    }
    
    this.highlight_selection();
    
    if (!this.showing)
    {
      this.show();
    }
  },
  
  // add the class "selected" to the current selected item
  // there can be only one selected item, so remove from any existing one first
  highlight_selection: function()
  {
    var current = this.suggestions_container.down(".selected");
    if (current)
    {
      current.removeClassName("selected");
    }
    var selected = this.suggestions_container.select("li")[this.current_index];
    if (selected)
    {
      selected.addClassName("selected");
    }
  },
  
  // by default this goes through the data array we have
  // you could override this to go off and load the data with ajax
  // or whatever takes your fancy so long as it passes any results to "found_items"
  find_items_matching: function(text)
  {
    text = this.escape_regex(text.toLowerCase());
    
    // return the first x who match the finder
    var items = this.data.findAll(this.finder.bind(this, text)).slice(0, this.num_results);    
    this.found_items(items, text);
  },
  
  // assumes a simple array of items, override to do something different
  // just matches if it contains the entered text
  finder: function(value, item)
  {
    return item.toLowerCase().match(value);
  },
  
  // escape any symbols in the text which will mess up a regex
  // http://simonwillison.net/2006/Jan/20/escape/
  escape_regex: function(text) 
  {
    if (!arguments.callee.sRE) 
    {
      var specials = [
        '/', '.', '*', '+', '?', '|',
        '(', ')', '[', ']', '{', '}', '\\'
      ];
      arguments.callee.sRE = new RegExp(
        '(\\' + specials.join('|\\') + ')', 'g'
      );
    }
    return text.replace(arguments.callee.sRE, '\\$1');
  }
});