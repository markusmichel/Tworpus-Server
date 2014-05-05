$(document).ready(function() {
	TWRP.TweetLanguages = ['de', 'en', 'it', 'nl', 'pt', 'es', 'tr', 'fr'];
	TWRP.TweetTimespan = {};

	TWRP.PathToClient = "download/client/";

	TWRP.MailAdressForPlugins = "daniel.riedmueller@ur.de";
	TWRP.MailSubjectForPlugins = "Tworpus Visualisation / Data Converter Upload";
	TWRP.MailBodyForPlugins = "Hello!%0A%0AThank you for your anticipation.%0APlease attach the plugin and add a screenshot, a title and some description.%0AYour plugin will be published soon so digital humanists, like you, can download it from the website and use it for their own purposes.%0A%0ABest regards, Tworpus Team";

	TWRP.fetchData();
});

TWRP.ns('TWRP');
TWRP.init = function(tweetsData) {
	TWRP.App.instance = new TWRP.App(tweetsData);
};

TWRP.fetchData = function() {
	TWRP.TweetTimespan.enddate = new Date().getTime();

	var completedCalls = 0;
	var neededCalls = 2;

	var doneFetching = function() {
		completedCalls++;
		if (completedCalls == neededCalls) {
			TWRP.fetchTweetCount(TWRP.init);
		}
	};

	$.ajax({
		url: "/api/v1/tweets/oldesttimestamp"
	}).done(function(data) {
		TWRP.TweetTimespan.startdate = data.timestamp;
		doneFetching();
	});

	$.ajax({
		url: "/api/v1/tweets/crawlstatus"
	}).done(function(data) {
		TWRP.setCrawlingStatus(data.status);
		doneFetching();
	});
};

TWRP.fetchTweetCount = function(callback) {
	var tweetsData = {};

	var completedCalls = 0;
	var neededCalls = TWRP.TweetLanguages.length;

	var doneFetching = function() {
		completedCalls++;
		if (completedCalls == neededCalls) {
			callback(tweetsData);
		}
	};

	tweetsData['languages'] = {};

	$.each(TWRP.TweetLanguages, function(index, value) {
		$.ajax({
			url: "/api/v1/tweets/count/" + value + "?startdate=" + TWRP.TweetTimespan.startdate + "&enddate=" + TWRP.TweetTimespan.enddate
		}).done(function(data) {
			tweetsData['languages'][value] = data.count;
			doneFetching();
		})
	});
};

TWRP.setCrawlingStatus = function(status) {
	if (status == 1) {
		$('.crawling-status').text("crawling tweets");
		$('.status')
			.removeClass('inactive')
			.addClass('active');
	} else {
		$('.crawling-status').text("not crawling");
		$('.status')
			.removeClass('active')
			.addClass('inactive');
	}
};

