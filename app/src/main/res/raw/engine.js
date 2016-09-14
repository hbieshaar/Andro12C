/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true, bitwise: true */
/*jshint globalstrict: true*/

"use strict";

var H = {};
H.type = "12c";
H.touch_display = false;
H.vertical_layout = false;
H.embedded = false;

H.disp_theo_width = 700.0;
H.disp_theo_height = 438.0;
H.disp_key_offset_x = 44.0 - 6;
H.disp_key_offset_y = 151.0 - 18;
H.disp_key_dist_x = (606.0 - 44.0) / 9;
H.disp_key_dist_y = 70;
H.disp_key_width = H.disp_key_dist_x; // 54;
H.disp_key_height = H.disp_key_dist_y; // 50;

H.disp_fb_offset_x = 6;
H.disp_fb_offset_y = 15;
H.disp_fb_width = 50;
H.disp_fb_height = 45;
/* HP-12C emulator 
 * Copyright (c) 2007, 2011, 2016 Elvis Pfutzenreuter - epxx.co.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*jshint globalstrict: true*/
/*global H */

"use strict";

H.getElem = function (id)
{
	return document.getElementById(id);
};

H.createElem = function (typ)
{
	return document.createElement(typ);
};

H.badnumber = function (res)
{
	return (isNaN(res) || ! isFinite(res));
};

H.clamp = function (res)
{
	res = res || 0; // just in case it is NaN
	res = Math.max(res, -H.value_max);
	res = Math.min(res, H.value_max);
	return res;
};

H.binary_sgn = function (val)
{
	return (val >= 0 ? 1 : -1);
};

H.cl5_round = function (val, decs)
{
	var scale = Math.pow(10, decs);
	return Math.round(Math.abs(val) * scale) / scale * H.binary_sgn(val);
};

H.trim = function (stringToTrim) {
	return stringToTrim.replace(/^\s+|\s+$/g, "");
};

H.zeropad = function (s, n)
{
	s = "" + s;
	while (s.length < n) {
		s = "0" + s;
	}
	return s;
};

H.spacepad = function (s, n)
{
	s = "" + s;
	while (s.length < n) {
		s = " " + s;
	}
	return s;
};

H.i18n = function (s, comma, dp0, non_decimal)
{
	var grouping = 3;

	if (non_decimal) {
		grouping = 4;
		if (comma === H.INDIAN_SEPARATOR) {
			comma = H.POINT_DECIMAL_SEPARATOR;
		}
	}

	// dp0 means: add decimal point after a whole number
	var dpos = s.indexOf('.');
	if (dpos === -1 && dp0) {
		s += ".";
		dpos = s.length - 1;
	}

	/* Replace decimal point by comma */
	if (dpos !== -1 && comma === H.COMMA_DECIMAL_SEPARATOR) {
		s = s.slice(0, dpos) + ',' + s.slice(dpos + 1);
	}

	if (dpos == -1) {
		// no decimal separator
		// phantom position to satisfy loop ahead
		dpos = s.length;
	}

	/* Thousands separator */
	var ts = (comma === H.COMMA_DECIMAL_SEPARATOR) ? "." : ",";

	/* find where whole part begins */
	var dstop = 0;
	while (dstop < s.length && isNaN(parseInt(s.charAt(dstop), 16))) {
		++dstop;
	}

	/* Add thousands separator, from right to left */
	for (var e = dpos - grouping; e > dstop; e -= grouping) {
		s = s.slice(0, e) + ts + s.slice(e);
		if (comma === H.INDIAN_SEPARATOR) {
			// India numeric system: 1234567.1 -> 12,34,567.1
			grouping = 2;
		}
	}

	return s;
};

H.tzoffset = function (d)
{
	// returns the time zone offset, expressed as "hours *behind* UTC".
	// that would be 180 minutes for Brazil (-0300) and -60 minutes for Germany (+0100)
	return d.getTimezoneOffset() * 60000;
};

H.date_check = function (year, month, day)
{
	var daymax = 31;
	if (month == 4 || month == 6 || month == 9 || month == 11) {
		daymax = 30;
	} else if (month == 2) {
		daymax = 28;
		if ((year % 4) === 0 && (((year % 100) !== 0) || ((year % 400) === 0))) {
			// leap: divisible by 4 and not ending with 00
			//       years ending in 00 but divisible by 400 are leap!
			daymax = 29;
		}
	}
	if (day <= 0 || day > daymax || year <= 0 || year > 9999 || month <= 0 || month > 12) {
		return 0;
	}
	return 1;
};

H.date_interpret = function (n, dmy)
{
	n = Math.round(Math.abs(n) * 1000000);
	var day = Math.round(n / 1000000) % 100;
	var month = Math.round(n / 10000) % 100;
	var year = Math.round(n % 10000);

	if (! dmy) {
		var tmp = day;
		day = month;
		month = tmp;
	}

	if (! H.date_check(year, month, day)) {
		return null;
	}

	// set date at noon, so daylight savings timezone transtion will not change the day.
	return new Date(year, month - 1, day, 12, 0, 0); 
};

H.date_diff = function (d1, d2)
{
	// Dates' timezones may be different because of daylight savings, so we
	// need to compensate for.
	//
	// Math.round could be enough to do this compensation, but we prefer to
	// be twice as safe.
	
	return Math.round(((d2.getTime() - H.tzoffset(d2)) - (d1.getTime() - H.tzoffset(d1))) / 86400000);
};

H.date_add = function (dbase, days)
{
	// daylight savings timezone not a problem as long as dbase is > 1:01am,
	// so even 1 or 2 hour changes will not change the day.
	dbase.setTime(dbase.getTime() + Math.floor(days) * 86400000);
};

H.date_diff30 = function (d1, d2)
{
	var dd1 = d1.getDate();
	var dd2 = d2.getDate();
	var z1 = dd1;
	var z2 = dd2;

	if (dd1 == 31) {
		z1 = 30;
	}

	if (dd2 == 31) {
		if (dd1 >= 30) {
			z2 = 30;
		}
	}

	var fdt1 = 360 * d1.getFullYear() + 30 * (d1.getMonth() + 1) + z1;
	var fdt2 = 360 * d2.getFullYear() + 30 * (d2.getMonth() + 1) + z2;

	return fdt2 - fdt1;
};

H.date_gen = function (dd, dmy)
{
	if (dmy) {
		return dd.getDate() + (dd.getMonth() + 1) / 100 + dd.getFullYear() / 1000000;
	} else {
		return (dd.getMonth() + 1) + dd.getDate() / 100 + dd.getFullYear() / 1000000;
	}
};

H.date_to_show = function (dd, dmy)
{
	var dow = dd.getDay();
	if (dow === 0) {
		dow = 7;
	}

	var datestring = "";
	if (dmy) {
		datestring = " " + H.spacepad(dd.getDate(), 2) + "." +
				H.zeropad(dd.getMonth() + 1, 2) + "." +
				H.zeropad(dd.getFullYear(), 4);
	} else {
		datestring = " " + H.spacepad(dd.getMonth() + 1, 2) + "." +
				H.zeropad(dd.getDate(), 2) + "." +
				H.zeropad(dd.getFullYear(), 4);
	}

	return datestring + " " + dow;
};

H.is_12c = function ()
{
	return H.type === "12c" ||
		H.type === "12c-platinum" ||
		H.type === "12c-bs";
};

/* Some browsers don't have window.console.log */
window.console = window.console || {};
window.console.log = window.console.log || function (msg) {};
// should default to console.log in production
window.xlog = window.xlog || function (msg) { window.console.log(msg); };
// should be null in production
window.console.ut_snap = window.console.ut_snap || function (mode) {};

H.type_cookie = "hp12c";
if (H.type === "12c-platinum") {
	H.type_cookie = "hp12cpl";
} else if (H.type === "12c-bs") {
	H.type_cookie = "hp12cbs";
} else if (H.type === "11c") {
	H.type_cookie = "hp11c";
} else if (H.type === "10c") {
	H.type_cookie = "hp10c";
} else if (H.type === "15c") {
	H.type_cookie = "hp15c";
} else if (H.type === "16c") {
	H.type_cookie = "hp16c";
}

H.INTERACTIVE = 0;
H.PROGRAMMING = 1;
H.RUNNING = 2;
H.RUNNING_STEP = 3;
H.RUNNING_STEP_PRE = 4;

// financial constants (12c)
H.FIN_N = 0;
H.FIN_I = 1;
H.FIN_PV = 2;
H.FIN_PMT = 3;
H.FIN_FV = 4;

// Statistics (map to stomemory)
H.STAT_N  = 1;
H.STAT_X  = 2;
H.STAT_X2 = 3;
H.STAT_Y  = 4;
H.STAT_Y2 = 5;
H.STAT_XY = 6;

if (H.type === "11c" || H.type === "10c") {
	H.STAT_N  = 0;
	H.STAT_X  = 1;
	H.STAT_X2 = 2;
	H.STAT_Y  = 3;
	H.STAT_Y2 = 4;
	H.STAT_XY = 5;
} else if (H.type === "15c") {
	H.STAT_N  = 2;
	H.STAT_X  = 3;
	H.STAT_X2 = 4;
	H.STAT_Y  = 5;
	H.STAT_Y2 = 6;
	H.STAT_XY = 7;
}

H.STAT_MIN = H.STAT_N;
H.STAT_MAX = H.STAT_XY;

// 11C
H.TRIGO_DEG = 0;
H.TRIGO_RAD = 1;
H.TRIGO_GRAD = 2;

// 11C, 15C
H.NOTATION_FIX = 0;
H.NOTATION_SCI = 1;
H.NOTATION_ENG = 2;

// 16C
H.NOTATION_INT = 10; // just for comparisons
H.NOTATION_INT_DEC = H.NOTATION_INT + 1;
H.NOTATION_INT_HEX = H.NOTATION_INT + 2;
H.NOTATION_INT_OCT = H.NOTATION_INT + 3;
H.NOTATION_INT_BIN = H.NOTATION_INT + 4;

H.DEFAULT_WORDSIZE = 16;

H.win_digits = [];
H.win_digits[H.NOTATION_INT_HEX] = 8;
H.win_digits[H.NOTATION_INT_OCT] = 8;
H.win_digits[H.NOTATION_INT_DEC] = 8; // or 10?
H.win_digits[H.NOTATION_INT_BIN] = 8;

H.digit_bits = [];
H.digit_bits[H.NOTATION_INT_HEX] = 4;
H.digit_bits[H.NOTATION_INT_OCT] = 3;
H.digit_bits[H.NOTATION_INT_DEC] = Math.log(10) / Math.log(2); // ~3.32 bits
H.digit_bits[H.NOTATION_INT_BIN] = 1;

H.radix = [];
H.radix[H.NOTATION_INT_HEX] = 16;
H.radix[H.NOTATION_INT_OCT] = 8;
H.radix[H.NOTATION_INT_BIN] = 2;
H.radix[H.NOTATION_INT_DEC] = 10;
// just to simplify some functions that query radix
H.radix[H.NOTATION_FIX] = 10;
H.radix[H.NOTATION_SCI] = 10;
H.radix[H.NOTATION_ENG] = 10;

H.radix_suffix = [];
H.radix_suffix[H.NOTATION_INT_HEX] = "h";
H.radix_suffix[H.NOTATION_INT_OCT] = "o";
H.radix_suffix[H.NOTATION_INT_DEC] = "d";
H.radix_suffix[H.NOTATION_INT_BIN] = "b";

H.value_max = 9.999999 * 1e99;
H.value_min = 1e-99;

// 12C defaults
H.ram_MAX = 100;
H.ram_ADDR_SIZE = 2; // e.g. 43.33.00, 43 and 33 are 2 digits
H.STOP_INSTRUCTION = "43.33.00"; // e.g. GTO 00 has 2-digit addr
H.STOP_INSTRUCTION_IS_INVALID = false;
H.INSTRUCTION_SIZE = 2; // size of a non-addr opcode
H.INSTRUCTION_MAX = 100;
H.INSTRUCTION_TOKENS = 3; // e.g. 43.33.00 has 3 tokens

// 12c-BS has the same defaults as 12C vanilla

if (H.type === "12c-platinum") {
	H.ram_MAX = 400;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "43.33.000";
} else if (H.type === "11c") {
	H.ram_MAX = 204;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
} else if (H.type === "10c") {
	H.STOP_INSTRUCTION = "22.00";
	H.ram_MAX = 80;
} else if (H.type === "16c") {
	H.ram_MAX = 204;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
} else if (H.type === "15c") {
	H.ram_MAX = 448;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
	H.INSTRUCTION_TOKENS = 4; // big 15c exception
}

H.MEM_MAX = 20;

// 12C-BS the same defaults as vanilla

if (H.type == "12c-platinum") {
	H.MEM_MAX = 30;
} else if (H.type == "16c") {
	H.MEM_MAX = 100;
} else if (H.type === "15c") {
	H.MEM_MAX = 66;
} else if (H.type === "10c") {
	H.MEM_MAX = 10;
}

H.FLAGS_MAX = 2;

if (H.type === "16c") {
	H.FLAGS_MAX = 6;
} else if (H.type === "15c") {
	H.FLAGS_MAX = 10;
}

// Decimal separators
H.POINT_DECIMAL_SEPARATOR = 0;
H.COMMA_DECIMAL_SEPARATOR = 1;
H.INDIAN_SEPARATOR = 2;
H.SEPARATORS = 3;

// 16C flags
H.FLAG_ZEROS = 3;
H.FLAG_CARRY = 4;
H.FLAG_OVERFLOW = 5;

// 15C flags
H.FLAG_COMPLEX = 8;
if (H.type === "15c") {
	H.FLAG_OVERFLOW = 9;
}

// ############### Errors
H.ERROR_DIVZERO = 0;
H.ERROR_OVERFLOW = 1;
H.ERROR_STAT = 2;
H.ERROR_IP = 4;

// 11C, 15C
H.ERROR_INDEX = 3;
H.ERROR_RTN = 5;
H.ERROR_FLAG = 6;

// 15C
H.ERROR_MATRIX_OP = 1;
H.ERROR_RECURSIVE_SOLVE = 7;
H.ERROR_NO_ROOT = 8;
H.ERROR_MATRIX_ARG = 11;
// H.ERROR_DEFECTIVE = 9; // same as 16c, never happens in this simulator

// 12C
H.ERROR_IRR = 3;
H.ERROR_INTEREST = 5;
H.ERROR_MEMORY = 6;
H.ERROR_IRR2 = 7;
H.ERROR_DATE = 8;

// 16C
H.ERROR_IMPROPER_N = 1;
H.ERROR_IMPROPER_BIT = 2;
// H.ERROR_INDEX = 3; // STO register number invalid, same as 11C
// H.ERROR_IP = 4; // same as 11C, 12C
// H.ERROR_RTN = 5 // same as 11C (GOSUB-related error)
H.ERROR_NUMBERFORMAT = 6; // 16C-exclusive, floating point x integer number format
H.ERROR_DEFECTIVE = 9; // same as 15c, never happens in this simulator

H.check_closure_args = function (args)
{
	// replaced by actual checking at unittest_main
};

H.make_closure = function (fname, args, asm)
{
	H.check_closure_args(args);

	var f = function () {
		H.machine[fname].apply(H.machine, args);
	};

	f.closure_type = "machine";
	f.closure_name = fname;
	f.reducible = false;
	f.no_pgrm = 0;
	f.asm = asm;
	f.shrink = 0;

	return f;
};

H.make_pgrm_closure = function (fname, arg, asm)
{
	var f = function () {
		H.pgrm[fname].call(H.pgrm, arg);
	};

	f.closure_type = "pgrm";
	f.closure_name = fname;
	f.reducible = false;
	f.no_pgrm = 0;
	f.asm = asm;
	f.shrink = 0;

	return f;
};

H.delay = function (f, ms)
{
	return window.setTimeout(f, ms);
};

H.cancel_delay = function (handle)
{
	return window.clearTimeout(handle);
};

H.periodic = function (f, ms)
{
	return window.setInterval(f, ms);
};

H.cancel_periodic = function (handle)
{
	return window.clearInterval(handle);
};

H.defer = function (f)
{
	return H.delay(f, 0);
};

H.error = function (msg)
{
	window.xlog(msg);
};

H.mod_stt = null;

H.modifier_table = function ()
{
	if (H.mod_stt) {
		return H.mod_stt;
	}

	var a = [];

	a[0] = "";
	a[H.FF] = "f";
	a[H.GG] = "g";
	a[H.STO] = "STO";
	a[H.STO2] = "STO★";
	a[H.RCL] = "RCL";
	a[H.RCL2] = "RCL★";
	
	if (H.type !== "16c") {
		a[H.STO_PLUS] = "STO+";
		a[H.STO_MINUS] = "STO-";
		a[H.STO_TIMES] = "STO×";
		a[H.STO_DIVIDE] = "STO÷";
	}

	a[H.GTO] = "GTO";
	a[H.GTO_MOVE] = "GTO★";

	// models without RCL g still use as apocryphal key
	a[H.RCL_GG] = "RCL g";

	if (H.type === "11c" || H.type === "15c") {
		a[H.HYP] = "HYP";
		a[H.HYPINV] = "HYP-1";
		a[H.LBL] = "LBL";
		a[H.GSB] = "GSB";
		a[H.FIX] = "FIX";
		a[H.SCI] = "SCI";
		a[H.ENG] = "ENG";
		a[H.STO_FF] = "STO f";
		a[H.RCL_FF] = "RCL f";
		a[H.GG_SF] = "SF";
		a[H.GG_CF] = "CF";
		a[H.GG_FQUESTION] = "F?";

		a[H.STO_PLUS_FF] = "STO+ f";
		a[H.STO_MINUS_FF] = "STO- f";
		a[H.STO_TIMES_FF] = "STO× f";
		a[H.STO_DIVIDE_FF] = "STO÷ f";
	}

	if (H.type === "10c") {
		a[H.FIX] = "FIX";
		a[H.SCI] = "SCI";
		a[H.ENG] = "ENG";
	}

	if (H.type === "15c") {
		a[H.GTO_DOT] = "GTO★";
		a[H.GSB_DOT] = "GSB★";
		a[H.LBL_DOT] = "LBL★";

		a[H.STO_PLUS_DOT] = "STO+★";
		a[H.STO_MINUS_DOT] = "STO-★";
		a[H.STO_TIMES_DOT] = "STO×★";
		a[H.STO_DIVIDE_DOT] = "STO÷★";

		a[H.RCL_PLUS] = "RCL+";
		a[H.RCL_MINUS] = "RCL-";
		a[H.RCL_TIMES] = "RCL×";
		a[H.RCL_DIVIDE] = "RCL÷";

		a[H.RCL_PLUS_DOT] = "RCL+★";
		a[H.RCL_MINUS_DOT] = "RCL-★";
		a[H.RCL_TIMES_DOT] = "RCL×★";
		a[H.RCL_DIVIDE_DOT] = "RCL÷★";

		a[H.RCL_PLUS_FF] = "STO+ f";
		a[H.RCL_MINUS_FF] = "STO- f";
		a[H.RCL_TIMES_FF] = "STO× f";
		a[H.RCL_DIVIDE_FF] = "STO÷ f";

		a[H.FF_EXCHANGE] = "X⇄";
		a[H.FF_EXCHANGE_DOT] = "X⇄★";

		a[H.SOLVE] = "SOLV";
		a[H.SOLVE_DOT] = "SOLV★";
		a[H.INTEG] = "INTG";
		a[H.INTEG_DOT] = "INTG★";
		a[H.GG_TEST] = "TEST";

		a[H.DIM] = "DIM";
		a[H.RCL_DIM] = "RCL D";
		a[H.MATRIX] = "M";
		a[H.STO_GG] = "STO g";
		a[H.STO_MATRIX] = "STO M";
		a[H.STO_FF_MATRIX] = "STO M";
		a[H.RCL_MATRIX] = "RCL M";
		a[H.RCL_FF_MATRIX] = "RCL M";
		a[H.RESULT] = "Res";

		a[H.ISG] = "ISG";
		a[H.ISG_DOT] = "ISG★";
		a[H.DSE] = "DSE";
		a[H.DSE_DOT] = "DSE★";
	}

	if (H.type === "16c") {
		a[H.LBL] = "LBL";
		a[H.GSB] = "GSB";
		a[H.GG_SF] = "SF";
		a[H.GG_CF] = "CF";
		a[H.GG_FQUESTION] = "F?";
		a[H.STO_FF] = "STO f";
		a[H.RCL_FF] = "RCL f";
		a[H.WINDOW] = "WINDOW";
		a[H.FLOAT] = "FLOAT";
	}

	H.mod_stt = a;
	return H.mod_stt;
};

H.MODAL_NONE = 0;
H.MODAL_PAUSE = 1;
H.MODAL_PRESS = 2;
H.MODAL_MISC = 3;
H.MODAL_ERROR = 4;
/* HP-12C emulator 
 * Copyright (c) 2007, 2011, 2016 Elvis Pfutzenreuter - epxx.co.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true, bitwise: true */
/*jshint globalstrict: true*/
/*global H */

"use strict";

function Hp12c_debug(format_result)
{
	var self = this;

	self.memwin = null;
	self.format_result = format_result;
}

Hp12c_debug.prototype.format_result_i = function (t)
{
	var self = this;

	var it = {r: t.i, i: t.r, h: t.h};
	return self.format_result(it);
};

Hp12c_debug.prototype.format_matrix = function (t)
{
	var self = this;

	var size = H.machine.matrix_size(t.r);

	return "Mat " +
		(10 + t.r - 20).toString(16).toUpperCase() +
		" (" + size[0] + "x" + size[1] + ")";
};

