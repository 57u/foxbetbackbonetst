// Start Code Test.
// 
// Hi folks, I have kept this "main app" all in one file for exanples sake, 
// only external files are the mock json and an html template.


// Store global app data for this test.
var App = {
	Data: [], // data we pass around including markets and selections
	Models: {},
	Views: {},
	Core: {} // core object just to namespace off the events and views etc. (trying to emulate your example question i.e App.core.vent...)
};


// Models & Collection
// Model to hold a bet item
App.Models.BetItem = Backbone.Model.extend({});

// Collection to hold all bet items
App.Models.BetItems = Backbone.Collection.extend({
    model: App.Models.BetItem
});



// Global Event Listener
App.Core.vent = _.extend({}, Backbone.Events);
App.Core.vent.on("bet:addBet", function(betData) {

	console.info('Global event listener heard the emit of bet:addBet, betData:');
	console.table(betData);

	alert(`global listener heard the emit: betId: ${betData.betID}, marketType: ${betData.marketType}`);
});



// Views
// A single BetItemView
App.Views.BetItemView = Backbone.View.extend({
	tagName: 'tr',

	initialize: function() {
		this.model.on('change', this.render, this);
	}, 
	
	events: {
		'click button': 'emitAddBet'
	},
	
	render: function() {
		let tpl = '';
		var view = this;
		$.get("./tpl.row.html", function(html) {
			template = _.template(html, {
	        	data: view.model.toJSON()
	        	});

	        	view.$el.html(template);  
		});

		return this;
	},

	emitAddBet: function() {
		// Small DTO to transfer betData
		let selectedBetData = {
			marketType: App.Data.MarketType, 
			betID: this.model.get('betId')
		};

		// Emit to the global event listener function
		App.Core.vent.trigger('bet:addBet', selectedBetData);
	}
});

// Collection of BetItemView
App.Views.BetItemsView = Backbone.View.extend({
	el: '.betItems',

	render:function() {
		this.addAll();
		return this;
	},

	addBetItem: function(betItem) {
		let betItemView = new App.Views.BetItemView({model: betItem});
		// Append the rendered betItems to the collection
		this.$el.append(betItemView.render().el);
	},

	addAll: function() {
		this.collection.forEach(this.addBetItem, this);
	}
});



// On DOM load... 
$(document).ready(function() {
	// MOCK API ENDPOINT & FETCH

	console.info('DOM has loaded, starting...');

	// Fetch data from the JSON file / MOCK API endpoint
	function getMockApiJson() {
		return $.getJSON('mockdata.json');
	}

	// Once the data if fetched, sort it by row then col, assign it to a collection, and render it
	getMockApiJson().done(function(json) {

		console.info('Fetched raw JSON: ', json);

		// Pluck out event.markets.selection from loaded json
		let filteredData = _.pluck(json.event.markets, 'selection')[0];

		console.info('Filtered out markets.selections: ', filteredData);

		// Sort by row, then column
		App.Data.Selections = _.chain(filteredData)
			.sortBy(function(item){
				return item.pos.row;
			})
			.sortBy(function(item){
				return item.pos.col;
			})
			.value();

		console.info('Sorted markets.selections by row, col: ');
		console.table(App.Data.Selections);

		// Assign market type we will need this when user is adding a bet
		App.Data.MarketType = json.event.markets[0].type;

		// Start Backbone Views Display: load the bet data, pass to view, render
		const betItems = new App.Models.BetItems(App.Data.Selections);
		const betItemsView = new App.Views.BetItemsView({ 
			collection: betItems
		});

		betItemsView.render();
	});

});