TWRP.App = Class.extend({

	initialize: function(tweetsData) {
		this.initElements();
		this.setStats(tweetsData);
		this.initVisualisationsPane();
	},

	initElements: function() {
		var languagesContainer = $('.languages');
		$.each(TWRP.TweetLanguages, function(key, value) {
			var language = $('<div></div>')
				.addClass(value)
				.hide();
			languagesContainer.append(language);
		});


		$('.navi-btn').click(function() {
			$("html, body").animate({scrollTop: $('.' + $(this).text().toLocaleLowerCase()).position().top - $('.header').height() + "px" });
		});

		$('.software .download-btn .apple').click(function() {
			window.location = TWRP.PathToClient + "/apple/client.exe";
		});

		$('.software .download-btn .linux').click(function() {
			window.location = TWRP.PathToClient + "/linux/client.exe";
		});

		$('.software .download-btn .windows').click(function() {
			window.location = TWRP.PathToClient + "/windows/client.exe";
		});

		$('.upload-btn').click(function() {
			window.location = "mailto:" + TWRP.MailAdressForPlugins + "?subject=" + TWRP.MailSubjectForPlugins + "&body=" + TWRP.MailBodyForPlugins;
		});

		$('.close').click(this.hideDetailView);
		$('.overlay').click(this.hideDetailView);


		var me = this;
		var dateFrom = $('#dateFrom').val(moment(TWRP.TweetTimespan.startdate).format('MM/DD/YYYY'));

		new Pikaday({
			field: dateFrom[0],
			format: 'MM/DD/YYYY',
			defaultDate: new Date(TWRP.TweetTimespan.startdate),
			onSelect: function(date) {
				TWRP.TweetTimespan.startdate = date.getTime();
				TWRP.fetchTweetCount(me.setStats);
			}
		});

		var dateTo = $('#dateTo').val(moment(TWRP.TweetTimespan.enddate).format('MM/DD/YYYY'));
		new Pikaday({
			field: dateTo[0],
			format: 'MM/DD/YYYY',
			defaultDate: new Date(TWRP.TweetTimespan.enddate),
			onSelect: function(date) {
				TWRP.TweetTimespan.enddate = date.getTime();
				TWRP.fetchTweetCount(me.setStats);
			}
		});
	},

	setStats: function(tweetsData) {

		var languagesContainer = $('.languages');

		var totalLanguages = 0;
		var totalTweets = 0;

		$.each(tweetsData.languages, function(key, value) {

			var langDiv = $('.' + key);
			if (value == 0) langDiv.hide();
			else {
				langDiv
					.text(value)
					.fadeIn();

				totalTweets += value;
				totalLanguages++;
			}
		});

		$('.total-tweets').text(totalTweets + " tweets in " + totalLanguages + " languages");
	},

	initVisualisationsPane: function() {
		var visContainer = $('.visualisations-container');
		var dcContainer = $('.dataconverter-container');

		var visBtn = $('.visualisations-btn');
		var dcBtn = $('.dataconverter-btn');
		visBtn.click($.proxy(this.toggleVisContainer, this, visContainer, dcContainer, visBtn, dcBtn));
		dcBtn.click($.proxy(this.toggleVisContainer, this, dcContainer, visContainer, dcBtn, visBtn));

		var me = this;
		$.each(TWRP.VisInfo, function(index, value) {
			var visItem = $('<div></div>')
				.addClass('visualisation-item')
				.click($.proxy(me.onItemClick, me, value))
				.appendTo(visContainer);

			$('<div></div>')
				.addClass('visualisation-item-title')
				.text(value.title)
				.appendTo(visItem);

			$('<div></div>')
				.addClass('visualisation-item-img')
				.css('background-image', 'url(' + value.img + ')')
				.appendTo(visItem);
		});

		$.each(TWRP.DcInfo, function(index, value) {
			var dcItem = $('<div></div>')
				.addClass('dataconverter-item')
				.click($.proxy(me.onItemClick, me, value))
				.appendTo(dcContainer);

			$('<div></div>')
				.addClass('dataconverter-item-title')
				.text(value.title)
				.appendTo(dcItem);
		});

	},

	onItemClick: function(item) {
		if (item.img) {
			$('.item-detail-view-img')
				.removeClass('no-image')
				.css('background-image', 'url(' + item.img + ')');

			$('.item-detail-view-title')
				.text(item.title)
				.removeClass('no-image-title');
		} else {
			$('.item-detail-view-img').addClass('no-image');
			$('.item-detail-view-title')
				.text(item.title)
				.addClass('no-image-title');
		}

		$('.item-detail-view-desc').text(item.desc);

		$('.item-detail-view .download-btn').click(function() {
			window.location = item.path;
		});

		this.showDetailView();
	},

	showDetailView: function() {
		$('.item-detail-view').fadeIn();
		$('.overlay').fadeIn();
	},

	hideDetailView: function() {
		$('.item-detail-view').fadeOut();
		$('.overlay').fadeOut();
	},

	toggleVisContainer: function(showContainer, hideContainer, activeBtn, inactiveBtn) {
		if (showContainer.height() == 0) {

			if (hideContainer.height() > 0) {

				inactiveBtn.removeClass('active');
				hideContainer.animate({
					height: 0
				},400, 'swing', function() {
					activeBtn.addClass('active');
					showContainer.css('height', 'auto');
					var expandedHeight = showContainer.height();
					showContainer.css('height', 0);
					showContainer.animate({
						height: expandedHeight
					})
				})
			} else {
				activeBtn.addClass('active');
				showContainer.css('height', 'auto');
				var expandedHeight = showContainer.height();
				showContainer.css('height', 0);
				showContainer.animate({
					height: expandedHeight
				})
			}
		} else {
			activeBtn.removeClass('active');
			showContainer.animate({
				height: 0
			})
		}
	}
});