Hp12c_debug.prototype.show_memory2 = function ()
{
	var self = this;

	if (! self.memwin || ! self.memwin.document) {
		// window has been closed; don't schedule updates anymore
		self.memwin = null;
		return;
	}

	var windoc = self.memwin.document;
	var now = new Date();
	var title = windoc.getElementById('tt');
	var e;

	if (title) {
		title.innerHTML = H.type + " memory at " + now;

		if (H.is_12c()) {
			for (e = 0; e < H.machine.finmemory.length; ++e) {
				windoc.getElementById("finmemory" + e).innerHTML =
					self.format_result({r: H.machine.finmemory[e]});
			}
		}
		for (e = 0; e < H.machine.stomemory.length; ++e) {
			var elem = windoc.getElementById("stomemory" + e);
			if (! elem && e >= 32) {
				// pardon (16c has *lots* of memory)
				continue;
			}
			elem.innerHTML =
				self.format_result(H.machine.sto_tuple(e));
		}
		if (H.is_12c()) {
			for (e = 0; e < H.machine.njmemory.length; ++e) {
				windoc.getElementById("njmemory" + e).innerHTML =
					self.format_result({r: H.machine.njmemory[e]});
			}
		}
		if (H.machine.matrix_in_reg("x")) {
			windoc.getElementById("x").innerHTML =
				self.format_matrix(H.machine.reg_tuple("x"));
			windoc.getElementById("xi").innerHTML = "";
		} else {
			windoc.getElementById("x").innerHTML =
				self.format_result(H.machine.reg_tuple("x"));
			if (H.type === "15c") {
				windoc.getElementById("xi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("x"));
			}
		}
		if (H.machine.matrix_in_reg("last_x")) {
			windoc.getElementById("last_x").innerHTML =
				self.format_matrix(H.machine.reg_tuple("last_x"));
			windoc.getElementById("last_xi").innerHTML = "";
		} else {
			windoc.getElementById("last_x").innerHTML =
				self.format_result(H.machine.reg_tuple("last_x"));
			if (H.type === "15c") {
				windoc.getElementById("last_xi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("last_x"));
			}
		}
		if (H.machine.matrix_in_reg("y")) {
			windoc.getElementById("y").innerHTML =
				self.format_matrix(H.machine.reg_tuple("y"));
			windoc.getElementById("yi").innerHTML = "";
		} else {
			windoc.getElementById("y").innerHTML =
				self.format_result(H.machine.reg_tuple("y"));
			if (H.type === "15c") {
				windoc.getElementById("yi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("y"));
			}
		}
		if (H.machine.matrix_in_reg("z")) {
			windoc.getElementById("z").innerHTML =
				self.format_matrix(H.machine.reg_tuple("z"));
			windoc.getElementById("zi").innerHTML = "";
		} else {
			windoc.getElementById("z").innerHTML =
				self.format_result(H.machine.reg_tuple("z"));
			if (H.type === "15c") {
				windoc.getElementById("zi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("z"));
			}
		}
		if (H.machine.matrix_in_reg("w")) {
			windoc.getElementById("w").innerHTML =
				self.format_matrix(H.machine.reg_tuple("w"));
			windoc.getElementById("wi").innerHTML = "";
		} else {
			windoc.getElementById("w").innerHTML =
				self.format_result(H.machine.reg_tuple("w"));
			if (H.type === "15c") {
				windoc.getElementById("wi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("w"));
			}
		}

		if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
			if (H.machine.matrix_in_index()) {
				windoc.getElementById("index").innerHTML =
				self.format_matrix({r: H.machine.index,
							h: H.machine.indexh,
							i: 0});
			} else {
				windoc.getElementById("index").innerHTML =
				self.format_result({r: H.machine.index, h: 0, i: 0});
			}
		}

		for (e = 0; e < H.machine.ram.length; ++e) {
			var opcode = H.machine.ram[e];
			var asm = H.pgrm.disassemble(opcode);
			var txt = "";
			
			if (opcode && asm !== "NOP") {
				txt = H.pgrm.disassemble(opcode) +
					" <i>(" + opcode + ")</i>";
			}
			windoc.getElementById("ram" + e).innerHTML = txt;
		}
	}

	H.delay(function () {
		self.show_memory2();
	}, 1000);
};

Hp12c_debug.prototype.show_memory = function ()
{
	var self = this;

	self.memwin = window.open(H.type_cookie + '_memory.html');
	H.delay(function () {
		self.show_memory2();
	}, 1000);
};

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true */
/*jshint globalstrict: true*/
/*global H */

"use strict";

H.display_max = 9999999999;
H.display_len = 10; // without extra -
H.display_min = 0.0000000001;

H.format_result_armored = function (n, decs, notation, co)
{
	n = n.r || 0;

	if (n > H.value_max) {
		n = H.value_max;
	} else if (n < -H.value_max) {
		n = -H.value_max;
	} else if (Math.abs(n) < H.value_min) {
		n = 0;
	}

	return H.format_result(n, decs, notation, co);
};

// called by unit tests
H.format_result_ut = function (n)
{
	return H.format_result(n, H.machine.decimals, H.machine.notation, H.machine.comma);
};

H.format_result = function (n, decs, notation, co)
{
	var res = "";
	var absn = Math.abs(n);
	var fix_dec = decs;
	var mantissa_dec = decs;
	var degenerate = 0;
	var scale;
	var mantissa;

	if (n >= H.value_max) {
		degenerate = 1;
		scale = 99;
		n = H.value_max;
		absn = Math.abs(n);
	} else if (n <= -H.value_max) {
		degenerate = 2;
		scale = 99;
		n = -H.value_max;
		absn = Math.abs(n);
	} else if (absn >= H.value_min) {
		scale = Math.log(absn) / Math.log(10);
		// added a tad to guarantee that log(10) === 1
		scale = Math.floor(scale + 0.00000000001);
	} else {
		degenerate = 3;
		scale = -100;
		absn = n = 0;
	}

	if (notation == H.NOTATION_FIX) {
		// note that 12C and 16C are hardwired to FIX
		if (H.type === "15c" || H.type === "11c" || H.type === "10c") {
		} else {
			// 12C, 16C: show all decimals we can if SCI mode
			mantissa_dec = 6;
		}
		if (absn > H.display_max) {
			// too big to be shown normally
			notation = H.NOTATION_SCI;
		} else if (absn !== 0 && scale < -9) {
			// too small to be shown at all
			notation = H.NOTATION_SCI;
		} else if (absn !== 0 && fix_dec < (-scale)) {
			// too small to be shown with current decimal count
			if (H.type === "15c" || H.type === "11c" || H.type === "10c") {
				// change to SCI
				notation = H.NOTATION_SCI;
			} else {
				// 12C, 16C
				// we need more decimals to show this number
				fix_dec = -scale;
			}
		}
	}

	mantissa_dec = Math.min(mantissa_dec, 6);

	if (degenerate != 3) {
		mantissa = n / Math.pow(10, scale);
	} else {
		mantissa = 0;
	}

	// handle rounding up
	var mantissa_signal = mantissa >= 0 ? 1 : -1;
	mantissa = parseFloat(Math.abs(mantissa).toFixed(mantissa_dec));
	if (notation != H.NOTATION_FIX && mantissa >= 10) {
		mantissa /= 10;
		scale += 1;
	}
	// give signal back
	mantissa *= mantissa_signal;

	// until now, ENG handling == SCI
	// now, compensate for ENG
	if (notation == H.NOTATION_ENG && (! degenerate)) {
		var new_scale = 3 * Math.floor(scale / 3);
		while (scale > new_scale) {
			mantissa *= 10;
			scale -= 1;
			if (mantissa_dec > 0) {
				mantissa_dec -= 1;
			}
		}
	}

	if (notation !== H.NOTATION_FIX) {
		// show as exponential
		/*
		if (mantissa === 0 && (H.type !== "11c" && H.type !== "15c") && false) {
			// in SCI mode, 12C shows 0.0000000 00 too...
			return H.i18n(' 0', co, 1);
		*/
		if (degenerate == 1) {
			return H.i18n(' 9.999999 99', co, 1);
		} else if (degenerate == 2) {
			return H.i18n('-9.999999 99', co, 1);
		}

		res = H.i18n(mantissa.toFixed(mantissa_dec), co, 1);
		if (mantissa >= 0) {
			res = " " + res;
		}

		// no need to compensate for thousand separators because even
		// in ENG mode mantissa is < 1000.

		// display_len does NOT count the negative sign
		// -3: exponential plus space/expo signal
		// +1: compressed decimal point (always present, even if mantissa_dec == 0)
		// +1: negative sign
		var max_m_len = H.display_len - 3 + 1 + 1;

		res = res.substr(0, max_m_len);
		while (res.length < max_m_len) {
			res = res + " ";
		}

		if (mantissa === 0) {
			scale = 0;
		}

		if (scale < 0) {
			res = res + "-" + H.zeropad((-scale).toFixed(0), 2);
		} else {
			res = res + " " + H.zeropad(scale.toFixed(0), 2);
		}
		// window.xlog(" " + n + " " + mantissa + " " + scale + " d " + degenerate + " " + res);

		return res;
	}

	// show as fixed, w/o exp
	var dec = Math.max(0, fix_dec);
	var sgn = n < 0 ? "-" : " ";
	n = Math.abs(n);
	var ll = n.toFixed(dec).length - (dec > 0 ? 1 : 0);
	if (ll > H.display_len) {
		// reduce decimals if too big for display
		dec -= (ll - H.display_len);
		dec = Math.max(0, dec);
	}
	res = H.i18n(sgn + n.toFixed(dec), co, 1);

	return res;
};

H.format_result_integer = function (t, notation, negative_repr, wordsize)
{
	var radix = H.get_radix(notation)[0];
	return H.format_integer_to_string(t, radix, negative_repr, wordsize);
};

// used only for debugging purposes, so it may use H.machine
H.format_result_tuple = function (t)
{
	var notation = H.machine.notation;
	if (notation < H.NOTATION_INT) {
		var co = H.machine.comma;
		var decs = H.machine.decimals;
		return H.format_result(t.r, decs, notation, co);
	}
	var negative_repr = H.machine.negative_repr;
	var wordsize = H.machine.wordsize;
	return H.format_result_integer(t, notation, negative_repr, wordsize);
};

H.format_integer = function (x, xmode, typed_digits, altdisplay, notation, wordsize,
				window_count, intwindow, zeros_flag, co, negative_repr)
{
	var typing = xmode > -100; // -100, -1, 0
	var point1 = "";
	var point2 = "";
	var sign = " ";
	var show_apocryphal = (altdisplay > 0);

	var radix = H.get_radix(notation);
	var suffix = radix[1];
	radix = radix[0];

	var spure = H.format_integer_to_string(x, radix, negative_repr, wordsize);
	var spure16;
	if (radix === 2) {
		spure16 = H.format_integer_to_string(x, 16, negative_repr, wordsize);
	}
	// window.xlog(spure);

	if (spure.substr(0, 1) === "-") {
		spure = spure.substr(1);
		sign = "-";
	}

	var s, sfull;
	var len = 8;

	var bits_per_digit = H.digit_bits[notation];
	var digits_on_display = H.win_digits[notation];
	var tot_digits = Math.ceil(wordsize / bits_per_digit);
	var wincount = window_count;
	var tot_digits_ceil = wincount * digits_on_display;

	var si2 = spure;
	var significant_digits = si2.length;
	var significant_windows = Math.ceil(significant_digits /
						digits_on_display);

	if (typing) {
		while (si2.length < typed_digits) {
			si2 = "0" + si2;
		}
	}

	var current_window = typing ? 0 : intwindow;

	show_apocryphal = show_apocryphal &&
				(significant_windows > 1 || current_window > 0);

	var filler = " ";
	if (zeros_flag && radix !== 10) {
		filler = "0";
	}

	while (si2.length < tot_digits) {
		si2 = filler + si2;
	}

	while (si2.length < tot_digits_ceil) {
		si2 = " " + si2;
	}

	if (current_window > 0) {
		point2 = ".";
	}
	if (current_window < (significant_windows - 1)) {
		point1 = ".";
	}

	// window cutting
	var dpos;
	dpos = (wincount - current_window - 1) * digits_on_display;
	si2 = si2.substr(dpos, digits_on_display);
	// convert dpos to "last digit = 0"
	dpos = current_window * digits_on_display;

	var lcdsign = sign;

	if (radix === 10) {
		var sp = si2.lastIndexOf(" ");
		if (sp >= 0) {
			si2 = si2.substr(0, sp) + lcdsign + si2.substr(sp + 1);
			lcdsign = " ";
		} else if (point1 === ".") {
			// next window has significant digits
			// do not show LCD sign
			lcdsign = " ";
		} else {
			// this window is full but next window does not
			// have significant digits
			// leave LCD sign in place
		}
	}

	// if radix = 10 and window > 0, i18n() might put decimal places
	// in wrong values, because si2 has been cut. We add zeros as
	// LSBs until the LSB is a multiple of 3, so i18n(si2) does well.
	var r10comp = 0;
	while (radix === 10 && ((dpos - r10comp) % 3) > 0) {
		si2 += "0";
		r10comp++;
	}
	si2 = H.i18n(si2, co, 0, radix !== 10);
	// Remove LSB compensation, if it was made above
	if (radix === 10 && r10comp > 0) {
		si2 = si2.substr(0, si2.length - r10comp);
	}
	s = lcdsign + si2 + " " + point1 + suffix + point2;

	sfull = sign + (radix === 2 ? spure16 : spure);
	sfull = H.i18n(sfull, co, 0, radix !== 10);

	return [s, sfull, show_apocryphal];
};

H.html_wrap = function (txt) {
	var j = 0;
	var c;
	for (var i = 0; i < txt.length; ++i) {
		c = txt.charAt(i);
		++j;
		if (j > 13 || (j > 9 && (c === "." || c === ","))) {
			txt = txt.substr(0, i + 1) + "<br>" + txt.substr(i + 1);
			i += 4;
			j = 0;
		}
	}

	return txt;
};

H.format_matrix = function (n, r, c)
{
	var s = " " + (10 + n - 20).toString(16).toUpperCase() +
		" " + r + ", " + c;
	return s;
};

H.format_typed_number = function (ms, m, dec, exp, exps, xmode, co, notation, decs)
{
	if (m.length === 0) {
		// nothing typed, or BSP'ed to none
		return H.format_result(0, decs, notation, co);
	}

	var s = "";

	if (xmode === 0) {
		s = " 0";
		if (m.length > 0) {
			s = (ms < 0 ? "-" : " ") + m;
		}
		if (H.type !== "11c" && H.type !== "15c" && H.type !== "10c") {
			s += ".";
		}
		s = H.i18n(s, co, 0);
	} else if (xmode === 1) {
		s = H.i18n((ms < 0 ? "-" : " ") + m + "." + dec, co, 1);
	} else if (xmode === 100) {
		var rdec = dec.substr(0, 7 - m.length);
		s = H.i18n((ms < 0 ? "-" : " ") + m + "." + rdec, co, 1);
		for (var i = 0; i < (7 - rdec.length - m.length); ++i) {
			s += " ";
		}
		s += exps < 0 ? "-" : " ";
		s += H.zeropad(parseInt("0" + exp, 10).toFixed(0), 2);
	}

	return s;
};

H.get_radix = function (notation)
{
	var radix = H.radix[notation];
	var suffix = H.radix_suffix[notation];

	return [radix, suffix];
};

H.format_integer_to_string = function (t, radix, pnegative_repr, wordsize)
{
	// for non-decimal, how as unsigned
	var negative_repr = 0;
	if (radix === 10) {
		negative_repr = pnegative_repr;
	}

	var spure = H.integer_to_string(t,
					negative_repr,
					wordsize,
					radix,
					true);

	return spure;
};

/* HP-12C emulator 
 * Copyright (c) 2007, 2011, 2016 Elvis Pfutzenreuter - epxx.co.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true */
/*jshint globalstrict: true*/
/*global H */

"use strict";

function Hp12c_display()
{
	var self = this;

	self.lcd = [];

	// contents that "should be" on screen. Closure or list of strings
	self.contents_logical = ["", ""];

	// contents that are actually on screen e.g. could be "" when flickering
	self.contents_physical = "replaceme";
	self.contents_alt_physical = "replaceme";

	// contents that "should be" and are actually in modifier
	self.contents_modifier_logical = "";
	self.contents_modifier_physical = "replaceme";

	// LCD fast 'flicker' when a key is pressed
	self.flicker_delay = 25;
	self.flicker_timer = null;

	// LCD continuous blink when overflow
	self.overflow_blink = false;
	self.overflow_blink_timer = null;
	self.overflow_blink_freq = 250; // ms


	var LCD_A = 1;
	var LCD_B = 2;
	var LCD_C = 4;
	var LCD_D = 8;
	var LCD_E = 16;
	var LCD_F = 32;
	var LCD_G = 64;
	var LCD_P = 128;
	var LCD_T = 256;

	self.lcdmap = [];

	self.lcdmap['0'] = LCD_A | LCD_B | LCD_C | LCD_E | LCD_F | LCD_G;
	self.lcdmap['1'] = LCD_C | LCD_F;
	self.lcdmap['2'] = LCD_A | LCD_C | LCD_D | LCD_E | LCD_G;
	self.lcdmap['3'] = LCD_A | LCD_C | LCD_D | LCD_F | LCD_G;
	self.lcdmap['4'] = LCD_B | LCD_C | LCD_D | LCD_F;
	self.lcdmap['5'] = LCD_A | LCD_B | LCD_D | LCD_F | LCD_G;
	self.lcdmap['6'] = LCD_A | LCD_B | LCD_D | LCD_E | LCD_F | LCD_G;
	self.lcdmap['7'] = LCD_A | LCD_C | LCD_F;
	self.lcdmap['8'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E | LCD_F | LCD_G;
	self.lcdmap['9'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_F | LCD_G;
	self.lcdmap[' '] = 0;
	self.lcdmap['.'] = LCD_P;
	self.lcdmap[','] = LCD_P | LCD_T;
	self.lcdmap['r'] = LCD_A | LCD_B;
	self.lcdmap['U'] = LCD_B | LCD_C | LCD_E | LCD_F | LCD_G;
	self.lcdmap['u'] = LCD_B | LCD_C | LCD_D;
	self.lcdmap['n'] = LCD_B | LCD_C | LCD_A;
	self.lcdmap['i'] = LCD_B;
	self.lcdmap['g'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_F | LCD_G;
	self.lcdmap['-'] = LCD_D;
	self.lcdmap['A'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E | LCD_F;
	self.lcdmap['a'] = self.lcdmap['A'];
	self.lcdmap['B'] = LCD_B | LCD_D | LCD_E | LCD_F | LCD_G;
	self.lcdmap['b'] = self.lcdmap['B'];
	self.lcdmap['c'] = LCD_D | LCD_E | LCD_G;
	self.lcdmap['C'] = self.lcdmap['c'];
	self.lcdmap['d'] = LCD_C | LCD_D | LCD_E | LCD_F | LCD_G;
	self.lcdmap['D'] = self.lcdmap['d'];
	self.lcdmap['E'] = LCD_A | LCD_B | LCD_D | LCD_E | LCD_G;
	self.lcdmap['e'] = self.lcdmap['E'];
	self.lcdmap['F'] = LCD_A | LCD_B | LCD_D | LCD_E;
	self.lcdmap['f'] = self.lcdmap['F'];
	self.lcdmap['H'] = LCD_B | LCD_C | LCD_D | LCD_E | LCD_F;
	self.lcdmap['h'] = LCD_B |         LCD_D | LCD_E | LCD_F;
	self.lcdmap['o'] = LCD_D | LCD_E | LCD_F | LCD_G;
	self.lcdmap['O'] = self.lcdmap["o"];
	self.lcdmap['R'] = LCD_D | LCD_E;
	self.lcdmap['P'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E;
	self.lcdmap[':'] = LCD_P;

	for (var e = 0; e <= 10; ++e) {
		self.lcd[e] = [];
		self.lcd[e][0] = 0;
		self.lcd[e][self.lcd[e].length] = H.getElem("lcd" + e + "a");
		self.lcd[e][self.lcd[e].length] = H.getElem("lcd" + e + "b");
		self.lcd[e][self.lcd[e].length] = H.getElem("lcd" + e + "c");
		self.lcd[e][self.lcd[e].length] = H.getElem("lcd" + e + "d");
		self.lcd[e][self.lcd[e].length] = H.getElem("lcd" + e + "e");
		self.lcd[e][self.lcd[e].length] = H.getElem("lcd" + e + "f");
		self.lcd[e][self.lcd[e].length] = H.getElem("lcd" + e + "g");
		self.lcd[e][self.lcd[e].length] = H.getElem("lcd" + e + "p");
		self.lcd[e][self.lcd[e].length] = H.getElem("lcd" + e + "t");
	}
	
	self.display = H.getElem("display");
	self.dbegin = H.getElem("begin");
	self.ddmyc = H.getElem("dmyc");
	self.dmodifier = H.getElem("modifier");
	self.pgrm = H.getElem("pgrm");
	self.rpnalg = H.getElem("rpnalg");
	self.trigo = H.getElem("trigo");
	self.user = H.getElem("user");
	self.carry = H.getElem("carry");
	self.overflow = H.getElem("overflow");
	self.complex = H.getElem("complex");
	self.altdisplay = H.getElem("altdisplay");
	self.wordstatus = H.getElem("wordstatus");
	self.undo = H.getElem("undo");
	self.parentheses = H.getElem("parentheses");

	self.clear();
}

Hp12c_display.prototype.private_show = function (dummy)
{
	// This method only exists because the mobile versions
	// override it to detect changes in display, and schedule
	// memory saving.
};

// converts contents to LCD segments
Hp12c_display.prototype.physical_lcd_display = function (contents)
{
	var self = this;
	var txt = contents[0];
	var alttxt = contents[1];

	self.show_alt(alttxt);

	if (self.contents_physical === txt) {
		return;
	}

	// no-op, but mobile versions override method and
	// might look the argument
	self.private_show(txt);

	self.contents_physical = txt;

	window.console.ut_snap("lcd  ");

	var f = -1;
	var buffer = [];

	for (var e = 0; e < txt.length && f < self.lcd.length; ++e) {
		var merge = false;
		var val = txt.charAt(e);
		++f;
		if ((val == '.' || val == ',') && f > 0) {
			// merge decimal point/thousand separator
			--f;
			merge = true;
		}
		if (! self.lcdmap[val]) {
			val = ' ';
		}
		var map = self.lcdmap[val];
		buffer[f] = map | (merge ? buffer[f] : 0);
	}
	for (++f; f < self.lcd.length; ++f) {
		buffer[f] = 0;
	}

	if (H.embedded) {
		self.display.showDisplay(buffer);
		return;
	}

	for (f = 0; f < buffer.length && f < self.lcd.length; ++f) {
		var map2 = buffer[f];
		for (var segm = 1; segm < 10; ++segm) {
			var bit = 1 << (segm - 1);
			var visibility = (map2 & bit) ? "visible" : "hidden";
			if (self.lcd[f][segm].style.visibility !== visibility) {
				self.lcd[f][segm].style.visibility = visibility;
			}
		}
	}
};

Hp12c_display.prototype.set_blink = function (blinks)
{
	var self = this;

	self.overflow_blink = blinks;
	self.recycle();
};

Hp12c_display.prototype.clear = function ()
{
	var self = this;

	self.new_content(["", ""], false);
	self.show_wordstatus("");
};

Hp12c_display.prototype.displayMatrix = function (n, r, c)
{
	var self = this;

	self.new_content(function () {
		return [H.format_matrix(n, r, c), ""];
	}, true);
};

Hp12c_display.prototype.p_display_integer = function (x, xmode, typed_digits, flicker)
{
	var self = this;

	var altdisplay = H.machine.altdisplay;
	var notation = H.machine.notation;
	var wordsize = H.machine.wordsize;
	var window_count = H.machine.window_count();
	var intwindow = H.machine.intwindow;
	var zeros_flag = H.machine.get_zeros_flag();
	var co = H.machine.comma;
	var negative_repr = H.machine.negative_repr;

	var f = function () {
		var res = H.format_integer(x, xmode, typed_digits, altdisplay, notation, wordsize,
                                window_count, intwindow, zeros_flag, co, negative_repr);
		var s = res[0];
		var sfull = res[1];
		var show_apocryphal = res[2];

		return [s, (show_apocryphal ? H.html_wrap(sfull) : "")];
	};

	self.new_content(f, flicker);
};

Hp12c_display.prototype.displayNumber = function (x)
{
	var self = this;

	if (H.type === "16c" && H.machine.notation >= H.NOTATION_INT) {
		self.p_display_integer(x, -100, null, true);
		return;
	}

	var decs = H.machine.decimals;
	var notation = H.machine.notation;
	var co = H.machine.comma;

	var f = function () {
		var sres = H.format_result_armored(x, decs, notation, co);
		return [sres, ""];
	};

	self.new_content(f, true);
};

Hp12c_display.prototype.displayTypedNumber_integer = function (val, xmode, digits)
{
	var self = this;
	self.p_display_integer(val, xmode, digits, false);
};

Hp12c_display.prototype.displayTypedNumber = function (ms, m, dec, exp, exps, xmode, notation)
{
	var self = this;
	var co = H.machine.comma;
	var decs = H.machine.decimals;

	var f = function () {
		var s = H.format_typed_number(ms, m, dec, exp, exps, xmode, co, notation, decs);
		return [s, ""];
	};
	self.new_content(f, false); // no flicker
};

// Show free/unknown contents
Hp12c_display.prototype.show_nopgrm = function (txt)
{
	var self = this;

	self.new_content([txt, ""], false);
};


// Show "running"
Hp12c_display.prototype.show_running = function ()
{
	var self = this;
	self.new_content(["running", ""], false);
};

// Show date
Hp12c_display.prototype.show_date = function (txt)
{
	var self = this;
	self.new_content([txt, ""], true);
};

// ################## Blink / flicker state machine implementation

// LCD contents have changed
Hp12c_display.prototype.new_content = function (content, to_flicker)
{
	var self = this;

	var will_flicker = false;

	if (content !== null) {
		self.contents_logical = content;
		// flicker uses H.machine.cli()/sti()
		will_flicker = to_flicker && (!!H.machine);
		window.console.ut_snap("new  ");
	} else {
		window.console.ut_snap("recy ");
	}

	if (self.overflow_blink_timer) {
		H.cancel_periodic(self.overflow_blink_timer);
		self.overflow_blink_timer = null;
	}
	if (self.flicker_timer) {
		H.machine.sti("flicker abrt");
		H.cancel_delay(self.flicker_timer);
		self.flicker_timer = null;
	}

	if (H.machine) {
		var modal = H.machine.modal();

		if (modal === H.MODAL_ERROR) {
			will_flicker = false;
			// override display contents
			self.contents_logical = ["ERROR " + H.machine.error(), ""];
		} else if (modal === H.MODAL_PAUSE) {
			will_flicker = false;
			self.show_modifier_physical("PAUSE");
		} else if (modal === H.MODAL_PRESS) {
			will_flicker = false;
			self.show_modifier_physical("Press");
		} else if (modal === H.MODAL_MISC) {
			will_flicker = false;
		} else if (H.machine.program_mode === H.RUNNING_STEP_PRE) {
			will_flicker = false;
			self.show_modifier_physical("Press");
		} else {
			// refresh modifier, in case last mode was modal
			self.show_modifier_physical(self.contents_modifier_logical);

			if (H.machine.program_mode === H.RUNNING || H.machine.running_context.length > 0) {
				if (H.machine.rapid) {
					// Show "running" but preserve the logical display content
					self.physical_lcd_display(["running", ""]);
					// elide display update when in rapid mode
					return;
				}
				will_flicker = false;
			}
		}
	}

	var f = function () {
		if (self.overflow_blink) {
			self.overflow_blink_on = true;
			self.overflow_blink_timer =
				H.periodic(function () {
					self.overflow_blink_on = ! self.overflow_blink_on;
					if (self.overflow_blink_on) {
						window.console.ut_snap("blink");
						self.physical_lcd_display(self.r_contents_logical());
					} else {
						window.console.ut_snap("blonk");
						self.physical_lcd_display(["", ""]);
					}
				},
				self.overflow_blink_freq);
		} 

		self.physical_lcd_display(self.r_contents_logical());
	};

	if (will_flicker) {
		// flicker: clear display for a short while
		self.physical_lcd_display(["", ""]);

		// block keyboard
		H.machine.cli("flicker");
	
		// schedule redisplay (f() block contains overflow blink logic)
		self.flicker_timer = H.delay(function () {
				self.flicker_timer = null;
				H.machine.sti("flicker");
				f();
		}, self.flicker_delay);
	} else {
		f();
	}
};

Hp12c_display.prototype.recycle = function () {
	var self = this;
	self.new_content(null);
};

Hp12c_display.prototype.r_contents_logical = function ()
{
	var self = this;

	if (typeof self.contents_logical === "function") {
		// resolve lazy evaluation
		self.contents_logical = self.contents_logical();
	}
	
	return self.contents_logical;
};

// ############################################ Modifier

Hp12c_display.prototype.show_modifier = function (m)
{
	var self = this;

	var txt = H.modifier_table()[m];
	if (txt === undefined || txt === null) {
		H.error("Display: unknown modifier " + m);
		txt = "";
	}
	self.contents_modifier_logical = txt;

	// do not change modifier in modal state (PAUSE or Press are painted there)
	// or when running in rapid mode (to save processing time)

	var modal = H.machine.modal() > 0 || H.machine.program_mode === H.RUNNING_STEP_PRE;
	var running_rapid = H.machine.rapid &&
		(H.machine.program_mode === H.RUNNING || H.machine.running_context.length > 0);

	if (modal || running_rapid) {
		return;
	}

	self.show_modifier_physical(txt);
};

// ################## Annunciators and other 'simple' elements

Hp12c_display.prototype.show_dmyc = function (dmy, compoundf)
{
	var self = this;

	var txt = "";
	if (dmy) {
		txt += "D.MY";
	}
	if (compoundf) {
		txt += "&nbsp;&nbsp;C";
	}

	self.setInnerHTML("ddmyc", txt);
};

Hp12c_display.prototype.show_modifier_physical = function (txt)
{
	var self = this;

	if (txt !== self.contents_modifier_physical) {
		self.contents_modifier_physical = txt;
		self.setInnerHTML("dmodifier", self.contents_modifier_physical);
		window.console.ut_snap("mod  ");
	}
};

Hp12c_display.prototype.show_pgrm = function (pgrm, run, pc)
{
	var self = this;

	var txt = "";
	if (pgrm) {
		txt = "PRGM";
	} else if (run) {
		txt = "RUN " + H.zeropad(pc.toFixed(0), 2);
	}

	self.setInnerHTML("pgrm", txt);
};

Hp12c_display.prototype.show_algmode = function (algmode)
{
	var self = this;

	if (H.type === "12c-platinum") {
		var txt = ["RPN", "ALG"][algmode];
		self.setInnerHTML("rpnalg", txt);
	}
};

Hp12c_display.prototype.show_trigo = function (trigo)
{
	var self = this;

	if (H.type === "11c" || H.type === "15c" || H.type === "10c") {
		var txt = ["", "RAD", "GRAD"][trigo];
		self.setInnerHTML("trigo", txt);
	}
};

Hp12c_display.prototype.show_user = function (user)
{
	var self = this;

	if (H.type === "11c" || H.type === "15c") {
		var txt = ["", "USER"][user];
		self.setInnerHTML("user", txt);
	}
};

Hp12c_display.prototype.setInnerHTML = function (name, txt)
{
	var self = this;

	if (H.embedded) {
		self.display.setInnerHTML(name, txt);
	} else {
		var tgt = this[name];
		if (tgt) {
			tgt.innerHTML = txt;
		}
	}
};

Hp12c_display.prototype.show_carry = function (is_carry)
{
	var self = this;

	var txt = "";
	if (is_carry) {
		txt = "C";
	}

	if (H.type === "16c") {
		self.setInnerHTML("carry", txt);
	}
};

Hp12c_display.prototype.show_overflow = function (is_overflow)
{
	var self = this;

	var txt = "";
	if (is_overflow) {
		txt = "G";
	}

	if (H.type === "16c") {
		self.setInnerHTML("overflow", txt);
	}
};

Hp12c_display.prototype.show_begin = function (is_begin)
{
	var self = this;

	var txt = "";
	if (is_begin) {
		txt = "BEGIN";
	}

	self.setInnerHTML("dbegin", txt);
};

Hp12c_display.prototype.show_alt = function (txt)
{
	var self = this;

	if (self.contents_alt_physical === txt) {
		return;
	}

	self.contents_alt_physical = txt;
	self.setInnerHTML("altdisplay", txt);
	window.console.ut_snap("alth ");
};

Hp12c_display.prototype.show_wordstatus = function (txt)
{
	var self = this;

	self.setInnerHTML("wordstatus", txt);
};

Hp12c_display.prototype.show_parentheses = function (txt)
{
	var self = this;

	self.setInnerHTML("parentheses", txt);
};

Hp12c_display.prototype.show_undo = function (enabled)
{
	var self = this;

	self.setInnerHTML("undo", enabled ? "u" : "");
};

Hp12c_display.prototype.show_complex = function (is_complex)
{
	var self = this;

	var txt = "";
	if (is_complex) {
		txt = "C";
	}

	if (H.type === "15c") {
		self.setInnerHTML("complex", txt);
	}
};

/* HP-12C emulator 
 * Copyright (c) 2007, 2011, 2016 Elvis Pfutzenreuter - epxx.co.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true, bitwise: true */
/*jshint globalstrict: true*/
/*global H */

"use strict";

function Hp12c_keyboard()
{
	var self = this;

	self.is_enabled = 0;
	self.buffer = 0;

	self.kbdtable = {};

	self.kbdtable['0'] = 0;
	self.kbdtable['.'] = 48;
	self.kbdtable[','] = 48;
	self.kbdtable['1'] = 1;
	self.kbdtable['2'] = 2;
	self.kbdtable['3'] = 3;
	self.kbdtable['4'] = 4;
	self.kbdtable['5'] = 5;
	self.kbdtable['6'] = 6;
	self.kbdtable['7'] = 7;
	self.kbdtable['8'] = 8;
	self.kbdtable['9'] = 9;
	self.kbdtable['+'] = 40;
	self.kbdtable['='] = 40;
	self.kbdtable['-'] = 30;
	self.kbdtable['*'] = 20;
	self.kbdtable['x'] = 20;
	self.kbdtable['X'] = 20;
	self.kbdtable['/'] = 10;
	self.kbdtable[':'] = 10;
	self.kbdtable['\r'] = 36;
	self.kbdtable['\n'] = 36;
	self.kbdtable[' '] = 36;
	self.kbdtable['f'] = 42;
	self.kbdtable['F'] = 42;
	self.kbdtable['g'] = 43;
	self.kbdtable['G'] = 43;
	self.kbdtable['s'] = 44;
	self.kbdtable['S'] = 44;
	self.kbdtable['r'] = 45;
	self.kbdtable['R'] = 45;
	self.kbdtable['o'] = 41;
	self.kbdtable['O'] = 41;

	H.hp1xc_keyboard_flavor(self.kbdtable);

	// stay here while vertical map translation is uniform across models
	self.vertical_map = {};
	self.vertical_map[0] = -1;
	self.vertical_map[1] = 11;
	self.vertical_map[2] = 12;
	self.vertical_map[3] = 13;
	self.vertical_map[4] = 14;
	self.vertical_map[5] = 15;
	self.vertical_map[10] = -1;
	self.vertical_map[11] = 21;
	self.vertical_map[12] = 22;
	self.vertical_map[13] = 23;
	self.vertical_map[14] = 24;
	self.vertical_map[15] = 25;
	self.vertical_map[20] = 41;
	self.vertical_map[21] = 31;
	self.vertical_map[22] = 32;
	self.vertical_map[23] = 33;
	self.vertical_map[24] = 34;
	self.vertical_map[25] = 35;
	self.vertical_map[30] = 45;
	self.vertical_map[31] = 16;
	self.vertical_map[32] = 7;
	self.vertical_map[33] = 8;
	self.vertical_map[34] = 9;
	self.vertical_map[35] = 10;
	self.vertical_map[40] = 44;
	self.vertical_map[41] = 26;
	self.vertical_map[42] = 4;
	self.vertical_map[43] = 5;
	self.vertical_map[44] = 6;
	self.vertical_map[45] = 20;
	self.vertical_map[50] = 43;
	self.vertical_map[51] = 36;
	self.vertical_map[52] = 1;
	self.vertical_map[53] = 2;
	self.vertical_map[54] = 3;
	self.vertical_map[55] = 30;
	self.vertical_map[60] = 42;
	self.vertical_map[61] = 36;
	self.vertical_map[62] = 0;
	self.vertical_map[63] = 48;
	self.vertical_map[64] = 49;
	self.vertical_map[65] = 40;

	self.kbdcoord = {};
	self.kbdcoord[11] = 0;
	self.kbdcoord[12] = 1;
	self.kbdcoord[13] = 2;
	self.kbdcoord[14] = 3;
	self.kbdcoord[15] = 4;

	self.kbdcoord[16] = 5;
	self.kbdcoord[7] = 6;
	self.kbdcoord[8] = 7;
	self.kbdcoord[9] = 8;
	self.kbdcoord[10] = 9;

	self.kbdcoord[21] = 10;
	self.kbdcoord[22] = 11;
	self.kbdcoord[23] = 12;
	self.kbdcoord[24] = 13;
	self.kbdcoord[25] = 14;

	self.kbdcoord[26] = 15;
	self.kbdcoord[4] = 16;
	self.kbdcoord[5] = 17;
	self.kbdcoord[6] = 18;
	self.kbdcoord[20] = 19;

	self.kbdcoord[31] = 20;
	self.kbdcoord[32] = 21;
	self.kbdcoord[33] = 22;
	self.kbdcoord[34] = 23;
	self.kbdcoord[35] = 24;

	self.kbdcoord[36] = 25;
	self.kbdcoord[1] = 26;
	self.kbdcoord[2] = 27;
	self.kbdcoord[3] = 28;
	self.kbdcoord[30] = 29;

	self.kbdcoord[41] = 30;
	self.kbdcoord[42] = 31;
	self.kbdcoord[43] = 32;
	self.kbdcoord[44] = 33;
	self.kbdcoord[45] = 34;

	// ENTER is 36
	self.kbdcoord[0] = 36;
	self.kbdcoord[48] = 37;
	self.kbdcoord[49] = 38;
	self.kbdcoord[40] = 39;

	H.hp1xc_vertical_keyboard_flavor(self.vertical_map);

	self.kbdcoordv = {};
	for (var opcode in self.kbdcoord) {
		if (self.kbdcoord.hasOwnProperty(opcode)) {
			// do reverse translation on vertical_map[coord] -> opcode
			// (given opcode, find key)
			for (var vcoord in self.vertical_map) {
				if (self.vertical_map.hasOwnProperty(vcoord)) {
					var vopcode = self.vertical_map[vcoord];
					if (opcode == vopcode) {
						self.kbdcoordv[opcode] = vcoord;
					}
				}
			}
		}
	}

	self.pointer_div = H.getElem("pointer_div");
	self.cross = H.getElem("cross");
	self.css3 = self.has_css3(self.pointer_div);
	self.overlays = [];
	self.overlays_timer = null;

	// recalculate keyboard coordinates
	// based on original ones for 700x438 image
	if (! H.embedded) {
		self.pointer_div_width = parseInt(self.pointer_div.style.width, 10);
		self.pointer_div_height = parseInt(self.pointer_div.style.height, 10);
		self.kx = self.pointer_div_width / H.disp_theo_width;
		self.ky = self.pointer_div_height / H.disp_theo_height;
		self.highlight_radius = "" + Math.floor(5 / 600 * self.pointer_div_width) + "px";
	}

	self.microsoft = (window.navigator && window.navigator.msPointerEnabled && true);
	H.touch_display = H.touch_display || self.microsoft;

	if (! H.touch_display) {
		// Web version running in mobile fare better with touch events
		if (self.cross['ontouchstart'] !== undefined) {
			H.touch_display = true;
		}
	}
	
	var o = this;

	if (H.touch_display) {
		if (self.microsoft) {
			var handler = function (x) {
				o.mouse_click(x);
			};
			window.cross.addEventListener("MSPointerDown", handler, true);
		} else {
			self.cross.ontouchstart = function (x) {
				o.mouse_click(x);
			};
		}
	} else {	
		self.cross.onclick = function (x) {
			o.mouse_click(x);
		};
	}
	self.pointer_div.onkeypress = function (x) {
		o.hard_keyboard(x);
	};
}

Hp12c_keyboard.prototype.enable = function ()
{
	var self = this;

	self.is_enabled = 1;
	// window.xlog("kbd enabled ");

	if (self.buffer) {
		var key = self.buffer;
		self.buffer = 0;
		H.defer(function () {
			self.do_dispatch_key(key);
		});
	}
};

Hp12c_keyboard.prototype.disable = function ()
{
	var self = this;

	self.is_enabled = 0;
	// window.xlog("kbd disabled ");
};

Hp12c_keyboard.prototype.enabled = function ()
{
	var self = this;

	return self.is_enabled;
};

Hp12c_keyboard.prototype.remap_key_vertical = function (raw)
{
	var self = this;
	var key = -1;
	var candidate = self.vertical_map[raw];
	if (candidate !== null && candidate !== undefined) {
		key = candidate;
	}

	return key;
};

Hp12c_keyboard.prototype.remap_key = function (raw)
{
	var self = this;

	// map 'raw' keys to HP12-compatible key codes

	var hpkey = raw + 11;  // key 0 ("n") becomes key 11
	var col = (hpkey % 10); // "n" is at column 1; Divide is at column 0
	if (col === 0) {
		// "Divide" is not the key 20; it is the key 10
		// this operation does NOT change column value
		hpkey -= 10;
	}
	var row = Math.floor(hpkey / 10); // "n" and Device are at line 1

	if (hpkey == 47 /* zero */ ) {
		hpkey = 0;
	} else if (col >= 7 && col <= 9 && hpkey != 48 /* point */ && hpkey != 49 /*sigma+*/) {
		// numeric keys: key code is equal to the number it represents
		hpkey = col - 3 * (row - 1);
	}

	if (hpkey == 46) {
		// ENTER exception
		hpkey = 36;
	}
	
	return hpkey;
};

Hp12c_keyboard.prototype.dispatch_key = function (key, force)
{
	var self = this;

	if (! force && ! self.enabled()) {
		self.buffer = key;
		return;
	}

	self.do_dispatch_key(key);
};

Hp12c_keyboard.prototype.do_dispatch_key = function (key)
{
	var self = this;

	self.buffer = 0;
	H.dispatcher.dispatch(key);
};

Hp12c_keyboard.prototype.hard_keyboard = function (e)
{
	var self = this;

	self.transform_coords();

	var keynum;
	var keychar;
	var numcheck;

	if (window.event) {
		e = window.event;
		keynum = window.event.keyCode;
	} else if (e.which) {
		keynum = e.which;
	} else {
		return true;
	}

	keychar = String.fromCharCode(keynum);

	var ret = true;
	var kk = self.kbdtable[keychar];
	if (kk !== undefined && kk !== null) {
		var kco = H.vertical_layout ? self.kbdcoordv[kk] : self.kbdcoord[kk];
		if (kco !== undefined && kco !== null) {
			self.highlight(kco);
		}
		self.dispatch_key(kk, false);

		e.returnValue = false;
		if (e.preventDefault) {
			e.preventDefault();
		}
		ret = false;
	}
	return ret;
};

Hp12c_keyboard.prototype.transform_coords = function ()
{
	var self = this;

	// recalculate keyboard coordinates
	// based on original ones for 700x438 image
	// This needs to be recalculated here because coords can be
	// changed by Android at any time
	if (H.embedded) {
		self.kx = 1;
		self.ky = 1;
		self.pointer_div_width = H.disp_theo_width;
		self.pointer_div_height = H.disp_theo_height;
		self.highlight_radius = Math.floor(5 / 600 * H.disp_theo_width);
	}

	self.xoff = H.disp_key_offset_x * self.kx;
	self.yoff = H.disp_key_offset_y * self.ky;

	self.xl = H.disp_key_width * self.kx;
	self.yl = H.disp_key_height * self.ky;

	self.xd = H.disp_key_dist_x * self.kx;
	self.yd = H.disp_key_dist_y * self.ky;

	if (H.disp_fb_offset_x !== undefined) {
		self.xoff_fb = H.disp_fb_offset_x * self.kx;
		self.yoff_fb = H.disp_fb_offset_y * self.ky;

		self.xl_fb = H.disp_fb_width * self.kx;
		self.yl_fb = H.disp_fb_height * self.ky;
	}
};

Hp12c_keyboard.prototype.mouse_click = function (evt)
{
	var self = this;

	if (! evt) {
		evt = window.event;
	}

	self.transform_coords();

	var pos_x, pos_y;

	if (H.embedded) {
		pos_x =	evt.X;
		pos_y = evt.Y;
	} else if (H.touch_display) {
		if (! self.microsoft) {
			evt.preventDefault();
		}
		// Browser chooses a CSS transform based on viewport
		// and touch events are not automatically translated
		var css_scale = 1;
		if (self.pointer_div['getBoundingClientRect'] !== undefined) {
			css_scale = self.pointer_div.getBoundingClientRect().width / self.pointer_div.offsetWidth;
		}
		// transformed rect is based on x=0 but y is vertically centered
		var css_y = self.pointer_div.offsetHeight * (1 - css_scale) / 2;
		if (self.microsoft) {
			pos_x =	evt.pageX - self.pointer_div.offsetLeft;
			pos_y = evt.pageY - self.pointer_div.offsetTop;
		} else {
			pos_x =	evt.targetTouches[0].pageX - self.pointer_div.offsetLeft;
			pos_y = evt.targetTouches[0].pageY - self.pointer_div.offsetTop;
		}
		// xlog("pos x " + pos_x);
		// xlog("CSS scale: " + css_scale);
		pos_x /= css_scale;
		pos_y -= css_y;
		pos_y /= css_scale;
		// xlog("pos x' " + pos_x);
	} else {
		pos_x = (evt.offsetX ? evt.offsetX : 
			(evt.pageX - self.pointer_div.offsetLeft));
		pos_y = (evt.offsetY ? evt.offsetY :
			(evt.pageY - self.pointer_div.offsetTop));
	}

	if (pos_y < self.yoff && pos_y >= 0 && pos_x >= 0 && pos_x <= self.pointer_div_width) {
		// touched LCD
		var leftside = pos_x < (self.pointer_div_width / 2);
		var pseudo_key = leftside ? 200 : 201;
		self.dispatch_key(pseudo_key, true);
		return;
	}

	pos_x -= self.xoff;
	pos_y -= self.yoff;

	var key;
	var in_key;

	if (H.vertical_layout) {
		if (pos_x < 0 || pos_y < 0 || pos_x >= self.xd * 6 || pos_y >= self.yd * 7) {
			return;
		}

		key = Math.floor(pos_x / self.xd) + 10 * Math.floor(pos_y / self.yd);

		while (pos_x > self.xd) {
			pos_x -= self.xd;
		}

		while (pos_y > self.yd) {
			pos_y -= self.yd;
		}

		in_key = (pos_x < self.xl) && ((pos_y < self.yl) || key == 51);
		if (in_key) {
			var rkey = self.remap_key_vertical(key);
			if (rkey >= 0) {
				self.highlight(key);
				self.dispatch_key(rkey, false);
			}
		}
	} else {
		if (pos_x < 0 || pos_y < 0 || pos_x >= self.xd * 10 || pos_y >= self.yd * 4) {
			return;
		}

		key = Math.floor(pos_x / self.xd) + 10 * Math.floor(pos_y / self.yd);

		while (pos_x > self.xd) {
			pos_x -= self.xd;
		}

		while (pos_y > self.yd) {
			pos_y -= self.yd;
		}

		in_key = (pos_x < self.xl) && ((pos_y < self.yl) || key == 25);
		if (in_key) {
			self.highlight(key);
			self.dispatch_key(self.remap_key(key), false);
		}
	}
};

Hp12c_keyboard.prototype.test = function ()
{
	var self = this;

	self.transform_coords();

	if (! self.css3) {
		return;
	}

	for (var x = 0; x < (H.vertical_layout ? 6 : 10); ++x) {
		for (var y = 0; y < (H.vertical_layout ? 7 : 4); ++y) {
			var xx = self.xoff + x * self.xd;
			var yy = self.yoff + y * self.yd;
			var id = "test" + x + y;
			// DO NOT CHANGE COLOR NAME without fixing Android first
			self.make_div(xx, yy, self.xl, self.yl, self.pointer_div,
				id, "red");
			xx = self.xoff + x * self.xd + self.xoff_fb;
			yy = self.yoff + y * self.yd + self.yoff_fb;
			id = "testfb" + x + y;
			// DO NOT CHANGE COLOR NAME without fixing Android first
			self.make_div(xx, yy, self.xl_fb, self.yl_fb, self.pointer_div,
				id, "green");
		}
	}

	self.reset_overlays_timer();
	H.machine.fb = 1;
	window.xlog("Testing feedback");
};

Hp12c_keyboard.prototype.highlight = function (key)
{
	var self = this;

	if (! H.machine.fb) {
		return;
	} else if (! self.css3) {
		return;
	}

	self.reset_overlays_timer();
	self.remove_overlays();

	var is_enter = false;
	if (H.vertical_layout) {
		if (key === 61) {
			key = 51;
		}
		is_enter = key === 51;
	} else {
		if (key === 35) {
			key = 25;
		}
		is_enter = key === 25;
	}

	var x = key % 10;
	var y = Math.floor(key / 10);

	var xx = self.xoff + x * self.xd; // + self.xoff_fb;
	var yy = self.yoff + y * self.yd; // + self.yoff_fb;
	var w = self.xl;
	var h = self.yl;
	if (is_enter) {
		h += self.yl;
		h += self.yd - self.yl;
	}
	var id = "fb" + x + y;
	// DO NOT CHANGE COLOR NAME without fixing Android first
	self.make_div(xx, yy, w, h, self.pointer_div,
			id, "green");

	self.overlays_timer = H.delay(function () {
		self.remove_overlays();
	}, 350);
};

Hp12c_keyboard.prototype.has_css3 = function (hook)
{
	if (H.embedded) {
		window.xlog("CSS3 x embedded engine");
		return true;
	} else if (H.disp_fb_offset_x === undefined) {
		window.xlog("No feedback coordinates");
		return false;
	} else if (hook.style['zIndex'] === undefined ||
			hook.style['borderRadius'] === undefined ||
			hook.style['opacity'] === undefined ||
			hook.style['pointerEvents'] === undefined) {
		// we need these CSS2/CSS3 style elements
		window.xlog("CSS3 property misssing");
		return false;
	}
	window.xlog("CSS3 present");
	return true;
};

Hp12c_keyboard.prototype.make_div = function (x, y, w, h, hook, id, color)
{
	var self = this;

	w = Math.min(x + w, self.pointer_div_width - 1) - x;
	h = Math.min(y + h, self.pointer_div_height - 1) - y;

	if (H.embedded) {
		self.pointer_div.makeDiv(x, y, w, h, self.highlight_radius, color);
		return;
	}

	var div = H.createElem('div');
	div.id = id;
	div.style.width = "" + w + "px";
	div.style.height = "" + h + "px";
	div.style.backgroundColor = color;
	div.style.position = "absolute";
	div.style.left = "" + x + "px";
	div.style.top = "" + y + "px";
	div.style.zIndex = 2;
	div.style.opacity = 0.3;
	div.style.borderRadius = self.highlight_radius;
	div.style.pointerEvents = "none";

	hook.appendChild(div);
	self.overlays.push(div);

	// window.xlog("" + x + " " + y + " " + w + " " + h);
};

Hp12c_keyboard.prototype.reset_overlays_timer = function ()
{
	var self = this;

	if (self.overlays_timer !== null) {
		H.cancel_delay(self.overlays_timer);
		self.overlays_timer = null;
	}
};

Hp12c_keyboard.prototype.remove_overlays = function ()
{
	var self = this;

	self.overlays_timer = null;

	if (H.embedded) {
		self.pointer_div.clearDiv();
		return;
	}

	while (self.overlays.length > 0) {
		var div = self.overlays.shift();
		div.parentNode.removeChild(div);
	}
};
/* HP-12C emulator 
 * Copyright (c) 2007, 2011, 2016 Elvis Pfutzenreuter - epxx.co.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true, bitwise: true */
/*jshint globalstrict: true*/
/*global H */

"use strict";

H.hp1xc_keyboard_flavor = function (kbdtable)
{
	kbdtable['w'] = 49;
	kbdtable['W'] = 49;
	kbdtable['y'] = 34;
	kbdtable['Y'] = 34;
	kbdtable['h'] = 16;
	kbdtable['H'] = 16;
	kbdtable['c'] = 35;
	kbdtable['C'] = 35;
	kbdtable['n'] = 11;
	kbdtable['N'] = 11;
	kbdtable['i'] = 12;
	kbdtable['I'] = 12;
	kbdtable['p'] = 13;
	kbdtable['P'] = 13;
	kbdtable['m'] = 14;
	kbdtable['M'] = 14;
	kbdtable['v'] = 15;
	kbdtable['V'] = 15;
	kbdtable['#'] = 23;
	kbdtable['$'] = 24;
	kbdtable['%'] = 25;
	kbdtable['!'] = 21;
	kbdtable['\\'] = 22;
	kbdtable['d'] = 33;
	kbdtable['D'] = 33;
	kbdtable[String.fromCharCode(40)] = 33;
	kbdtable['['] = 31;
	kbdtable[']'] = 32;
	kbdtable['?'] = 99;
	kbdtable[String.fromCharCode(8)] = 98;
	kbdtable['Z'] = 98;
	kbdtable['z'] = 98;
	kbdtable['e'] = 26;
	kbdtable['E'] = 26;
};

H.hp1xc_vertical_keyboard_flavor = function (vmap)
{
};
/* HP-12C emulator 
 * Copyright (c) 2007, 2011, 2016 Elvis Pfutzenreuter - epxx.co.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true */
/*jshint globalstrict: true*/
/*global H */

"use strict";

// test with 12C and 11C

function Hp12c_machine()
{
	// algebraic operations

	this.nvname = H.type_cookie;

	// TODO this should be in init_memory()
	// and unit tests should wait it to go back to 1
	this.sti_level = 0;

	// changed by unit tests only
	this.rapid_default = 0;

	this.init_memory();
}


/* Can be called before display and other components are still uninitialized */
Hp12c_machine.prototype.init_memory = function (n)
{
	// calculator non-volatile memory -----------------------------------------------------------

	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.w = 0;
	this.last_x = 0;

	// 15C imaginary parts of each register
	this.xi = 0;
	this.yi = 0;
	this.zi = 0;
	this.wi = 0;
	this.last_xi = 0;

	this.mA = [];
	this.mB = [];
	this.mC = [];
	this.mD = [];
	this.mE = [];
	this.msA = [0, 0];
	this.msB = [0, 0];
	this.msC = [0, 0];
	this.msD = [0, 0];
	this.msE = [0, 0];
	this.mR = 20; // A=20, B=21 ...

	// 16C "high" parts of 64-bit integer numbers
	// 15C also use these flags as matrix pointers
	this.xh = 0;
	this.yh = 0;
	this.zh = 0;
	this.wh = 0;
	this.last_xh = 0;
	// 15C matrixes never go to STO memories
	this.stomemoryh = [];

	this.wordsize = H.DEFAULT_WORDSIZE;
	this.intwindow = 0;
	this.negative_repr = 2;

	this.stomemory = [];
	this.finmemory = [];
	this.njmemory = [];
	this.index = 0; // not-12C
	this.indexh = 0; // 15C

	this.ram = [];
	this.program_size = 1; // for STOP in [0]
	this.flags = [];

	var i;
	for (i = 0; i < H.FLAGS_MAX; ++i) {
		this.flags[i] = 0;
	}

	this.decimals = 2;
	this.comma = 0; 
	this.altdisplay = 1; // 16c alternative (apocryphal) displays

	this.begin = 0;
	this.dmy = 0;
	this.compoundf = 0;

	this.notation = H.NOTATION_FIX;
	if (H.type === "16c") {
		this.notation = H.NOTATION_INT_HEX;
	}
	this.trigo = H.TRIGO_DEG;
	this.complex = 0;
	this.user = 0;

	this.prng = new H.Prng(0);

	// 15C thing to handle solve, integration
	this.running_context = [];
	this.osolve = null;
	this.ointegrate = null;

	// volatile memory ---------------------------------------------------------------------

	this.UNDOABLE_NONE = 0;
	this.UNDOABLE_CLX = 1;
	this.UNDOABLE_BSP = 2;
	this.UNDOABLE_BSP_TYPING = 3;
	this.UNDOABLE_CLEAR_REG = 4;
	this.UNDOABLE_CLEAR_STAT = 5;
	this.UNDOABLE_CLEAR_FIN = 6;

	this.algmode = 0;
	this.algebra = [];
	this.undoable = 0; // UNDOABLE_* values
	this.undoable_assets = null;
	this.program_mode = 0;
	this.ip = 0;
	this.pushed = 0;
	this.pushed_cplx_exception = 0;
	this.gtoxx = "";
	this.modifier = 0;
	this.do_fincalc = 0;
	this.xmode = -1;
	this.typed_mantissa = "";
	this.typed_decimals = "";
	this.typed_mantissa_signal = 1;
	this.typed_exponent = "00";
	this.typed_exponent_signal = 1;

	this.modal_state = H.MODAL_NONE;
	this.modal_observers = {};
	this.modal_data = null;

	this.call_stack = []; // not-12C

	// Visual feedback
	this.fb = 1;
	// "Rapid" programming and financial - does not try to imitate HP1xC speed
	this.rapid = this.rapid_default;

	if (H.type === '11c') {
		this.nvN = ['x', 'y', 'z', 'w', 'last_x', 
			  'decimals', 'comma', 'index',
			  'trigo', 'user', 'notation', 'fb', 'rapid'];
		this.nvAN = ['stomemory', 'flags'];
	} else if (H.type === '10c') {
		this.nvN = ['x', 'y', 'z', 'w', 'last_x', 
			  'decimals', 'comma',
			  'trigo', 'notation', 'fb', 'rapid'];
		this.nvAN = ['stomemory'];
	} else if (H.type === '15c') {
		this.nvN = ['x',  'y',  'z',  'w',  'last_x',
                            'xi', 'yi', 'zi', 'wi', 'last_xi',
                            'xh', 'yh', 'zh', 'wh', 'last_xh',
			  'decimals', 'comma', 'index', 'indexh',
			  'trigo', 'user', 'notation', 'complex',
			  'mR', 'fb', 'rapid'];
		this.nvAN = ['stomemory', 'flags',
				'mA', 'mB', 'mC', 'mD', 'mE',
				'msA', 'msB', 'msC', 'msD', 'msE'];
	} else if (H.type === '16c') {
		this.nvN = ['x',  'y',  'z',  'w',  'last_x',
				'xh', 'yh', 'zh', 'wh', 'last_xh',
				'decimals', 'comma', 'index', 'notation',
				'wordsize', 'intwindow', 'negative_repr',
				'fb', 'rapid'];
		this.nvAN = ['stomemory', 'stomemoryh', 'flags'];
	} else {
		// 12C
		this.nvN = ['x', 'y', 'z', 'w', 'last_x', 'algmode',
				'decimals', 'comma', 'begin',
				'dmy', 'compoundf', 'notation', 'fb',
				'rapid'];
		this.nvAN = ['stomemory', 'finmemory', 'njmemory'];
	}
	this.nvAX = ['ram'];
};

Hp12c_machine.prototype.sto_Reset = function (i)
{
	this.stomemory[i] = 0;
	this.stomemoryh[i] = 0;
};

Hp12c_machine.prototype.reg_Reset = function (n)
{
	this[n] = 0;
	this[n + "h"] = 0;
	this[n + "i"] = 0;
};

Hp12c_machine.prototype.sto_Swap_reg = function (i, n)
{
	var tr = {r: this.stomemory[i], h: this.stomemoryh[i]};
	var ts = {r: this[n], h: this[n + "h"]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(tr);
		this.cast_wordsize(ts);
	}

	this.stomemory[i] = ts.r;
	if (H.type === "16c") {
		this.stomemoryh[i] = ts.h;
	} else {
		this.stomemoryh[i] = 0;
	}
	this[n] = tr.r;
	this[n + "h"] = tr.h;
};

Hp12c_machine.prototype.sto_To_reg = function (i, n)
{
	var t = {r: this.stomemory[i], h: this.stomemoryh[i]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	// STO does not have imaginary part
	this[n] = t.r;
	this[n + "h"] = t.h; // 16C integer
};

Hp12c_machine.prototype.reg_To_sto = function (n, i)
{
	var t = {r: this[n], h: this[n + "h"]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	// imaginary part not considered
	this.stomemory[i] = t.r;
	if (H.type === "16c") {
		// 15c matrixes don't go into STO
		this.stomemoryh[i] = t.h;
	} else {
		this.stomemoryh[i] = 0;
	}
};

Hp12c_machine.prototype.reg_To_reg = function (nf, nt)
{
	var t = {r: this[nf], h: this[nf + "h"], i: this[nf + "i"]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	this[nt] = t.r;
	this[nt + "h"] = t.h;
	this[nt + "i"] = t.i;
};

Hp12c_machine.prototype.reg_tuple = function (n)
{
	var t = {};
	t.r = this[n];
	t.i = this[n + "i"];
	t.h = this[n + "h"];

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	return t;
};

Hp12c_machine.prototype.reg_real = function (n)
{
	return this.reg_tuple(n).r;
};

Hp12c_machine.prototype.cast_wordsize = function (t)
{
	H.cast_wordsize(t, this.wordsize);
};

Hp12c_machine.prototype.cast_wordsize_in_accumulators = function ()
{
	var i;
	var regs = ["x", "y", "z", "w", "last_x"];

	for (i = 0; i < regs.length; ++i) {
		// getter and setter cast to wordsize, so no need to
		// do that explicitly
		this.reg_Set_tuple(regs[i], this.reg_tuple(regs[i]));
	}

	// storage is not cast immediately. If the user goes back
	// to bigger wordsize he should get the original values.
	/*
	for (i = 0; i < this.sto_mem_len(); ++i) {
		this.sto_Set_tuple(i, this.sto_tuple(i));
	}
	*/
};

Hp12c_machine.prototype.reg_Set_tuple = function (n, t)
{
	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		this.cast_wordsize(t);
	}

	this[n] = t.r;
	this[n + "i"] = t.i;
	this[n + "h"] = t.h;
};

Hp12c_machine.prototype.reg_Set_real = function (n, v)
{
	// check clients
	return this.reg_Set_tuple(n, {r: v, i: 0, h: 0});
};

Hp12c_machine.prototype.reg_Set_real_only = function (n, v)
{
	if (H.type === "15c" && this.is_complex_mode()) {
		return this.reg_Set_tuple(n, {r: v, i: this.xi, h: 0});
	}
	
	return this.reg_Set_real(n, v);
};

Hp12c_machine.prototype.sto_tuple = function (i)
{
	var t = {};
	t.r = this.stomemory[i];
	t.h = this.stomemoryh[i];
	t.i = 0; // filler to make it compatible with reg tuple

	if (this.notation >= H.NOTATION_INT) {
		this.cast_wordsize(t);
	}

	return t;
};

Hp12c_machine.prototype.sto_Set_tuple = function (i, t)
{
	if (this.notation >= H.NOTATION_INT) {
		this.cast_wordsize(t);
	}

	this.stomemory[i] = t.r;
	this.stomemoryh[i] = ((H.type === "16c") ? t.h : 0);
	// t.i not used
};

Hp12c_machine.prototype.sto_mem_ref = function ()
{
	// Used by floating-point functions only, so this is ok
	return this.stomemory;
};

Hp12c_machine.prototype.sto_mem_len = function ()
{
	return this.stomemory.length;
};

Hp12c_machine.prototype.program_limit = function ()
{
	if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
		return Math.min(H.ram_MAX - 1, this.program_size - 1);
	}
	return H.ram_MAX - 1;
};

Hp12c_machine.prototype.ram_available = function ()
{
	if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
		return Math.min(H.ram_MAX - this.program_size);
	}
	return H.ram_MAX - 1;
};

Hp12c_machine.prototype.incr_ip = function (delta)
{
	// do not allow to go above program limit, but do not zero
	// because if in RUNNING mode, pgrm module always increases IP.
	// If we make ip=0, pgrm does ++ip and then we have an
	// infinite loop.
	this.ip = Math.max(0, Math.min(this.program_limit(), this.ip + delta));
};

/* Called when H.display is already in place */
Hp12c_machine.prototype.init = function ()
{
	this.init_memory();
	this.clear_prog(1);
	this.do_clear_reg(); // implies reg, sto, fin
	this.clear_stack();
	this.display_flags(); // some flags affect display
};

Hp12c_machine.prototype.clear_fin = function ()
{
	var e;

	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();

		this.undoable = this.UNDOABLE_CLEAR_FIN;
		this.undoable_assets = [];
		for (e = 0; e < 5; ++e) {
			this.undoable_assets[e] = this.finmemory[e];
		}
		this.display_undo();
	}

	this.do_clear_fin();
};

Hp12c_machine.prototype.do_clear_fin = function ()
{
	for (var e = 0; e < 5; ++e) {
		this.finmemory[e] = 0;
	}
	this.display_result();
};

Hp12c_machine.prototype.clear_statistics = function ()
{
	var e;

	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();

		this.undoable = this.UNDOABLE_CLEAR_STAT;
		var d = {};
		this.undoable_assets = d;
		d.stack = {};
		d.stack.x = this.reg_real("x");
		d.stack.y = this.reg_real("y");
		d.stack.z = this.reg_real("z");
		d.stack.w = this.reg_real("w");
		d.sto = [];
		for (e = H.STAT_MIN; e <= H.STAT_MAX; ++e) {
			d.sto[e] = this.sto_tuple(e);
		}
		this.display_undo();
	}

	// statistics share memory with STO memory
	for (e = H.STAT_MIN; e <= H.STAT_MAX; ++e) {
		this.sto_Reset(e);
	}
	this.reg_Reset("x");
	this.reg_Reset("y");
	this.reg_Reset("z");
	this.reg_Reset("w");
	this.display_result();
};

Hp12c_machine.prototype.clear_prog = function (in_pgrm)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	if (in_pgrm) {
		this.ram[0] = "";
		for (var e = 1; e < H.ram_MAX; ++e) {
			this.ram[e] = H.STOP_INSTRUCTION;
		}
		this.program_size = 1; // for STOP in [0]
	} else {
		this.display_result();
	}
	this.ip = 0;
};

Hp12c_machine.prototype.clear_sto = function ()
{
	for (var e = 0; e < H.MEM_MAX; ++e) {
		this.sto_Reset(e);
		this.njmemory[e] = 1; // position 0 is read-only and always returns 1.
	}
};

Hp12c_machine.prototype.cli = function (motive)
{
	this.sti_level--;
	window.console.ut_snap("cli  ", this.sti_level + " " + motive);
	// this is cumulative i.e. two calls to cli(x) must be
	// counterbalanced by two sti(x)'s
	if (this.sti_level === 0) {
		H.keyboard.disable();
	}
};

Hp12c_machine.prototype.sti = function (motive)
{
	this.sti_level++;
	window.console.ut_snap("sti  ", this.sti_level + " " + motive);
	if (this.sti_level === 1) {
		H.keyboard.enable();
	}
};

Hp12c_machine.prototype.clear_typing = function ()
{
	var positive_clearing = (this.xmode > -1);

	this.xmode = -1;
	this.typed_mantissa = "";
	this.typed_decimals = "";
	this.typed_mantissa_signal = 1;
	this.typed_exponent = "00";
	this.typed_exponent_signal = 1;

	return positive_clearing;
};

Hp12c_machine.prototype.display_result = function ()
{
	this.display_result_s(true, true);
};

Hp12c_machine.prototype.display_result_s = function (reset_window, enable_pushed)
{
	if (H.type === "16c") {
		if (reset_window) {
			if (this.intwindow !== 0) {
				this.intwindow = 0;
				this.display_wordstatus();
			}
		}
	}

	if (this.clear_typing()) {
		// if a number was being typed, any further typing
		// must push (e.g. 12 PSE 34 should push 12 to y,
		// and not let it be overwritten by 34)
		enable_pushed = true;
	}
	if (enable_pushed) {
		this.pushed = 0;
		this.pushed_cplx_exception = 0;
	}

	var t = this.display_result_in();

	if (H.type === "15c") {
		if (t.r >= H.value_max || t.r <= -H.value_max) {
			// make display blink
			this.set_overflow(true);
		}
	}
};

Hp12c_machine.prototype.display_result_in = function ()
{
	var t = this.reg_tuple("x");
	var matrix = this.matrix_in_reg("x");

	if (! matrix) {
		H.display.displayNumber(t);
	} else {
		var size = this.matrix_size(matrix);
		H.display.displayMatrix(matrix, size[0], size[1]);
	}

	return t;
};

Hp12c_machine.prototype.display_matrix = function (n, r, c)
{
	this.pushed = 0;
	this.pushed_cplx_exception = 0;
	this.clear_typing();
	H.display.displayMatrix(n, r, c);
};

Hp12c_machine.prototype.display_all = function ()
{
	this.display_result_in();
	this.display_modifier();
	this.display_begin();
	this.display_dmyc();
	this.display_pgrm();
	this.display_algmode();
	this.display_trigo();
	this.display_user();
	this.display_flags();
	this.display_wordstatus();
	this.display_undo();
	this.display_parentheses();
};

Hp12c_machine.prototype.pse = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		self.algebra = [];
		self.display_parentheses();
	}

	// PSE pushes the stack
	// (we can't count on reset_modal() for this because it may be
	// executed in a program, and reset_modal() only pushes the stack
	// in interactive mode)
	self.display_result_s(false, false);

	// PSE is somewhat special because it is modal but it also
	// disables keyboard, and can be programmed
	self.cli("pse");
	self.enter_modal(H.MODAL_PAUSE);

	H.delay(function () {
		self.sti("pse");
		self.reset_modal();
	}, 1200);
};

Hp12c_machine.prototype.toggle_decimal_character = function ()
{
	if (H.type === "15c") {
		this.set_overflow(false);
	}

	this.comma = (this.comma + 1) % H.SEPARATORS;
	this.display_result();
	H.storage.save();
	window.xlog("Storage saved");
};

Hp12c_machine.prototype.toggle_decimal_and_altdisplay = function ()
{
	// toggles altdisplay and comma alternatively
	if (this.altdisplay) {
		this.altdisplay = 0;
		this.display_result_s(false, false);
		this.display_wordstatus();
		H.storage.save();
	} else {
		this.altdisplay = 1;
		this.display_wordstatus();
		this.toggle_decimal_character();
	}
};

Hp12c_machine.prototype.clear_stack = function ()
{
	this.reg_Reset("x");
	this.reg_Reset("y");
	this.reg_Reset("z");
	this.reg_Reset("w");
	this.reg_Reset("last_x");
};

Hp12c_machine.prototype.clear_reg = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();

		this.undoable = this.UNDOABLE_CLEAR_REG;
		var d = {};
		this.undoable_assets = d;
		d.stack = {};
		d.stack.x = this.reg_real("x");
		d.stack.y = this.reg_real("y");
		d.stack.z = this.reg_real("z");
		d.stack.w = this.reg_real("w");
		d.stack.last_x = this.reg_real("last_x");
		d.sto = [];
		d.nj = [];
		for (var e = 0; e <= H.MEM_MAX; ++e) {
			d.sto[e] = this.sto_tuple(e);
			d.nj[e] = this.njmemory[e];
		}
		d.fin = [];
		for (e = 0; e < 5; ++e) {
			d.fin[e] = this.finmemory[e];
		}
		this.display_undo();
	}

	this.do_clear_reg();
};

Hp12c_machine.prototype.do_clear_reg = function ()
{
	if (H.type !== "10c" && H.type !== "11c" && H.type !== "15c" && H.type !== "16c") {
		this.clear_stack();
	}
	this.index = 0;
	this.indexh = 0;
	this.do_clear_fin();
	this.clear_sto();
	this.display_result_s(false, false);
};

// HP-12C Errors
// 0 = Division by zero, LN(negative) etc.
// 1 = STO + arith + memory position if memory position > 4
// 2 = statistics
// 3 = IRR
// 4 = Memory full (only happens in emulator when program typing reaches position 99+1)
// 5 = Composite interest
// 6 = CFj if j >= 30
// 7 = IRR
// 8 = Date

Hp12c_machine.prototype.display_pgrm = function ()
{
	H.display.show_pgrm(this.program_mode == H.PROGRAMMING,
				this.program_mode >= H.RUNNING,
				this.ip);
};

Hp12c_machine.prototype.display_trigo = function ()
{
	H.display.show_trigo(this.trigo);
};

Hp12c_machine.prototype.display_user = function ()
{
	H.display.show_user(this.user);
};

Hp12c_machine.prototype.display_algmode = function ()
{
	H.display.show_algmode(this.algmode);
};

Hp12c_machine.prototype.display_error = function (err)
{
	if (H.type == "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.clear_typing();
	this.modal_data = err;
	this.enter_modal(H.MODAL_ERROR);

	if (this.program_mode >= H.RUNNING) {
		// errors stop programs
		H.pgrm.stop(2);
	}
};

Hp12c_machine.prototype.modal = function ()
{
	var self = this;
	return self.modal_state;
};

Hp12c_machine.prototype.is_error = function ()
{
	var self = this;
	return self.modal_state === H.MODAL_ERROR;
};

Hp12c_machine.prototype.error = function ()
{
	var self = this;
	return (self.modal_state === H.MODAL_ERROR) ? self.modal_data : 0;
};

Hp12c_machine.prototype.enter_modal = function (m)
{
	var self = this;
	self.modal_state = m;
	window.xlog("modal " + m);
	H.display.recycle();
};

Hp12c_machine.prototype.reset_modal = function ()
{
	var self = this;

	var was = self.modal_state;
	self.modal_state = H.MODAL_NONE;
	self.modal_data = null;
	window.xlog("rst modal " + was);

	if (this.program_mode == H.INTERACTIVE) {
		this.display_result_s(false, false);
	} else if (this.program_mode == H.PROGRAMMING) {
		this.display_program_opcode();
	} else {
		H.display.recycle();
	}

	var observers = self.modal_observers;
	self.modal_observers = {};
	H.defer(function () {
		for (var name in observers) {
			observers[name]();
		}
	});
};

Hp12c_machine.prototype.modal_observer = function (name, cb)
{
	var self = this;

	self.modal_observers[name] = cb;
};

Hp12c_machine.prototype.modal_observer_remove = function (name)
{
	var self = this;

	self.modal_observers[name] = undefined;
	delete self.modal_observers[name];
};

Hp12c_machine.prototype.display_modifier2 = function (m)
{
	H.display.show_modifier(m);
};

Hp12c_machine.prototype.display_modifier = function ()
{
	this.display_modifier2(this.modifier);
};

Hp12c_machine.prototype.display_begin = function ()
{
	H.display.show_begin(this.begin);
};

Hp12c_machine.prototype.display_carry = function ()
{
	if (H.type === "16c") {
		H.display.show_carry(this.flags[H.FLAG_CARRY]);
	}
};

Hp12c_machine.prototype.display_overflow = function ()
{
	if (H.type === "16c") {
		H.display.show_overflow(this.flags[H.FLAG_OVERFLOW]);
	} else if (H.type === "15c") {
		H.display.set_blink(this.flags[H.FLAG_OVERFLOW]);
	}
};

Hp12c_machine.prototype.display_complex = function ()
{
	if (H.type === "15c") {
		H.display.show_complex(this.flags[H.FLAG_COMPLEX]);
	}
};

Hp12c_machine.prototype.display_wordstatus = function ()
{
	if (H.type === "16c") {
		var st = "";
		if (this.notation >= H.NOTATION_INT && this.altdisplay) {
			st = "" + this.wordsize + ",";
			if (this.negative_repr) {
				st += this.negative_repr;
			} else {
				st += "u";
			}
			st += "<br>w=" + this.intwindow;
		}
		H.display.show_wordstatus(st);
	}
};

Hp12c_machine.prototype.display_flags = function ()
{
	this.display_carry();
	this.display_overflow();
	this.display_complex();
};

Hp12c_machine.prototype.display_undo = function ()
{
	if (H.type === "12c-platinum") {
		H.display.show_undo(this.undoable);
	}
};

Hp12c_machine.prototype.display_parentheses = function ()
{
	if (H.type === "12c-platinum") {
		var txt = "";
		if (this.algmode) {
			if (this.count_open_parentheses() > 0) {
				txt = "( )";
			} else if (this.algebra.length > 0) {
				txt = "..";
			}
		}
		H.display.show_parentheses(txt);
	}
};

Hp12c_machine.prototype.display_dmyc = function ()
{
	H.display.show_dmyc(this.dmy, this.compoundf);
};

Hp12c_machine.prototype.set_dmy = function (v)
{
	this.dmy = v;
	this.display_dmyc();
	this.display_result();
};

Hp12c_machine.prototype.set_trigo = function (v)
{
	this.trigo = v;
	this.display_trigo();
	this.display_result_s(true, false);
};

Hp12c_machine.prototype.rpn_mode = function ()
{
	this.algmode = 0;
	this.algebra = [];
	this.display_parentheses();
	this.display_algmode();
	this.display_result_s(true, false);
};

Hp12c_machine.prototype.toggle_compoundf = function ()
{
	this.compoundf = this.compoundf ? 0 : 1;
	this.display_dmyc();
	this.display_result_s(true, false);
};

Hp12c_machine.prototype.toggle_user = function ()
{
	this.user = this.user ? 0 : 1;
	this.display_user();
	if (this.program_mode == H.INTERACTIVE) {
		this.display_result_s(true, false);
	}
};

Hp12c_machine.prototype.set_begin = function (v)
{
	this.begin = v;
	this.display_begin();
	this.display_result();
};

Hp12c_machine.prototype.set_modifier = function (v)
{
	this.modifier = v;
	if (v == H.GTO || v == H.GTO_MOVE) {
		// clean gto nn buffer on edge
		this.gto_buf_clear();
	}
	this.display_modifier();
};

Hp12c_machine.prototype.set_decimals = function (d, notation)
{
	var enable_push = false;
	if (this.notation >= H.NOTATION_INT) {
		// 16C case
		this.prepare_for_float_mode();
		this.enable_push = true;
	}
	this.notation = notation;
	this.decimals = d;
	this.display_wordstatus();
	this.display_result_s(true, enable_push);
};

Hp12c_machine.prototype.set_decimals_exponential = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		this.prepare_for_float_mode();
		this.intwindow = 0;
	}
	this.notation = H.NOTATION_SCI;
	this.decimals = 10;
	this.display_wordstatus();
	this.display_result();
};

Hp12c_machine.prototype.rst_modifier = function (df)
{
	if (df) {
		this.do_fincalc = 0;   // disarms financial calculation 
	}
	this.modifier = 0;
	this.display_modifier();
};

Hp12c_machine.prototype.push = function ()
{
	this.reg_To_reg("z", "w");
	this.reg_To_reg("y", "z");
	this.reg_To_reg("x", "y");
	this.pushed = 1;
};

Hp12c_machine.prototype.digit_add_chk_int = function (digit, typed)
{
	var digit_bits = H.digit_bits[this.notation];
	var max_digits = Math.ceil(this.wordsize / digit_bits);

	if (typed.length >= max_digits) {
		// all allowable digits typed 
		digit = null;
	}

	if (digit !== null) {
		digit = digit.toString(16);
	}

	return digit;
};

Hp12c_machine.prototype.chk_int_overflow = function (typed)
{
	var digit_bits = H.digit_bits[this.notation];
	var max_digits = this.wordsize / digit_bits;
	var max_digits_c = Math.ceil(max_digits);
	var max_digits_f = Math.floor(max_digits);

	if ((typed.length >= max_digits_c) && (max_digits_c !== max_digits_f)) {
		// test if MSB digit "splits" ie. has more bits than there
		// are bits still allowed by the word size. In this case,
		// MSB digit is cast to zero.

		// A simple bit count is not ok because in radix=10 every bit
		// depends on all digits, so it is not practical to detect overflow
		// based on the fact that 1 decimal digit ~= 3.3 bits

		var radix = H.radix[this.notation];
		var x1 = H.string_to_integer_fast(typed, this.negative_repr,
						this.wordsize, radix);
		var x2 = H.string_to_integer_fast(typed, this.negative_repr,
						this.wordsize + digit_bits,
						radix);
		if (x1.r !== x2.r || x1.h !== x2.h) {
			typed = "0" + typed.substr(1);
		}
	}

	return typed;
};

Hp12c_machine.prototype.digit_add = function (d)
{
	var radix = H.radix[this.notation] || 10;

	if (d >= radix) {
		return;
	}

	if (H.type === "12c-platinum") {
		if (this.undoable > this.UNDOABLE_NONE) {
			this.undoable = this.UNDOABLE_NONE;
			this.undoable_assets = null;
			this.display_undo();
		}
	}

	if (this.xmode == -1) {
		if (this.notation >= H.NOTATION_INT) {
			d = this.digit_add_chk_int(d, this.typed_mantissa);
		}
		if (d !== null) {
			if (! this.pushed) {
				this.push(); // push stack when result is immediately followed by typing
			}
			// just displayed a result
			this.clear_typing();
			if (this.notation >= H.NOTATION_INT) {
				this.typed_mantissa = this.chk_int_overflow("" + d);
			} else {
				this.typed_mantissa += "" + d;
			}
			this.xmode = 0;
		}
	} else if (this.xmode === 0) {
		if (this.notation >= H.NOTATION_INT) {
			d = this.digit_add_chk_int(d, this.typed_mantissa);
			if (d !== null) {
				this.typed_mantissa = this.chk_int_overflow(this.typed_mantissa + "" + d);
			}
		} else {
			if (this.typed_mantissa.length < H.display_len) {
				this.typed_mantissa += "" + d;
			}
		}
	} else if (this.xmode === 1) {
		// integer mode never reaches this branch due to decimal_point_mode
		if ((this.typed_mantissa.length + this.typed_decimals.length) < H.display_len) {
			this.typed_decimals += "" + d;
		}
	} else if (this.xmode === 100) {
		// integer mode never gets this branch
		this.typed_exponent = this.typed_exponent.substr(1, 1);
		this.typed_exponent += "" + d;
	}

	this.display_typing();
};

Hp12c_machine.prototype.display_typing_integer = function ()
{
	var tu = H.string_to_integer_fast(this.typed_mantissa, this.negative_repr,
					this.wordsize, H.radix[this.notation]);
	this.reg_Set_tuple("x", tu);

	H.display.displayTypedNumber_integer(this.reg_tuple("x"), this.xmode,
						this.typed_mantissa.length);
};

Hp12c_machine.prototype.display_typing = function ()
{
	this.pushed = 0;

	if (H.type === "16c" && this.notation >= H.NOTATION_INT) {
		this.display_typing_integer();
		return;
	}

	var x = this.typed_mantissa_signal * 
		parseFloat(this.typed_mantissa + "." + this.typed_decimals + "0") * 
		Math.pow(10, parseInt("0" + this.typed_exponent, 10) * this.typed_exponent_signal);

	if (this.pushed_cplx_exception) {
		this.reg_Set_real_only("x", x);
	} else {
		this.reg_Set_real("x", x);
	}

	H.display.displayTypedNumber(this.typed_mantissa_signal, this.typed_mantissa,
		this.typed_decimals, this.typed_exponent, this.typed_exponent_signal,
		this.xmode, this.notation);
};

Hp12c_machine.prototype.digit_delete = function ()
{
	var number_signal;
	var i;

	if (H.type === "15c") {
		this.set_overflow(false);
	}

	if (this.xmode == -1) {
		if (H.type === "12c-platinum") {
			// Backspace equivalent to CLx for "undo" operation
			this.undoable = this.UNDOABLE_CLX;
			this.undoable_assets = this.reg_real("x");
			this.display_undo();
		}

		var imaginary = 0;
		if (this.is_complex_mode()) {
			// preserve imaginary
			imaginary = this.xi;
		}
		this.reg_Set_tuple("x", {r: 0, h: 0, i: imaginary});

		// changes to in-place number editing
		// (does not push again when new number is typed)
		this.pushed = 1;
		this.pushed_cplx_exception = 1;

		H.display.displayNumber(this.reg_tuple("x"));
		return;
	}

	if (H.type === "12c-platinum") {
		this.undoable = this.UNDOABLE_BSP_TYPING;
		var a = [];
		this.undoable_assets = a;
		a[0] = this.xmode;
		a[1] = this.typed_mantissa;
		a[2] = this.typed_decimals;
		a[3] = this.typed_exponent;
		a[4] = this.typed_mantissa_signal;
		a[5] = this.typed_exponent_signal;
		this.display_undo();
	}

	if (this.xmode === 0) {
		i = this.typed_mantissa.length - 1;
		if (i >= 0) {
			this.typed_mantissa = this.typed_mantissa.substr(0, i);
		}
	} else if (this.xmode === 1) {
		i = this.typed_decimals.length - 1;
		if (i < 0) {
			// decimal point mode but no decimal typed
			this.xmode = 0;
		} else {
			this.typed_decimals = this.typed_decimals.substr(0, i);
		}
	} else if (this.xmode === 100) {
		if (parseInt("0" + this.typed_exponent, 10) === 0) {
			this.typed_exponent = "00";
			this.typed_exponent_signal = 1;
			if (this.typed_decimals.length > 0) {
				this.xmode = 1;
			} else {
				this.xmode = 0;
			}
		} else {
			this.typed_exponent = "0" + this.typed_exponent.substr(0, 1);
		}
	}

	this.display_typing();
};

Hp12c_machine.prototype.input_exponential = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		// no-op in 16C integer mode
		return;
	}

	if (this.xmode == -1) {
		if (! this.pushed) {
			this.push(); // push stack when result is immediately followed by typing
		}
		this.clear_typing();
		this.typed_mantissa = "1";

	} else if (this.xmode != 100) {
		if (this.typed_mantissa.length > (H.display_len - 3)) {
			// too long; refuse
			return;
		}

		if (parseInt("0" + this.typed_mantissa, 10) === 0) {
			// no integer part

			this.typed_mantissa = "0";

			var val_dec = parseInt("0" + this.typed_decimals, 10);

			if (val_dec === 0) {
				// both integer and decimal parts all zero
				this.typed_mantissa = "1";
			} else {
				// test for irreductible decimals like 0.000000001
				var n_dec = val_dec.toFixed(0);
				var zeros = this.typed_decimals.length - ("" + n_dec).length;

				// if no decimal typed yet, zeros gets -1
				zeros = Math.max(0, zeros);
			
				if ((this.typed_mantissa.length + zeros) >=
						(H.display_len - 3)) {
					// too long; refuse
					return;
				}
			}
		}
	}

	this.xmode = 100;
	this.display_typing();
};

