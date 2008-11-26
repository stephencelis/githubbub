// ==UserScript==
// @name        GitHubbub
// @description Hubbub for Fluid Github: Growl/Dock notifications, and more.
// @namespace   http://stephencelis.com/
// @homepage    http://github.com/stephencelis/githubbub/
// @author      Stephen Celis
// @include     https://github.com/*
// ==/UserScript==

(function () {
	var importAlert = function (imported) {
		$(".feed_filter").after(imported);

		var timestamp = $(".title abbr", imported)[0].innerText;
		var title = $(".title", imported)[0].innerText.replace(timestamp, "");
		var description = $(".details .message", imported)[0].innerText;
		var icon = $(".gravatar img", imported).attr("src").replace("?s=30&", "?s=128");
		// Make default Gravatar bigger; FIXME: render GitHub icon instead?
		icon = icon.replace("-30.", "-50.");
		var identifier = $(".details .message", imported)[0].innerText;

		window.fluid.showGrowlNotification({
			title: title,
			description: description,
			icon: icon,
			identifier: identifier,
			onclick: function() { window.fluid.activate() }
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
				if (switched)
					importAlert(remoteAlert);
				if ($(".message", remoteAlert).text() == $(".message", localAlert).text())
					switched = true;
			}
			if (!switched)
				importAll(remoteAlerts);
		}
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
			var timestamp = new Date(reformatTime($(this).attr("title")));
			$(this).text($.relatizeDate.timeAgoInWords(timestamp));
		});
	}

	var reformatTime = function (string) {
		var parts = string.split(/\s|\-/);
		var monthName = $.relatizeDate.shortMonths[parts[1] - 1];
		return monthName + " " + parts[2] + " " + parts[3] + " -800 " + parts[0];
	}

	// Run...
	setCount();
	setInterval(function () {
		$.get(window.location.href, function (data) { parseResponse(data); });
		reRelatizeDates();
	}, 120 * 1000)
})();
