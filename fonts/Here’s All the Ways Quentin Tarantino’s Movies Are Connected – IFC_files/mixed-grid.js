/*! Mixed Grid - v0.1.0
 * http://10up.com
 * Copyright (c) 2018; * Licensed GPLv2+ */
// Set our variables here so we can override for testing
var MixedGrid = window.MixedGrid = _.extend( window.MixedGrid || {}, {
	Backbone : Backbone,
	_ : _,
	jQuery : jQuery,
	Handlebars : Handlebars,
	parentView: Backbone.View.extend(),
	childView: Backbone.View.extend(),
	retrieved_posts : [],
	queued_posts : [],
});

(function( window, document ) {
	'use strict';

	// https://github.com/elving/swag/blob/master/lib/swag.js#L495
	Handlebars.registerHelper('is', function(value, test, options) {
		if (value && value === test) {
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	}, ['safe:string|number', 'safe:string|number']);

( function( MixedGrid, _, Backbone ) {

	Backbone.on( 'homepage:reload homepage:load', function(){
		initialize();
	});

	function initialize() {
		var elements = document.querySelectorAll( '.mixed-grid-container' );
		for ( var i = 0; i < elements.length; i++ ) {
			MixedGrid.seeder.create( elements[i] );
		}
	}

	/**
	 * Create an instance of the Parent View with the relevant data
	 *
	 * @param  {object} element DOM Object
	 * @param  {int}    index   Current index in Loop
	 * @return {void}
	 */
	function createInstance( element ) {
		var collection, view, posts,
			data = element.getAttribute( 'data-mixed-grid' ),
			old_instance = element.getAttribute( 'data-mixed-grid-instance' );

		//make sure that element have single backbone instance
		if ( old_instance ) {
			return;
		}
		element.setAttribute( 'data-mixed-grid-instance', 'true' );

		this.collection = new Backbone.Collection();
		this.view = new MixedGrid.parentView({
			collection: this.collection,
			el: element,
		});
		try {
			data = JSON.parse( data );

			// Make sure we carry over manually curated positional cards
			MixedGrid.queued_posts = data.queued_posts;

			// Limit the posts to how many we actually request
			this.posts = data.posts.slice( 0, Math.max( 0, data.query.posts_per_page ) );

			//empty the inner html of the view fixed duplicate card issue
			element.innerHTML = '';
			MixedGrid.seeder.addTo( this.posts, this.collection );
			return this;
		} catch( e ) {
			return MixedGrid.seeder.err( e );
		}

	}

	/**
	 * Temporary error catching. Needs to be multiplized and rendered in front
	 * end
	 *
	 * @param  {object} e JavaScript Error object
	 * @return {void}
	 */
	function createError( e ) {
		return e;
	}

	/**
	 * Loop through the data and append each post as a new model, add it to the
	 * collection, and once complete trigger an event.
	 *
	 * @param {object} data       An object/array of WP post/query information
	 * @param {object} collection Current Backbone Collection
	 */
	function addToCollection( data, collection ) {
		var afterRender = null;

		collection.trigger( 'MixedGrid.collection.startRender' );

		afterRender = _.after( data.length, function() {
			// Stop listening to the event to avoid extra triggers
			collection.stopListening( collection, 'MixedGrid.collection.childRendered', afterRender );
			collection.trigger( 'MixedGrid.collection.endRender' );
		});

		collection.listenTo( collection, 'MixedGrid.collection.childRendered', afterRender );

		_.each( data, function( element, index ) {

			var model = new Backbone.Model( element );

			collection.add( model );
			// Add the post ID to a global array so we can add these to our
			// query for future ajax requests
			MixedGrid.retrieved_posts.push( model.get( 'id' ) );

		});

	}

	// setup seeder
	MixedGrid.seeder = {
		create : createInstance,
		addTo  : addToCollection,
		err    : createError,
	};

} )( MixedGrid, MixedGrid._, MixedGrid.Backbone );

( function( MixedGrid, _, Backbone ) {

	MixedGrid.childView = Backbone.View.extend({

		/**
		 * Render the view and apply all model attributes into the template
		 *
		 * @return {object} Backbone View object
		 */
		render : function() {

			// If HTML override is present, defautl to injecting the HTML
			// directly into the element
			if ( 'undefined' !== typeof this.model.get( 'html' ) && this.model.get( 'html' ) ) {
				this.el.innerHTML = this.model.get( 'html' );
			// Use the base template
			} else {
				this.el.innerHTML = this.baseTemplate( this.model.attributes );
			}

			return this;
		},

	});

} )( MixedGrid, MixedGrid._, MixedGrid.Backbone );

( function( MixedGrid, $, _ ) {

	MixedGrid.parentView = MixedGrid.Backbone.View.extend({

		events : {
			'click .mixed-grid-load-more-button' : 'retrievePosts',
		},

		/**
		 * Initalization class
		 *
		 * Upon creation of this prototype, call this function. Create an array
		 * for our children to latch onto. Create a shadow template and append
		 * it to this element. Attach some events for us to listen to.
		 *
		 * @event add: Gets triggered whenever a view is added to the collection
		 * @event MixedGrid.collection.render: Called when the views are finally
		 *                                     done being looped through.
		 *
		 */
		initialize : function() {

			var items = document.querySelectorAll( '.mixed-grid-container' ),
				last_element = items[ items.length - 1 ];

			// Reference for load more rendering
			this.side        = 'left';
			this.force       = false;
			this.render      = false;
			this.switchSide  = false;
			this.trigger     = true;
			this.height      = 0;
			this.heightSide  = {
				left  : 0,
				right : 0,
			};

			// Boolean to run our ajax request
			this.runAjax = true;

			if ( this.el === last_element && null !== this.el.querySelector( '#mixed-grid-load-more' ) ) {
				this.infinite = this.el.querySelector( '#mixed-grid-load-more' );
			} else {
				this.infinite = false;
			}

			if ( null !== this.el.querySelector( '.mixed-grid-ad' ) ) {
				this.advertisment = this.el.querySelector( '.mixed-grid-ad' );
			} else {
				this.advertisment = false;
			}

			if ( null !== this.el.parentNode.querySelector( '.ifc-lazy-loader' ) ) {
				this.lazyLoader = this.el.parentNode.querySelector( '.ifc-lazy-loader' );
			} else {
				this.lazyLoader = false;
			}

			// events to listen on
			this.listenTo( this.collection, 'add', this.addOne );

			this.listenTo( this.collection, 'MixedGrid.collection.startRender', this.startRender );
			this.listenTo( this.collection, 'MixedGrid.collection.endRender', this.endRender );

		},

		/**
		 * Start the render by initializing our children. This refreshes the
		 * variable so we're only templating new things
		 *
		 * @return {void}
		 */
		startRender : function() {

			// Store all children into an array
			this.children = [];
			// Remove these items from the DOM and show our loading icon.
			// Enables an easier interface for the end-user
			if ( this.advertisment && this.advertisment.parentNode === this.el ) this.el.removeChild( this.advertisment );
			if ( this.infinite && this.infinite.parentNode === this.el ) this.el.removeChild( this.infinite );
			if ( this.lazyLoader ) this.lazyLoader.style.display = 'block';
			this.render = false;
		},

		/**
		 * Render once all views have been added. This is triggered by an event
		 * on the collection. This will then sort all arrays and then display
		 * them as child nodes in the DOM.
		 *
		 * @return {object} this An instance of the prototype
		 */
		endRender : function() {
			return this;
		},

		/**
		 * Render a single child view
		 *
		 * Check if the view has a property, append the value as a classname
		 * and then attach to parent. If it does not have this value, it is most
		 * likely a 'small' view that consists of 2+ view objects, so we can
		 * safely reloop through the same function
		 *
		 * @param  {object} view Backbone View
		 * @param  {string} side Side the view is appearing
		 * @return {object} this An instance of the prototype
		 */
		renderOne : function( view ) {
			return this;
		},

		/**
		 * Create a view from a model and push it to the global children array
		 *
		 * Create a new view from the provided model. Get certain attributes
		 * about the view and apply those to the child object. This object holds
		 * all the data about the child.
		 *
		 * @param  {object} model Backbone Model
		 * @return {void}
		 */
		addOne : function( model ) {
			return;
		},

		/**
		 * Stop the retrival of most posts. This will remove all click events
		 * associated with this element
		 *
		 * @return {object} this An instance of the prototype
		 */
		stopRetrievePosts : function() {
			this.$el.off( 'click', '.mixed-grid-load-more-button' );
			if ( this.infinite ) {
				this.infinite.style.display = 'none';
				this.infinite = false;
			}
			this.lazyLoader.style.display = 'none';
			return this;
		},

		/**
		 * Retrieve our posts with our data defined query.
		 *
		 * Check that everything is deinfed. Do some light JS validation on some
		 * of our riskier query elements. Query against the AMCN JSON API on an
		 * endpoint we've created. Once we've run out of data to query for,
		 * remove our event.
		 *
		 * @param  {object} e Base JS Event
		 * @return {void}
		 */

		retrievePosts: function( e ) {
			e.preventDefault();
			this.retrievePostsDebounced( e );
		},

		retrievePostsDebounced : _.debounce( function( e ) {

			var self = this,
				query = self.$el.data( 'mixed-grid' ).query,
				count = 0,
				posts_per_page,
				position,
				not_in = [];

			// Confirm we actually have query info
			if ( "undefined" !== typeof query ) {

				if ( self.infinite ) self.infinite.style.display = 'none';
				if ( self.lazyLoader ) self.lazyLoader.style.display = 'block';

				// Confirm that we aren't currently running an ajax request
				if ( self.runAjax ) {

					self.runAjax = false;

					// Verify retrieved_posts exists and is an array
					if ( 'undefined' !== typeof MixedGrid.retrieved_posts ) {

						// Quick validation to check that all are numbers
						not_in = _.filter( MixedGrid.retrieved_posts, function( num ) {
							return ( typeof num === 'number' ) && ( num % 1 === 0 );
						});

						// Get the posts_per_page set through the module
						posts_per_page = self.$el.data( 'mixed-grid' ).posts.length;

						// Handle the positionally curated cards
						for ( position in MixedGrid.queued_posts ) {

							// Logic to get an accurate positional count based on subsequent ajax display of cards
							if ( posts_per_page < MixedGrid.retrieved_posts.length ) {
								count = 10;
							} else {
								count = posts_per_page;
							}

							// Manage the not_in and queued_posts array to avoid duplicates
							if ( position - count > 0 ) {
								MixedGrid.queued_posts[ position - count ] = MixedGrid.queued_posts[ position ];
								// Make sure we are pushing to the not_in array only if it is a valid WP_Post
								if ( 'undefined' == typeof MixedGrid.queued_posts[ position ].id ) {
									not_in.push( MixedGrid.queued_posts[ position ] );
								}
							}
							delete MixedGrid.queued_posts[ position ];
						}
						// rewrite our not in call to account for all modules
						// on page
						query.post__not_in = not_in;
						query.posts_per_page = 10;

					}

					$.ajax({
						url: "/api/mixed-grid/v0/json",
						type: "GET",
						data : {
							query  : query,
							queued_posts: MixedGrid.queued_posts
						},

					}).done( function( result ) {

						// Get actual post count from WP_Query before filtering
						var wpQueryCount = parseInt(result.data.wpQueryCount);

						// Store posts as the result data
						result.data = result.data.posts;

						if ( 0 < result.data.length ) {
							MixedGrid.seeder.addTo( result.data, self.collection );

							// Check if we've retrieved our max number of posts
							if ( 'undefined' !== typeof MixedGrid.retrieved_posts ) {
								if ( 100 <= MixedGrid.retrieved_posts.length ) {
									self.stopRetrievePosts();
								}
							}
							// Check if we've retrieved less than 10 posts from
							// our request
							if ( 10 > wpQueryCount ) {
								self.stopRetrievePosts();
							}

						} else {
							self.stopRetrievePosts();
						}

					}).fail( function( data ) {
						// Leave for testing
						console.log( data );
					}).always( function() {
						self.runAjax = true;
					});

				}

			} else {
				self.stopRetrievePosts();
			}
		}, 100 ),

	});

})( MixedGrid, MixedGrid.jQuery, MixedGrid._ );

}).call( MixedGrid, this, this.document );