Hp12c_machine.prototype.decimal_point_mode = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		// no-op in 16C integer mode
		return;
	}

	if (this.xmode == -1) {
		// just displayed a result
		if (! this.pushed) {
			this.push(); // push stack when result is immediately followed by typing
		}
		this.clear_typing();
	}

	if (this.typed_mantissa.length <= 0) {
		this.typed_mantissa = "0";
	}

	this.xmode = 1;
	this.display_typing();
};

Hp12c_machine.prototype.chs_integer = function ()
{
	// CHS always goes to result mode
	this.save_lastx();
	var xt = this.reg_tuple("x");
	var calc = H.integer_inv([xt.h, xt.r], this.negative_repr, this.wordsize);
	this.reg_Set_tuple("x", calc.result);
	this.set_overflow(calc.overflow);
	this.display_result();
};

Hp12c_machine.prototype.chs = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_chs();
		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		this.chs_integer();
		return;
	}

	if (this.xmode === -1) {
		if (this.is_complex_mode()) {
			this.reg_Set_real_only("x", -this.reg_real("x"));
		} else {
			this.reg_Set_real("x", -this.reg_real("x"));
		}
		this.display_result();
		return;
	}

	if (this.xmode == 100) {
		// input mode, inputting exponential
		this.typed_exponent_signal *= -1;
	} else {
		this.typed_mantissa_signal *= -1;
	}

	this.display_typing();
};

