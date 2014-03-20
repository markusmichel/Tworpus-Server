$(document).ready(function() {

	$.ajax({
		url: "test.html"
	}).done(function() {
		TWRP.Data = [];
		TWRP.App.instance = new TWRP.App();
	});

	TWRP.PathToClient = "download/client/desktopclient.exe";

	TWRP.MailAdressForPlugins = "daniel.riedmueller@ur.de";
	TWRP.MailSubjectForPlugins = "Tworpus Visualisation / Data Converter Upload";
	TWRP.MailBodyForPlugins = "Hello!%0A%0AThank you for your anticipation.%0APlease attach the plugin and add a screenshot, a title and some description.%0AYour plugin will be published soon so digital humanists, like you, can download it from the website and use it for their own purposes.%0A%0ABest regards, Tworpus Team";
});

TWRP.ns('TWRP');
TWRP.App = Class.extend({

	initialize: function() {
		this.initButtons();
		this.initVisualisationsPane();
		this.initDatepicker();
	},

	initButtons: function() {
		$('.navi-btn').click(function() {
			$("html, body").animate({scrollTop: $('.' + $(this).text().toLocaleLowerCase()).position().top - $('.header').height() + "px" });
		});

		$('.software .download-btn').click(function() {
			window.location = TWRP.PathToClient;
		});

		$('.upload-btn').click(function() {
			window.location = "mailto:" + TWRP.MailAdressForPlugins + "?subject=" + TWRP.MailSubjectForPlugins + "&body=" + TWRP.MailBodyForPlugins;
		});

		$('.close').click(this.hideDetailView);
		$('.overlay').click(this.hideDetailView);
	},

	initVisualisationsPane: function() {
		var visContainer = $('.visualisations-container');
		var dcContainer = ($('.dataconverter-container'));

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
	},

	initDatepicker: function() {
		$('#dp1').datepicker({
			format: 'mm-dd-yyyy'
		});

		/*
		var nowTemp = new Date();
		var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);

		var checkin = $('#dpd1').datepicker({
			onRender: function(date) {
				return date.valueOf() < now.valueOf() ? 'disabled' : '';
			}
		}).on('changeDate', function(ev) {
			if (ev.date.valueOf() > checkout.date.valueOf()) {
				var newDate = new Date(ev.date)
				newDate.setDate(newDate.getDate() + 1);
				checkout.setValue(newDate);
			}
			checkin.hide();
			$('#dpd2')[0].focus();
		}).data('datepicker');
		var checkout = $('#dpd2').datepicker({
			onRender: function(date) {
				return date.valueOf() <= checkin.date.valueOf() ? 'disabled' : '';
			}
		}).on('changeDate', function(ev) {
			checkout.hide();
		}).data('datepicker');
		*/
	}
});