var is_this_free_version = true;

var avirgin = true;

Hp12c_storage.prototype.save = function() {
	Portal.sendCookie(H.storage.save_memory2(H.machine));
};

Hp12c_storage.prototype.load = function() {
	var sserial = "" + Portal.recvCookie();
	if (sserial.length > 0) {
		H.storage.recover_memory2(H.machine, sserial);
	}
	if (avirgin && is_this_free_version) {
		start_donate();
	}
	avirgin = false;
};

var old_dispatch = Hp12c_dispatcher.prototype.dispatch;
var old_show = Hp12c_display.prototype.show;

Hp12c_dispatcher.prototype.dispatch = function (k)
{
	Portal.touchFeedback();
	old_dispatch.call(H.dispatcher, k);
	if (!avirgin) {
		H.storage.save();
	}
}

Hp12c_display.prototype.show = function (s)
{
	old_show.call(H.display, s);
	if (!avirgin) {
		H.storage.save();
	}
}

function do_donate()
{
        document.getElementById("donate").style.visibility = 'visible';
}

function close_donate()
{
        document.getElementById("donate").style.visibility = 'hidden';
        window.setTimeout(do_donate, 10*60*1000);
}

function start_donate()
{
        window.setTimeout(do_donate, 60*1000);
}


H.disp_theo_width = 1024.0;
H.disp_theo_height = 656.0;
H.disp_key_offset_x = 8.0;
H.disp_key_offset_y = 210.0;
H.disp_key_width = 79;
H.disp_key_height = 69;
H.disp_key_dist_x = (941.0 - 8.0) / 9;
H.disp_key_dist_y = (554.0 - 210.0) / 3;