Hp12c_machine.prototype.pop = function ()
{
	this.reg_To_reg("y", "x");
	this.reg_To_reg("z", "y");
	this.reg_To_reg("w", "z");
};

Hp12c_machine.prototype.save_lastx = function ()
{
	if (! this.algmode) {
		this.reg_To_reg("x", "last_x");
	}
};

Hp12c_machine.prototype.lstx = function ()
{
	if (! this.pushed) {
		this.push();
	}
	this.reg_To_reg("last_x", "x");
	this.display_result();
};

Hp12c_machine.prototype.shv = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.push();
	if (this.notation >= H.NOTATION_INT) {
		this.reg_Set_real("x", H.sve * 10);
	} else {
		this.reg_Set_real("x", H.sve);
	}
	this.display_result();
};

Hp12c_machine.prototype.test_offsets = function ()
{
	H.keyboard.test();
};

Hp12c_machine.prototype.toggle_feedback = function ()
{
	this.fb = this.fb ? 0 : 1;
	window.xlog("Toggling feedback to " + this.fb);
};

Hp12c_machine.prototype.rapid_on = function ()
{
	this.rapid = 1;
	window.xlog("Toggling rapid ON");
};

Hp12c_machine.prototype.rapid_off = function ()
{
	this.rapid = 0;
	window.xlog("Toggling rapid OFF");
};

Hp12c_machine.prototype.apocryphal = function (i)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	// to be overridden as necessary; this is here just for testing
	this.push();
	this.reg_Set_real("x", 140 + i);
	this.display_result();
};

Hp12c_machine.prototype.clear_prefix = function ()
{
	var self = this;

	if (this.notation >= H.NOTATION_INT) {
		return;	
	}

	if (H.type == "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var n = Math.abs(this.reg_real("x"));
	var order = Math.log(n) / Math.log(10);

	if (H.badnumber(order)) {
		// tends to zero
		order = 1;
	}

	// result may have 11 significant digits in corner cases
	n = n * Math.pow(10, H.display_len - Math.ceil(order));

	var s = n.toFixed(0);
	s = H.zeropad(s, H.display_len); // probably unnecessary
	s = s.substr(0, 10);

	H.display.show_nopgrm(" " + s);

	if (self.program_mode < H.RUNNING) {
		self.enter_modal(H.MODAL_PRESS);
	} else {
		// can only happen in unit tests
	}
};

Hp12c_machine.prototype.x_exchange_y = function ()
{
	var tmp = this.reg_tuple("x");
	this.reg_To_reg("y", "x");
	this.reg_Set_tuple("y", tmp);
	this.display_result();
};

Hp12c_machine.prototype.fix_index = function ()
{
	this.indexh = 0;
	var index = Math.floor(Math.abs(this.index));
	if (index >= H.MEM_MAX) {
		this.display_error(H.ERROR_INDEX);
		return null;
	}
	return index;
};

Hp12c_machine.prototype.x_exchange_index = function ()
{
	var self = this;

	if (self.matrix_in_index()) {
		self.x_exchange_matrix_index();
		return;
	}

	var index = self.fix_index();

	if (index === null) {
		return;
	}

	self.sto_Swap_reg(index, "x");
	self.display_result();
};

Hp12c_machine.prototype.x_exchange_for = function (mem_position)
{
	this.sto_Swap_reg(mem_position, "x");
	this.display_result();
};

Hp12c_machine.prototype.x_exchange_index_itself = function ()
{
	// (reg_Set_real calls reg_Set_tuple which casts an eventual
	// float index to integer.)

	var tmp = this.reg_tuple("x");
	this.reg_Set_tuple("x", {r: this.index, h: this.indexh, i: 0});
	this.index = tmp.r;
	this.indexh = tmp.h;
	this.display_result();
};

Hp12c_machine.prototype.mem_info = function ()
{
	var self = this;
	var mem = self.ram_available();
	var stolen = self.sto_mem_len();

	--stolen;
	var stolen_txt = (stolen % 100).toFixed(0);

	H.display.show_nopgrm("P-" + H.zeropad(mem, H.ram_ADDR_SIZE) + " R-" + stolen_txt, false);
	self.enter_modal(H.MODAL_PRESS);
};

Hp12c_machine.prototype.sf = function (i)
{
	if (i >= this.flags.length) {
		this.display_error(H.ERROR_FLAG);
		return;
	}

	this.do_sf(i);
	this.display_result();
};

Hp12c_machine.prototype.do_sf = function (i)
{
	this.flags[i] = 1;
	this.display_flags();
};

Hp12c_machine.prototype.cf = function (i)
{
	if (i >= this.flags.length) {
		this.display_error(H.ERROR_FLAG);
		return;
	}

	this.do_cf(i);
	this.display_result();
};

Hp12c_machine.prototype.do_cf = function (i)
{
	this.flags[i] = 0;

	if (H.type === "15c") {
		if (i === H.FLAG_COMPLEX) {
			this.xi = this.yi = this.zi = this.wi = this.last_xi = 0;
		}
	}

	this.display_flags();
};

Hp12c_machine.prototype.f_question = function (i)
{
	if (i >= this.flags.length) {
		this.display_error(H.ERROR_FLAG);
		return;
	}

	this.incr_ip(this.flags[i] ? 0 : 1);
};

Hp12c_machine.prototype.dissect_word = function (word)
{
	var sgn = H.binary_sgn(word);
	var index = H.cl5_round(Math.abs(word), 5);
	var counter = Math.floor(index) * sgn;
	index -= sgn * counter;
	index *= 1000;
	var cmp = Math.floor(index + 0.001);
	index = Math.max(0, index - cmp);
	index *= 100;
	var incr = Math.floor(index + 0.1);
	return [counter, cmp, incr];
};

Hp12c_machine.prototype.update_word = function (counter, cmp, incr)
{
	var sgn = H.binary_sgn(counter);
	counter = Math.abs(counter);
	return sgn * (counter + cmp / 1000 + incr / 100000);
};

Hp12c_machine.prototype.isg_core = function (word)
{
	var res = this.dissect_word(word);
	var counter = res[0], cmp = res[1], incr = res[2];

	counter += (incr === 0 ? 1 : incr);
	this.incr_ip(counter > cmp ? 1 : 0);
	return this.update_word(counter, cmp, incr);
};

Hp12c_machine.prototype.f_isg = function ()
{
	var word = this.isg_core(this.index);
	this.index = word;
	this.indexh = 0;
};

Hp12c_machine.prototype.dse_core = function (word)
{
	var res = this.dissect_word(word);
	var counter = res[0], cmp = res[1], incr = res[2];

	counter -= (incr === 0 ? 1 : incr);
	// note that cmp >= 0; a negative counter means this is always True
	this.incr_ip(counter <= cmp ? 1 : 0);
	return this.update_word(counter, cmp, incr);
};

Hp12c_machine.prototype.f_dse = function ()
{
	var word = this.dse_core(this.index);
	this.index = word;
	this.indexh = 0;
};

Hp12c_machine.prototype.r_down = function ()
{
	var tmp = this.reg_tuple("x");
	this.reg_To_reg("y", "x");
	this.reg_To_reg("z", "y");
	this.reg_To_reg("w", "z");
	this.reg_Set_tuple("w", tmp);
	this.display_result();
};

Hp12c_machine.prototype.r_up = function ()
{
	var tmp = this.reg_tuple("x");
	this.reg_To_reg("w", "x");
	this.reg_To_reg("z", "w");
	this.reg_To_reg("y", "z");
	this.reg_Set_tuple("y", tmp);
	this.display_result();
};

Hp12c_machine.prototype.clx = function ()
{
	if (H.type === "12c-platinum") {
		if (this.undoable > this.UNDOABLE_NONE) {
			// CLx in this situation wipes undo possibility
			this.undoable = this.UNDOABLE_NONE;
			this.undoable_assets = null;
		} else {
			this.undoable = this.UNDOABLE_CLX;
			this.undoable_assets = this.reg_real("x");
		}
		this.display_undo();
	}

	if (this.is_complex_mode()) {
		this.reg_Set_real_only("x", 0);
	} else {
		this.reg_Reset("x");
	}

	this.display_result();
	this.pushed = 1; // do not push if user retries typing
	// replaced even by RCL
	this.pushed_cplx_exception = 1;
};

Hp12c_machine.prototype.finish_arithmetic = function (res, a, b)
{
	if (H.type === "16c") {
		var over = Math.abs(res) > H.value_max;
		this.set_overflow(over);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_real("x", H.arithmetic_round(res, a, b));
	this.display_result();
};

Hp12c_machine.prototype.finish_arithmetic_complex = function (res, a, b)
{
	this.save_lastx();
	this.pop();
	var tuple = {"r": H.arithmetic_round(res.r, a.r, b.r),
		     "i": H.arithmetic_round(res.i, a.i, b.i),
		     "h": 0};
	this.reg_Set_tuple("x", tuple);
	this.display_result();
};

Hp12c_machine.prototype.finish_arithmetic_int = function (calc)
{
	this.save_lastx();
	this.pop();
	this.set_carry(calc.carry);
	this.set_overflow(calc.overflow);
	this.reg_Set_tuple("x", calc.result);
	this.display_result();
};

Hp12c_machine.prototype.enter = function (g_modifier)
{
	if (this.algmode) {
		if (this.algebra.length > 0) {
			// pending op, do not push
			this.alg_resolve(1);
		} else if (! g_modifier) {
			this.push();
			this.display_result();
			this.pushed = 1;
		} else {
			// =, but nothing to solve, do not push
			this.display_result();
		}
	} else {
		this.easter_egg();
		this.push();
		this.display_result();
		this.pushed = 1; // already pushed, do not push twice when user types new number
	}
};

Hp12c_machine.prototype.easter_egg = function ()
{
	if (this.x === 0xf457123) {
		this.rapid_on();
	} else if (this.x == 0xf457122) {
		this.rapid_off();
	}
};

Hp12c_machine.prototype.plus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_plus();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_plus([x.h, x.r], [y.h, y.r],
						this.negative_repr, this.wordsize);
		this.finish_arithmetic_int(calc);
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("+");
		window.xlog("[+] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_plus(x, y);
		this.finish_arithmetic_complex(calc, x, y);
	} else {
		x = this.reg_real("x");
		y = this.reg_real("y");
		this.finish_arithmetic(y + x, x, y);
	}
};

Hp12c_machine.prototype.minus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_minus();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_minus([y.h, y.r], [x.h, x.r],
						this.negative_repr, this.wordsize);
		this.finish_arithmetic_int(calc);
		return;
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("-");
		window.xlog("[-] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_minus(y, x);
		this.finish_arithmetic_complex(calc, x, y);
	} else {
		x = this.reg_real("x");
		y = this.reg_real("y");
		this.finish_arithmetic(y - x, x, y);
	}
};

Hp12c_machine.prototype.multiply = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_multiply();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_multiply([x.h, x.r], [y.h, y.r],
				this.negative_repr, this.wordsize);
		// make sure multiplication does not change carry
		calc.carry = this.get_carry();
		this.finish_arithmetic_int(calc);
		return;
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("*");
		window.xlog("[*] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_multiply(x, y);
		this.finish_arithmetic_complex(calc, x, y);
	} else {
		x = this.reg_real("x");
		y = this.reg_real("y");
		this.finish_arithmetic(y * x, 0, 0);
	}
};

Hp12c_machine.prototype.divide = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_divide();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_divide([y.h, y.r], [x.h, x.r],
				this.negative_repr, this.wordsize,
				false);
		if (calc.overflow) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			calc.result = calc.result[0];
			this.finish_arithmetic_int(calc);
		}
		return;
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("/");
		window.xlog("[/] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_divide(y, x);
		if (calc.err) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.finish_arithmetic_complex(calc, x, y);
		}
	} else {
		calc = this.reg_real("y") / this.reg_real("x");
		if (H.badnumber(calc)) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.finish_arithmetic(calc, 0, 0);
		}
	}
};

Hp12c_machine.prototype.poweryx = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("^");
		window.xlog("[^] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		var x = this.reg_tuple("x");
		var y = this.reg_tuple("y");
		var calc = H.complex_power(y, x);
		if (calc.err) {
			window.xlog("complex power err");
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.finish_arithmetic_complex(calc, x, y);
		}
	} else {
		var res = Math.pow(this.reg_real("y"), this.reg_real("x"));
		if (H.badnumber(res)) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.finish_arithmetic(res, 0, 0);
		}
	}
};

Hp12c_machine.prototype.power10 = function ()
{ 
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_power10(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	// can be big but not NaN
	var res = H.clamp(Math.pow(10.0, this.reg_real("x")));
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.reciprocal = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_reciprocal();
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_reciprocal(this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		// no-op in 16C integer mode
		return;
	}

	var res = 1 / this.reg_real("x");
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.square = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_square(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	// can overflow but is never NaN
	var res = H.clamp(Math.pow(this.reg_real("x"), 2));
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.sqroot = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_sqrt(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		var xt = this.reg_tuple("x");
		var calc = H.integer_sqrt([xt.h, xt.r],
						this.negative_repr,
						this.wordsize);
		if (calc.overflow) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.save_lastx();
			this.reg_Set_tuple("x", calc.result);
			this.set_carry(calc.carry);
			this.display_result();
		}
		return;
	}

	var res = Math.sqrt(this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.exp = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		// can't fail
		var cres = H.complex_exp(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	// can't be NaN
	var res = H.clamp(Math.exp(this.reg_real("x")));
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.ln_imag = function ()
{
	return this.do_ln(true);
};

Hp12c_machine.prototype.ln = function ()
{
	return this.do_ln(false);
};

Hp12c_machine.prototype.do_ln = function (bs_cplx)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_ln(this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;

	} else if (bs_cplx) {
		var tuple = {r: this.reg_real("x"), i: this.reg_real("y")};
		var cres2 = H.complex_ln(tuple);
		if (cres2.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_real("x", cres2.r);
		this.reg_Set_real("y", cres2.i);
		this.display_result();

		return;
	}

	var res = Math.log(this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.log10 = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_log10(this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = Math.log(this.reg_real("x")) / Math.log(10);
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.trig = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			// only tan can yield error, due to our implementation
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = H[f](H.radians(this.reg_real("x"), this.trigo));
	// sin, cos, tan can't yield NaN
	res = H.clamp(res);

	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.triginv = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = Math[f](this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", H.to_angle_mode(res, this.trigo));
		this.display_result();
	}
};

Hp12c_machine.prototype.htrig = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	// hyperbolic sin/cos/tan can't yield NaN
	var res = H[f].call(null, this.reg_real("x"));
	res = H.clamp(res);

	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.htriginv = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = H[f].call(null, this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.intg = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", Math.floor(Math.abs(this.reg_real("x"))) *
				H.binary_sgn(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.abs_integer = function ()
{
	// CHS always goes to result mode
	var xt = this.reg_tuple("x");
	var calc = H.integer_abs([xt.h, xt.r], this.negative_repr, this.wordsize);

	this.save_lastx();
	this.reg_Set_tuple("x", calc.result);
	this.set_overflow(calc.overflow);
	this.display_result();
};

Hp12c_machine.prototype.abs = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_abs(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		this.abs_integer();
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", Math.abs(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_radians = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.degrees_to_radians(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_degrees = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.radians_to_degrees(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_hms = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.hour_to_hms(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_hour = function () 
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.hms_to_hour(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.pi = function ()
{
	if (! this.pushed) {
		this.push();
	}
	this.reg_Set_real("x", Math.PI);
	this.display_result();
};

Hp12c_machine.prototype.random = function ()
{
	if (! this.pushed) {
		this.push();
	}
	this.reg_Set_real("x", this.prng.random());
	this.display_result();
};

Hp12c_machine.prototype.random_sto = function ()
{
	var seed = this.reg_real("x");
	this.prng = new H.Prng(seed);
	this.display_result();
};

Hp12c_machine.prototype.random_rcl = function ()
{
	this.reg_Set_real("x", this.prng.getSeed());
	this.display_result();
};

Hp12c_machine.prototype.rnd = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.cl5_round(this.reg_real("x"), this.decimals));
	this.display_result();
};

Hp12c_machine.prototype.polar = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_to_polar(this.reg_tuple("x"));
		cres.i = H.to_angle_mode(cres.i, this.trigo);
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	var res = H.polar(this.reg_real("x"), this.reg_real("y"));
	// H.polar can't throw NaN
	var r = H.clamp(res[0]);
	var angle = res[1];

	this.save_lastx();
	this.reg_Set_real("x", r);
	this.reg_Set_real("y", H.to_angle_mode(angle, this.trigo));
	this.display_result();
};

Hp12c_machine.prototype.orthogonal = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var arg = this.reg_tuple("x");
		arg.i = H.radians(arg.i, this.trigo);
		var cres = H.complex_to_cartesian(arg);
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	var r = this.reg_real("x");
	var angle = H.radians(this.reg_real("y"), this.trigo);
	var res = H.orthogonal(r, angle);
	// H.orthogonal can't throw NaN
	var x = H.clamp(res[0]);
	var y = H.clamp(res[1]);

	this.save_lastx();
	this.reg_Set_real("x", x);
	this.reg_Set_real("y", y);
	this.display_result();
};

Hp12c_machine.prototype.fatorial = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	// 12C-BlackScholes can do gamma as well
	if (H.type === "12c" || H.type === "12c-platinum") {
		if (this.reg_real("x") < 0 ||
				this.reg_real("x") != Math.floor(this.reg_real("x"))) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
	}

	if (this.reg_real("x") > 69.95) {
		this.save_lastx();
		this.reg_Set_real("x", H.value_max);
		this.display_result();
		return;
	}

	var res;

	if (H.type === "12c" || H.type === "12c-platinum") {
		res = H.fatorial(this.reg_real("x"));
	} else {
		res = H.fatorial_gamma(this.reg_real("x"));
	}

	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.frac = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", (Math.abs(this.reg_real("x")) -
				Math.floor(Math.abs(this.reg_real("x")))) *
					H.binary_sgn(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.percent = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	var res = this.reg_real("y") * this.reg_real("x") / 100;
	res = H.clamp(res);
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.deltapercent = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	var res = 100 * (this.reg_real("x") / this.reg_real("y")) - 100;

	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.sto = function (pos)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	var res = 100 * (this.reg_real("x") / this.reg_real("y")) - 100;
	// "pos" comes correctly adjusted from dispatcher even in the
	// case of HP-16C (0..15, 16..31).
	this.reg_To_sto("x", pos);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.sto_index = function (pos)
{
	if (this.matrix_in_index()) {
		this.sto_matrix_el_i();
		return;
	}

	var index = this.fix_index();

	if (index === null) {
		return;
	}

	this.reg_To_sto("x", index);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.get_index = function ()
{
	if (! this.pushed) {
		this.push();
	}
	this.reg_Set_tuple("x", {r: this.index, h: this.indexh, i: 0});
	this.display_result();
};

Hp12c_machine.prototype.set_index = function ()
{
	var x = this.reg_tuple("x");
	this.index = x.r;
	this.indexh = x.h;
	this.display_result();
};

Hp12c_machine.prototype.tarithmetic = function (at, bt, op)
{
	// not implemented in 16c
	var res = {};
	res.r = res.i = res.h = 0;
	if (op === "+") {
		res.r = at.r + bt.r;
	} else if (op === "-") {
		res.r = at.r - bt.r;
	} else if (op === "x") {
		res.r = at.r * bt.r;
	} else if (op === "/") {
		res.r = at.r / bt.r;
	}
	return res;
};

Hp12c_machine.prototype.stoinfix_core = function (a, operation)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return null;
	}

	var b = this.reg_tuple("x");

	if (operation ==  H.STO_PLUS) {
		a = this.tarithmetic(a, b, "+");
	} else if (operation == H.STO_MINUS) {
		a = this.tarithmetic(a, b, "-");
	} else if (operation == H.STO_TIMES) {
		a = this.tarithmetic(a, b, "x");
	} else if (operation == H.STO_DIVIDE) {
		a = this.tarithmetic(a, b, "/");
		if (H.badnumber(a.r)) {
			this.display_error(H.ERROR_DIVZERO);
			return null;
		}
	}

	a.r = H.clamp(a.r);

	return a;
};

Hp12c_machine.prototype.rcl = function (pos)
{
	if (! this.pushed) {
		this.push();
	}
	this.sto_To_reg(pos, "x");
	this.display_result(); // enables pushing
};

Hp12c_machine.prototype.rcl_index = function (pos)
{
	if (this.matrix_in_index()) {
		this.rcl_matrix_el_i();
		return;
	}

	var index = this.fix_index();

	if (index === null) {
		return;
	}

	if (! this.pushed) {
		this.push();
	}
	this.sto_To_reg(index, "x");
	this.display_result(); // enables pushing
};

Hp12c_machine.prototype.stat_sigma_rcl = function ()
{
	if (! this.pushed) {
		this.push();
	}
	this.push();
	this.sto_To_reg(H.STAT_X, "x");
	this.sto_To_reg(H.STAT_Y, "y");
	this.display_result();
};

Hp12c_machine.prototype.stat_sigma_plus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	H.stat_accumulate(+1, this.sto_mem_ref(), this.reg_real("x"), this.reg_real("y"));
	this.save_lastx();
	this.sto_To_reg(H.STAT_N, "x");
	this.display_result();
	this.pushed = 1;
};

Hp12c_machine.prototype.stat_sigma_minus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	H.stat_accumulate(-1, this.sto_mem_ref(), this.reg_real("x"), this.reg_real("y"));
	this.save_lastx();
	this.sto_To_reg(H.STAT_N, "x");
	this.display_result();
	this.pushed = 1;
};

Hp12c_machine.prototype.stat_avgw = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	// 16C does not have statistics, so this is ok
	var res = H.stat_avgw(this.sto_mem_ref());
	
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res[1]);
		this.display_result();
	}
};

Hp12c_machine.prototype.stat_avg = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var res = H.stat_avg(this.sto_mem_ref());

	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		if (! this.pushed) {
			this.push();
		}
		this.push();
		this.reg_Set_real("x", res[1]);
		this.reg_Set_real("y", res[2]);
		this.display_result();
	}
};

Hp12c_machine.prototype.stat_stddev = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var res = H.stddev(this.sto_mem_ref());
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
		return;
	}

	if (! this.pushed) {
		this.push();
	}
	this.push();
	this.reg_Set_real("x", res[1]);
	this.reg_Set_real("y", res[2]);
	this.display_result();
};

Hp12c_machine.prototype.stat_lr = function (is_x)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return null;
	}

	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var res = H.stat_kr(this.sto_mem_ref(), is_x, this.reg_real("x"));
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		this.save_lastx();
		this.push();
		this.reg_Set_real("x", res[1]);
		this.reg_Set_real("y", res[2]);
		this.display_result();
	}
};

Hp12c_machine.prototype.stat_linearregression = function ()
{
	// this method is called only for 11C and 15C
	/*
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}
	*/

	var res = H.linear_regression(this.sto_mem_ref());
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		if (! this.pushed) {
			this.push();
		}
		this.push();
		this.reg_Set_real("x", res[1]); // B
		this.reg_Set_real("y", res[2]); // A
		this.display_result();
	}
};

Hp12c_machine.prototype.permutations = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_zc_zp();
		return;
	}

	var x = this.reg_real("x");
	var y = this.reg_real("y");
	if (x < 0 || x != Math.floor(x) || x >= 70 ||
	    y < 0 || y != Math.floor(y) || y >= 70 ||
	    y < x) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		var res = H.permutations(y, x);
		this.pop();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.combinations = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_zp_zc();
		return;
	}

	var x = this.reg_real("x");
	var y = this.reg_real("y");
	if (x < 0 || x != Math.floor(x) || x >= 70 ||
	    y < 0 || y != Math.floor(y) || y >= 70 ||
	    y < x) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		var res = H.combinations(y, x);
		this.pop();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.display_program_opcode = function ()
{
	var instr = this.ram[this.ip];

	if (H.type === "16c") {
		instr = H.pgrm.hex_opcode(instr);
	} else if (H.type === "15c") {
		instr = H.pgrm.shrunk_opcode(instr);
	}

	var txt = H.zeropad(this.ip.toFixed(0), H.ram_ADDR_SIZE) +
				"-" + instr;
	H.display.show_nopgrm(txt);
};

Hp12c_machine.prototype.prog_pr = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	if (this.program_mode == H.INTERACTIVE) {
		this.program_mode = H.PROGRAMMING;
		// NOTE: entering programming mode does not reset instruction pointer
		// this.ip = 0;
		this.display_pgrm();
		this.display_program_opcode();
	}
};

Hp12c_machine.prototype.gto_digit_add = function (n)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.gtoxx = "" + this.gtoxx + n.toFixed(0);
	if (this.gtoxx.length >= H.ram_ADDR_SIZE) {
		var new_ip = parseInt(this.gtoxx, 10);
		this.gtoxx = "";
		this.rst_modifier(); // OK

		if (new_ip > this.program_limit()) {
			this.display_error(H.ERROR_IP);
			return;
		}

		this.ip = new_ip;
	}
};

Hp12c_machine.prototype.ntest = function (var1, criteria, var2, cplx)
{
	var1 = this.reg_tuple(var1);

	if (var2 !== "0") {
		var2 = this.reg_tuple(var2);
	} else {
		var2 = {r: 0, h: 0, i: 0};
	}

	var res;

	if (this.notation >= H.NOTATION_INT) {
		if (criteria == "==" || criteria == "=" || criteria == "===") {
			res = H.integer_eq(var1, var2, this.negative_repr, this.wordsize);
		} else if (criteria == "<=") {
			res = H.integer_le(var1, var2, this.negative_repr, this.wordsize);
		} else if (criteria == "<") {
			res = H.integer_lt(var1, var2, this.negative_repr, this.wordsize);
		}
	} else {
		if (criteria == "==" || criteria == "=" || criteria == "===") {
			res = H.feq10(var1.r, var2.r);
			if (cplx && this.is_complex_mode()) {
				res = res && H.feq10(var1.i, var2.i);
			}
		} else if (criteria == "<=") {
			res = var1.r <= var2.r;
		} else if (criteria == "<") {
			res = var1.r < var2.r;
		}
	}

	return res;
};

Hp12c_machine.prototype.test = function (condition)
{
	this.display_result_s(false, true);
	this.incr_ip(condition ? 0 : 1);
};

Hp12c_machine.prototype.test_x_le_y = function ()
{
	this.test(this.ntest("x", "<=", "y"));
};

Hp12c_machine.prototype.test_x_gt_y = function ()
{
	this.test(! this.ntest("x", "<=", "y"));
};

Hp12c_machine.prototype.test_x_eq_y = function ()
{
	this.test(this.ntest("x", "==", "y", true));
};

Hp12c_machine.prototype.test_x_ne_y = function ()
{
	this.test(! this.ntest("x", "==", "y", true));
};

Hp12c_machine.prototype.test_x_ge_y = function ()
{
	this.test(! this.ntest("x", "<", "y"));
};

Hp12c_machine.prototype.test_x_lt_y = function ()
{
	this.test(this.ntest("x", "<", "y"));
};

Hp12c_machine.prototype.test_x_less_0 = function ()
{
	this.test(this.ntest("x", "<", "0"));
};

Hp12c_machine.prototype.test_x_ge_0 = function ()
{
	this.test(! this.ntest("x", "<", "0"));
};

Hp12c_machine.prototype.test_x_gt_0 = function ()
{
	this.test(! this.ntest("x", "<=", "0"));
};

Hp12c_machine.prototype.test_x_le_0 = function ()
{
	this.test(this.ntest("x", "<=", "0"));
};

Hp12c_machine.prototype.test_x_eq0 = function ()
{
	// works for matrix since x would be a non-zero descriptor
	this.test(this.ntest("x", "==", "0", true));
};

Hp12c_machine.prototype.test_x_ne0 = function ()
{
	this.test(! this.ntest("x", "==", "0", true));
};

Hp12c_machine.prototype.gto_buf_clear = function ()
{
	this.gtoxx = "";
};

Hp12c_machine.prototype.nop = function ()
{
};

Hp12c_machine.prototype.program_stopped = function (reason)
{
	if (H.type !== "15c") {
		return;
	}

	// handles result of subroutine execution for SOLVE,
	// integration, etc.

	this.pop_running_context(reason);
};

Hp12c_machine.prototype.get_complex = function ()
{
	return this.flags[H.FLAG_COMPLEX];
};

Hp12c_machine.prototype.is_complex_mode = function ()
{
	if (H.type === "15c") {
		return this.get_complex();
	}

	return false;
};

Hp12c_machine.prototype.set_complex = function (v)
{
	if (H.type === "15c") {
		this.do_sf(H.FLAG_COMPLEX);
	}
};

