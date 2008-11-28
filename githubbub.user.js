// ==UserScript==
// @name        GitHubbub
// @description Hubbub for Fluid Github: Growl/Dock notifications, and more.
// @namespace   http://stephencelis.com/
// @homepage    http://github.com/stephencelis/githubbub/
// @author      Stephen Celis
// @include     http*://github.com/*
// ==/UserScript==

(function () {
	var activate = function (node) {
		window.fluid.activate();
		$(".commits", node).show();
	}

	var importAlert = function (imported) {
		$(".feed_filter").after(imported);

		var timestamp = $(".title abbr", imported)[0].innerText;
		var title = $(".title", imported)[0].innerText.replace(timestamp, "");
		var descriptions = $(".details .message", imported)
		var description = descriptions[0].innerText.replace(/^\s*|\s*$/g, "");
		if (descriptions.length > 1)
			description = description + "\n\n(And " + (descriptions.length - 1) + " more commits...)"
		var icon = $(".gravatar img", imported).attr("src")
		if (icon) // Make default Gravatar bigger; FIXME: render GitHub icon instead?
			icon = icon.replace("?s=30&", "?s=128").replace("-30.", "-50.");
		else if (icon = $(".identity img").attr("src"))
			icon = icon.replace("?s=50&", "?s=128");
		var identifier = $(".details .message", imported)[0].innerText;

		window.fluid.showGrowlNotification({
			title: title,
			description: description,
			icon: icon,
			identifier: identifier,
			onclick: function() { activate(imported) }
		});
	}

	var importAll = function (remoteAlerts) {
		for (var i = remoteAlerts.length; i > 0; --i)
			importAlert(document.importNode(remoteAlerts[i - 1], true));
	}

	var parseResponse = function (data) {
		var xmlDoc = new DOMParser().parseFromString(data, "application/xhtml+xml");
		$(".relatize", xmlDoc).relatizeDate();
		setCount(xmlDoc);

		if (dashboard) {
			var remoteAlerts = $(".alert", xmlDoc);
			var localAlert = $(".alert")[0], switched = false;

			for (var i = remoteAlerts.length; i > 0; --i) {
				var remoteAlert = document.importNode(remoteAlerts[i - 1], true);
				if (moreRecent(remoteAlert, localAlert))
					importAlert(remoteAlert);
			}
		}
	}

	var moreRecent = function (alertOne, alertTwo) {
		var oneTime = toTime($(".title abbr", alertOne).attr("title"));
		var twoTime = toTime($(".title abbr", alertTwo).attr("title"));
		return oneTime > twoTime;
	}

	var setCount = function (doc) {
		if (typeof doc == "undefined")
			doc = document;
		var unreadCount = $(".inbox span a", doc).text();
		if (doc != document);
			$(".inbox span a").text(unreadCount);
		window.fluid.dockBadge = unreadCount > 0 ? unreadCount : null;
	}

	var reRelatizeDates = function () {
		$(".relatize").each(function () {
			var timestamp = toTime($(this).attr("title"));
			$(this).text($.relatizeDate.timeAgoInWords(timestamp));
		});
	}

	var reformatTime = function (string) {
		var parts = string.split(/\s|\-/);
		var monthName = $.relatizeDate.shortMonths[parts[1] - 1];
		return monthName + " " + parts[2] + " " + parts[3] + " -800 " + parts[0];
	}

	var toTime = function (string) {
		var time = new Date(reformatTime(string));
		return time;
	}

	// Run...
	setCount();
	setInterval(function () {
		$.get(window.location.href, function (data) { parseResponse(data); });
		reRelatizeDates();
	}, 120 * 1000)
})();