Hp12c_machine.prototype.set_overflow = function (v)
{
	if (H.type === "16c" || H.type === "15c") {
		if (v) {
			this.do_sf(H.FLAG_OVERFLOW);
		} else {
			this.do_cf(H.FLAG_OVERFLOW);
		}
	}
};

Hp12c_machine.prototype.get_overflow = function ()
{
	return this.flags[H.FLAG_OVERFLOW];
};

Hp12c_machine.prototype.matrix_in_reg = function (reg)
{
	if (H.type !== "15c") {
		return 0;
	}

	var self = this;

	var x = self.reg_tuple(reg);

	if ((! x.h) || (! self.chk_matrix_number(x.r))) {
		return 0;
	}

	return x.r;
};

Hp12c_machine.prototype.matrix_in_index = function ()
{
	var self = this;

	if (H.type !== "15c") {
		return 0;
	}

	if ((! self.indexh) || (! self.chk_matrix_number(self.index))) {
		return 0;
	}

	return self.index;
};

Hp12c_machine.prototype.alg_resolve = function (close_all)
{
	if (H.type !== "12c-platinum") {
		return 1;
	}
	return this.alg_resolve_in(close_all);
};

Hp12c_machine.prototype.stoinfix = function (pos, operation)
{
	var a;
	if (pos === 99999) {
		a = {r: this.index, i: 0, h: 0};
	} else {
		a = this.sto_tuple(pos);
	}
	a = this.stoinfix_core(a, operation);

	if (a === null) {
		return;
	}

	if (pos === 99999) {
		this.index = a.r;
	} else {
		this.sto_Set_tuple(pos, a);
	}
	this.display_result();
};

Hp12c_machine.prototype.stoinfix_index = function (operation)
{
	var self = this;

	if (self.matrix_in_index()) {
		self.sto_infix_matrix_el_i(operation);
		return;
	}

	var index = this.fix_index();
 
	if (index === null) {
		return;
	}

	this.stoinfix(index, operation);
};
/* HP-12C emulator 
 * Copyright (c) 2007, 2011, 2016 Elvis Pfutzenreuter - epxx.co.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true */
/*jshint globalstrict: true*/
/*global H, Hp12c_machine */

"use strict";

Hp12c_machine.prototype.display_result_date = function (dd)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.clear_typing();
	H.display.show_date(H.date_to_show(dd, this.dmy));
};

Hp12c_machine.prototype.algebraic_mode = function ()
{
	var self = this;

	self.algmode = 1;
	self.algebra = [];
	self.display_parentheses();
	self.display_algmode();
	self.display_result();
};

Hp12c_machine.prototype.algebraic_open_parentheses = function ()
{
	var self = this;

	if (! self.algmode) {
		return;
	}

	var count = self.count_open_parentheses();
	if (count > 13) {
		// maximum 13 parentheses
		self.display_error(H.ERROR_IP);
		return;
	}

	if (self.can_open_parentheses()) {
		// e.g. "5 (" -- invalid
		self.algebra.push("(");
		window.xlog("(open) " + self.algebra.join(" "));
		self.display_parentheses();
		return;
	}
};

Hp12c_machine.prototype.algebraic_close_parentheses = function ()
{
	var self = this;

	if (! self.algmode) {
		return;
	}

	if (self.do_close_parentheses(0)) {
		self.alg_resolve(0);
		self.display_parentheses();
	} else {
		self.display_result();
	}
};

Hp12c_machine.prototype.platinum_undo = function ()
{
	var self = this;

	var e;

	if (self.undoable === self.UNDOABLE_CLX) {
		self.reg_Set_real("x", self.undoable_assets);
		self.display_result();
	} else if (self.undoable === self.UNDOABLE_BSP) {
		// currently not implemented (12c BSP does CLx?)
	} else if (self.undoable === self.UNDOABLE_BSP_TYPING) {
		self.xmode = self.undoable_assets[0];
		self.typed_mantissa = self.undoable_assets[1];
		self.typed_decimals = self.undoable_assets[2];
		self.typed_exponent = self.undoable_assets[3];
		self.typed_mantissa_signal = self.undoable_assets[4];
		self.typed_exponent_signal = self.undoable_assets[5];
		self.display_typing();
	} else if (self.undoable === self.UNDOABLE_CLEAR_REG) {
		for (e = 0; e < 5; ++e) {
			self.finmemory[e] = self.undoable_assets.fin[e];
		}
		for (e = 0; e < H.MEM_MAX; ++e) {
			self.sto_Set_tuple(e, self.undoable_assets.sto[e]);
		}
		for (e = 0; e < H.MEM_MAX; ++e) {
			self.njmemory[e] = self.undoable_assets.nj[e];
		}
		self.reg_Set_real("x", self.undoable_assets.stack.x);
		self.reg_Set_real("y", self.undoable_assets.stack.y);
		self.reg_Set_real("z", self.undoable_assets.stack.z);
		self.reg_Set_real("w", self.undoable_assets.stack.w);
		self.reg_Set_real("last_x", self.undoable_assets.stack.last_x);
		self.display_result();
	} else if (self.undoable === self.UNDOABLE_CLEAR_STAT) {
		for (e = H.STAT_MIN; e <= H.STAT_MAX; ++e) {
			self.sto_Set_tuple(e, self.undoable_assets.sto[e]);
		}
		self.reg_Set_real("x", self.undoable_assets.stack.x);
		self.reg_Set_real("y", self.undoable_assets.stack.y);
		self.reg_Set_real("z", self.undoable_assets.stack.z);
		self.reg_Set_real("w", self.undoable_assets.stack.w);
		self.display_result();
	} else if (self.undoable === self.UNDOABLE_CLEAR_FIN) {
		for (e = 0; e < 5; ++e) {
			self.finmemory[e] = self.undoable_assets[e];
		}
		self.display_result();
	}

	self.undoable = self.UNDOABLE_NONE;
	self.undoable_assets = null;
	self.display_undo();
};

Hp12c_machine.prototype.algebra_rightmost_is_number = function ()
{
	var self = this;

	if (self.algebra.length <= 0) {
		return false;
	}
	return typeof self.algebra[self.algebra.length - 1] === "number";
};

Hp12c_machine.prototype.can_open_parentheses = function ()
{
	var self = this;

	if (self.algebra.length <= 0) {
		// can always begin a sentence with (
		return 1;
	}

	var rightmost = self.algebra[self.algebra.length - 1];

	if (typeof rightmost === "string") {
		if (rightmost !== ")") {
			// "... 5 x (" or "... 5 x ( ("
			return 1;
		} else {
			// "... ) (" forbidden
			return 0;
		}
	}

	// forbidden seq. like "... 5 ("
	return 0;
};

Hp12c_machine.prototype.count_open_parentheses = function ()
{
	var self = this;

	var open = 0;

	for (var i = 0; i < self.algebra.length; ++i) {
		var token = self.algebra[i];
		if (typeof token !== "string") {
			continue;
		}
		if (token === "(") {
			++open;
		} else if (token === ")") {
			--open;
		}
	}

	return open;
};

Hp12c_machine.prototype.do_close_parentheses = function ()
{
	var self = this;

	var open = self.count_open_parentheses();

	if (open > 0) {
		var rightmost = self.algebra[self.algebra.length - 1];
		if (typeof rightmost === "string") {
			if (rightmost !== ")") {
				// "... 5 x" or "... 5 x ("
				// takes another numeric parameter so it becomes
				// "... 5 x n )" or "... 5 x ( n )"
				self.algebra.push(self.reg_real("x"));
			}
		}
		self.algebra.push(")");
		window.xlog("(close) " + self.algebra.join(" "));
	}

	return open > 0; 
};

Hp12c_machine.prototype.alg_resolve_in = function (close_all)
{
	var self = this;

	// 12C-only algebric mode.
	var res;
	var ok = 1;

	if (! self.algmode) {
		return ok;
	}

	// add X value if rightmost item is an operator
	if (self.algebra.length > 0) {
		var rightmost = self.algebra[self.algebra.length - 1];
		if (typeof rightmost === "string") {
			if (rightmost !== ")") {
				// "... 5 x" or "... 5 x ("
				// takes another numeric parameter so it becomes
				// "... 5 x n )" or "... 5 x ( n )"
				self.algebra.push(self.reg_real("x"));
			}
		}
	}

	if (close_all) {
		while (self.do_close_parentheses(1)) {
		}
	}

	window.xlog("--- solving " + (close_all ? "all" : "one"));
	ok = self.do_alg_solve(close_all);
	self.display_parentheses();

	return ok;
};


Hp12c_machine.prototype.do_alg_solve = function (close_all)
{
	var self = this;

	var ok = 1;
	if (self.algebra.length <= 0) {
		window.xlog("Nothing to solve");
		return ok;
	}

	var solved = 1;
	var did_solve = 0;

	while (true) {
		if (self.algebra.length > 0) {
			window.xlog(self.algebra.join(" "));
		} else {
			window.xlog("--");
		}

		// delay break to show algebra before quitting
		if (! solved || ! ok || (did_solve && ! close_all)) {
			break;
		}

		var res_array = self.do_alg_solve_in();
		var res = res_array[0];
		solved = res_array[1];

		if (H.badnumber(res)) {
			ok = 0;
			self.display_error(H.ERROR_DIVZERO);
			self.algebra = [];
		} else if (solved) {
			did_solve = 1;
			// if there is some error in another op, x gets the
			// value of last solved operation
			self.reg_Set_real("x", res);
		}
	}

	if (ok && did_solve) {
		var x = self.reg_real("x");
		self.finish_arithmetic(x, x, x);
	}

	if (close_all) {
		self.algebra = [];
	}

	return ok;
};

Hp12c_machine.prototype.do_alg_simplify = function ()
{
	var self = this;

	// look for "( number )" to simplify
	for (var i = self.algebra.length - 3; i >= 0; --i) {
		var nu = self.do_alg_simplify_in(i);
		if (typeof nu === "number") {
			return nu;
		}
	}

	return null;
};

Hp12c_machine.prototype.do_alg_simplify_in = function (i)
{
	var self = this;

	if (i < 0 || (i + 2) >= self.algebra.length) {
		return null;
	}

	var op = self.algebra[i];
	var nu = self.algebra[i + 1];
	var cp = self.algebra[i + 2];

	if (typeof op !== "string" || typeof nu !== "number" ||
					typeof cp !== "string") {
		return null;
	}
	if (op !== "(" || cp !== ")") {
		return null;
	}

	// found opportunity to simplify
	self.algebra.splice(i, 3, nu);
	return nu;
};

Hp12c_machine.prototype.do_alg_solve_in = function ()
{
	var self = this;

	var i, nu, op, a, b, cp;

	// trivial case: empty list
	if (self.algebra.length <= 0) {
		return [0, false];
	}

	// trivial case: single number
	if (self.algebra.length === 1) {
		nu = self.algebra[0];
		if (typeof nu === "number") {
			self.algebra = [];
			return [nu, true];
		}
	}

	nu = self.do_alg_simplify();
	if (typeof nu === "number") {
		return [nu, true];
	}

	// look for "x op y" to solve 
	for (i = self.algebra.length - 3; i >= 0; --i) {
		a = self.algebra[i];
		op = self.algebra[i + 1];
		b = self.algebra[i + 2];

		if (typeof a !== "number" || typeof op !== "string" ||
						typeof b !== "number") {
			continue;
		}

		var res;
		if (op === "+") {
			res = H.arithmetic_round(a + b, a, b);
			self.algebra.splice(i, 3, res);
			self.do_alg_simplify_in(i - 1);
			return [res, true];
		} else if (op === "-") {
			res = H.arithmetic_round(a - b, a, b);
			self.algebra.splice(i, 3, res);
			self.do_alg_simplify_in(i - 1);
			return [res, true];
		} else if (op === "*") {
			res = H.arithmetic_round(a * b, a, b);
			self.algebra.splice(i, 3, res);
			self.do_alg_simplify_in(i - 1);
			return [res, true];
		} else if (op === "/") {
			res = a / b;
			if (! H.badnumber(res)) {
				res = H.arithmetic_round(res, a, b);
			}
			self.algebra.splice(i, 3, res);
			self.do_alg_simplify_in(i - 1);
			return [res, true];
		} else if (op === "^") {
			res = Math.pow(a, b);
			if (! H.badnumber(res)) {
				res = H.arithmetic_round(res, a, b);
			}
			self.algebra.splice(i, 3, res);
			self.do_alg_simplify_in(i - 1);
			return [res, true];
		} else {
			// inconsistent (should not happen)
			self.algebra = [];
			return [b, false];
		}
	}

	// nothing to do
	return [0, false];
};

Hp12c_machine.prototype.stoCF0 = function ()
{
	var self = this;

	if (! self.alg_resolve(1)) {
		return;
	}

	var res = 100 * (self.reg_real("x") / self.reg_real("y")) - 100;
	self.reg_To_sto("x", 0);
	self.finmemory[H.FIN_N] = 0;
	self.display_result();
};

Hp12c_machine.prototype.stoCFj = function ()
{
	var self = this;

	if (! self.alg_resolve(1)) {
		return;
	}

	var res = 100 * (self.reg_real("x") / self.reg_real("y")) - 100;
	if (self.finmemory[H.FIN_N] != Math.floor(self.finmemory[H.FIN_N]) ||
	    self.finmemory[H.FIN_N] < 0 ||
	    self.finmemory[H.FIN_N] >= H.MEM_MAX) {
		self.display_error(H.ERROR_MEMORY);
	} else {
		self.finmemory[H.FIN_N]++;
		self.reg_To_sto("x", self.finmemory[H.FIN_N]);
		self.njmemory[self.finmemory[H.FIN_N]] = 1; 
		self.display_result();
	}
};

Hp12c_machine.prototype.rclCFj = function ()
{
	var self = this;

	if (self.finmemory[H.FIN_N] < 0 ||
	    self.finmemory[H.FIN_N] >= H.MEM_MAX ||
	    Math.floor(self.finmemory[H.FIN_N]) != self.finmemory[H.FIN_N]) {
		self.display_error(H.ERROR_MEMORY);
	} else {
		if (! self.pushed) {
			self.push();
		}
		self.sto_To_reg(self.finmemory[H.FIN_N], "x");
		--self.finmemory[H.FIN_N];
		self.display_result();
	}
};

Hp12c_machine.prototype.rclNj = function ()
{
	var self = this;

	if (self.finmemory[H.FIN_N] < 0 ||
            self.finmemory[H.FIN_N] >= H.MEM_MAX ||
            Math.floor(self.finmemory[H.FIN_N]) != self.finmemory[H.FIN_N]) {
		self.display_error(H.ERROR_MEMORY);
	} else {
		if (! self.pushed) {
			self.push();
		}
		self.reg_Set_real("x", self.njmemory[self.finmemory[H.FIN_N]]);
		self.display_result();
	}
};

Hp12c_machine.prototype.stoNj = function ()
{
	var self = this;

	if (! self.alg_resolve(1)) {
		return;
	}

	var res = 100 * (self.reg_real("x") / self.reg_real("y")) - 100;
	if (self.finmemory[H.FIN_N] != Math.floor(self.finmemory[H.FIN_N]) ||
            self.finmemory[H.FIN_N] < 0 ||
            self.finmemory[H.FIN_N] >= H.MEM_MAX ||
	    self.reg_real("x") != Math.floor(self.reg_real("x")) ||
	    self.reg_real("x") < 0 ||
	    self.reg_real("x") > 500) {
		self.display_error(H.ERROR_MEMORY);
	} else {
		self.njmemory[self.finmemory[H.FIN_N]] = self.reg_real("x");
		self.display_result();
	}
};

Hp12c_machine.prototype.stofin = function (pos)
{
	var self = this;

	self.finmemory[pos] = self.reg_real("x");
	self.display_result();
	self.pushed = 1;
	self.do_fincalc = 1; // next fin. key runs calculation
};

Hp12c_machine.prototype.ston_12x = function ()
{
	var self = this;

	if (! self.alg_resolve(1)) {
		return;
	}

	var res = self.reg_real("x") * 12;
	if (Math.abs(res) > H.value_max) {
		self.display_error(H.ERROR_OVERFLOW);
		return;
	}
	self.reg_Set_real("x", res);
	self.stofin(0);
};

Hp12c_machine.prototype.stoi_12div = function ()
{
	var self = this;

	if (! self.alg_resolve(1)) {
		return;
	}

	self.reg_Set_real("x", self.reg_real("x") / 12);
	self.stofin(1);
};

Hp12c_machine.prototype.rclfin = function (pos, twelve)
{
	var self = this;

	if (! self.pushed) {
		self.push();
	}
	var x = self.finmemory[pos];
	if (twelve) {
		if (pos === 0) {
			// 12x n
			x /= 12;
		} else if (pos === 1) {
			// 12/ i
			x *= 12;
		}
	}
	self.reg_Set_real("x", x);
	self.display_result();
};

Hp12c_machine.prototype.simple_interest = function ()
{
	var self = this;

	if (! self.alg_resolve(1)) {
		return;
	}

	var n = self.finmemory[H.FIN_N];
	var i = self.finmemory[H.FIN_I] / 100;
	var pv = self.finmemory[H.FIN_PV];
	self.push();
	self.push();
	self.push();

	self.reg_Set_real("x", n / 360 * -pv * i);
	self.reg_Set_real("y", -pv);
	self.reg_Set_real("z", n / 365 * -pv * i);

	self.display_result();
};

Hp12c_machine.prototype.sto_or_calc_fin = function (pos)
{
	var self = this;

	if (! self.alg_resolve(1)) {
		return;
	}

	if (! self.do_fincalc) {
		self.stofin(pos);
	} else {
		H.display.show_running();
		self.cli("sto_or_calc_fin");
		self.enter_modal(H.MODAL_MISC);

		H.delay(function () {
			self.sti("sto_or_calc_fin");
			self.reset_modal();
			var err = H.financecalc(pos, self.begin, self.compoundf, self.finmemory);
			if (err == -1) {
				// no error
				self.reg_Set_real("x", self.finmemory[pos]);
				self.display_result();
			} else {
				self.display_error(err);
			}
		}, (self.rapid ? 0 : 200));
	}
};

Hp12c_machine.prototype.npv = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		self.algebra = [];
		self.display_parentheses();
	}

	if (! self.pushed) {
		self.push();
	}
	// 16C does not have finance, so this is ok
	self.reg_Set_real("x", H.npv(self.finmemory[H.FIN_N], self.finmemory[H.FIN_I], self.sto_mem_ref(), self.njmemory));
	self.finmemory[H.FIN_PV] = self.x;
	self.display_result();
};

Hp12c_machine.prototype.irr = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		self.algebra = [];
		self.display_parentheses();
	}

	H.display.show_running();
	self.cli("irr");
	self.enter_modal(H.MODAL_MISC);

	H.delay(function () {
		self.sti("irr");
		self.reset_modal();

		var res = H.irr_calc(self.finmemory[H.FIN_N], self.finmemory[H.FIN_I],
					self.sto_mem_ref(), self.njmemory);
		var err = res[0];
		self.finmemory[H.FIN_I] = res[1];
		if (err != -1) {
			self.display_error(err);
		} else {
			if (! self.pushed) {
				self.push();
			}
			self.reg_Set_real("x", self.finmemory[H.FIN_I]);
			self.display_result();
		}
	}, (self.rapid ? 0 : 200));
};


Hp12c_machine.prototype.date_date = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		self.algebra = [];
		self.display_parentheses();
	}

	var base = H.date_interpret(self.reg_real("y"), self.dmy);
	if (base === null) {
		self.display_error(H.ERROR_DATE);
		return;
	}
	self.save_lastx();
	H.date_add(base, self.reg_real("x"));
	self.pop(); // eat original arguments 
	self.reg_Set_real("x", H.date_gen(base, self.dmy)); // and fill with newly calculated date
	self.display_result_date(base);

	if (self.program_mode >= H.RUNNING) {
		// in a program, 12C pauses so the date can be seen
		self.cli("date");
		self.enter_modal(H.MODAL_PAUSE);

		H.delay(function () {
			self.sti("date");
			self.reset_modal();
		}, 1000);
	}
};

Hp12c_machine.prototype.date_dys = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		self.algebra = [];
		self.display_parentheses();
	}

	var d2 = H.date_interpret(self.reg_real("x"), self.dmy);
	var d1 = H.date_interpret(self.reg_real("y"), self.dmy);
	if ((d1 === null) || (d2 === null)) {
		self.display_error(H.ERROR_DATE);
		return;
	}
	self.save_lastx();
	self.reg_Set_real("x", H.date_diff(d1, d2));
	self.reg_Set_real("y", H.date_diff30(d1, d2));
	self.display_result();
};

Hp12c_machine.prototype.amortization = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		self.algebra = [];
		self.display_parentheses();
	}

	var requested_n = self.reg_real("x");
	var orig_n = self.finmemory[H.FIN_N];
	var i = self.finmemory[H.FIN_I] / 100;

	// AMORT rounds present value to shown decimals
	var pv = H.cl5_round(self.finmemory[H.FIN_PV], self.decimals);
	self.finmemory[H.FIN_PV] = pv;

	// AMORT rounds payment to shown decimals
	var pmt = H.cl5_round(self.finmemory[H.FIN_PMT], self.decimals);
	self.finmemory[H.FIN_PMT] = pmt;

	var res = H.amortization(requested_n, orig_n, i, pv, pmt, self.decimals, self.begin);
	var err = res[0];
	var tot_interest = res[1];
	var tot_amort = res[2];

	self.push();
	self.push();

	self.reg_Set_real("x", tot_interest); 
	self.reg_Set_real("y", tot_amort);
	self.reg_Set_real("z", requested_n);

	self.finmemory[H.FIN_N] += requested_n;
	self.finmemory[H.FIN_PV] += tot_amort;

	self.display_result();
};

Hp12c_machine.prototype.bond_price = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		self.algebra = [];
		self.display_parentheses();
	}

	var desired_rate = self.finmemory[H.FIN_I];
	if (desired_rate <= -100) {
		self.display_error(H.ERROR_INTEREST);
		return;
	}

	var coupon_year = self.finmemory[H.FIN_PMT];

	var buy = H.date_interpret(self.reg_real("y"), self.dmy);
	if (buy === null) {
		self.display_error(H.ERROR_DATE);
		return;
	}

	var maturity = H.date_interpret(self.reg_real("x"), self.dmy);
	if (maturity === null) {
		self.display_error(H.ERROR_DATE);
		return;
	}

	var res = H.bond_price(desired_rate, coupon_year, buy, maturity);

	if (res[0] >= 0) {
		self.display_error(res[0]);
		return;
	}

	self.push();
	self.push();
	self.finmemory[H.FIN_N] = res[1];
	self.reg_Set_real("x", res[1]);
	self.reg_Set_real("y", res[2]);
	self.display_result();
};

Hp12c_machine.prototype.bond_yield = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		self.algebra = [];
		self.display_parentheses();
	}

	var coupon_year = self.finmemory[H.FIN_PMT];
	var buy = H.date_interpret(self.reg_real("y"), self.dmy);
	var maturity = H.date_interpret(self.reg_real("x"), self.dmy);
	var price = self.finmemory[H.FIN_PV];

	var res = H.bond_yield(coupon_year, buy, maturity, price);

	var err = res[0];
	var desired_rate = res[1];

	if (err >= 0) {
		self.display_error(err);
		return;
	}

	self.push();
	self.finmemory[H.FIN_I] = desired_rate;
	self.reg_Set_real("x", desired_rate);
	self.display_result();
};


Hp12c_machine.prototype.depreciation_sl = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		self.algebra = [];
		self.display_parentheses();
	}

	var cost = self.finmemory[H.FIN_PV];
	var sell = self.finmemory[H.FIN_FV];
	var life = self.finmemory[H.FIN_N];
	var year = self.reg_real("x");

	var res = H.depreciation_sl(cost, sell, life, year);
	var err = res[0];
	var depr = res[1];
	var rest = res[2];

	if (err >= 0) {
		self.display_error(err);
		return;
	}
	
	self.push();
	self.push();
	self.reg_Set_real("x", depr);
	self.reg_Set_real("y", rest);
	self.display_result();
};

Hp12c_machine.prototype.depreciation_soyd = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		self.algebra = [];
		self.display_parentheses();
	}

	var cost = self.finmemory[H.FIN_PV];
	var sell = self.finmemory[H.FIN_FV];
	var life = self.finmemory[H.FIN_N];
	var year = self.reg_real("x");

	var res = H.depreciation_soyd(cost, sell, life, year);
	var err = res[0];
	var depr = res[1];
	var rest = res[2];

	if (err >= 0) {
		self.display_error(err);
		return;
	}
	
	self.push();
	self.push();
	self.reg_Set_real("x", depr);
	self.reg_Set_real("y", rest);
	self.display_result();
};

Hp12c_machine.prototype.depreciation_db = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		self.algebra = [];
		self.display_parentheses();
	}

	var cost = self.finmemory[H.FIN_PV];
	var sell = self.finmemory[H.FIN_FV];
	var life = self.finmemory[H.FIN_N];
	var year = self.reg_real("x");
	var db = self.finmemory[H.FIN_I] / 100;

	var res = H.depreciation_db(cost, sell, life, year, db);
	var err = res[0];
	var depr = res[1];
	var rest = res[2];

	if (err >= 0) {
		self.display_error(err);
		return;
	}

	self.push();
	self.push();
	self.reg_Set_real("x", depr);
	self.reg_Set_real("y", rest);
	self.display_result();
};

Hp12c_machine.prototype.percentT = function ()
{
	var self = this;

	if (! self.alg_resolve(1)) {
		return;
	}

	var res = 100 * self.reg_real("x") / self.reg_real("y");
	if (H.badnumber(res)) {
		self.display_error(H.ERROR_DIVZERO);
	} else {
		self.save_lastx();
		self.reg_Set_real("x", res);
		self.display_result();
	}
};

Hp12c_machine.prototype.bs_rho = function ()
{
	var self = this;

	var bsdata = self.finmemory.slice();
	var res = H.bs_rho(bsdata);
	var err = res[0];
	var c = res[1];
	var p = res[2];

	if (err) {
		self.display_error(H.ERROR_DIVZERO);
		return;
	}

	self.push();
	self.push();
	self.reg_Set_real("x", c);
	self.reg_Set_real("y", p);
	self.display_result();
};

Hp12c_machine.prototype.bs_theta = function ()
{
	var self = this;

	var bsdata = self.finmemory.slice();
	var res = H.bs_theta(bsdata);
	var err = res[0];
	var c = res[1];
	var p = res[2];

	if (err) {
		self.display_error(H.ERROR_DIVZERO);
		return;
	}

	self.push();
	self.push();
	self.reg_Set_real("x", c);
	self.reg_Set_real("y", p);
	self.display_result();
};

Hp12c_machine.prototype.bs_delta = function ()
{
	var self = this;

	var bsdata = self.finmemory.slice();
	var res = H.bs_delta(bsdata);
	var err = res[0];
	var c = res[1];
	var p = res[2];

	if (err) {
		self.display_error(H.ERROR_DIVZERO);
		return;
	}

	self.push();
	self.push();
	self.reg_Set_real("x", c);
	self.reg_Set_real("y", p);
	self.display_result();
};

Hp12c_machine.prototype.bs_vega = function ()
{
	var self = this;

	var bsdata = self.finmemory.slice();
	var res = H.bs_vega(bsdata);
	var err = res[0];
	var c = res[1];
	var p = res[2];

	if (err) {
		self.display_error(H.ERROR_DIVZERO);
		return;
	}

	self.push();
	self.push();
	self.reg_Set_real("x", c);
	self.reg_Set_real("y", p);
	self.display_result();
};

Hp12c_machine.prototype.bs_gamma = function ()
{
	var self = this;

	var bsdata = self.finmemory.slice();
	var res = H.bs_gamma(bsdata);
	var err = res[0];
	var c = res[1];
	var p = res[2];

	if (err) {
		self.display_error(H.ERROR_DIVZERO);
		return;
	}

	self.push();
	self.push();
	self.reg_Set_real("x", c);
	self.reg_Set_real("y", p);
	self.display_result();
};

Hp12c_machine.prototype.bs_premium = function ()
{
	var self = this;

	var bsdata = self.finmemory.slice();
	var res = H.bs_premium(bsdata);
	var err = res[0];
	var c = res[1];
	var p = res[2];

	if (err) {
		self.display_error(H.ERROR_DIVZERO);
		return;
	}

	self.push();
	self.push();
	self.reg_Set_real("x", c);
	self.reg_Set_real("y", p);
	self.display_result();
};

Hp12c_machine.prototype.bs_d1 = function ()
{
	var self = this;

	var bsdata = self.finmemory.slice();
	var res = H.bs_d1(bsdata);
	var err = res[0];
	var c = res[1];

	if (err) {
		self.display_error(H.ERROR_DIVZERO);
		return;
	}

	self.push();
	self.reg_Set_real("x", c);
	self.display_result();
};

Hp12c_machine.prototype.bs_d2 = function ()
{
	var self = this;

	var bsdata = self.finmemory.slice();
	var res = H.bs_d2(bsdata);
	var err = res[0];
	var c = res[1];

	if (err) {
		self.display_error(H.ERROR_DIVZERO);
		return;
	}

	self.push();
	self.reg_Set_real("x", c);
	self.display_result();
};

Hp12c_machine.prototype.bs_normal = function ()
{
	var self = this;

	var res = H.bs_normal(self.reg_real("x"));
	self.save_lastx();
	self.reg_Set_real("x", res);
	self.display_result();
};

Hp12c_machine.prototype.bs_implvolC = function ()
{
	var self = this;

	var bsdata = self.finmemory.slice();
	var res = H.bs_implvolC(bsdata, self.reg_real("x"));
	var err = res[0];
	var c = res[1];

	if (err) {
		self.display_error(H.ERROR_DIVZERO);
		return;
	}

	self.save_lastx();
	self.reg_Set_real("x", c);
	self.display_result();
};

Hp12c_machine.prototype.bs_implvolP = function ()
{
	var self = this;

	var bsdata = self.finmemory.slice();
	var res = H.bs_implvolP(bsdata, self.reg_real("x"));
	var err = res[0];
	var c = res[1];

	if (err) {
		self.display_error(H.ERROR_DIVZERO);
		return;
	}

	self.save_lastx();
	self.reg_Set_real("x", c);
	self.display_result();
};

Hp12c_machine.prototype.bs_cumul = function ()
{
	var self = this;

	var res = H.bs_cumul(self.reg_real("x"));
	self.save_lastx();
	self.reg_Set_real("x", res);
	self.display_result();
};

Hp12c_machine.prototype.bs_252div = function ()
{
	var self = this;

	var res = self.reg_real("x") / 252;
	self.reg_Set_real("x", res);
	self.stofin(0);
};

Hp12c_machine.prototype.bs_365div = function ()
{
	var self = this;

	var res = self.reg_real("x") / 365;
	self.reg_Set_real("x", res);
	self.stofin(0);
};

Hp12c_machine.prototype.bs_dys252 = function ()
{
	var self = this;

	var d2 = H.date_interpret(self.reg_real("x"), self.dmy);
	var d1 = H.date_interpret(self.reg_real("y"), self.dmy);
	if ((d1 === null) || (d2 === null)) {
		self.display_error(H.ERROR_DATE);
		return;
	}

	// does not eat Y to keep 'compatibility' with DYS
	self.save_lastx();
	self.reg_Set_real("x", H.date_diff252(d1, d2));
	self.display_result();
};
/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*jshint globalstrict: true*/
/*global H, Hp12c_dispatcher */

"use strict";

function Hp12c_dispatcher()
{
}

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*jshint globalstrict: true*/
/*global H, Hp12c_dispatcher */

"use strict";

// overridden by 12C and 16C flavors
Hp12c_dispatcher.prototype.handle_modifier = function (key, pgrm_mode, exec_mode)
{
	var modifier_table = this.modifier_sm[key];
	var f = this.find_function(key, 0, 1, exec_mode);

	if (H.type !== "15c") {
		if (H.machine.modifier == H.STO_FF || H.machine.modifier == H.RCL_FF) {
			// this is always final, no modifier here
			return false;
		}
	}

	if (modifier_table) {
		var next_modifier = modifier_table[H.machine.modifier];
		if (next_modifier) {
			// a modifier potentialized by a previous one
			H.machine.set_modifier(next_modifier);
			return true;
		} else if (modifier_table[0] && !f) {
			// a modifier of its own right, like f, g
			H.machine.set_modifier(modifier_table[0]);
			return true;
		}
	}

	return false;
};

// overridden by 12C and 16C flavors
Hp12c_dispatcher.prototype.find_function = function (key, pgrm_mode, query, exec_mode)
{
	var function_table = this.functions[key];
	var f = null;

	if (!function_table) {
		return null;
	}

	f = function_table[H.machine.modifier];

	if (f) {
		if (f.reducible) {
			// Handle cases like STO PLUS f I, STO f I
			// make opcode like STO I and STO PLUS I
			H.machine.set_modifier(f.reduced_modifier);
			f = function_table[H.machine.modifier];
		}
	}

	if (!f) {
		// no function given current modifier
		if (query === 1) {
			return null;
		}

		if (H.machine.modifier == H.STO_FF ||
				H.machine.modifier == H.RCL_FF ||
				H.machine.modifier == H.STO_PLUS_FF ||
				H.machine.modifier == H.STO_MINUS_FF ||
				H.machine.modifier == H.STO_TIMES_FF ||
				H.machine.modifier == H.STO_DIVIDE_FF) {
			// give a chance to plain F
			f = function_table[H.FF];
			if (f && query === 0) {
				H.machine.set_modifier(H.FF);
			}
		}
	}

	if (!f) {
		// try plain key without any modifier
		f = function_table[0];
		if (f && query === 0) {
			H.machine.rst_modifier(1);
		}
	}

	if (pgrm_mode && f && f.no_pgrm) {
		// this function can not be programmed; revoked
		f = null;
	}

	return f;
};

// Used by all flavors
Hp12c_dispatcher.prototype.dispatch_basic = function (key)
{
	var self = this;

	// 'special' keys that do not belong to calculator itself
	if (key == 99) {
		H.debug.show_memory();
		return true;
	} else if (key === 200) {
		self.lcd_left();
		return true;
	} else if (key === 201) {
		self.lcd_right();
		return true;
	}

	if (H.machine.program_mode === H.RUNNING_STEP_PRE) {
		H.pgrm.run_step_finish();
		return true;
	} else if (H.machine.modal() > 0) {
		H.machine.reset_modal();
		return true;
	} else if (H.machine.program_mode >= H.RUNNING) {
		H.pgrm.stop(1);
		return true;
	}

	return false;
};

// overridden by 12C and 16C flavors
Hp12c_dispatcher.prototype.dispatch = function (key)
{
	if (this.dispatch_basic(key)) {
		return;
	}

	// Determine key function early, because we need that in USER logic
	var f_mod = this.find_function(key, 0, 1, false);
	var f = f_mod;
	var tmp = H.machine.modifier;

	if (!f) {
		H.machine.modifier = 0;
		f = this.find_function(key, 0, 1, false);
		H.machine.modifier = tmp;
	}

	// USER logic - may change modifier
	if (key >= 11 && key <= 15) {
		if (H.machine.user) {
			if (H.machine.modifier == H.FF) {
				// USER + f = natural
				H.machine.modifier = 0;
			} else if (H.machine.modifier == H.STO_FF ||
					H.machine.modifier == H.RCL_FF ||
					H.machine.modifier == H.STO_PLUS_FF ||
					H.machine.modifier == H.STO_MINUS_FF ||
					H.machine.modifier == H.STO_TIMES_FF ||
					H.machine.modifier == H.STO_DIVIDE_FF) {
				// USER + f = natural
				H.machine.modifier = 0;
			} else if (H.machine.modifier === 0) {
				// USER + no modifier = f
				H.machine.modifier = H.FF;
			} else if (! f_mod) {
				// USER + invalid modifier -> f
				H.machine.modifier = H.FF;
			}
			// GSB [A-F] and GTO [A-F] not affected because
			// GSB and GTO are modifiers different from the ones
			// handled above.
		} else {
			// natural course
		}
	}

	// Programming mode?

	if (H.machine.program_mode == H.PROGRAMMING) {
		H.pgrm.type(key);
		return;
	}

	this.dispatch_common(key, false);
};

// overridden by 12C and 16C flavors
Hp12c_dispatcher.prototype.dispatch_common = function (key, in_exec)
{
	var ok = 1;

	if (this.handle_modifier(key, 0, in_exec)) {
		return ok;
	}

	// key is not modifier in this context, try a function

	var f = this.find_function(key, 0, 0, in_exec);

	if (!f) {
		// no-op
		f = function () { };
		ok = false;
	}

	var rst_modifier = 1;

	if (f.dont_rst_modifier) {
		rst_modifier = 0;
	}

	f();

	if (rst_modifier) {
		H.machine.rst_modifier(1);
	}

	return ok;
};

// overridden when touching LCD is to have some collateral effect
Hp12c_dispatcher.prototype.lcd_left = function ()
{
	window.xlog("LCD left side touched");
};

// overridden when touching LCD is to have some collateral effect
Hp12c_dispatcher.prototype.lcd_right = function ()
{
	window.xlog("LCD right side touched");
};
/* HP-12C emulator 
 * Copyright (c) 2007, 2011, 2016 Elvis Pfutzenreuter - epxx.co.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H, Hp12c_machine, Hp12c_dispatcher */
/*jshint globalstrict: true*/

"use strict";

// aliases to function and modifier arrays;
var K = [];
var M = [];
var I;

Hp12c_dispatcher.prototype.functions = K;
Hp12c_dispatcher.prototype.modifier_sm = M;

Hp12c_dispatcher.prototype.KEY_RS = 31;
Hp12c_dispatcher.prototype.KEY_SST = 32;
Hp12c_dispatcher.prototype.KEY_RDOWN = 33;
H.FF = Hp12c_dispatcher.prototype.KEY_FF = 42;
H.GG = Hp12c_dispatcher.prototype.KEY_GG  = 43;
H.STO = Hp12c_dispatcher.prototype.KEY_STO = 44;
H.RCL = Hp12c_dispatcher.prototype.KEY_RCL = 45;
Hp12c_dispatcher.prototype.KEY_DECIMAL = 48;
Hp12c_dispatcher.prototype.KEY_PLUS = 40;
Hp12c_dispatcher.prototype.KEY_MINUS = 30;
Hp12c_dispatcher.prototype.KEY_MULTIPLY = 20;
Hp12c_dispatcher.prototype.KEY_DIVIDE = 10;
Hp12c_dispatcher.prototype.KEY_BACKSPACE = 98;
H.STO2 = H.STO * 100 + 48;
H.RCL2 = H.RCL * 100 + 48;
H.RCL_GG = H.RCL * 100 + H.GG;
H.STO_PLUS = H.STO * 100 + 40;
H.STO_MINUS = H.STO * 100 + 30;
H.STO_TIMES = H.STO * 100 + 20;
H.STO_DIVIDE = H.STO * 100 + 10;
H.GTO = H.GG * 100 + 33;
// program typing mode only
H.GTO_MOVE = H.GTO * 100 + 48;
// does not exist in 12c
H.HYP = H.HYPINV = H.LBL = H.GSB = H.FIX = H.SCI = H.ENG = H.STO_F = 99999999;

Hp12c_dispatcher.init_vars = function () {
	var Keys = [11, 12, 13, 14, 15, 16, 7, 8, 9, 10,
	    	    21, 22, 23, 24, 25, 26, 4, 5, 6, 20,
	    	    31, 32, 33, 34, 35, 36, 1, 2,  3, 30,
	    	    41, 42, 43, 44, 45, 0, 48, 49, 40,
	    	    98];

	var Modifiers = [H.FF, H.GG, H.STO, H.RCL, 48, 10, 20, 30, 40, 33];

	var i;

	for (i = 0; i < Keys.length; i++) {
		K[Keys[i]] = [];
	}

	for (i = 0; i < Modifiers.length; i++) {
		M[Modifiers[i]] = [];
	}
};

Hp12c_dispatcher.init_vars();

I = 11;

K[I][H.FF] = H.make_closure("amortization", [], "AMORT");
K[I][H.GG] = H.make_closure("ston_12x", [], "n 12x");
K[I][H.GG].dont_rst_do_fincalc = 1;
K[I][H.RCL] = H.make_closure("rclfin", [0], "RCL n");
K[I][H.RCL_GG] = H.make_closure("rclfin", [0, 1], "RCL 12x n");
K[I][H.STO] = H.make_closure("stofin", [0], "STO n");
K[I][H.STO].dont_rst_do_fincalc = 1;
K[I][0] = H.make_closure("sto_or_calc_fin", [0], "n");
K[I][0].dont_rst_do_fincalc = 1;

I = 12;

K[I][H.FF] = H.make_closure("simple_interest", [], "INT");
K[I][H.GG] = H.make_closure("stoi_12div", [], "i 12/");
K[I][H.GG].dont_rst_do_fincalc = 1;
K[I][H.RCL] = H.make_closure("rclfin", [1], "RCL i");
K[I][H.RCL_GG] = H.make_closure("rclfin", [1, 1], "RCL 12/ i");
K[I][H.STO] = H.make_closure("stofin", [1], "STO i");
K[I][H.STO].dont_rst_do_fincalc = 1;
K[I][0] = H.make_closure("sto_or_calc_fin", [1], "i");
K[I][0].dont_rst_do_fincalc = 1;

I = 13;

K[I][H.FF] = H.make_closure("npv", [], "NPV");
K[I][H.GG] = H.make_closure("stoCF0", [], "CF0");
K[I][H.RCL] = H.make_closure("rclfin", [2], "RCL PV");
K[I][H.STO] = H.make_closure("stofin", [2], "STO PV");
K[I][H.STO].dont_rst_do_fincalc = 1;
K[I][0] = H.make_closure("sto_or_calc_fin", [2], "PV");
K[I][0].dont_rst_do_fincalc = 1;

I = 14;

K[I][H.FF] = H.make_closure("rnd", [], "RND");
K[I][H.GG] = H.make_closure("stoCFj", [], "CFj");
K[I][H.RCL] = H.make_closure("rclfin", [3], "RCL PMT");
K[I][H.RCL_GG] = H.make_closure("rclCFj", [], "RCL CFj");
K[I][H.STO] = H.make_closure("stofin", [3], "STO PMT");
K[I][H.STO].dont_rst_do_fincalc = 1;
K[I][0] = H.make_closure("sto_or_calc_fin", [3], "PMT");
K[I][0].dont_rst_do_fincalc = 1;

I = 15;

K[I][H.FF] = H.make_closure("irr", [], "IRR");
K[I][H.GG] = H.make_closure("stoNj", [], "Nj");
K[I][H.RCL_GG] = H.make_closure("rclNj", [], "RCL Nj");
K[I][H.RCL] = H.make_closure("rclfin", [4], "RCL FV");
K[I][H.STO] = H.make_closure("stofin", [4], "STO FV");
K[I][H.STO].dont_rst_do_fincalc = 1;
K[I][0] = H.make_closure("sto_or_calc_fin", [4], "FV");
K[I][0].dont_rst_do_fincalc = 1;

I = 16;

if (H.type == "12c-platinum") {
	K[I][H.FF] = H.make_closure("rpn_mode", [], "RPN");
} else if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_rho", [], "BS RHO");
}

K[I][H.GG] = H.make_closure("date_date", [], "DATE");
K[I][0] = H.make_closure("chs", [], "CHS");

for (I = 0; I <= 9; ++I) {
	var SI = I.toString(16);

	// adds all functions that are commond to all digits
	K[I][H.FF] = H.make_closure("set_decimals", [I, H.NOTATION_FIX], "FIX " + SI);
	K[I][H.RCL] = H.make_closure("rcl", [I], "RCL " + SI);
	K[I][H.RCL2] = H.make_closure("rcl", [I + 10], "RCL . " + SI);
	K[I][H.STO] = H.make_closure("sto", [I], "STO " + SI);
	K[I][H.STO2] = H.make_closure("sto", [I + 10], "STO . " + SI);
	K[I][H.STO_PLUS] = H.make_closure("stoinfix", [I, H.STO_PLUS], "STO + " + SI);
	K[I][H.STO_MINUS] = H.make_closure("stoinfix", [I, H.STO_MINUS], "STO - " + SI);
	K[I][H.STO_TIMES] = H.make_closure("stoinfix", [I, H.STO_TIMES], "STO x " + SI);
	K[I][H.STO_DIVIDE] = H.make_closure("stoinfix", [I, H.STO_DIVIDE], "STO / " + SI);
	K[I][H.GTO] = H.make_closure("gto_digit_add", [I], "GTO DIGIT ADD " + I);
	K[I][H.GTO].dont_rst_modifier = 1;
	K[I][0] = H.make_closure("digit_add", [I], "" + SI);
}

I = 7;

K[I][H.GG] = H.make_closure("set_begin", [1], "BEGIN");
K[I][H.GG].dont_rst_do_fincalc = 1;

I = 8;

K[I][H.GG] = H.make_closure("set_begin", [0], "END");
K[I][H.GG].dont_rst_do_fincalc = 1;

I = 9;

K[I][H.GG] = H.make_closure("mem_info", [], "MEM");
K[I][H.GG].no_pgrm = 1;

I = 10;

K[I][0] = H.make_closure("divide", [], "/");
M[I][H.STO] = H.STO_DIVIDE;
if (H.type == "12c-platinum") {
	K[I][H.GG] = H.make_closure("platinum_undo", [], "UNDO");
} else if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_252div", [], "n 252/");
	K[I][H.GG] = H.make_closure("bs_365div", [], "n 365/");
}

I = 21;

if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_premium", [], "BS PREMIUM");
} else {
	K[I][H.FF] = H.make_closure("bond_price", [], "PRICE");
}
K[I][H.GG] = H.make_closure("sqroot", [], "SQRT");
K[I][0] = H.make_closure("poweryx", [], "POWER");

I = 22;

if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_theta", [], "BS THETA");
} else {
	K[I][H.FF] = H.make_closure("bond_yield", [], "YTM");
}
K[I][H.GG] = H.make_closure("exp", [], "EXP");
K[I][0] = H.make_closure("reciprocal", [], "1/X");

I = 23;

if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_gamma", [], "BS GAMMA");
	K[I][H.RCL_GG] = H.make_closure("ln_imag", [], "LN IMAG");
} else {
	K[I][H.FF] = H.make_closure("depreciation_sl", [], "DEPR SL");
}
K[I][H.GG] = H.make_closure("ln", [], "LN");
K[I][0] = H.make_closure("percentT", [], "%T");

I = 24;

if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_delta", [], "BS DELTA");
} else {
	K[I][H.FF] = H.make_closure("depreciation_soyd", [], "DEPR SOYD");
}
K[I][H.GG] = H.make_closure("frac", [], "FRAC");
K[I][0] = H.make_closure("deltapercent", [], "D%");

I = 25;

if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_vega", [], "BS VEGA");
} else {
	K[I][H.FF] = H.make_closure("depreciation_db", [], "DEPR DB");
}
K[I][H.GG] = H.make_closure("intg", [], "INTG");
K[I][0] = H.make_closure("percent", [], "%");

I = 26;

if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_dys252", [], "DYS252");
}
K[I][H.GG] = H.make_closure("date_dys", [], "DYS");
K[I][H.STO] = H.make_closure("toggle_compoundf", [], "STOEEX");
K[I][0] = H.make_closure("input_exponential", [], "EEX");

if (H.type == "12c-platinum") {
	K[I][H.FF] = H.make_closure("algebraic_mode", [], "ALG");
}

I = 4;

K[I][H.GG] = H.make_closure("set_dmy", [1], "D.MY");

I = 5;

K[I][H.GG] = H.make_closure("set_dmy", [0], "M.DY");

I = 6;

K[I][H.GG] = H.make_closure("stat_avgw", [], "STAT AVGW");

I = 20;

if (H.type == "12c-platinum") {
	K[I][H.GG] = H.make_closure("square", [], "SQUARE");
} else if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_d1", [], "BS d1");
	K[I][H.GG] = H.make_closure("bs_d2", [], "BS d2");
}
K[I][0] = H.make_closure("multiply", [], "x");
M[I][H.STO] = H.STO_TIMES;

I = 31;

K[I][H.GG] = H.make_closure("pse", [], "PSE");
K[I][H.FF] = H.make_closure("prog_pr", [], "P/R");
K[I][0] = H.make_pgrm_closure("rs", [], "R/S");

I = 32;

K[I][H.FF] = H.make_closure("clear_statistics", [], "CLEAR STAT");
K[I][H.GG] = H.make_pgrm_closure("bst", [], "BST");
K[I][0] = H.make_pgrm_closure("sst", [], "SST");

I = 33;

K[I][H.FF] = H.make_closure("clear_prog", [0], "CLEAR PROG");
K[I][0] = H.make_closure("r_down", [], "Rv");
M[I][H.GG] = H.GTO;

I = 34;

K[I][H.FF] = H.make_closure("clear_fin", [], "CLEAR FIN");
K[I][H.GG] = H.make_closure("test_x_le_y", [], "x<=y");
K[I][0] = H.make_closure("x_exchange_y", [], "X<->Y");

I = 35;

K[I][H.FF] = H.make_closure("clear_reg", [], "CLEAR REG");
K[I][H.GG] = H.make_closure("test_x_eq0", [], "x=0");
K[I][0] = H.make_closure("clx", [], "CLx");

I = 36;

K[I][H.FF] = H.make_closure("clear_prefix", [], "CLEAR PREFIX");
K[I][H.FF].no_pgrm = 1;

if (H.type == "12c-platinum") {
	K[I][H.GG] = H.make_closure("enter", [1], "g ENTER");
} else {
	K[I][H.GG] = H.make_closure("lstx", [], "LSTx");
}

K[I][0] = H.make_closure("enter", [0], "ENTER");

I = 1;

K[I][H.GG] = H.make_closure("stat_lr", [1], "STAT LR X");

I = 2;

K[I][H.GG] = H.make_closure("stat_lr", [0], "STAT LR Y");

I = 3;

K[I][H.GG] = H.make_closure("fatorial", [], "n!");

I = 30;

K[I][0] = H.make_closure("minus", [], "-");
K[I][H.GG] = H.make_closure("digit_delete", [], "BSP PLATINUM");
K[I][H.GG].no_pgrm = 1;
if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_normal", [], "BS NORMAL");
}
M[I][H.STO] = H.STO_MINUS;

I = 41;

K[I][0] = H.make_closure("toggle_decimal_character", [], "ON");
K[I][0].no_pgrm = 1;
K[I][H.RCL] = H.make_closure("shv", [], "SHV");
K[I][H.RCL].no_pgrm = 1;
K[I][H.RCL_GG] = H.make_closure("test_offsets", [], "TEST OFFSETS");
K[I][H.RCL_GG].no_pgrm = 1;
K[I][H.STO] = H.make_closure("apocryphal", [1], "APOCRYPHAL 1");
K[I][H.STO].no_pgrm = 1;

I = 42;

M[I][0] = H.FF;

I = 43;

M[I][0] = H.GG;
M[I][H.RCL] = H.RCL_GG;

I = 44;

M[I][0] = H.STO;
if (H.type == "12c-platinum") {
	K[I][H.GG] = H.make_closure("algebraic_open_parentheses", [], "(");
}


I = 45;

M[I][0] = H.RCL;
if (H.type == "12c-platinum") {
	K[I][H.GG] = H.make_closure("algebraic_close_parentheses", [], ")");
}

I = 0;

K[I][H.GG] = H.make_closure("stat_avg", [], "STAT AVG");

I = 48;

K[I][H.FF] = H.make_closure("set_decimals_exponential", [], "FIX .");
K[I][H.GG] = H.make_closure("stat_stddev", [], "STAT STDDEV");
K[I][H.GTO] = H.make_closure("gto_buf_clear", [], "GTO BUF CLR");
K[I][0] = H.make_closure("decimal_point_mode", [], ".");
M[I][H.STO] = H.STO2;
M[I][H.RCL] = H.RCL2;

I = 49;

K[I][H.GG] = H.make_closure("stat_sigma_minus", [], "STAT S-");
K[I][0] = H.make_closure("stat_sigma_plus", [], "STAT S+");
if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_implvolC", [], "BS IMPL C");
}

I = 40;

if (H.type == "12c-platinum") {
	K[I][H.GG] = H.make_closure("lstx", [], "LSTx");
} else if (H.type === "12c-bs") {
	K[I][H.FF] = H.make_closure("bs_implvolP", [], "BS IMPL P");
	K[I][H.GG] = H.make_closure("bs_cumul", [], "BS CUMUL");
}
K[I][0] = H.make_closure("plus", [], "+");
M[I][H.STO] = H.STO_PLUS;
K[I][H.RCL_GG] = H.make_closure("toggle_feedback", [], "TOGGLE FEEDBACK");
K[I][H.RCL_GG].no_pgrm = 1;

I = 98;

K[I][0] = H.make_closure("digit_delete", [], "BSP");
K[I][0].no_pgrm = 1;


Hp12c_dispatcher.prototype.handle_modifier = function (key, pgrm_mode)
{
	var modifier_table = this.modifier_sm[key];
	var f = this.find_function(key, 0, 1);

	if (modifier_table) {
		var next_modifier = modifier_table[H.machine.modifier];
		if (next_modifier) {
			// a modifier potentialized by a previous one
			H.machine.set_modifier(next_modifier);
			return true;
		} else if (modifier_table[0] && !f) {
			// a modifier of its own right, like f, g
			H.machine.set_modifier(modifier_table[0]);
			return true;
		}
	}

	return false;
};

Hp12c_dispatcher.prototype.find_function = function (key, pgrm_mode, query)
{
	var function_table = this.functions[key];
	var f = null;

	if (function_table) {
		f = function_table[H.machine.modifier];
		if (!f) {
			// no function given current modifier
			f = function_table[0];
			if (f && ! query) {
				// function without modifier
				H.machine.rst_modifier(1);
			}
		}
	}

	if (pgrm_mode && f && f.no_pgrm) {
		// this function can not be programmed; revoked
		f = null;
	}

	return f;
};

Hp12c_dispatcher.prototype.dispatch = function (key)
{
	if (this.dispatch_basic(key)) {
		return;
	} else if (H.machine.program_mode == H.PROGRAMMING) {
		H.pgrm.type(key);
		return;
	}

	this.dispatch_common(key);
};

Hp12c_dispatcher.prototype.dispatch_common = function (key)
{
	// this is used both by real keys and program scheduler

	var ok = 1;

	if (this.handle_modifier(key, 0)) {
		return ok;
	}

	// key is not modifier in this context, try a function

	var f = this.find_function(key, 0, 0);

	if (!f) {
		f = function () {
			// no-op
		};
		ok = false;
	}

	var rst_modifier = 1;
	var rst_do_fincalc = 1;

	if (f.dont_rst_do_fincalc) {
		rst_do_fincalc = 0;
	}
	if (f.dont_rst_modifier) {
		rst_modifier = 0;
	}

	f();

	if (rst_modifier) {
		H.machine.rst_modifier(rst_do_fincalc);
	}

	return ok;
};

// remove from scope
M = undefined;
K = undefined;
I = undefined;
H.asm_reverse_map = null;
H.asm_ucode_reverse_map = null;

H.asm_make_reverse_map = function ()
{
	var map = {};
	var umap = {};
	H.asm_reverse_map = map;
	H.asm_ucode_reverse_map = umap;

	var K = Hp12c_dispatcher.prototype.functions;

	// pure modifier keys, with no K[key][0]
	umap.FF = 42;
	umap.STO = 44;
	umap.RCL = 45;
	if (H.type === "16c") {
		umap.GG = 43;
		umap.GSB = 21;
		umap.LBL = 22;
		umap.GTO = 22;
	} else if (H.type === "10c") {
		umap.GTO = 22;
	} else if (H.type === "11c" || H.type === "15c") {
		umap.GG = 43;
		umap.GTO = 22;
		umap.GSB = 32;
		umap.LBL = 21;
		umap.DIM = 23;
		umap.MATRIX = 16;
		umap.A = 11;
		umap.B = 12;
		umap.C = 13;
		umap.D = 14;
		umap.E = 15;
	} else { // 12c
		umap.GG = 43;
		umap.GTO = 33;
	}

	for (var key in K) {
		if (K.hasOwnProperty(key)) {
			for (var modifier in K[key]) {
				if (K[key].hasOwnProperty(modifier)) {
					var closure = K[key][modifier];
					if (! closure.asm) {
						continue;
					}
					var imodifier = modifier;
					var ikey = key;
					if (closure.reducible) {
						if (imodifier >= 10000) {
							// 11C, 15C: this key sequence cannot
							// be translated to an opcode, since it
							// is reduced before goes to RAM
							continue;
						}
					}
					
					var is_addr = false;
					var mnemonic = closure.asm.toUpperCase();
					var opcode = Hp12c_pgrm.p_encode_instruction(parseInt(imodifier, 10),
											parseInt(ikey, 10),
											is_addr);
					if (map[mnemonic]) {
						throw "Mnemonic already exists: " + mnemonic +
							" existing code " + map[mnemonic] + " " +
							" other code " + opcode;
					}
					map[mnemonic] = opcode;
					// iterating over K yields string keys
					umap[mnemonic] = parseInt(key, 10);
				}
			}
		}
	}

	window.xlog("Making asm done");
};

H.asm_condition = function (s)
{
	s = H.trim(s).toUpperCase();
	return s.replace(/\s{2,}/g, ' ');
};

H.asm_gto12 = function (s) 
{
	var regex_gto12 = new RegExp('^GTO [0-9]+$');

	if (! regex_gto12.test(s)) {
		return null;
	}

	var ip = 0 + s.substr(4);
	if (ip >= H.ram_MAX) {
		window.xlog("IP too high: " + s);
		return null;
	}

	// TODO 4333 should come from dispatch
	return Hp12c_pgrm.p_encode_instruction(parseInt(4333, 10),
						parseInt(ip, 10),
						true);
};

H.asm_gto10 = function (s) 
{
	var regex_gto10 = new RegExp('^GTO [0-9]+$');

	if (! regex_gto10.test(s)) {
		return null;
	}

	var ip = 0 + s.substr(4);
	if (ip >= H.ram_MAX) {
		window.xlog("IP too high: " + s);
		return null;
	}

	// TODO 22 should come from dispatch
	return Hp12c_pgrm.p_encode_instruction(parseInt(22, 10),
						parseInt(ip, 10),
						true);
};

H.asm = function (instr, query)
{
	if (! H.asm_reverse_map) {
		H.asm_make_reverse_map();
	}

	var map = H.asm_reverse_map;

	var c12 = H.is_12c();
	var c10 = H.type === "10c";

	instr = H.asm_condition(instr);
	var opcode = null;

	if (map[instr]) {
		opcode = map[instr];
	} else if (c12 && H.asm_gto12(instr)) {
		opcode = H.asm_gto12(instr);
	} else if (c10 && H.asm_gto10(instr)) {
		opcode = H.asm_gto10(instr);
	} else {
		if (! query) {
			throw "asm: Invalid instruction: " + instr;
		}
	}

	return opcode;
};

H.asm_microcode = function (ucodename, query)
{
	if (! H.asm_reverse_map) {
		H.asm_make_reverse_map();
	}

	ucodename = H.asm_condition(ucodename);

	if (H.asm_ucode_reverse_map[ucodename] === undefined ||
			H.asm_ucode_reverse_map[ucodename] === null) {
		if (! query) {
			throw ">>>> Invalid microcode " + ucodename;
		}
		return null;
	}

	return H.asm_ucode_reverse_map[ucodename];
};

H.asm_expand = function (progr)
{
	var result = [];
	var regex_number = new RegExp('^[0-9.]+$');

	for (var i = 0; i < progr.length; ++i) {
		var instr = progr[i];
		if (H.asm(instr, true)) {
			result.push(instr);
		} else if (regex_number.test(instr)) {
			for (var j = 0; j < instr.length; ++j) {
				result.push(instr.charAt(j));
			}
		} else {
			result.push(instr);
		}
	}

	return result;
};

H.asm_microcode_expand = function (progr)
{
	var result = [];
	var regex_number = new RegExp('^[0-9.]+$');

	for (var i = 0; i < progr.length; ++i) {
		var instr = progr[i];
		if (instr === null) {
			// skip
		} else if (H.asm_microcode(instr, true)) {
			result.push(instr);
		} else if (regex_number.test(instr)) {
			for (var j = 0; j < instr.length; ++j) {
				result.push(instr.charAt(j));
			}
		} else {
			result.push(instr);
		}
	}

	return result;
};

H.asm_compile = function (progr, base_addr)
{
	progr = H.asm_expand(progr);

	for (var i = 0; i < progr.length; ++i) {
		H.machine.ram[base_addr + i + 1] = H.asm(progr[i]);
	}

	return progr.length;
};

H.asm_microcode_exec = function (microcode, monitor)
{
	for (var i = 0; i < microcode.length; ++i) {
		window.xlog("> Typed " + microcode[i]);
		H.dispatcher.dispatch(microcode[i]);
		if (monitor) {
			monitor(i);
		}
	}
};

/*
Assembly = whole instructions
Microcode = actual keystrokes
Example:
	"STO 0" is an assembly instruction
	It compiles to opcode "44.00"
	Microcode/keystrokes would be [44, 00].
Microcode is useful to simulate program typing, among
other things.
*/
H.asm_microcode_compile = function (microprogram)
{
	microprogram = H.asm_microcode_expand(microprogram);
	var microcode = [];

	for (var i = 0; i < microprogram.length; ++i) {
		microcode[i] = H.asm_microcode(microprogram[i]);
	}

	return microcode;
};
/* HP-12C emulator 
 * Copyright (c) 2007, 2011, 2016 Elvis Pfutzenreuter - epxx.co.
 * All rights reserved.
 */

/*jshint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: false */
/*jshint globalstrict: true*/
/*global H */

"use strict";

H.INTERPOLATION_MAX = 100;

H.solve_infinity = function (val)
{
	if (val > 1e95) {
		val = 1e95;
	} else if (val < -1e95) {
		val = -1e95;
	}
	return val;
};

// better pow() for bases in the form 1 + i when i is small
// base is actually (1 + base_m1)
H.finance_pow = function (base_m1, exponent)
{
	if (Math.abs(base_m1) > 0.000001) {
		return Math.pow(1 + base_m1, exponent);
	}
	// pow(b, e) = exp(e * ln(b))
	// use the fact ln(1+x) ~= x for x very near 1
	// pow(B + 1, e) = exp(e * B)
	// use a small Taylor series
	// idea from http://colorfulengineering.org/logmath-notes.pdf
	// In the future, when all Javascript engines support log1p(),
	// we can replace this by log1p()
	var log_m1 = (-0.5 * base_m1 + 1.0) * base_m1;
	return Math.exp(exponent * log_m1);
};

H.npv = function (n, i, cfj, nj)
{
	var res = cfj[0];
	var pmt = 0;
	for (var e = 1; e <= n; ++e) {
		var cf = cfj[e];
		for (var f = 1; f <= nj[e]; ++f) {
			++pmt;
			res += cf / H.finance_pow(i / 100, pmt);
		}
	}
	return res;
};

H.npv_quality = function (n, cfj, nj)
{
	var sgn = 0;

	if (cfj[0] > 0) {
		sgn = 1;
	} else if (cfj[0] < 0) {
		sgn = -1;
	}
	
	for (var e = 1; e <= n; ++e) {
		if (nj[e] !== 0) {
			var newsgn = 0;
			if (cfj[e] > 0) {
				newsgn = 1;
			} else if (cfj[e] < 0) {
				newsgn = -1;
			}
			if (newsgn !== 0) {
				if (sgn !== 0) {
					if (newsgn !== sgn) {
						// signal inversion, exit with sucess
						return +1;
					}
				}
				sgn = newsgn;
			}
		}
	}

	// no signal inversions, or all-zeros
	return (sgn === 0) ? 0 : -1;
};

H.comppmtlim = function (i, n)
{
	if (Math.abs(i) < 0.0000000001) {
		return n;
	} else {
		return (1 - H.finance_pow(i / 100, -n)) / (i / 100);
	}
};

H.calcNPV = function (is_n, n, i, pv, pmt, fv, begin, compoundf)
{
	if (n == Math.floor(n) || is_n) {
		return pv + 
			(1 + (i / 100) * (begin ? 1:0)) * pmt * H.comppmtlim(i, n) + 
			fv * H.finance_pow(i / 100, -n);
	} else if (! compoundf) {
		return pv * (1 + ((i / 100) * (n - Math.floor(n)))) + 
			(1 + (i / 100) * (begin ? 1:0)) * pmt * H.comppmtlim(i, Math.floor(n)) +
			fv * H.finance_pow(i / 100, -Math.floor(n));
	} else {
		return pv * H.finance_pow(i / 100, (n - Math.floor(n))) + 
			(1 + (i / 100) * (begin ? 1 : 0)) * pmt * H.comppmtlim(i, Math.floor(n)) +
			fv * H.finance_pow(i / 100, -Math.floor(n));
	}
};

H.bond_previous_coupon = function (buy, maturity)
{
	// calculates last coupon paid just before buy

	var coupons = 0;
	var last_coupon = new Date(maturity);
	var next_coupon;

	while (last_coupon > buy) {
		next_coupon = new Date(last_coupon);
		++coupons;
		last_coupon.setDate(1);
		last_coupon.setMonth(last_coupon.getMonth() - 6);
		var month = last_coupon.getMonth();
		last_coupon.setDate(maturity.getDate());
	
		if (last_coupon.getMonth() != month) {
			// day > 28, overflowed into next month
			// Javascript trick: set to day 0 goes to last day of previous month
			// last_coupon.setDate(0);
			
			// We *could* do this calculation, but HP-12C returns Error 8 in this case,
			// so do we
			return null;
		}
	}

	return [last_coupon, next_coupon, coupons];
};

H.bond_price = function (desired_rate, coupon_year, buy, maturity)
{
	var price;
	var tot_interest;

	// * HP-12C only calculates semi-annual bonds i.e. bonds which pay coupons every 6 mo
	// * Value paid at maturity is always = 100

	// desire rate is pre-checked to be > -100

	var coupon_date = maturity;
	var tottime = H.date_diff(buy, maturity); 

	if (tottime <= 0) {
		return [H.ERROR_DATE, 0, 0];
	}

	var res = H.bond_previous_coupon(buy, maturity);

	if (res === null) {
		return [H.ERROR_DATE, 0, 0];
	}

	var E = H.date_diff(res[0], res[1]);
	var dsc = H.date_diff(buy, res[1]);	// time between settlement (buying) and next coupon
	var coupons = res[2];			// coupons that will be paid until maturity
	var dcs = E - dsc;			// time since last coupon, paid before we bought it.

	if (tottime <= E) {
		price = (100 * (100 + coupon_year / 2)) / (100 + ((tottime / E) * desired_rate / 2)); // present-value price
	} else {
		price = 100 / H.finance_pow(desired_rate / 200, coupons - 1 + dsc / E); // present-value price
		for (var e = 1; e <= coupons; ++e) {
			// accumulate present value of all future coupons
			price += (coupon_year / 2) / H.finance_pow(desired_rate / 200, e - 1 + dsc / E); 
		}
	}
	tot_interest = (coupon_year / 2) * dcs / E;
	price -= tot_interest; // coupon fraction compound before we bought it

	// should never happen, since previous checkings avoid NaN cases
	price = H.solve_infinity(price) || 0;
	tot_interest = H.solve_infinity(tot_interest) || 0;

	return [-1, price, tot_interest];
};

H.irr_npvsum = function (n, cfj)
{
	var res = Math.abs(cfj[0]);
	for (var e = 1; e <= n; ++e) {
		res += Math.abs(cfj[e]);
	}
	return res;
};

H.irr_calc = function (n, i, cfj, nj)
{
	var quality = H.npv_quality(n, cfj, nj);

	if (quality === 0) {
		// all-zeros
		return [-1, 0];
	} else if (quality < 0) {
		// all data have the same signal
		return [H.ERROR_IRR, i];
	}

	var NPVA, NPVL, NPVH, guessL, guessH;
	var threshold = 0.0000000000125;
	var threshold_order = H.irr_npvsum(n, cfj);

	if (threshold_order > 0) {
		threshold *= threshold_order;
	}

	if (i <= -98 || i > 10000000000) {
		i = 0;
	}
	guessL = i - 1;
	guessH = i + 1;

	var success = false;

	// find an interval guessL..guessH that contains NPV = 0
	var iteration = H.INTERPOLATION_MAX;
	while (--iteration >= 0) {
		// window.xlog("Trying interval " + guessL + " " + guessH);
		NPVH = H.npv(n, guessH, cfj, nj);
		NPVL = H.npv(n, guessL, cfj, nj);

		// success condition
		if ((NPVH * NPVL) < 0) {
			success = true;
			break;
		}

		var diff = guessH - guessL;
		if (guessL < 0) {
			guessL = Math.max(-99.99999999, guessL * 1.5); // counting with 100 iterations
		} else {
			guessL = Math.max(-99.99999999, guessL - 5 * diff); // counting with 100 iterations
		}
		guessH = Math.min(guessH + 5 * diff, 1e99);
	}

	if (success) {
		// Now bisect to find NPV(guess) = 0
		iteration = H.INTERPOLATION_MAX;
		while (--iteration >= 0) {	
			// window.xlog("Trying bisection " + guessL + " " + guessH);
			var avg = (guessL + guessH) / 2;
			NPVA = H.npv(n, avg, cfj, nj);
	
			if (Math.abs(NPVA) < threshold) {
				return [-1, avg];
			}
	
			if ((NPVL * NPVA) < 0) {
				// zero between L and avg
				NPVH = NPVA;
				guessH = avg;
			} else {
				// zero between avg and H
				NPVL = NPVA;
				guessL = avg;
			}
	
			// window.xlog("Interval NPV is " + NPVL + " " + NPVH);
		}
	}
	
	return [H.ERROR_IRR2, i];
};

H.financecalc = function (dependent, begin, compoundf, finarray)
{
	var err = 0;
	if (dependent === 0) {
		// n
		var tpmt = finarray[H.FIN_PMT];
		var tpvi = -finarray[H.FIN_PV] * finarray[H.FIN_I] / 100;
		var tfvi = finarray[H.FIN_FV] * finarray[H.FIN_I] / 100;
		var tfv = finarray[H.FIN_FV];
		if (tpmt < 0) {
			tpmt = -tpmt;
			tpvi = -tpvi;
			tfvi = -tfvi;
			tfv = -tfv;
		}
		
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
		// "if" is kludge to work around a problem with PMT = 0 and FV != 0
		if (tfv === 0) {
			err = err || (tpmt <= tpvi); // PMT <= -VP x i
			err = err || H.feq10(tpmt, tpvi); // PMT <= -VP x i
		}
		// I am in doubt in relation to signal
		// err = err || H.feq10(tpmt, tfvi); // PMT == VF x i
	} else if (dependent == 1) {
		var pmtn = finarray[H.FIN_PMT] * finarray[H.FIN_N];
		err = err || (finarray[H.FIN_N] < 0);
		err = err || (pmtn >= 0 && finarray[H.FIN_PV] >= 0 && finarray[H.FIN_FV] >= 0);
		err = err || (pmtn <= 0 && finarray[H.FIN_PV] <= 0 && finarray[H.FIN_FV] <= 0);
	} else if (dependent == 2) {
		// PV
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
	} else if (dependent == 3) { 
		// PMT
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
		err = err || finarray[H.FIN_N] === 0; // n = 0
	} else if (dependent == 4) {
		// FV
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
	}

	if (err) {
		return H.ERROR_INTEREST;
	}

	var threshold = 0.00000000000125; // 12 significant digits for NPV calc
	var threshold_order = 0;
	var threshold_result = 0.0000000000125; // 11 significant digits for result
	var threshold_result_order = 0;

	// correct threshold so it is proportional to the numbers involved
	if (dependent != H.FIN_PV) {
		threshold_order += Math.abs(finarray[H.FIN_PV]);
		threshold_result_order += Math.abs(finarray[H.FIN_PV]);
	}
	if (dependent != H.FIN_PMT) {
		threshold_order += Math.abs(finarray[H.FIN_PMT]);
		threshold_result_order += Math.abs(finarray[H.FIN_PMT]);
	}
	if (dependent != H.FIN_N && dependent != H.FIN_PMT) {
		// reduce calc precision because big N might make it impossible to 
		// find a result if too picky
		threshold_order += Math.abs(finarray[H.FIN_N] * finarray[H.FIN_PMT]);
	}
	if (dependent != H.FIN_FV) {
		threshold_order += Math.abs(finarray[H.FIN_FV]);
		threshold_result_order += Math.abs(finarray[H.FIN_FV]);
	}
	if (threshold_order > 0) {
		threshold *= threshold_order;
	}
	if (threshold_result_order > 0) {
		threshold_result *= threshold_result_order;
	}

	if (dependent === 1) {
		return H.financecalc_i(dependent, begin, compoundf, finarray, threshold, threshold_order);
	}

	var guess0, guess1, NPV0, NPV1;
	var saved = finarray[dependent];
	var iteration = H.INTERPOLATION_MAX;

	guess0 = null;

	if (dependent == H.FIN_N || dependent == H.FIN_I || threshold_order <= 0) {
		guess1 = 1;
	} else {
		// initial guess for interpolation must be of same order as other parameters
		guess1 = threshold_order;
	}

	var ret = H.ERROR_INTEREST;

	while (--iteration >= 0) {
		finarray[dependent] = guess1;

		NPV1 = H.calcNPV(dependent === 0,
				finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
				finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);

		if (Math.abs(NPV1) < threshold) {
			if (dependent === 0) {
				if ((guess1 - Math.floor(guess1)) > 0.003) {
					finarray[dependent] = Math.floor(finarray[dependent]) + 1;
				} else {
					finarray[dependent] = Math.floor(finarray[dependent]);
				}
			} else {
				// handle insignificant residues for PV, PMT and FV
				if (Math.abs(finarray[dependent]) < threshold_result) {
					finarray[dependent] = 0;
				}
			}
			saved = finarray[dependent];
			ret = -1;
			break;
		}

		var new_guess = guess1 + 1;

		if (guess0 !== null) {
			var B = (NPV1 - NPV0) / (guess1 - guess0); // B
			new_guess = NPV0 - guess0 * B; // A
			new_guess /= -B; // -A/B is the interpolation root
			new_guess = H.solve_infinity(new_guess);
		}

		guess0 = guess1;
		NPV0 = NPV1;
		guess1 = new_guess;
		NPV1 = null;
	}

	// puts back the original value in case of error,
	// since the calculated one may be NaN
	finarray[dependent] = saved;
	return ret;
};

// separate routine since linear interpolation does not work well for i
H.financecalc_i = function (dependent, begin, compoundf, finarray, threshold, threshold_order)
{
	var NPVA, NPVL, NPVH, guessL, guessH;
	var saved = finarray[dependent];

	var ret = H.ERROR_INTEREST;

	var success = false;

	guessL = -1;
	guessH = +1;

	// find an interval guessL..guessH that contains NPV = 0
	var iteration = H.INTERPOLATION_MAX;
	while (--iteration >= 0) {
		// window.xlog("Trying interval " + guessL + " " + guessH);
		finarray[dependent] = guessH;
		NPVH = H.calcNPV(dependent === 0,
				finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
				finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);

		finarray[dependent] = guessL;
		NPVL = H.calcNPV(dependent === 0,
				finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
				finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);

		// window.xlog("Interval NPV is " + NPVL + " " + NPVH);

		// success condition
		if ((NPVH * NPVL) < 0) {
			success = true;
			break;
		}

		guessL = Math.max(-99.99999999, guessL - 1.1); // counting with 100 iterations
		guessH = Math.min(guessH * 10, 1e99);
	}

	if (success) {
		// Now bisect to find NPV(guess) = 0
		iteration = H.INTERPOLATION_MAX;
		while (--iteration >= 0) {	
			// window.xlog("Trying bisection " + guessL + " " + guessH);
			var avg = (guessL + guessH) / 2;
			finarray[dependent] = avg;
			NPVA = H.calcNPV(dependent === 0,
					finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
					finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);
	
			if (Math.abs(NPVA) < threshold) {
				return -1;
			}
	
			if ((NPVL * NPVA) < 0) {
				// zero between L and avg
				NPVH = NPVA;
				guessH = avg;
			} else {
				// zero between avg and H
				NPVL = NPVA;
				guessL = avg;
			}
	
			// window.xlog("Interval NPV is " + NPVL + " " + NPVH);
		}
	}
	
	finarray[dependent] = saved;
	return ret;
};

H.bond_yield = function (coupon_year, buy, maturity, price)
{
	if (buy === null) {
		return [H.ERROR_DATE, 0];
	}

	if (maturity === null) {
		return [H.ERROR_DATE, 0];
	}

	if (price <= 0) {
		return [H.ERROR_INTEREST, 0];
	}

	var NPVA, NPVL, NPVH, guessL, guessH;
	var threshold = 0.000000000125 * Math.abs(price);

	guessL = -1;
	guessH = +1;

	var success = false;
	var err = H.ERROR_INTEREST;

	// find an interval guessL..guessH that contains NPV = 0
	var iteration = H.INTERPOLATION_MAX;
	while (--iteration >= 0) {
		// window.xlog("Trying interval " + guessL + " " + guessH);
		NPVL = H.bond_price(guessL, coupon_year, buy, maturity);
		if (NPVL[0] >= 0) {
			err = NPVL[0];
			break;
		}
		NPVL = NPVL[1] - price;
		NPVH = H.bond_price(guessH, coupon_year, buy, maturity);
		/*
		Impossible, because all possible errors are related to date and
		are caught in NPVL calculation.

		if (NPVH[0] >= 0) {
			err = NPVH[0];
			break;
		}
		*/
		NPVH = NPVH[1] - price;

		// success condition
		if ((NPVH * NPVL) < 0) {
			success = true;
			break;
		}

		guessL = Math.max(-199.99999999, guessL * 1.5); // counting with 100 iterations
		guessH = Math.min(guessH * 10, 1e99);
	}

	if (success) {
		// Now bisect to find NPV(guess) = 0
		iteration = H.INTERPOLATION_MAX;
		while (--iteration >= 0) {	
			// window.xlog("Trying bisection " + guessL + " " + guessH);
			var avg = (guessL + guessH) / 2;
			NPVA = H.bond_price(avg, coupon_year, buy, maturity);
			/*
			Impossible, because all possible errors would have been
			caught in previous loop, in NPVL calculation.

			if (NPVA[0] >= 0) {
				err = NPVA[0];
				break;
			}
			*/
			NPVA = NPVA[1] - price;
	
			if (Math.abs(NPVA) < threshold) {
				return [-1, avg];
			}
	
			if ((NPVL * NPVA) < 0) {
				// zero between L and avg
				NPVH = NPVA;
				guessH = avg;
			} else {
				// zero between avg and H
				NPVL = NPVA;
				guessL = avg;
			}
	
			// window.xlog("Interval NPV is " + NPVL + " " + NPVH);
		}
	}

	return [err, 0];
};

H.depreciation_sl = function (cost, sell, life, year)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > 1e10) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	if (year > life) {
		// bail out early to avoid slowness if year is absurdly big
		// linear depreciation does not make sense if year > life
		return [-1, 0, 0];
	}

	while (--year >= 0) {
		depr = (cost - sell) / life;
		rest -= depr;
	}

	return [-1, depr, rest];
};

H.depreciation_soyd = function (cost, sell, life, year)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > 1e10) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	if (year > life) {
		// bail out early to avoid slowness if year is absurdly big
		// soyd depreciation does not make sense if year > life
		return [-1, 0, 0];
	}

	var year_up = 0;
	var soyd = life * (life + 1) / 2;

	while (--year >= 0) {
		depr = (cost - sell) * (life - (++year_up) + 1) / soyd;
		rest -= depr;
	}

	return [-1, depr, rest];
};

H.depreciation_db = function (cost, sell, life, year, db)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > 1e10) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	if (year > life || rest < 0) {
		// bail out early to avoid slowness if year is absurdly big
		// soyd depreciation does not make sense if year > life
		return [-1, 0, 0];
	}

	var birthday = 0;

	while (--year >= 0) {
		if (++birthday < life) {
			depr = (rest + sell) * db / life;
		} else {
			depr = rest;
		}
		rest -= depr;

		if (rest < 0) {
			// may happen if db is big
			depr += rest;
			rest = 0;
		}
	}

	return [-1, depr, rest];
};

H.amortization = function (requested_n, orig_n, i, pv, pmt, decimals, begin)
{
	if (requested_n <= 0 || requested_n != Math.floor(requested_n) || i <= -1) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	var tot_interest = 0;
	var tot_amort = 0;

	for (var e = 1; e <= requested_n; ++e) {
		var interest = H.cl5_round(-pv * i, decimals);
		if (e == 1 && begin && orig_n <= 0) {
			// front payment has no interest
			interest = 0;
		}
		var capital_amortization = pmt - interest;
		tot_interest += interest;
		tot_amort += capital_amortization;
		pv += capital_amortization;
	}

	return [-1, tot_interest, tot_amort];
};

H.degrees_to_radians = function (angle)
{
	return angle * Math.PI / 180;
};

H.radians = function (angle, mode) // 11C
{
	if (mode == H.TRIGO_DEG) {
		angle = H.degrees_to_radians(angle);
	} else if (mode == H.TRIGO_GRAD) {
		angle *= Math.PI / 200;
	}
	return angle;
};

H.radians_to_degrees = function (angle)
{
	return angle * 180 / Math.PI;
};

H.to_angle_mode = function (angle, mode) // 11C
{
	if (mode == H.TRIGO_DEG) {
		angle = H.radians_to_degrees(angle);
	} else if (mode == H.TRIGO_GRAD) {
		angle *= 200 / Math.PI;
	}
	return angle;
};

H.hour_to_hms = function (hour)
{
	var sgn = H.binary_sgn(hour);
	var whole_hour = Math.floor(Math.abs(hour));
	var fraction = Math.abs(hour) - whole_hour;
	fraction *= 60;
	// avoid leaving a 0.999... fraction behind
	var minutes = Math.floor(fraction + 0.00000001);
	// make sure it does not get negative
	fraction = Math.max(fraction - minutes, 0);
	var seconds = fraction * 60;
	return sgn * (whole_hour + minutes / 100 + seconds / 10000);
};

H.hms_to_hour = function (hour)
{
	var sgn = H.binary_sgn(hour);
	var whole_hour = Math.floor(Math.abs(hour));
	var fraction = Math.abs(hour) - whole_hour;
	fraction *= 100;
	// avoid leaving a 0.999... fraction behind
	var minutes = Math.floor(fraction + 0.0000001);
	// make sure it does not get negative
	fraction = Math.max(fraction - minutes, 0);
	var seconds = fraction * 100;
	return sgn * (whole_hour + minutes / 60 + seconds / 3600);
};

// hyperbolic functions from http://phpjs.org/functions/

H.asinh = function (arg) {
	return Math.log(arg + Math.sqrt(arg * arg + 1));
};

H.acosh = function (arg) {
	return Math.log(arg + Math.sqrt(arg * arg - 1));
};

H.atanh = function (arg) {
	return 0.5 * Math.log((1 + arg) / (1 - arg));
};

H.sinh = function (arg) {
	return (Math.exp(arg) - Math.exp(-arg)) / 2;
};

H.cosh = function (arg) {
	return (Math.exp(arg) + Math.exp(-arg)) / 2;
};

H.tanh = function (arg) {
	return (Math.exp(arg) - Math.exp(-arg)) / (Math.exp(arg) + Math.exp(-arg));
};

H.feq = function (a, b, epsilon) {
	if (a === undefined || a === null || b === undefined || b === null ||
					H.badnumber(a) || H.badnumber(b)) {
		// window.xlog("feq: bad number");
		return false;
	}

	if (epsilon === undefined || epsilon === null) {
		epsilon = 1e-10;
	}

	/*
	// convert numbers into intervals
	var A = a - epsilon;
	var B = a + epsilon;
	var X = b - epsilon;
	var Y = b + epsilon;

	// interval equality
	// return B >= X && A <= Y;
	// if numbers are negative, (A,B) (X,Y) will not be in order!
	return (A >= X && A <= Y) || (B >= X && B <= Y);
	*/

	// xlog(" " + a + " " + b + " " + epsilon + " " + Math.abs(a - b) +
	// (Math.abs(a - b) < epsilon));

	return Math.abs(a - b) <= epsilon;
};

H.arithmetic_round = function (r, a, b)
{
	if (r === 0) {
		// nothing to round
		return r;
	} else if (a === 0 && b === 0) {
		// both zeros or no rounding desired (mult, div, power)
		return r;
	}

	var r_order = Math.floor(Math.log(Math.abs(r)) / Math.log(10));
	var order = r_order;

	// pick the magnitude of biggest number in operation
	if (a !== 0) {
		order = Math.floor(Math.log(Math.abs(a)) / Math.log(10));
	}
	if (b !== 0) {
		order = Math.max(order, Math.floor(Math.log(Math.abs(b)) / Math.log(10)));
	}

	var scale = Math.pow(10, order - 15);

	if (Math.abs(r) < scale) {
		r = 0;
	}

	return r;
};

H.feq10 = function (a, b) {
	if (a === undefined || a === null || b === undefined || b === null ||
					H.badnumber(a) || H.badnumber(b)) {
		return false;
	}

	var epsilon = 0; // exact comparison

	if (a === 0 || b === 0) {
		// comparison with pure zero is special case
		epsilon = 1e-100;
	} else {
		var order = Math.floor(Math.max(Math.log(Math.abs(b)) / Math.log(10),
				                Math.log(Math.abs(a)) / Math.log(10))) + 1;

		// OR just in case order is NaN (probably never)
		epsilon = Math.pow(10, order - 10) || 1e-100;
	}

	return H.feq(a, b, epsilon);
};

H.feq_digits = function (a, b, precision_digits, epsilon, log)
{
	if (a === undefined || a === null || b === undefined || b === null ||
					H.badnumber(a) || H.badnumber(b)) {
		return false;
	}

	if (! epsilon) {
		epsilon = 5;
	}

	precision_digits = Math.min(precision_digits, 10);

	var magnitude;

	// effectively moving the magnitude to zero
	while (a === 0 || b === 0) {
		a += 1;
		b += 1;
	}

	var magnitude_b = Math.log(Math.abs(b)) / Math.log(10);
	var magnitude_a = Math.log(Math.abs(a)) / Math.log(10);
	magnitude = Math.max(magnitude_a, magnitude_b);

	// Just in case magnitude is NaN
	magnitude = (Math.floor(magnitude) + 1) || 0;

	epsilon *= Math.pow(10, magnitude - precision_digits - 1);

	if (log) {
		window.xlog(" feq_digits " + a + " " + b + " " + (a - b) + " mag=" +
				magnitude + " d=" + precision_digits +
				" e=" + epsilon + " res " +
				H.feq(a, b, epsilon));
	}

	return H.feq(a, b, epsilon);
};

// comparision with 10^-10 tolerance when one of the values tend to zero
H.feq10_0 = function (a, b)
{
	var offset = 0;
	if ((a <= 1 && a >= -1) || (b <= 1 && b >= -1)) {
		offset = 2;
	}
	return H.feq10(offset + a, offset + b);
};

H.polar = function (x, y) {
	var angle = Math.atan2(y, x); // does not throw NaN
	var r = Math.sqrt(x * x + y * y);
	return [r, angle];
};

H.orthogonal = function (r, angle)
{
	return [r * H.cos(angle), r * H.sin(angle)];
};

H.fatorial = function (n)
{
	var res = 1;
	while (n > 1 && ! H.badnumber(res)) {
		res *= n;
		--n;
	}
	return res;
};

// from Wikipedia
H.gamma = function (z) {
	if (z < 0.5) {
		return Math.PI / (Math.sin(Math.PI * z) * H.gamma(1 - z));
	}
	z = z - 1;
	var x = H.gamma.p[0];
	for (var i = 1; i < (H.gamma.g + 2); ++i) {
		x += H.gamma.p[i] / (z + i);
	}
	var t = z + H.gamma.g + 0.5;
	return Math.sqrt(2 * Math.PI) * Math.pow(t, (z + 0.5)) * Math.exp(-t) * x;
};

H.gamma.g = 7;
H.gamma.p = [0.99999999999980993, 676.5203681218851,
	-1259.1392167224028, 771.32342877765313, -176.61502916214059,
	12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
	1.5056327351493116e-7];

H.fatorial_gamma = function (n)
{
	if (n >= 0 && Math.floor(n) == n) {
		return H.fatorial(n);
	}
	return H.gamma(n + 1);
};

H.permutations = function (a, b)
{
	return H.fatorial(a) / H.fatorial(a - b);
};

H.combinations = function (a, b)
{
	return H.permutations(a, b) / H.fatorial(b);
};

H.stddev = function (mem)
{
	if (mem[H.STAT_N] <= 1 || 
	    (mem[H.STAT_N] * mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X]) < 0 ||
	    (mem[H.STAT_N] * mem[H.STAT_Y2] - mem[H.STAT_Y] * mem[H.STAT_Y]) < 0) {
		return [0];
	}
	var x = Math.pow((mem[H.STAT_N] * mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X]) /
			 (mem[H.STAT_N] * (mem[H.STAT_N] - 1)), 0.5);
	var y = Math.pow((mem[H.STAT_N] * mem[H.STAT_Y2] - mem[H.STAT_Y] * mem[H.STAT_Y]) /
			 (mem[H.STAT_N] * (mem[H.STAT_N] - 1)), 0.5);
	return [1, x, y];
};

H.linear_regression = function (mem)
{
	if (mem[H.STAT_N] <= 1) {
		// window.xlog("LR err type 1");
		return [0];
	}

	var div = mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X] / mem[H.STAT_N];
	if (H.feq10_0(div, 0)) {
		// window.xlog("LR err type 2");
		return [0];
	}

	// TODO implement test [ n Ex2 - (Ex)2] [ n Ey2 - (Ey)2] <= 0

	var avgx = mem[H.STAT_X] / mem[H.STAT_N];
	var avgy = mem[H.STAT_Y] / mem[H.STAT_N];

	var B = mem[H.STAT_XY] - mem[H.STAT_X] * mem[H.STAT_Y] / mem[H.STAT_N];
	B /= div;
	B = H.solve_infinity(B) || 0;

	var A = avgy - B * avgx;

	// note: vars are following the HP12C handbook convention
	// y=Bx+A, while the 11C and math convention is y=Ax+B.

	return [1, A, B];
};

H.stat_kr = function (mem, is_x, xx)
{
	var res = H.linear_regression(mem);

	if (! res[0]) {
		// window.xlog("statkr error 1");
		return [0];
	}

	var A = res[1];
	var B = res[2];

	// note: vars are following the HP12C handbook convention
	// y=Bx+A, while the 11C and math convention is y=Ax+B.

	// an equivalent test is already made at linear_regression()
	/*
	if (H.feq((mem[H.STAT_N] * mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X]), 0)) {
		window.xlog("statkr error 2");
		return [0];
	}
	*/

	var rr3 = mem[H.STAT_Y2] - mem[H.STAT_Y] * mem[H.STAT_Y] / mem[H.STAT_N];

	if (H.feq10_0(rr3, 0)) {
		// window.xlog("statkr error 3");
		return [0];
	}

	var rr1 = mem[H.STAT_XY] - mem[H.STAT_X] * mem[H.STAT_Y] / mem[H.STAT_N];
	var rr2 = mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X] / mem[H.STAT_N];

	/*
	// already checked in "statkr error 2" and "statkr error 3"
	if (rr2 === 0 || rr3 === 0) {
		window.xlog("statkr error 5");
		return [0];
	}
	*/

	if ((rr2 * rr3) < 0) {
		// window.xlog("statkr error 6");
		return [0];
	}

	var rr = Math.sqrt(rr2 * rr3);

	var r = rr1 / rr;

	var c;

	if (is_x) {
		if (H.feq10_0(B, 0)) {
			// window.xlog("statkr error 7");
			return [0];
		}
		c = (xx - A) / B;
	} else {
		c = A + B * xx;
	}

	c = H.solve_infinity(c) || 0;
	r = H.solve_infinity(r) || 0;

	return [1, c, r];
};

H.stat_accumulate = function (sgn, mem, x, y)
{
	mem[H.STAT_N] += sgn;
	mem[H.STAT_X] += sgn * x;
	mem[H.STAT_X2] += sgn * x * x;
	mem[H.STAT_Y] += sgn * y;
	mem[H.STAT_Y2] += sgn * y * y;
	mem[H.STAT_XY] += sgn * x * y;
};

H.stat_avg = function (mem)
{
	if (mem[H.STAT_N] === 0) {
		return [0];
	}
	var x = mem[H.STAT_X] / mem[H.STAT_N];
	var y = mem[H.STAT_Y] / mem[H.STAT_N];
	return [1, x, y];
};

H.stat_avgw = function (mem)
{
	if (mem[H.STAT_X] === 0) {
		return [0];
	}
	return [1, mem[H.STAT_XY] / mem[H.STAT_X]];
};

// MODIFIED VERSION OF: https://github.com/cslarsen/mersenne-twister

/*
  I've wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
  so it's better encapsulated. Now you can have multiple random number generators
  and they won't stomp all over eachother's state.
  
  If you want to use this as a substitute for Math.random(), use the random()
  method like so:
  
  var m = new MersenneTwister();
  var randomNumber = m.random();
  
  You can also call the other genrand_{foo}() methods on the instance.

  If you want to use a specific seed in order to get a repeatable random
  sequence, pass an integer into the constructor:

  var m = new MersenneTwister(123);

  and that will always produce the same random sequence.

  Sean McCullough (banksean@gmail.com)
*/

/* 
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.
 
   Before using, initialize the state by using init_genrand(seed)  
   or init_by_array(init_key, key_length).
 
   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.                          
 
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:
 
     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
 
     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
 
     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.
 
   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 
 
   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

H.Prng = function (seed)
{
	var self = {};

	seed = seed || 0;

	// convert to 0 <= x < 1 range
	seed = Math.abs(seed);
	while (seed >= 1) {
		seed /= 10;
	}

	// save for further RCL
	self.seed = seed;

	// condition to needs of this particular prng: 32-bit integer, non-zero
	if (seed === 0) {
		seed = 1;
	}
	while (seed < 0x40000000) {
		seed *= 1.9123456789;
	}

	/* Period parameters */  
	self.N = 624;
	self.M = 397;
	self.MMA = 0x9908b0df;   /* constant vector a */
	self.UMA = 0x80000000; /* most significant w-r bits */
	self.LMA = 0x7fffffff; /* least significant r bits */
 
	self.mt = [];          /* the array for the state vector */
	self.mti = self.N + 1; /* mti==N+1 means mt[N] is not initialized */

	self.getSeed = function ()
	{
		return self.seed;
	};
 
	/* initializes mt[N] with a seed */
	self.private_init = function (seed)
	{
		self.mt[0] = seed >>> 0;
		for (self.mti = 1; self.mti < self.N; self.mti++) {
			var s = self.mt[self.mti - 1] ^ (self.mt[self.mti - 1] >>> 30);
			self.mt[self.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + 
				(s & 0x0000ffff) * 1812433253) + self.mti;
			/* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
			/* In the previous versions, MSBs of the seed affect   */
			/* only MSBs of the array mt[].                        */
			/* 2002/01/09 modified by Makoto Matsumoto             */
			self.mt[self.mti] >>>= 0;
			/* for >32 bit machines */
		}
	};
 
	/* generates a random number on [0,0xffffffff]-interval */
	self.gen32 = function ()
	{
		var y;
		var mag01 = [0x0, self.MMA];
		/* mag01[x] = x * MMA  for x=0,1 */
	
		if (self.mti >= self.N) { /* generate N words at one time */
			var kk;
	
			for (kk = 0; kk < self.N - self.M; kk++) {
				y = (self.mt[kk] & self.UMA) | (self.mt[kk + 1] & self.LMA);
				self.mt[kk] = self.mt[kk + self.M] ^ (y >>> 1) ^ mag01[y & 0x1];
			}
	
			for (; kk < self.N - 1; kk++) {
				y = (self.mt[kk] & self.UMA) | (self.mt[kk + 1] & self.LMA);
				self.mt[kk] = self.mt[kk + (self.M - self.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
			}
	
			y = (self.mt[self.N - 1] & self.UMA) | (self.mt[0] & self.LMA);
			self.mt[self.N - 1] = self.mt[self.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
	
			self.mti = 0;
		}
	
		y = self.mt[self.mti++];
	
		/* Tempering */
		y ^= (y >>> 11);
		y ^= (y << 7) & 0x9d2c5680;
		y ^= (y << 15) & 0xefc60000;
		y ^= (y >>> 18);
	
		return y >>> 0;
	};
 	
	/* generates a random number on [0,1) with 53-bit resolution*/
	self.random = function ()
	{ 
		var a = self.gen32() >>> 5;
		var b = self.gen32() >>> 6; 
		return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0); 
	};

	self.private_init(seed);

	return self;
};

H.sin = function (r)
{
	r = r % (2 * Math.PI);
	var res = Math.sin(r);
	if (Math.abs(res) <= 2.5e-16) {
		res = 0;
	}	
	return res;
};

H.cos = function (r)
{
	r = r % (2 * Math.PI);
	var res = Math.cos(r);
	if (Math.abs(res) <= 2.5e-16) {
		res = 0;
	}	
	return res;
};

H.tan = function (r)
{
	r = r % Math.PI;
	var res = H.sin(r) / H.cos(r);
	if (res > H.value_max) {
		res = H.value_max;
	} else if (res < -H.value_max) {
		res = -H.value_max;
	}
	return res;
};

H.complex_ln = function (arg)
{
	var polar = H.complex_to_polar(arg);
	var a_len = polar.r;
	var a_angle = polar.i;

	if (a_len === 0) {
		// avoids a failure mode, and 0^z=0
		return {r: 0, i: 0, h: 0, err: true};
	}

	return {r: Math.log(a_len), i: a_angle, h: 0, err: false};
};

H.complex_to_polar = function (arg)
{
	var len = H.complex_abs(arg).r;
	var angle = Math.atan2(arg.i, arg.r); // always returns a valid number
	return {r: len, i: angle, h: 0};
};

H.complex_abs = function (y)
{
	var real = Math.sqrt(y.r * y.r + y.i * y.i);
	return {r: real, i: 0, h: 0};
};
H.sve = 37.0;
H.kve = "331b2fc2243896da96b2fc40315e6f22";
H.kve2 = "6608b97ff54635753af9701c0c995cfade3b67c8";
/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*jshint globalstrict: true*/

/*global H */

"use strict";

function Hp12c_pgrm()
{
	this.constructor();
}

Hp12c_pgrm.prototype.constructor = function ()
{
	this.exec_special = [];
	this.exec_special[H.GTO] = [2, 1, this.p_exec_gto];
	this.exec_special[H.GSB] = [2, 1, this.p_exec_gosub];
	if (H.type === "15c") {
		// 15C: see remark [1]
		this.exec_special[H.GTO_DOT] = [3, 1, this.p_exec_gto_dot];
		this.exec_special[H.GSB_DOT] = [3, 1, this.p_exec_gosub_dot];
	}

	this.exec_special[H.GG * 100 + H.GSB] = [2, 0, this.p_exec_rtn];
	this.exec_special[H.dispatcher.KEY_RS] = [1, 0, this.p_exec_rs];

	this.label_count = 0;

	this.type_special = [];
	var t = this.type_special;

	t[H.GG * 100 + H.dispatcher.KEY_RS] = this.p_type_pr;
	t[H.dispatcher.KEY_SST] = this.p_type_sst;
	t[H.GG * 100 + H.dispatcher.KEY_SST] = this.p_type_bst;
	t[H.dispatcher.KEY_BACKSPACE] = this.p_type_del;
	t[H.FF * 100 + H.dispatcher.KEY_RDOWN] = this.p_type_clear_pgrm;
	if (H.type === "15c") {
		t[H.GTO * 100 + H.dispatcher.KEY_CHS] = this.p_type_gto_move_begin;
	} else {
		t[H.GTO * 100 + H.dispatcher.KEY_DECIMAL] = this.p_type_gto_move_begin;
	}

	t[H.GTO] = this.p_type_gto_begin;
	t[H.GSB] = this.p_type_gosub_begin;
	t[H.LBL] = this.p_type_label_begin;
	if (H.type === "15c") {
		t[H.GTO_DOT] = this.p_type_gto_dot_begin;
		t[H.GSB_DOT] = this.p_type_gosub_dot_begin;
		t[H.LBL_DOT] = this.p_type_label_dot_begin;
	}

	if (H.type === "11c" || H.type === "15c") {
		t[H.GG * 100 + H.RCL] = this.p_type_mem_info;
		t[H.FF * 100 + H.RCL] = this.p_type_user;
		if (H.type === "15c") {
			this.label_count = 25;
		} else {
			this.label_count = 15;
		}
	} else if (H.type === "16c") {
		t[H.FF * 100 + 0] = this.p_type_mem_info;
		this.label_count = 16;
	}

	for (var n = 0; n <= 9; ++n) {
		t[H.GTO_MOVE * 100 + n] = this.p_type_gto_move_n;
		t[H.GTO * 100 + n] = this.p_type_gto_n;
		t[H.GSB * 100 + n] = this.p_type_gosub_n;
		t[H.LBL * 100 + n] = this.p_type_label_n;
		if (H.type === "15c") {
			t[H.GTO_DOT * 100 + n] = this.p_type_gto_dot_n;
			t[H.GSB_DOT * 100 + n] = this.p_type_gosub_dot_n;
			t[H.LBL_DOT * 100 + n] = this.p_type_label_dot_n;
		}
	}

	var lc = this.label_count;
	if (H.type === "15c") {
		// label count goes up to 25 but we really want
		// here is the range of letters here (A..E).
		lc = 15;
	}

	for (n = 11; n <= lc; ++n) {
		t[H.GTO * 100 + n] = this.p_type_gto_n;
		t[H.GSB * 100 + n] = this.p_type_gosub_n;
		t[H.LBL * 100 + n] = this.p_type_label_n;
	}

	// 15c: no dot handling for index
	t[H.GTO * 100 + H.KEY_INDEX] = this.p_type_gto_n;
	t[H.GSB * 100 + H.KEY_INDEX] = this.p_type_gosub_n;

	this.execution_delay = 80;
	this.default_execution_delay = this.execution_delay;
	this.fast_stack = 0;

	this.stack_size = 4;
	if (H.type === "15c") {
		this.stack_size = 8;
	}

	this.sched_timer = null;
};

Hp12c_pgrm.p_encode_key = function (key, addr)
{
	var opcode;

	if (addr) {
		opcode = H.zeropad(key.toFixed(0), H.ram_ADDR_SIZE);
	} else {
		opcode = H.zeropad(key.toFixed(0), H.INSTRUCTION_SIZE);
	}

	return opcode;
};

Hp12c_pgrm.p_expand_opcode = function (modifier)
{
	var a = [];

	// Expands an opcode or modifier codified like 100 * op0 + op1
	if (modifier >= H.INSTRUCTION_MAX) {
		// composite modifier; recurse
		a = Hp12c_pgrm.p_expand_opcode(Math.floor(modifier / 100));
	}
	a.push(modifier % H.INSTRUCTION_MAX);
	return a;
};

Hp12c_pgrm.p_encode_modifier = function (modifier)
{
	if (modifier <= 0) {
		return "";
	}

	var opcode = "";
	var expanded = Hp12c_pgrm.p_expand_opcode(modifier);

	for (var i = 0; i < expanded.length; ++i) {
		opcode += Hp12c_pgrm.p_encode_key(expanded[i], 0) + ".";
	}

	return opcode;
};

Hp12c_pgrm.p_encode_instruction = function (modifier, key, addr)
{
	return Hp12c_pgrm.p_encode_modifier(modifier) +
	       Hp12c_pgrm.p_encode_key(key, addr);

};

Hp12c_pgrm.prototype.hex_opcode = function (instr)
{
	var op = instr.split(".");

	for (var i = 0; i < op.length; ++i) {
		var key = parseInt(op[i], 10);
		if (key >= 11 && key <= 16) {
			op[i] = (key - 1).toString(16);
		}
	}

	return op.join(".");
};

Hp12c_pgrm.prototype.shrunk_opcode = function (instr)
{
	var op = instr.split(".");

	var modifier = 0;
	var key = 0;

	key = parseInt(op[op.length - 1], 10);
	for (var i = 0; i < op.length - 1; ++i) {
		modifier = 100 * modifier + parseInt(op[i], 10);
	}

	var K = H.dispatcher.functions;
	if (K[key]) {
		var closure = K[key][modifier];
		if (closure) {
			if (closure.shrink === 1) {
				// convert 48 to "o"
				var skey = parseInt(op[op.length - 2], 10);
				if (skey === 48) {
					var iop = op.slice(0, op.length - 2);
					return iop.join(".") + ".o" + parseInt(op[op.length - 1], 10);
				}
			} else if (closure.shrink === 2) {
				// convert 11..15 to letter
				if (key >= 11 && key <= 16) {
					op[op.length - 1] = (key - 1).toString(16);
				}
			}
		}
	}

	return op.join(".");
};

Hp12c_pgrm.prototype.p_del = function (modifier, key, addr)
{
	var ip = H.machine.ip;
	var limit = H.machine.program_limit();

	if (ip <= 0 || ip > limit) {
		H.machine.ip = 0;
		return;
	}

	for (var e = ip; e < limit; ++e) {
		H.machine.ram[e] = H.machine.ram[e + 1];
	}
	H.machine.ram[limit] = H.STOP_INSTRUCTION;

	--H.machine.ip;
	--H.machine.program_size;
};

Hp12c_pgrm.prototype.log = function (msg)
{
	if (! H.machine.rapid) {
		window.xlog(msg);
	}
};

Hp12c_pgrm.prototype.p_poke = function (modifier, key, addr)
{
	if ((H.machine.ip + 1) >= H.ram_MAX) {
		this.log("pgrm: IP limit bumped");
		H.machine.display_error(H.ERROR_IP);
		return false;
	}
	if (H.machine.program_size >= H.ram_MAX) {
		this.log("pgrm: program size limit bumped");
		H.machine.display_error(H.ERROR_IP);
		return false;
	}
	++H.machine.ip;
	++H.machine.program_size;

	// anyone except 12C inserts instructions
	for (var e = H.ram_MAX - 1; e > H.machine.ip; --e) {
		H.machine.ram[e] = H.machine.ram[e - 1];
	}

	H.machine.ram[H.machine.ip] =
		Hp12c_pgrm.p_encode_instruction(modifier, key, addr);

	return true;
};

Hp12c_pgrm.prototype.p_sched = function ()
{
	var self = this;

	if (self.sched_timer) {
		H.cancel_delay(self.sched_timer);
		self.sched_timer = null;
	}

	if (H.machine.program_mode >= H.RUNNING) {
		H.machine.display_pgrm();

		if (H.machine.modal() > 0) {
			// call us back when exits from modal
			window.console.ut_snap("halt ");
			H.machine.modal_observer("p_sched", function () {
				window.console.ut_snap("resum");
				self.p_sched();
			});
			return;
		}

		H.machine.modal_observer_remove("p_sched");

		self.sched_timer = H.delay(function () {
			self.sched_timer = null;
			self.p_execute();
		}, (H.machine.rapid ? 0 : self.execution_delay));
	}
};

Hp12c_pgrm.prototype.p_gto = function (label)
{
	var is_label = true;
	var new_ip = label;
	var low = 11; 			// key for letter 'A'
	var high = this.label_count;	// key for letter 'E' or 'F'

	if (H.type === "15c") {
		// 15C uses label 10-19 for LBL . 0-9
		low = 10;
		// letter A-F goes to 20-24
		high = 24;
	}

	if (label == H.KEY_INDEX) {
		// index-based gto
		if (H.machine.index >= 0) {
			// label in index
			new_ip = Math.floor(H.machine.index);
			if (new_ip >= this.label_count) {
				this.log("Invalid label in index: " + new_ip);
				return false;
			}
			if (new_ip >= 10 && H.type !== "15c") {
				// move from 10..14 to 11..15 range (letter keystrokes)
				// (15c uses range 20-24 for letters: no move!)
				new_ip += 1;
			}
		} else {
			// absolute address in index
			new_ip = Math.floor(Math.abs(H.machine.index));
			is_label = false;
			if (new_ip > H.machine.program_limit()) {
				this.log("Invalid IP in index: " + new_ip);
				return false;
			}
		}
	} else {
		// hard-coded label
		// in 11C and 16c, it is the key code for A-F (11.16)
	}

	if (is_label) {
		this.log("GTO to label " + new_ip);
		new_ip = this.find_label(new_ip);
		if (! new_ip) {
			this.log("... no such label");
			return false;
		}
	}

	this.log("GTO to ip " + new_ip);
	H.machine.ip = new_ip;
	return true;
};

Hp12c_pgrm.prototype.p_do_gto = function (addr)
{
	// handled in special way because it changes IP
	H.machine.rst_modifier(1);

	if (! this.p_gto(addr)) {
		H.machine.display_error(H.ERROR_IP);
		this.stop(2);
		return;
	}
};

Hp12c_pgrm.prototype.p_exec_gto = function (op)
{
	// if 15c, keys 11..15 translated to label range 20..24
	return this.p_do_gto(this.fix_label_key(op[1]));
};

Hp12c_pgrm.prototype.p_exec_gto_dot = function (op)
{
	return this.p_do_gto(op[2] + 10);
};

Hp12c_pgrm.prototype.p_do_gosub = function (addr)
{
	if (H.machine.call_stack.length >= this.stack_size) {
		H.machine.display_error(H.ERROR_RTN);
		this.stop(2);
		return;
	}

	var new_ip = this.find_label_or_index(addr);

	if (! new_ip) {
		H.machine.display_error(H.ERROR_IP);
		this.stop(2);
		return;
	}

	this.log("GSB label " + addr + " to " + new_ip);

	this.push_stack(new_ip);
};

Hp12c_pgrm.prototype.p_exec_gosub = function (op)
{
	// if 15c, keys 11..15 translated to label range 20..24
	return this.p_do_gosub(this.fix_label_key(op[1]));
};

Hp12c_pgrm.prototype.p_exec_gosub_dot = function (op)
{
	return this.p_do_gosub(op[2] + 10);
};

Hp12c_pgrm.prototype.p_exec_rtn = function (op)
{
	this.pop_stack();
	this.log("RTN to " + H.machine.ip);
	// do nothing since p_execute() will stop if ip=0
};

Hp12c_pgrm.prototype.p_exec_rs = function (op)
{
	++H.machine.ip;
	this.stop(0);
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.p_opcode_match = function (candidate, model, comparison_len)
{
	model = Hp12c_pgrm.p_expand_opcode(model);

	for (var i = 0; i < comparison_len; ++i) {
		if (candidate[i] != model[i]) {
			return false;
		}
	}

	return true;
};

Hp12c_pgrm.prototype.p_exec_handle_special = function (op)
{
	var handler = null;

	for (var prefix in this.exec_special) {
		if (typeof prefix !== "object") {
			var expected_len = this.exec_special[prefix][0];
			var suffix_len = this.exec_special[prefix][1];
			var f = this.exec_special[prefix][2];

			if (expected_len != op.length) {
				continue;
			}

			if (! Hp12c_pgrm.p_opcode_match(op, prefix, 
					expected_len - suffix_len)) {
				continue;
			}

			handler = f;
			break;
		}
	}
	
	if (handler) {
		handler.call(this, op);
	}

	return !!handler;
};

Hp12c_pgrm.prototype.find_label = function (lab)
{
	var template_modifier = H.LBL;
	var template_label = lab;
	if (H.type === "15c") {
		if (template_label >= 10 && template_label <= 19) {
			template_modifier = H.LBL_DOT;
			template_label -= 10;
		} else if (template_label >= 20 && template_label <= 24) {
			template_label -= 20;
			template_label += 11;
		}
	}
	var template = Hp12c_pgrm.p_encode_instruction(template_modifier, template_label, 0);
	var i;

	// two-phase search to handle repeated labels correctly
	for (i = H.machine.ip + 1; i <= H.machine.program_limit(); ++i) {
		if (H.machine.ram[i] == template) {
			return i;
		}
	}
	for (i = 1; i <= H.machine.ip; ++i) {
		if (H.machine.ram[i] == template) {
			return i;
		}
	}

	this.log("find_label: not found " + lab);
	return 0;
};

Hp12c_pgrm.prototype.find_label_or_index = function (label_or_index)
{
	if (label_or_index === H.KEY_INDEX) {
		if (H.machine.index >= 0) {
			// label in index
			var label = Math.floor(H.machine.index);
			if (label >= this.label_count) {
				this.log("find_label_or_index: Invalid label in index: " + label);
				return 0;
			}
			if (label >= 10 && H.type !== "15c") {
				// put in 11..count range (= letter keys)
				// 15C: no gap, no change!
				label += 1;
			}
			return this.find_label(label);
		} else {
			// absolute address in index
			var new_ip = Math.floor(Math.abs(H.machine.index));
			if (new_ip > H.machine.program_limit()) {
				return 0;
			}
			return new_ip;
		}
	}

	return this.find_label(label_or_index);
};

Hp12c_pgrm.prototype.clean_stack = function ()
{
	H.machine.call_stack = [];
};

Hp12c_pgrm.prototype.push_stack = function (ip)
{
	H.machine.call_stack.push(H.machine.ip + 1);
	H.machine.ip = ip;
};

Hp12c_pgrm.prototype.pop_stack = function ()
{
	if (H.machine.call_stack.length <= 0) {
		H.machine.ip = 0;
		return false;
	}

	var ip = H.machine.call_stack[H.machine.call_stack.length - 1];
	H.machine.call_stack.splice(H.machine.call_stack.length - 1, 1);

	if (ip > H.machine.program_limit()) {
		this.log("RTN to EOF, defaulting to 0");
		ip = 0;
	}

	H.machine.ip = ip;

	return true;
};

// can only be called as a deferred call from p_sched()
Hp12c_pgrm.prototype.p_execute = function ()
{
	if (H.machine.program_mode < H.RUNNING) {
		// may happen if a key is pressed between p_sched()
		// and the deferred call to this method
		return;
	}

	window.console.ut_snap("pre  ");

	if (H.machine.ip > H.machine.program_limit()) {
		// top of RAM
		// in 12c, pop_stack() always fails because GSB is never called
		this.pop_stack();

		if (H.machine.ip <= 0) {
			this.clean_stack();
			this.stop(0);
			return;
		} else {
			this.log("implicit RTN to " + H.machine.ip);
		}
	}

	// should never happen; tested by error injection in stack
	if (H.machine.ip <= 0) {
		H.machine.ip = 1;
		H.machine.display_pgrm();
	}

	var op_txt = H.machine.ram[H.machine.ip];

	// should never happen; tested by error injection in stack
	if (! H.is_12c() && H.type !== "10c") {
		if (op_txt == H.STOP_INSTRUCTION || op_txt === "") {
			// bumped soft end of program (GTO 00)
			H.machine.ip = 0;
			this.stop(0);
			return;
		}
	}

	var op = op_txt.split(".");

	var log;

	if (! H.machine.rapid) {
		log = op_txt; /* + "   " + H.machine.x;
		if (H.type === "15c") {
			log += ":" + H.machine.xi;
			if (H.machine.xh) {
				log += ":M";
			}
		}
		*/
	}

	var e;

	for (e = 0; e < op.length; ++e) {
		op[e] = parseInt(op[e], 10);
	}

	if (! this.p_exec_handle_special(op)) {
		// not special; execute via dispatcher

		for (e = 0; e < op.length; ++e) {
			if (!H.dispatcher.dispatch_common(op[e], true)) {
				this.log("Invalid opcode for exec: " + op_txt);
			}
		}

		window.console.ut_snap("pos  ");

		if (H.machine.program_mode >= H.RUNNING || ! H.machine.is_error()) {
			// sticks at error opcode
			++H.machine.ip;
		}
	} else {
		window.console.ut_snap("posp ");
	}

	if (! H.machine.rapid) {
		/*
		log += " -> " + H.machine.x;
		if (H.type === "15c") {
			log += ":" + H.machine.xi;
			if (H.machine.xh) {
				log += ":M";
			}
		}
		*/

		this.log(log);
	}

	// instruction execution aftermath

	if (H.machine.ip <= 0) {
		// GTO 00, RTN to empty, or equivalent
		this.stop(0);
	} else if (H.machine.program_mode === H.RUNNING_STEP) {
		H.machine.program_mode = H.INTERACTIVE;
		H.machine.display_pgrm();
	} else if (H.machine.program_mode === H.RUNNING) {
		this.p_sched();
	}
	// Warning: 15c's SOLVE and INTG put machine in interactive
	// mode so they can run the programmed function
};

Hp12c_pgrm.prototype.p_run = function ()
{
	H.machine.program_mode = H.RUNNING;
	if (H.machine.ip <= 0) {
		this.clean_stack();
		H.machine.ip = 1;
	}
	H.machine.display_pgrm();
	H.display.recycle();
	this.p_sched();
};

Hp12c_pgrm.prototype.run = function ()
{
	this.p_run();
};

Hp12c_pgrm.prototype.rs = function ()
{
	// when executing program, p_exec_rs is called instead
	if (H.machine.program_mode == H.INTERACTIVE) {
		H.machine.display_result_s(false, false);
		this.p_run();
	}
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.prototype.p_type_pr = function (key)
{
	// P/R in prog. mode exits programming mode
	H.machine.rst_modifier(1);
	H.machine.program_mode = H.INTERACTIVE;
	if (H.is_12c() || H.type === "10c") {
		H.machine.ip = 0;
	}
	H.machine.display_pgrm();
	H.machine.display_modifier();
	H.machine.display_result_s(false, false);
};

Hp12c_pgrm.prototype.p_type_sst = function (key)
{
	if (++H.machine.ip > H.machine.program_limit()) {
		H.machine.ip = 0;
	}
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_bst = function (key)
{
	if (--H.machine.ip < 0) {
		H.machine.ip = H.machine.program_limit();
	}
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_del = function (modifier, key, addr)
{
	this.p_del();
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_clear_pgrm = function (key)
{
	H.machine.clear_prog(1);
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_mem_info = function (key)
{
	H.machine.rst_modifier(1);
	H.machine.mem_info();
};

Hp12c_pgrm.prototype.p_type_user = function (key)
{
	H.machine.rst_modifier(1);
	H.machine.toggle_user();
};

Hp12c_pgrm.prototype.p_type_gto_move_n = function (key)
{
	H.machine.gtoxx = "" + H.machine.gtoxx + key.toFixed(0);
	if (H.machine.gtoxx.length >= H.ram_ADDR_SIZE) {
		var ip = parseInt(H.machine.gtoxx, 10);
		H.machine.gtoxx = "";
		H.machine.rst_modifier(1);
		if (ip > H.machine.program_limit()) {
			H.machine.display_error(H.ERROR_IP);
			return;
		}
		H.machine.ip = ip;
	}
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.fix_label_key = function (key)
{
	if (H.type === "15c") {
		// move keys 11..15 to label range 20..24
		if (key >= 11 && key <= 15) {
			key = key - 11 + 20;
		}
	}
	return key;
};

Hp12c_pgrm.prototype.p_type_gto_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GTO, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gto_dot_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GTO_DOT, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gosub_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GSB, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gosub_dot_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GSB_DOT, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gosub_begin = function (key)
{
	H.machine.set_modifier(H.GSB, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_gosub_dot_begin = function (key)
{
	H.machine.set_modifier(H.GSB_DOT, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_label_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.LBL, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_label_dot_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.LBL_DOT, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_label_begin = function (key)
{
	H.machine.set_modifier(H.LBL, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_label_dot_begin = function (key)
{
	H.machine.set_modifier(H.LBL_DOT, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_gto_move_begin = function (key)
{
	H.machine.set_modifier(H.GTO_MOVE, 1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gto_begin = function (key)
{
	H.machine.set_modifier(H.GTO, 1);
	if (H.is_12c() || H.type === "10c") {
		H.machine.gtoxx = "";
	}
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_gto_dot_begin = function (key)
{
	H.machine.set_modifier(H.GTO_DOT, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_handle_special = function (key)
{
	var handler = null;
	var op = H.machine.modifier * 100 + key;

	if (this.type_special[op]) {
		this.type_special[op].call(this, key);
		return true;
	}

	return false;
};


Hp12c_pgrm.prototype.type = function (key)
{
	if (this.p_type_handle_special(key)) {
		return false;
	}

	// non-special key; resolve using dispatcher mechanism

	if (H.dispatcher.handle_modifier(key, 1)) {
		H.machine.display_program_opcode();
		return false;
	}

	// non-special, non-modifier

	// USER already handled by dispatcher, even for pgrm mode

	var f = H.dispatcher.find_function(key, 1, 0);

	if (! f) {
		this.log("pgrm typing: no handler for " + key);
		H.machine.rst_modifier(1);
		H.machine.display_program_opcode();
		return false;
	}

	var m = H.machine.modifier;
	H.machine.rst_modifier(1);

	return this.p_poke(m, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.stop = function (motive)
{
	H.machine.program_mode = H.INTERACTIVE;
	if (H.machine.ip > H.machine.program_limit()) {
		H.machine.ip = 0;
	}
	H.machine.display_pgrm();
	if (! H.machine.is_error()) {
		if (H.type === "16c") {
			H.machine.display_result_s(false, true);
		} else {
			H.machine.display_result();
		}
	}
	
	H.machine.program_stopped(motive);
};

//////////////////////////////////////////////////////////////////////////
// Interactive mode commands
//////////////////////////////////////////////////////////////////////////

Hp12c_pgrm.prototype.sst = function ()
{
	if (H.machine.program_mode == H.INTERACTIVE) {
		if (H.machine.ip <= 0) {
			H.machine.ip = 1;
		}
		H.machine.program_mode = H.RUNNING_STEP_PRE;
		H.machine.display_program_opcode();
		this.log("pgrm: SST interactive begin");
	}
	H.machine.rst_modifier(1);
};

// Executed when in mode RUNNING_STEP_PRE and user presses a key
// (this exceptional case is handled by hp1xc_dispatch)
Hp12c_pgrm.prototype.run_step_finish = function ()
{
	var self = this;
	this.log("pgrm: SST interactive end+run");

	H.machine.program_mode = H.RUNNING_STEP;
	// unlikely
	H.machine.ip = (H.machine.ip <= 0) ? 1 : H.machine.ip;

	H.machine.display_pgrm();
	H.machine.display_modifier();
	this.p_sched();
};

Hp12c_pgrm.prototype.bst = function ()
{
	var self = this;

	if (H.machine.ip > 0) {
		--H.machine.ip;
	}
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
	H.machine.enter_modal(H.MODAL_PRESS);
};

Hp12c_pgrm.prototype.gto = function (label)
{
	if (! this.p_gto(label)) {
		H.machine.display_error(H.ERROR_IP);
		return;
	}

	if (H.type === "16c") {
		H.machine.display_result_s(false, true);
	} else {
		H.machine.display_result();
	}
};

Hp12c_pgrm.prototype.label = function (label)
{
	this.log("LBL #" + label);
	if (H.type === "16c") {
		H.machine.display_result_s(false, true);
	} else {
		H.machine.display_result();
	}
};

Hp12c_pgrm.prototype.gosub = function (label)
{
	var new_ip = this.find_label_or_index(label);
	
	if (! new_ip) {
		H.machine.display_error(H.ERROR_IP);
		return false;
	}

	this.clean_stack();
	// this made execution to continue from current IP
	// which is certainly not desirable
	// this.push_stack(new_ip);
	H.machine.ip = new_ip;

	if (H.type === "16c") {
		H.machine.display_result_s(false, true);
	} else {
		H.machine.display_result();
	}
	this.p_run();

	return true;
};

Hp12c_pgrm.prototype.user = function (label)
{
	var new_ip = this.find_label(label);

	if (! new_ip) {
		H.machine.display_error(H.ERROR_IP);
		return;
	}

	H.machine.display_result();
	this.clean_stack();
	H.machine.ip = new_ip;

	this.log("USER: exec from ip " + H.machine.ip);

	this.p_run();
};

Hp12c_pgrm.prototype.rtn = function (label)
{
	// does not unwind stack in interactive mode
	H.machine.ip = 0;
};

Hp12c_pgrm.prototype.dis_table = null;

Hp12c_pgrm.prototype.add_dis = function (dmap, asm, reducible, m, k)
{
	var is_addr = false;
	var mnemonic = asm.toUpperCase();
	if (reducible) {
		if (m >= 10000) {
			// m+k that cannot be an opcode in RAM
			// (but there is another closure with the
			// same mnemonic that does the same task)
			return;
		}
	}
	var opcode = Hp12c_pgrm.p_encode_instruction(parseInt(m, 10),
							parseInt(k, 10),
							is_addr);
	dmap[opcode] = mnemonic;
};

Hp12c_pgrm.prototype.generate_dis_table = function ()
{
	var K = H.dispatcher.functions;
	var dmap = {};
	this.dis_table = dmap;

	for (var key in K) {
		if (K.hasOwnProperty(key)) {
			for (var modifier in K[key]) {
				if (K[key].hasOwnProperty(modifier)) {
					var closure = K[key][modifier];
					if (closure.asm) {
						this.add_dis(dmap, closure.asm,
								closure.reducible,
								modifier, key);
					}
				}
			}
		}
	}
};

Hp12c_pgrm.prototype.disassemble = function (opcode)
{
	if (! this.dis_table) {
		this.generate_dis_table();
	}

	if (H.is_12c()) {
		if (opcode.substr(0, 6) === "43.33.") {
			return "GTO " + opcode.substr(6);
		}
	} else if (H.type === "10c") {
		if (opcode.substr(0, 3) === "22.") {
			return "GTO " + opcode.substr(3);
		}
	}

	if (!this.dis_table[opcode]) {
		return "???";
	}

	return this.dis_table[opcode];
};

Hp12c_pgrm.prototype.fast = function ()
{
	++this.fast_stack;
	this.execution_delay = 0;
};

Hp12c_pgrm.prototype.slow = function ()
{
	if (this.fast_stack > 0) {
		--this.fast_stack;
	}
	if (this.fast_stack === 0) {
		this.execution_delay = this.default_execution_delay;
	}
};
/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*jshint globalstrict: true*/

/*global H, Hp12c_pgrm */

"use strict";

Hp12c_pgrm.prototype.constructor = function ()
{
	this.exec_special = [];
	this.exec_special[H.GTO] = [3, 1, this.p_exec_gto];
	this.exec_special[H.dispatcher.KEY_RS] = [1, 0, this.p_exec_rs];

	this.type_special = [];
	var t = this.type_special;

	t[H.FF * 100 + H.dispatcher.KEY_RS] = this.p_type_pr;
	t[H.dispatcher.KEY_SST] = this.p_type_sst;
	t[H.GG * 100 + H.dispatcher.KEY_SST] = this.p_type_bst;
	t[H.dispatcher.KEY_BACKSPACE] = this.p_type_bst;
	t[H.FF * 100 + H.dispatcher.KEY_RDOWN] = this.p_type_clear_pgrm;
	t[H.GTO * 100 + H.dispatcher.KEY_DECIMAL] = this.p_type_gto_move_begin;
	t[H.GG * 100 + H.dispatcher.KEY_RDOWN] = this.p_type_gto_begin;
	t[H.GG * 100 + 9] = this.p_type_mem_info;

	for (var n = 0; n <= 9; ++n) {
		t[H.GTO_MOVE * 100 + n] = this.p_type_gto_move_n;
		t[H.GTO * 100 + n] = this.p_type_gto_n;
	}

	this.execution_delay = 100;
};

Hp12c_pgrm.prototype.p_poke = function (modifier, key, addr)
{
	if ((H.machine.ip + 1) >= H.ram_MAX) {
		H.machine.display_error(H.ERROR_IP);
		H.machine.ip = 0;
		return false;
	}
	++H.machine.ip;

	// The HP-12C *replaces* instructions on edit, does not insert them!
	//
	// for (var e = H.ram_MAX - 1; e > H.machine.ip; --e) {
	//	ram[e] = ram[e-1];
	// }

	H.machine.ram[H.machine.ip] =
		Hp12c_pgrm.p_encode_instruction(modifier, key, addr);

	return true;
};

Hp12c_pgrm.prototype.p_exec_gto = function (op)
{
	// handled in special way because it changes IP
	H.machine.ip = op[2];
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.prototype.p_type_gto_n = function (key)
{
	H.machine.gtoxx = "" + H.machine.gtoxx + key.toFixed(0);
	if (H.machine.gtoxx.length >= H.ram_ADDR_SIZE) {
		var ip = parseInt(H.machine.gtoxx, 10);
		H.machine.gtoxx = "";
		H.machine.rst_modifier(1);
		if (ip >= H.ram_MAX) {
			H.machine.display_error(H.ERROR_IP);
			return;
		}
		this.p_poke(H.GTO, ip, 1);
	}
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.type = function (key)
{
	if (this.p_type_handle_special(key)) {
		return;
	}

	// non-special key; resolve using dispatcher mechanism

	if (! H.dispatcher.handle_modifier(key, 1)) {
		// note that find_function may reset the modifier
		var f = H.dispatcher.find_function(key, 1);
		if (! f) {
			window.xlog("pgrm typing: no handler for " + key);
			H.machine.display_program_opcode();
			H.machine.rst_modifier(1);
			return;
		}
		var ok = this.p_poke(H.machine.modifier, key, 0);
		H.machine.rst_modifier(1);
		if (! ok) {
			// keep error on screen
			return;
		}
	}

	H.machine.display_program_opcode();
};
/* HP-12C emulator 
 * Copyright (c) 2007, 2011, 2016 Elvis Pfutzenreuter - epxx.co.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*jshint globalstrict: true*/
/*global H */

"use strict";

function Hp12c_storage()
{
}

Hp12c_storage.prototype.instruction_table = "0123456789_-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
Hp12c_storage.prototype.addr_prefix = "$";

Hp12c_storage.prototype.compress_opcode = function (op)
{
	var self = this;

	var c_op = "";
	var opcodelist = op.split('.');
	for (var e = 0; e < opcodelist.length; ++e) {
		var opcode = opcodelist[e];
		var lopcode = opcode.length;
		var nopcode = parseInt(opcode, 10);
		if (lopcode == H.INSTRUCTION_SIZE && nopcode >= 0 && nopcode <= 50) {
			c_op += self.instruction_table.charAt(nopcode);
		} else if (lopcode == H.ram_ADDR_SIZE) {
			c_op += self.addr_prefix; 
			if (nopcode < 64) {
				c_op += self.instruction_table.charAt(nopcode);
			} else {
				c_op += self.instruction_table.charAt(Math.floor(nopcode / 64));
				c_op += self.instruction_table.charAt(nopcode % 64);
			}
		} else {
			// invalid instruction
			return self.compress_opcode(H.STOP_INSTRUCTION);
		}
	}
	return c_op.toString();
};

Hp12c_storage.prototype.decompress_opcode = function (c_op)
{
	var self = this;

	var op = "";
	var aop = [];
	var cc;
	var ncc;
	var err = 0;
	var addr_mode = 0;
	var addr_value = 0;

	for (var e = 0; e < c_op.length; ++e) {
		cc = c_op.charAt(e);
		if (cc == self.addr_prefix) {
			if ((aop.length < 1) || (addr_mode > 0)) {
				err = 1;
				break;
			}
			addr_mode = 1;
			continue;
		}
		ncc = self.instruction_table.indexOf(cc);
		if (ncc < 0) {
			err = 1;
			break;
		}
		if (addr_mode) {
			addr_value = (addr_value * 64) + ncc;
			if (addr_value >= Math.pow(10, H.ram_ADDR_SIZE)) {
				err = 1;
				break;
			}
			if (addr_value >= H.ram_MAX) {
				err = 1;
				break;
			}
			if (addr_mode == 1) {
				aop.push(H.zeropad(addr_value, H.ram_ADDR_SIZE));
			} else {
				aop[aop.length - 1] = H.zeropad(addr_value, H.ram_ADDR_SIZE);
			}
			addr_mode += 1;
		} else {
			if (ncc > 49) {
				err = 1;
				break;
			}
			aop.push(H.zeropad(ncc, H.INSTRUCTION_SIZE));
		}
	}

	if (err) {
		op = H.STOP_INSTRUCTION;
	} else if (aop.length > H.INSTRUCTION_TOKENS || aop.length < 1) { 
		op = H.STOP_INSTRUCTION;
	} else {
		op = aop.join('.');
		/*
		// protection against "old" 12c memory being loaded on 11c
		if (op == "43.33.000" && H.STOP_INSTRUCTION != op) {
			op = H.STOP_INSTRUCTION;
		}
		if (op == "43.33.00" && H.STOP_INSTRUCTION != op) {
			op = H.STOP_INSTRUCTION;
		}
		*/
	}

	return op;
};

Hp12c_storage.prototype.marshal_array = function (a, type)
{
	var self = this;

	var mtxt = "A" + type;

	for (var ex = 0; ex < a.length; ++ex) {
		var data = a[ex];
		if (type == 'X') {
			data = self.compress_opcode(data);
		}
		mtxt += "!" + data;
		mtxt = mtxt.toString();
	}

	return mtxt;
};

Hp12c_storage.prototype.unmarshal_array = function (target, dst_name, mtxt)
{
	var self = this;

	var dst = target[dst_name]; // must be already filled with 0s or anything
	var type = mtxt.charAt(1);
	mtxt = mtxt.slice(3);
	var a = mtxt.split('!');

	if (dst_name === "mA" || dst_name === "mB" || dst_name === "mC" ||
			dst_name === "mD" || dst_name === "mE") {
		// target is matrix, and initially empty
		while (dst.length < a.length) {
			dst.push(0);
		}
	}

	for (var ex = 0; ex < a.length && ex < dst.length; ++ex) {
		if (type == 'N') {
			dst[ex] = parseFloat(a[ex]);
			if (H.badnumber(dst[ex])) {
				dst[ex] = 0;
			}
		} else {
			// programming opcode
			if (ex > 0) {
				dst[ex] = self.decompress_opcode(a[ex]);
			}
		}
	}

	return;
};

Hp12c_storage.prototype.save_memory2 = function (target)
{
	var self = this;

	var expires = new Date();
	expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // timezone irrelevant
	var sm = target.nvname + "=";
	var i, k;

	for (i = 0; i < target.nvN.length; ++i) {
		k = target.nvN[i];
		sm += k + ":" + target[k] + " ";
	}

	for (i = 0; i < target.nvAN.length; ++i) {
		k = target.nvAN[i];
		sm += k + ":" + self.marshal_array(target[k], 'N') + " ";
	}

	for (i = 0; i < target.nvAX.length; ++i) {
		k = target.nvAX[i];
		sm += k + ":" + self.marshal_array(target[k], 'X') + " ";
	}

	sm += "; expires=" + expires.toGMTString() + "; path=/";

	return sm;
};

Hp12c_storage.prototype.save = function ()
{
	var self = this;

	// WARNING this method is overridden by widgets!
	document.cookie = self.save_memory2(H.machine);
};

Hp12c_storage.prototype.get_memory = function ()
{
	var self = this;

	return self.save_memory2(H.machine);
};

Hp12c_storage.prototype.recover_memory2 = function (target, sserial)
{
	var self = this;

	var ck = sserial.split(';'); // gets all cookie variables for this site

	for (var f = 0; f < ck.length; ++f) {
		var cv = ck[f].split('=');      // split cookie variable name and value
		if (cv.length != 2) {
			continue;
		}
		cv[0] = H.trim(cv[0]);
		cv[1] = H.trim(cv[1]);
		if (cv[0] != H.type_cookie) {
			continue;
		}
		var sm = cv[1].split(' '); 	// internal variable separation
		for (var e = 0; e < sm.length; ++e) {
			var smpair = sm[e].split(':');  // each internal variable is name=value

			if (smpair.length == 2 && smpair[0].length > 0 &&
					smpair[1].length > 0 &&
					target[smpair[0]] !== undefined) {
				if (smpair[1].length >= 2 && smpair[1].charAt(0) == 'A') {
					self.unmarshal_array(target, smpair[0], smpair[1]);
				} else {
					target[smpair[0]] = parseFloat(smpair[1]);
					if (H.badnumber(target[smpair[0]])) {
						target[smpair[0]] = 0;
					}
				}
			}
		}
	}

	if (H.is_12c()) {
		return;
	}

	// calculate program_size
	H.machine.program_size = 1;
	for (var ee = 1; ee < H.ram_MAX; ++ee) {
		if (H.machine.ram[ee] != H.STOP_INSTRUCTION) {
			H.machine.program_size += 1;
		} else {
			break;
		}
	}
};

Hp12c_storage.prototype.load = function ()
{
	var self = this;

	// gets all cookie variables for this site
	// WARNING this method is overridden by widgets!
	self.recover_memory2(H.machine, document.cookie);
};

Hp12c_storage.prototype.set_memory = function (txt)
{
	var self = this;

	self.recover_memory2(H.machine, txt);
};
/* HP-12C emulator 
 * Copyright (c) 2007, 2011, 2016 Elvis Pfutzenreuter - epxx.co.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*jshint globalstrict: true*/
/*global H, Hp12c_display, Hp12c_keyboard, Hp12c_debug, Hp12c_machine, Hp12c_storage, Hp12c_dispatcher, Hp12c_pgrm */

"use strict";

function Close_hp12c()
{
	if (! Close_hp12c.done) {
		H.storage.save();
		Close_hp12c.done = 1;
	}
}
Close_hp12c.done = 0;

function Init_hp12c()
{
	H.display = new Hp12c_display();
	H.keyboard = new Hp12c_keyboard();
	H.debug = new Hp12c_debug(function (t) {
		return H.format_result_tuple(t);
	});
	H.machine = new Hp12c_machine();
	H.dispatcher = new Hp12c_dispatcher();
	H.pgrm = new Hp12c_pgrm();
	H.storage = new Hp12c_storage();

	H.machine.init();
	H.storage.load();
	H.machine.display_all();
	H.machine.sti("init");

	window.onunload = Close_hp12c;
	window.beforenunload = Close_hp12c;
	document.onunload = Close_hp12c;
	document.beforeunload = Close_hp12c;
}
H.touch_display = true;
