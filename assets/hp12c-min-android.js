/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true, bitwise: true */

"use strict";

var H = {};
H.type = "12c";
H.touch_display = false;
H.vertical_layout = false;

H.disp_theo_width = 700.0;
H.disp_theo_height = 438.0;
H.disp_key_offset_x = 44.0;
H.disp_key_offset_y = 151.0;
H.disp_key_width = 54;
H.disp_key_height = 50;
H.disp_key_dist_x = (606.0 - 44.0) / 9;
H.disp_key_dist_y = (364.0 - 151.0) / 3;
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

H.getElem = function (id)
{
	return document.getElementById(id);
};

H.badnumber = function (res)
{
	return (isNaN(res) || ! isFinite(res));
};

H.binary_sgn = function (val)
{
	return (val >= 0 ? 1 : -1);
};

H.cl5_round = function (val, decs)
{
	if (decs > 11) {
		return val;
	}
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

H.i18n = function (s, comma, dp0, grouping)
{
	// dp0 means: add decimal point after a whole number

	if (! grouping) {
		grouping = 3;
	}

	var dpos = s.indexOf('.');

	if (dpos == -1 && dp0) {
		s += ".";
		dpos = s.length - 1;
	}

	if (dpos != -1 && comma) {
		s = s.slice(0, dpos) + ',' + s.slice(dpos + 1);
	}

	if (dpos == -1) {
		// phantom position to satisfy loop ahead
		dpos = s.length;
	}

	var ts = comma ? "." : ",";

	var dstop = 0;
	while (dstop < s.length && isNaN(parseInt(s.charAt(dstop), 16))) {
		++dstop;
	}

	for (var e = dpos - grouping; e > dstop; e -= grouping) {
		s = s.slice(0, e) + ts + s.slice(e);
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
	return H.date_gen(dd, dmy).toFixed(6) + "  " + dow;
};

/* Some browsers don't have console.log */
if (! window.console) {
	window.console = {};
}
if (! window.console.log) {
	window.console.log = function (msg) {
	};
}

H.type_cookie = 'hp12c';
if (H.type === "12c-platinum") {
	H.type_cookie = 'hp12cpl';
} else if (H.type === "11c") {
	H.type_cookie = 'hp11c';
} else if (H.type === "15c") {
	H.type_cookie = 'hp15c';
} else if (H.type === "16c") {
	H.type_cookie = 'hp16c';
}

H.INTERACTIVE = 0;
H.PROGRAMMING = 1;
H.RUNNING = 2;
H.RUNNING_STEP = 3;

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

if (H.type === "11c" || H.type === "15c") {
	H.STAT_N  = 0;
	H.STAT_X  = 1;
	H.STAT_X2 = 2;
	H.STAT_Y  = 3;
	H.STAT_Y2 = 4;
	H.STAT_XY = 5;
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

H.value_max = 9.999999 * Math.pow(10, 99);
H.value_min = Math.pow(10, -99);

// 12C defaults
H.ram_MAX = 100;
H.ram_ADDR_SIZE = 2;
H.STOP_INSTRUCTION = "43.33.00"; // GTO 00, stops execution
H.STOP_INSTRUCTION_IS_INVALID = false;
H.INSTRUCTION_SIZE = 2;
H.INSTRUCTION_MAX = 100;

if (H.type === "12c-platinum") {
	H.ram_MAX = 400;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "43.33.000";
} else if (H.type === "11c") {
	H.ram_MAX = 203;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
} else if (H.type === "16c") {
	H.ram_MAX = 203;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
} else if (H.type === "15c") {
	H.ram_MAX = 322;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
}

H.MEM_MAX = 20;

if (H.type == "12c-platinum") {
	H.MEM_MAX = 30;
} else if (H.type == "16c") {
	H.MEM_MAX = 100;
}

H.FLAGS_MAX = 2;

if (H.type === "16c") {
	H.FLAGS_MAX = 6;
} else if (H.type === "15c") {
	// FIXM15 15c?
	H.FLAGS_MAX = 10;
}

// 16C flags
H.FLAG_ZEROS = 3;
H.FLAG_CARRY = 4;
H.FLAG_OVERFLOW = 5;

// ############### Errors
H.ERROR_DIVZERO = 0;
H.ERROR_OVERFLOW = 1;
H.ERROR_STAT = 2;
H.ERROR_IP = 4;

// 11C
H.ERROR_INDEX = 3;
H.ERROR_RTN = 5;
H.ERROR_FLAG = 6;

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
H.ERROR_DEFECTIVE = 9; // hopefully will never happen in this machine :)

// FIXM15 15C errors

H.make_closure = function (fname, args, asm)
{
	var f = function () {
		H.machine[fname].apply(H.machine, args);
	};

	f.closure_type = "machine";
	f.closure_name = fname;
	f.reducible = false;
	f.no_pgrm = 0;
	f.asm = asm;

	return f;
};

H.make_pgrm_closure = function (fname, arg, asm)
{
	var f = function () {
		H.pgrm[fname].call(H.pgrm, arg);
	};

	f.closure_type = "pgrm";
	f.closure_name = fname;
	f.no_pgrm = 0;
	f.asm = asm;

	return f;
};

/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

// FIXM15 imaginary

function Hp12c_debug(format_result)
{
	this.memwin = null;
	this.format_result = format_result;
}

Hp12c_debug.prototype.show_memory2 = function ()
{
	if (! this.memwin || ! this.memwin.document) {
		// window has been closed; don't schedule updates anymore
		this.memwin = null;
		return;
	}

	var windoc = this.memwin.document;
	var now = new Date();
	var title = windoc.getElementById('tt');
	var e;

	if (title) {
		title.innerHTML = H.type + " memory at " + now;

		if (H.type === "12c" || H.type === "12c-platinum") {
			for (e = 0; e < H.machine.finmemory.length; ++e) {
				windoc.getElementById("finmemory" + e).innerHTML =
					this.format_result({r: H.machine.finmemory[e]});
			}
		}
		for (e = 0; e < H.machine.stomemory.length; ++e) {
			var elem = windoc.getElementById("stomemory" + e);
			if (! elem && e >= 32) {
				// pardon (16c has *lots* of memory)
				continue;
			}
			elem.innerHTML =
				this.format_result(H.machine.sto_tuple(e));
		}
		if (H.type === "12c" || H.type === "12c-platinum") {
			for (e = 0; e < H.machine.njmemory.length; ++e) {
				windoc.getElementById("njmemory" + e).innerHTML =
					this.format_result({r: H.machine.njmemory[e]});
			}
		}
		// FIXM15 15C imaginary parts
		windoc.getElementById("x").innerHTML =
			this.format_result(H.machine.reg_tuple("x"));
		windoc.getElementById("last_x").innerHTML =
			this.format_result(H.machine.reg_tuple("last_x"));
		windoc.getElementById("y").innerHTML =
			this.format_result(H.machine.reg_tuple("y"));
		windoc.getElementById("z").innerHTML =
			this.format_result(H.machine.reg_tuple("z"));
		windoc.getElementById("w").innerHTML =
			this.format_result(H.machine.reg_tuple("w"));

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

	// closure trick, since 'this' changes meaning inside setTimeout
	var a = this;
	window.setTimeout(function () {
		a.show_memory2();
	}, 1000);
};

Hp12c_debug.prototype.show_memory = function ()
{
	this.memwin = window.open(H.type_cookie + '_memory.html');
	var a = this;
	window.setTimeout(function () {
		a.show_memory2();
	}, 1000);
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H, Hp12c_machine */

"use strict";

function Hp12c_dispatcher()
{
}

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
K[I][H.STO] = H.make_closure("stofin", [0], "STO n");
K[I][H.STO].dont_rst_do_fincalc = 1;
K[I][0] = H.make_closure("sto_or_calc_fin", [0], "n");
K[I][0].dont_rst_do_fincalc = 1;

I = 12;

K[I][H.FF] = H.make_closure("simple_interest", [], "INT");
K[I][H.GG] = H.make_closure("stoi_12div", [], "i 12/");
K[I][H.GG].dont_rst_do_fincalc = 1;
K[I][H.RCL] = H.make_closure("rclfin", [1], "RCL i");
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

I = 21;

K[I][H.FF] = H.make_closure("bond_price", [], "PRICE");
K[I][H.GG] = H.make_closure("sqroot", [], "SQRT");
K[I][0] = H.make_closure("poweryx", [], "POWER");

I = 22;

K[I][H.FF] = H.make_closure("bond_yield", [], "YTM");
K[I][H.GG] = H.make_closure("exp", [], "EXP");
K[I][0] = H.make_closure("reciprocal", [], "1/X");

I = 23;

K[I][H.FF] = H.make_closure("depreciation_sl", [], "DEPR SL");
K[I][H.GG] = H.make_closure("ln", [], "LN");
K[I][0] = H.make_closure("percentT", [], "%T");

I = 24;

K[I][H.FF] = H.make_closure("depreciation_soyd", [], "DEPR SOYD");
K[I][H.GG] = H.make_closure("frac", [], "FRAC");
K[I][0] = H.make_closure("deltapercent", [], "D%");

I = 25;

K[I][H.FF] = H.make_closure("depreciation_db", [], "DEPR DB");
K[I][H.GG] = H.make_closure("intg", [], "INTG");
K[I][0] = H.make_closure("percent", [], "%");

I = 26;

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
	K[I][H.GG] = H.make_closure("enter", [1], "ENTER");
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

M[I][H.STO] = H.STO_MINUS;

I = 41;

K[I][0] = H.make_closure("toggle_decimal_character", [], "ON");
K[I][0].no_pgrm = 1;
K[I][H.RCL] = H.make_closure("shv", [], "SHV");
K[I][H.RCL].no_pgrm = 1;
K[I][H.STO] = H.make_closure("apocryphal", [1], "APOCRYPHAL 1");
K[I][H.STO].no_pgrm = 1;

I = 42;

M[I][0] = H.FF;

I = 43;

M[I][0] = H.GG;
M[I][H.RCL] = H.RCL_GG;

I = 44;

M[I][0] = H.STO;

I = 45;

M[I][0] = H.RCL;

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

I = 40;

if (H.type == "12c-platinum") {
	K[I][H.GG] = H.make_closure("lstx", [], "LSTx");
}

K[I][0] = H.make_closure("plus", [], "+");
M[I][H.STO] = H.STO_PLUS;

I = 98;

K[I][0] = H.make_closure("digit_delete", [], "BSP");
K[I][0].no_pgrm = 1;


Hp12c_dispatcher.prototype.handle_modifier = function (key, pgrm_mode)
{
	var modifier_table = this.modifier_sm[key];

	if (modifier_table) {
		var next_modifier = modifier_table[H.machine.modifier];
		if (next_modifier) {
			// a modifier potentialized by a previous one
			H.machine.set_modifier(next_modifier);
			return true;
		} else if (modifier_table[0]) {
			// a modifier of its own right, like f, g
			H.machine.set_modifier(modifier_table[0]);
			return true;
		}
	}

	return false;
};

Hp12c_dispatcher.prototype.find_function = function (key, pgrm_mode)
{
	var function_table = this.functions[key];
	var f = null;

	if (function_table) {
		f = function_table[H.machine.modifier];
		if (!f) {
			// no function given current modifier
			f = function_table[0];
			if (f) {
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
	// this is used when a real key is pressed

	if (key == 99) {
		H.debug.show_memory();
		return;
	}

	if (H.machine.error_in_display) {
		H.machine.reset_error();
		return;
	} else if (H.machine.program_mode == H.PROGRAMMING) {
		H.pgrm.type(key);
		return;
	} else if (H.machine.program_mode >= H.RUNNING) {
		H.pgrm.stop();
		return;
	}

	this.dispatch_common(key);
};

Hp12c_dispatcher.prototype.dispatch_common = function (key)
{
	// this is used bAoth by real keys and program scheduler

	var ok = 1;

	if (this.handle_modifier(key, 0)) {
		return ok;
	}

	// key is not modifier in this context, try a function

	var f = this.find_function(key, 0);

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
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true */
/*global H */

"use strict";

// FIXM15 15c augment (complex)
// FIXM15 15c flags

function Hp12c_display()
{
	this.display_max = 9999999999;
	this.display_len = 10; // without extra -
	this.display_min = 0.0000000001;
	this.lcd = [];
	this.contents = "";
	this.contents_alt = "";
	this.blink_delay = 25;

	var LCD_A = 1;
	var LCD_B = 2;
	var LCD_C = 4;
	var LCD_D = 8;
	var LCD_E = 16;
	var LCD_F = 32;
	var LCD_G = 64;
	var LCD_P = 128;
	var LCD_T = 256;

	this.lcdmap = [];

	this.lcdmap['0'] = LCD_A | LCD_B | LCD_C | LCD_E | LCD_F | LCD_G;
	this.lcdmap['1'] = LCD_C | LCD_F;
	this.lcdmap['2'] = LCD_A | LCD_C | LCD_D | LCD_E | LCD_G;
	this.lcdmap['3'] = LCD_A | LCD_C | LCD_D | LCD_F | LCD_G;
	this.lcdmap['4'] = LCD_B | LCD_C | LCD_D | LCD_F;
	this.lcdmap['5'] = LCD_A | LCD_B | LCD_D | LCD_F | LCD_G;
	this.lcdmap['6'] = LCD_A | LCD_B | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['7'] = LCD_A | LCD_C | LCD_F;
	this.lcdmap['8'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['9'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_F | LCD_G;
	this.lcdmap[' '] = 0;
	this.lcdmap['.'] = LCD_P;
	this.lcdmap[','] = LCD_P | LCD_T;
	this.lcdmap['r'] = LCD_A | LCD_B;
	this.lcdmap['U'] = LCD_B | LCD_C | LCD_E | LCD_F | LCD_G;
	this.lcdmap['u'] = LCD_B | LCD_C | LCD_D;
	this.lcdmap['n'] = LCD_B | LCD_C | LCD_A;
	this.lcdmap['i'] = LCD_B;
	this.lcdmap['g'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_F | LCD_G;
	this.lcdmap['-'] = LCD_D;
	this.lcdmap['A'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E | LCD_F;
	this.lcdmap['a'] = this.lcdmap['A'];
	this.lcdmap['B'] = LCD_B | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['b'] = this.lcdmap['B'];
	this.lcdmap['c'] = LCD_D | LCD_E | LCD_G;
	this.lcdmap['C'] = this.lcdmap['c'];
	this.lcdmap['d'] = LCD_C | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['D'] = this.lcdmap['d'];
	this.lcdmap['E'] = LCD_A | LCD_B | LCD_D | LCD_E | LCD_G;
	this.lcdmap['e'] = this.lcdmap['E'];
	this.lcdmap['F'] = LCD_A | LCD_B | LCD_D | LCD_E;
	this.lcdmap['f'] = this.lcdmap['F'];
	this.lcdmap['H'] = LCD_B | LCD_C | LCD_D | LCD_E | LCD_F;
	this.lcdmap['h'] = LCD_B |         LCD_D | LCD_E | LCD_F;
	this.lcdmap['o'] = LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['O'] = this.lcdmap["o"];
	this.lcdmap['R'] = LCD_D | LCD_E;
	this.lcdmap['P'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E;
	this.lcdmap[':'] = LCD_P;

	for (var e = 0; e <= 10; ++e) {
		this.lcd[e] = [];
		this.lcd[e][0] = 0;
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "a");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "b");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "c");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "d");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "e");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "f");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "g");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "p");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "t");
	}
	
	this.display = H.getElem("display");
	this.dbegin = H.getElem("begin");
	this.ddmyc = H.getElem("dmyc");
	this.dmodifier = H.getElem("modifier");
	this.pgrm = H.getElem("pgrm");
	this.rpnalg = H.getElem("rpnalg");
	this.trigo = H.getElem("trigo");
	this.user = H.getElem("user");
	this.carry = H.getElem("carry");
	this.overflow = H.getElem("overflow");
	this.altdisplay = H.getElem("altdisplay");
	this.wordstatus = H.getElem("wordstatus");

	this.clear();
}

// TODO unit test LCD and annunciators
Hp12c_display.prototype.private_show_digit = function (dgt, pos, merge)
{
	if (pos >= this.lcd.length) {
		window.console.log("Too many characters for display");
		return;
	}
	if (! this.lcdmap[dgt]) {
		dgt = ' ';
	}
	var map = this.lcdmap[dgt];
	var element = this.lcd[pos];
	var e; 
	var f = 1;
	for (e = 1; e < element.length; ++e) {
		element[e].style.visibility = (map & f) ? "visible" : 
			((merge && element[e].style.visibility == "visible") ? "visible" :"hidden");
		f <<= 1;
	}
};

Hp12c_display.prototype.private_lcd_display = function (txt) 
{
	var f = -1;
	for (var e = 0; e < txt.length && f < this.lcd.length; ++e) {
		var dgt = txt.charAt(e);
		++f;
		if (dgt == '.' || dgt == ',') {
			// merge decimal point/thousand separator
			--f;
			this.private_show_digit(dgt, f, 1);
		} else {
			this.private_show_digit(dgt, f, 0);
		}
	}
	for (++f; f < this.lcd.length; ++f) {
		this.private_show_digit(' ', f, 0);
	}
};

Hp12c_display.prototype.show = function (txt)
{
	// printf("display show: " + txt);
	this.contents = txt;

	this.private_lcd_display(txt);
};

Hp12c_display.prototype.show_alt = function (txt)
{
	this.contents_alt = txt;

	if (this.altdisplay) {
		this.altdisplay.innerHTML = txt;
	}
};

Hp12c_display.prototype.html_wrap = function (txt)
{
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

Hp12c_display.prototype.show_wordstatus = function (txt)
{
	if (this.wordstatus) {
		this.wordstatus.innerHTML = txt;
	}
};

Hp12c_display.prototype.clear = function ()
{
	for (var e = 0; e < this.lcd.length; ++e) {
		for (var f = 1; f < this.lcd[e].length; ++f) {
			this.lcd[e][f].style.visibility = "hidden";
		}
	}
	this.show_alt("");
	this.show_wordstatus("");
};

Hp12c_display.prototype.format_result_tuple = function (t)
{
	if (H.machine.notation < H.NOTATION_INT) {
		return this.format_result(t.r);
	}
	return this.format_result_int(t);
};

Hp12c_display.prototype.format_result = function (n)
{
	var res = "";
	var absn = Math.abs(n);
	var fix_dec = H.machine.decimals;
	var mantissa_dec = H.machine.decimals;
	var notation = H.machine.notation;
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

	var co = H.machine.comma;

	if (notation == H.NOTATION_FIX) {
		mantissa_dec = 6;
		if (absn > this.display_max) {
			// too big to be shown normally
			notation = H.NOTATION_SCI;
		} else if (absn !== 0 && scale < -9) {
			// too small to be shown normally
			notation = H.NOTATION_SCI;
		} else if (absn !== 0 && fix_dec < (-scale)) {
			// we need more decimals to show this number
			fix_dec = -scale;
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

	if (notation != H.NOTATION_FIX) {
		// show as exponential
		if (mantissa === 0 && (H.type !== "11c" && H.type !== "15c") && false) {
			// in SCI mode, 12C shows 0.0000000 00 too...
			return H.i18n(' 0', co, 1);
		} else if (degenerate == 1) {
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
		var max_m_len = this.display_len - 3 + 1 + 1;

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
		// window.console.log(" " + n + " " + mantissa + " " + scale + " d " + degenerate + " " + res);

		return res;
	}

	// show as fixed, w/o exp
	var dec = Math.max(0, fix_dec);
	var sgn = n < 0 ? "-" : " ";
	n = Math.abs(n);
	var ll = n.toFixed(dec).length - (dec > 0 ? 1 : 0);
	if (ll > this.display_len) {
		// reduce decimals if too big for display
		dec -= (ll - this.display_len);
		dec = Math.max(0, dec);
	}
	res = H.i18n(sgn + n.toFixed(dec), co, 1);

	return res;
};

Hp12c_display.prototype.get_radix = function ()
{
	var radix = H.radix[H.machine.notation];
	var suffix = H.radix_suffix[H.machine.notation];

	return [radix, suffix];
};

Hp12c_display.prototype.integer_to_string = function (t, radix)
{
	// for non-decimal, how as unsigned
	var negative_repr = 0;
	if (radix === 10) {
		negative_repr = H.machine.negative_repr;
	}

	var spure = H.integer_to_string(t,
					negative_repr,
					H.machine.wordsize,
					radix,
					true);

	return spure;
};

Hp12c_display.prototype.format_result_int = function (t)
{
	var radix = this.get_radix()[0];
	return this.integer_to_string(t, radix);
};

Hp12c_display.prototype.p_display_integer = function (x, xmode, typed_digits)
{
	var typing = xmode > -100; // -100, -1, 0
	var point1 = "";
	var point2 = "";
	var sign = " ";
	var show_apocryphal = (H.machine.altdisplay > 0);

	var radix = this.get_radix();
	var suffix = radix[1];
	radix = radix[0];

	var spure = this.integer_to_string(x, radix);
	var spure16;
	if (radix === 2) {
		spure16 = this.integer_to_string(x, 16);
	}
	// console.log(spure);

	if (spure.substr(0, 1) === "-") {
		spure = spure.substr(1);
		sign = "-";
	}

	var s, sfull;
	var len = 8;

	var bits_per_digit = H.digit_bits[H.machine.notation];
	var digits_on_display = H.win_digits[H.machine.notation];
	var tot_digits = Math.ceil(H.machine.wordsize / bits_per_digit);
	var wincount = H.machine.window_count();
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

	var current_window = typing ? 0 : H.machine.intwindow;

	show_apocryphal = show_apocryphal &&
				(significant_windows > 1 || current_window > 0);

	var filler = " ";
	if (H.machine.get_zeros_flag() && radix !== 10) {
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
	si2 = H.i18n(si2, H.machine.comma, 0, radix === 10 ? 3 : 4);
	// Remove LSB compensation, if it was made above
	if (radix === 10 && r10comp > 0) {
		si2 = si2.substr(0, si2.length - r10comp);
	}
	s = lcdsign + si2 + " " + point1 + suffix + point2;

	sfull = sign + (radix === 2 ? spure16 : spure);
	sfull = H.i18n(sfull, H.machine.comma, 0, radix === 10 ? 3 : 4);

	this.show(s);
	if (show_apocryphal) {
		this.show_alt(this.html_wrap(sfull));
	} else {
		this.show_alt("");
	}
};

Hp12c_display.prototype.displayNumber_now_integer = function (x)
{
	this.p_display_integer(x, -100);
};

Hp12c_display.prototype.displayNumber_now = function (x)
{
	if (H.type === "16c" && H.machine.notation >= H.NOTATION_INT) {
		this.displayNumber_now_integer(x);
		return;
	}

	var co = H.machine.comma;
	x = x.r;

	if (isNaN(x)) {
		x = 0;
	} else if (x > H.value_max) {
		x = H.value_max;
	} else if (x < -H.value_max) {
		x = -H.value_max;
	} else if (Math.abs(x) < H.value_min) {
		x = 0;
	}

	// display result
	var sres = this.format_result(x);
	this.show(sres);
	this.show_alt("");
};

Hp12c_display.prototype.displayNumber = function (x)
{
	H.machine.cli("display");
	this.show("");
	var a = this;
	// printf("## Scheduling to display " + x.r + " " + x.h);
	window.setTimeout(function () {
		H.machine.sti("display");
		a.displayNumber_now(x);
	}, this.blink_delay);
};

Hp12c_display.prototype.displayTypedNumber_integer = function (val, xmode, digits)
{
	this.p_display_integer(val, xmode, digits);
};

Hp12c_display.prototype.displayTypedNumber = function (ms, m, dec, exp, exps, xmode)
{
	var s = "";
	var co = H.machine.comma;

	if (xmode === 0) {
		if (m.length <= 0) {
			s = " 0";
		} else {
			s = (ms < 0 ? "-" : " ") + m;
		}
		if (H.type !== "11c" && H.type !== "15c") {
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
	this.show(s);
	this.show_alt("");
};

H.mod_stt = null;

Hp12c_display.prototype.modifier_table = function ()
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

	if (H.type === "12c" || H.type === "12c-platinum") {
		a[H.RCL_GG] = "RCL g";

	} else if (H.type === "11c" || H.type === "15c") {
		a[H.HYP] = "HYP";
		a[H.HYPINV] = "HYPINV";
		a[H.LBL] = "f LBL";
		a[H.GSB] = "GSB";
		a[H.FIX] = "f FIX";
		a[H.SCI] = "f SCI";
		a[H.ENG] = "f ENG";
		a[H.STO_FF] = "STO f";
		a[H.RCL_FF] = "RCL f";
		a[H.GG_SF] = "g SF";
		a[H.GG_CF] = "g CF";
		a[H.GG_FQUESTION] = "g F?";
		a[H.STO_PLUS_FF] = "STO+,f";
		a[H.STO_MINUS_FF] = "STO-,f";
		a[H.STO_TIMES_FF] = "STO×,f";
		a[H.STO_DIVIDE_FF] = "STO÷,f";

	} else if (H.type === "16c") {
		a[H.LBL] = "g LBL";
		a[H.GSB] = "GSB";
		a[H.GG_SF] = "g SF";
		a[H.GG_CF] = "g CF";
		a[H.GG_FQUESTION] = "g F?";
		a[H.STO_FF] = "STO f";
		a[H.RCL_FF] = "RCL f";
		a[H.WINDOW] = "WINDOW";
		a[H.FLOAT] = "FLOAT";
	}

	H.mod_stt = a;
	return H.mod_stt;
};

Hp12c_display.prototype.show_modifier = function (m)
{
	var txt = this.modifier_table()[m];
	if (txt === undefined || txt === null) {
		console.log("Unknown modifier " + m);
		txt = "";
	}

	if (this.dmodifier) {
		this.dmodifier.innerHTML = txt;
	}
};

Hp12c_display.prototype.show_begin = function (is_begin)
{
	var txt = "";
	if (is_begin) {
		txt = "BEGIN";
	}

	if (this.dbegin) {
		this.dbegin.innerHTML = txt;
	}
};

Hp12c_display.prototype.show_carry = function (is_carry)
{
	var txt = "";
	if (is_carry) {
		txt = "C";
	}

	if (H.type === "16c" && this.carry) {
		this.carry.innerHTML = txt;
	}
};

Hp12c_display.prototype.show_overflow = function (is_overflow)
{
	var txt = "";
	if (is_overflow) {
		txt = "G";
	}

	if (H.type === "16c" && this.overflow) {
		this.overflow.innerHTML = txt;
	}
};

Hp12c_display.prototype.show_error = function (err)
{
	this.show("ERROR " + err);
	this.show_alt("");
};

Hp12c_display.prototype.display_meminfo = function (mem, stolen)
{
	--stolen;
	var stolen_txt = stolen.toFixed(0);
	if (H.type !== "16c") {
		stolen_txt = (stolen % 10).toFixed(0);
		if (stolen >= 10) {
			stolen_txt = ":" + stolen_txt;
		}
	}
	this.show("P-" + H.zeropad(mem, H.ram_ADDR_SIZE) + " R-" + stolen_txt);
	this.show_alt("");
};

Hp12c_display.prototype.show_dmyc = function (dmy, compoundf)
{
	var txt = "";
	if (dmy) {
		txt += "D.MY";
	}
	if (compoundf) {
		txt += "&nbsp;&nbsp;C";
	}
	if (this.ddmyc) {
		this.ddmyc.innerHTML = txt;
	}
};

Hp12c_display.prototype.show_pse = function ()
{
	if (this.dmodifier) {
		this.dmodifier.innerHTML = "PAUSE";
	}
};

Hp12c_display.prototype.show_pgrm = function (pgrm, run, pc)
{
	var txt = "";
	if (pgrm) {
		txt = "PRGM";
	} else if (run) {
		txt = "RUN " + H.zeropad(pc.toFixed(0), 2);
	}
	if (this.pgrm) {
		this.pgrm.innerHTML = txt;
	}
};

Hp12c_display.prototype.show_algmode = function (algmode)
{
	if (this.rpnalg && H.type === "12c-platinum") {
		var txt = ["RPN", "ALG"][algmode];
		this.rpnalg.innerHTML = txt;
	}
};

Hp12c_display.prototype.show_trigo = function (trigo)
{
	if (H.type === "11c" || H.type === "15c") {
		var txt = ["", "RAD", "GRAD"][trigo];
		if (this.trigo) {
			this.trigo.innerHTML = txt;
		}
	}
};

Hp12c_display.prototype.show_user = function (user)
{
	if (H.type === "11c" || H.type === "15c") {
		var txt = ["", "USER"][user];
		if (this.user) {
			this.user.innerHTML = txt;
		}
	}
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true, bitwise: true */
/*global H */

"use strict";

function Hp12c_keyboard()
{
	this.is_enabled = 0;
	this.kbdtable = {};
	this.kbdtable['0'] = 0;
	this.kbdtable['.'] = 48;
	this.kbdtable[','] = 48;
	this.kbdtable['1'] = 1;
	this.kbdtable['2'] = 2;
	this.kbdtable['3'] = 3;
	this.kbdtable['4'] = 4;
	this.kbdtable['5'] = 5;
	this.kbdtable['6'] = 6;
	this.kbdtable['7'] = 7;
	this.kbdtable['8'] = 8;
	this.kbdtable['9'] = 9;
	this.kbdtable['+'] = 40;
	this.kbdtable['='] = 40;
	this.kbdtable['-'] = 30;
	this.kbdtable['*'] = 20;
	this.kbdtable['x'] = 20;
	this.kbdtable['X'] = 20;
	this.kbdtable['/'] = 10;
	this.kbdtable[':'] = 10;
	this.kbdtable['\r'] = 36;
	this.kbdtable['\n'] = 36;
	this.kbdtable[' '] = 36;
	this.kbdtable['f'] = 42;
	this.kbdtable['F'] = 42;
	this.kbdtable['g'] = 43;
	this.kbdtable['G'] = 43;
	this.kbdtable['s'] = 44;
	this.kbdtable['S'] = 44;
	this.kbdtable['r'] = 45;
	this.kbdtable['R'] = 45;
	this.kbdtable['o'] = 41;
	this.kbdtable['O'] = 41;

	H.hp1xc_keyboard_flavor(this.kbdtable);

	// stay here while vertical map translation is uniform across models
	this.vertical_map = {};
	this.vertical_map[0] = -1;
	this.vertical_map[1] = 11;
	this.vertical_map[2] = 12;
	this.vertical_map[3] = 13;
	this.vertical_map[4] = 14;
	this.vertical_map[5] = 15;
	this.vertical_map[10] = -1;
	this.vertical_map[11] = 21;
	this.vertical_map[12] = 22;
	this.vertical_map[13] = 23;
	this.vertical_map[14] = 24;
	this.vertical_map[15] = 25;
	this.vertical_map[20] = 41;
	this.vertical_map[21] = 31;
	this.vertical_map[22] = 32;
	this.vertical_map[23] = 33;
	this.vertical_map[24] = 34;
	this.vertical_map[25] = 35;
	this.vertical_map[30] = 45;
	this.vertical_map[31] = 16;
	this.vertical_map[32] = 7;
	this.vertical_map[33] = 8;
	this.vertical_map[34] = 9;
	this.vertical_map[35] = 10;
	this.vertical_map[40] = 44;
	this.vertical_map[41] = 26;
	this.vertical_map[42] = 4;
	this.vertical_map[43] = 5;
	this.vertical_map[44] = 6;
	this.vertical_map[45] = 20;
	this.vertical_map[50] = 43;
	this.vertical_map[51] = 36;
	this.vertical_map[52] = 1;
	this.vertical_map[53] = 2;
	this.vertical_map[54] = 3;
	this.vertical_map[55] = 30;
	this.vertical_map[60] = 42;
	this.vertical_map[61] = 36;
	this.vertical_map[62] = 0;
	this.vertical_map[63] = 48;
	this.vertical_map[64] = 49;
	this.vertical_map[65] = 40;

	this.pointer_div = H.getElem("pointer_div");

	// recalculate keyboard coordinates
	// based on original ones for 700x438 image
	this.kx = parseInt(this.pointer_div.style.width, 10) / H.disp_theo_width;
	this.ky = parseInt(this.pointer_div.style.height, 10) / H.disp_theo_height;

	this.xoff = H.disp_key_offset_x * this.kx;
	this.yoff = H.disp_key_offset_y * this.ky;

	this.xl = H.disp_key_width * this.kx;
	this.yl = H.disp_key_height * this.ky;

	this.xd = H.disp_key_dist_x * this.kx;
	this.yd = H.disp_key_dist_y * this.ky;

	this.microsoft = (window.navigator && window.navigator.msPointerEnabled && true);
	
	var o = this;

	if (H.touch_display) {
		if (this.microsoft) {
			var handler = function (x) {
				o.mouse_click(x);
			};
			window.cross.addEventListener("MSPointerDown", handler, true);
		} else {
			H.getElem("cross").ontouchstart = function (x) {
				o.mouse_click(x);
			};
		}
	} else {	
		H.getElem("cross").onclick = function (x) {
			o.mouse_click(x);
		};
	}
	document.onkeypress = function (x) {
		o.hard_keyboard(x);
	};
}

Hp12c_keyboard.prototype.enable = function ()
{
	this.is_enabled = 1;
	// console.log("kbd enabled ");
};

Hp12c_keyboard.prototype.disable = function ()
{
	this.is_enabled = 0;
	// console.log("kbd disabled ");
};

Hp12c_keyboard.prototype.enabled = function ()
{
	return this.is_enabled;
};

Hp12c_keyboard.prototype.remap_key_vertical = function (raw)
{
	var key = this.vertical_map[raw];
	if (key === undefined || key === null) {
		key = -1;
	}
	return key;
};

// TODO unit test key mapping etc.

Hp12c_keyboard.prototype.remap_key = function (raw)
{
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

Hp12c_keyboard.prototype.hard_keyboard = function (e)
{
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

	var kk = this.kbdtable[keychar];
	if (kk !== undefined && kk !== null) {
		if (this.enabled()) {
			H.dispatcher.dispatch(this.kbdtable[keychar]);
		}
		e.returnValue = false;
		if (e.preventDefault) {
			e.preventDefault();
		}
		return false;
	}
	return true;
};

Hp12c_keyboard.prototype.mouse_click = function (evt)
{
	if (! evt) {
		evt = window.event;
	}

	var pos_x, pos_y;

	if (H.touch_display) {
		evt.preventDefault();
		if (this.microsoft) {
			pos_x =	(evt.pageX - this.pointer_div.offsetLeft) - this.xoff;
			pos_y = (evt.pageY - this.pointer_div.offsetTop) - this.yoff;
		} else {
			pos_x =	(evt.targetTouches[0].pageX - this.pointer_div.offsetLeft) - this.xoff;
			pos_y = (evt.targetTouches[0].pageY - this.pointer_div.offsetTop) - this.yoff;
		}
	} else {
		pos_x = (evt.offsetX ? evt.offsetX : 
			(evt.pageX - this.pointer_div.offsetLeft)) - this.xoff;
		pos_y = (evt.offsetY ? evt.offsetY :
			(evt.pageY - this.pointer_div.offsetTop)) - this.yoff;
	}

	var key;
	var in_key;

	if (H.vertical_layout) {
		if (pos_x < 0 || pos_y < 0 || pos_x >= this.xd * 6 || pos_y >= this.yd * 7) {
			return;
		}

		key = Math.floor(pos_x / this.xd) + 10 * Math.floor(pos_y / this.yd);

		while (pos_x > this.xd) {
			pos_x -= this.xd;
		}

		while (pos_y > this.yd) {
			pos_y -= this.yd;
		}

		in_key = (pos_x < this.xl) && ((pos_y < this.yl) || key == 51);
		if (in_key) {
			key = this.remap_key_vertical(key);
			if (key >= 0) {
				if (this.enabled()) {
					H.dispatcher.dispatch(key);
				}
			}
		}
	} else {
		if (pos_x < 0 || pos_y < 0 || pos_x >= this.xd * 10 || pos_y >= this.yd * 4) {
			return;
		}

		key = Math.floor(pos_x / this.xd) + 10 * Math.floor(pos_y / this.yd);

		while (pos_x > this.xd) {
			pos_x -= this.xd;
		}

		while (pos_y > this.yd) {
			pos_y -= this.yd;
		}

		in_key = (pos_x < this.xl) && ((pos_y < this.yl) || key == 25);
		if (in_key) {
			if (this.enabled()) {
				H.dispatcher.dispatch(this.remap_key(key));
			}
		}
	}
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true, bitwise: true */
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

/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true */
/*global H */

"use strict";

// FIXM15 stack-neutral operations (that don't change this.pushed)
// test with 12C and 11C

function Hp12c_machine()
{
	// algebraic operations

	this.ALG_PLUS = 1;
	this.ALG_MINUS = 2;
	this.ALG_MULTIPLY = 3;
	this.ALG_DIVIDE = 4;
	this.ALG_POWER = 5;

	this.nvname = H.type_cookie;

	// TODO this should be in init_memory()
	// and unit tests should wait it to go back to 1
	this.sti_level = 0;

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
	this.alg_op = 0;

	// 15C imaginary parts of each register
	this.xi = 0;
	this.yi = 0;
	this.zi = 0;
	this.wi = 0;
	this.last_xi = 0;
	// FIXM15 handle complex mode and calculations (15c)

	this.matrixmem = [];
	// FIXM15 zeroing matrixmem (15c)

	// 16C "high" parts of 64-bit integer numbers
	this.xh = 0;
	this.yh = 0;
	this.zh = 0;
	this.wh = 0;
	this.last_xh = 0;
	this.stomemoryh = [];
	this.wordsize = H.DEFAULT_WORDSIZE;
	this.intwindow = 0;
	this.negative_repr = 2;

	this.stomemory = [];
	this.finmemory = [];
	this.njmemory = [];
	this.index = 0; // not-12C

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

	this.prng = new H.Prng(1);

	// volatile memory ---------------------------------------------------------------------

	this.algmode = 0;
	this.program_mode = 0;
	this.ip = 0;
	this.pushed = 0;
	this.gtoxx = "";
	this.modifier = 0;
	this.do_fincalc = 0;
	this.xmode = -1;
	this.typed_mantissa = "";
	this.typed_decimals = "";
	this.typed_mantissa_signal = 1;
	this.typed_exponent = "00";
	this.typed_exponent_signal = 1;
	this.error_in_display = 0;

	this.call_stack = []; // not-12C

	if (H.type === '11c') {
		this.nvN = ['x', 'y', 'z', 'w', 'last_x', 
			  'decimals', 'comma', 'index',
			  'trigo', 'user', 'notation'];
		this.nvAN = ['stomemory', 'flags'];
	} else if (H.type === '15c') {
		this.nvN = ['x',  'y',  'z',  'w',  'last_x',
                            'xi', 'yi', 'zi', 'wi', 'last_xi',
			  'decimals', 'comma', 'index',
			  'trigo', 'user', 'notation', 'complex'];
		this.nvAN = ['stomemory', 'matrixmem', 'flags'];
	} else if (H.type === '16c') {
		this.nvN = ['x',  'y',  'z',  'w',  'last_x',
			    'xh', 'yh', 'zh', 'wh', 'last_xh',
			  'decimals', 'comma', 'index', 'notation',
			  'wordsize', 'intwindow', 'negative_repr',
			'altdisplay'];
		this.nvAN = ['stomemory', 'stomemoryh', 'flags'];
	} else {
		// 12C
		this.nvN = ['x', 'y', 'z', 'w', 'last_x', 'alg_op', 'algmode',
				'decimals', 'comma', 'begin',
				'dmy', 'compoundf', 'notation'];
		this.nvAN = ['stomemory', 'finmemory', 'njmemory'];
	}
	this.nvAX = ['ram'];
};

Hp12c_machine.prototype.check_reg = function (n)
{
	if (n !== "x" && n !== "y" && n !== "z" && n !== "w" && n !== "last_x") {
		console.log("Bad register name");
		return false;
	}
	return true;
};

Hp12c_machine.prototype.sto_Reset = function (i)
{
	this.stomemory[i] = 0;
	this.stomemoryh[i] = 0;
};

Hp12c_machine.prototype.reg_Reset = function (n)
{
	if (! this.check_reg(n)) {
		return;
	}
	this[n] = 0;
	this[n + "h"] = 0;
	this[n + "i"] = 0;
};

Hp12c_machine.prototype.sto_Swap_reg = function (i, n)
{
	if (! this.check_reg(n)) {
		return;
	}
	var tr = {r: this.stomemory[i], h: this.stomemoryh[i]};
	var ts = {r: this[n], h: this[n + "h"]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(tr);
		this.cast_wordsize(ts);
	}

	this.stomemory[i] = ts.r;
	this.stomemoryh[i] = ts.h;
	this[n] = tr.r;
	this[n + "h"] = tr.h;
};

Hp12c_machine.prototype.sto_To_reg = function (i, n)
{
	if (! this.check_reg(n)) {
		return;
	}

	var t = {r: this.stomemory[i], h: this.stomemoryh[i]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	this[n] = t.r;
	this[n + "h"] = t.h; // 16C integer
};

Hp12c_machine.prototype.reg_To_sto = function (n, i)
{
	if (! this.check_reg(n)) {
		return;
	}

	var t = {r: this[n], h: this[n + "h"]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	this.stomemory[i] = t.r;
	this.stomemoryh[i] = t.h;
};

Hp12c_machine.prototype.reg_To_reg = function (nf, nt)
{
	if (! this.check_reg(nf) || ! this.check_reg(nt)) {
		return;
	}

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
	if (! this.check_reg(n)) {
		return null;
	}
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
	if (! this.check_reg(n)) {
		return null;
	}
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
	if (! this.check_reg(n)) {
		return;
	}

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
	// FIXM15 callee might want to preserve complex part? (15c)
	if (! this.check_reg(n)) {
		return null;
	}
	return this.reg_Set_tuple(n, {r: v, i: 0, h: 0});
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
	this.stomemoryh[i] = t.h;
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
	this.ip += delta;

	if (this.ip < 0 ||
	    this.ip > this.program_limit()) {
		this.ip = 0;
	}
};

/* Called when H.display is already in place */
Hp12c_machine.prototype.init = function ()
{
	this.init_memory();
	this.clear_prog(1);
	this.clear_reg(); // implies reg, sto, fin
	this.clear_stack();
	this.error_in_display = 0;
};

Hp12c_machine.prototype.clear_fin = function ()
{
	for (var e = 0; e < 5; ++e) {
		this.finmemory[e] = 0;
	}
	this.display_result();
};

Hp12c_machine.prototype.clear_statistics = function ()
{
	// statistics share memory with STO memory (FIXM15 15C?)
	for (var e = H.STAT_MIN; e <= H.STAT_MAX; ++e) {
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
	// console.log("cli " + this.sti_level + " " + motive);
	// this is cumulative i.e. two calls to cli(x) must be
	// counterbalanced by two sti(x)'s
	if (this.sti_level === 0) {
		H.keyboard.disable();
	}
};

Hp12c_machine.prototype.sti = function (motive)
{
	this.sti_level++;
	// console.log("sti " + this.sti_level + " " + motive);
	if (this.sti_level === 1) {
		H.keyboard.enable();
	}
};

Hp12c_machine.prototype.clear_typing = function ()
{
	this.xmode = -1;
	this.typed_mantissa = "";
	this.typed_decimals = "";
	this.typed_mantissa_signal = 1;
	this.typed_exponent = "00";
	this.typed_exponent_signal = 1;
};

Hp12c_machine.prototype.display_result = function ()
{
	this.display_result_s(true, true);
};

Hp12c_machine.prototype.display_result_s = function (reset_window, enable_pushed)
{
	if (H.type === "16c") {
		if (reset_window) {
			this.intwindow = 0;
		}
	}
	if (enable_pushed) {
		this.pushed = 0;
	}
	this.clear_typing();
	H.display.displayNumber(this.reg_tuple("x"));
};

Hp12c_machine.prototype.display_all = function ()
{
	H.display.displayNumber(this.reg_tuple("x"));
	this.display_modifier();
	this.display_begin();
	this.display_dmyc();
	this.display_pgrm();
	this.display_algmode();
	this.display_trigo();
	this.display_user();
	this.display_flags();
	this.display_wordstatus();
};

Hp12c_machine.prototype.pse = function ()
{
	this.cli("pse");
	var a = this;
	window.setTimeout(function () {
		// do after dispatcher clears modifier
		H.display.show_pse();
	}, 0);
	window.setTimeout(function () {
		a.sti("pse");
		a.display_modifier();
		a.display_result_s(false, false);
	}, 1000);
};

Hp12c_machine.prototype.toggle_decimal_character = function ()
{
	this.comma = this.comma ? 0 : 1;
	this.display_result();
	H.storage.save();
	console.log("Storage saved");
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

Hp12c_machine.prototype.display_result_date = function (dd)
{
	this.clear_typing();
	H.display.show(H.date_to_show(dd, this.dmy));
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
	if (H.type !== "11c" && H.type !== "15c" && H.type !== "16c") {
		this.clear_stack();
	}
	this.alg_op = 0;
	this.index = 0;
	this.clear_fin();
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
	H.display.show_error(err);
	this.clear_typing();
	this.error_in_display = 1;

	if (this.program_mode >= H.RUNNING) {
		// errors stop programs
		H.pgrm.stop();
	}
};

Hp12c_machine.prototype.reset_error = function ()
{
	this.error_in_display = 0;
	if (this.program_mode == H.INTERACTIVE) {
		this.display_result_s(false, false);
	} else if (this.program_mode == H.PROGRAMMING) {
		this.display_program_opcode();
	}
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
	this.display_result();
};

Hp12c_machine.prototype.rpn_mode = function ()
{
	this.algmode = 0;
	this.alg_op = 0;
	this.display_algmode();
	this.display_result();
};

Hp12c_machine.prototype.algebraic_mode = function ()
{
	this.algmode = 1;
	this.alg_op = 0;
	this.display_algmode();
	this.display_result();
};

Hp12c_machine.prototype.toggle_compoundf = function ()
{
	this.compoundf = this.compoundf ? 0 : 1;
	this.display_dmyc();
	this.display_result();
};

Hp12c_machine.prototype.toggle_user = function ()
{
	this.user = this.user ? 0 : 1;
	this.display_user();
	if (this.program_mode == H.INTERACTIVE) {
		this.display_result();
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

Hp12c_machine.prototype.set_decimals_index = function (notation)
{
	// FIXM15
	// FIXM15 caller must pass notation
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
		var x1 = H.string_to_integer(typed, this.negative_repr,
						this.wordsize, radix);
		var x2 = H.string_to_integer(typed, this.negative_repr,
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
	var radix = H.radix[this.notation];
	if (! radix) {
		// for all non-integer modes
		radix = 10;
	}

	if (d >= radix) {
		return;
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
			this.typed_mantissa = this.chk_int_overflow("" + d);
			this.xmode = 0;
		}
	} else if (this.xmode === 0) {
		if (this.notation >= H.NOTATION_INT) {
			d = this.digit_add_chk_int(d, this.typed_mantissa);
			if (d !== null) {
				this.typed_mantissa = this.chk_int_overflow(this.typed_mantissa + "" + d);
			}
		} else {
			if (this.typed_mantissa.length < H.display.display_len) {
				this.typed_mantissa += "" + d;
			}
		}
	} else if (this.xmode === 1) {
		// integer mode never reaches this branch due to decimal_point_mode
		if ((this.typed_mantissa.length + this.typed_decimals.length) < H.display.display_len) {
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
	var tu = H.string_to_integer(this.typed_mantissa, this.negative_repr,
					this.wordsize, H.radix[this.notation]);
	this.reg_Set_tuple("x", tu);

	H.display.displayTypedNumber_integer(this.reg_tuple("x"), this.xmode,
						this.typed_mantissa.length);
};

Hp12c_machine.prototype.display_typing = function ()
{
	if (H.type === "16c" && this.notation >= H.NOTATION_INT) {
		this.display_typing_integer();
		return;
	}

	var x = this.typed_mantissa_signal * 
		parseFloat(this.typed_mantissa + "." + this.typed_decimals + "0") * 
		Math.pow(10, parseInt("0" + this.typed_exponent, 10) * this.typed_exponent_signal);
	this.reg_Set_real("x", x);
	H.display.displayTypedNumber(this.typed_mantissa_signal, this.typed_mantissa,
		this.typed_decimals, this.typed_exponent, this.typed_exponent_signal,
		this.xmode);
};

Hp12c_machine.prototype.digit_delete = function ()
{
	var number_signal;
	var i;

	if (this.xmode == -1) {
		if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
			// backspace key actually exists in 11c/15c/16c
			this.reg_Set_tuple("x", {r: 0, h: 0, i: 0});
			// FIXM15 i=0?

			// changes to in-place number editing
			// (does not push again when new number is typed)
			this.pushed = 1;

			H.display.displayNumber(this.reg_tuple("x"));
		} else {
			// does nothing
		}
		return;
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
		this.typed_exponent = "";
		if (this.typed_decimals.length > 0) {
			this.xmode = 1;
		} else {
			this.xmode = 0;
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
		if (this.typed_mantissa.length > (H.display.display_len - 3)) {
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
						(H.display.display_len - 3)) {
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
	if (this.notation >= H.NOTATION_INT) {
		this.chs_integer();
		return;
	}

	if (this.xmode === -1) {
		this.reg_Set_real("x", -this.reg_real("x"));
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
	this.push();
	this.reg_To_reg("last_x", "x");
	this.display_result();
};

Hp12c_machine.prototype.shv = function ()
{
	this.push();
	if (this.notation >= H.NOTATION_INT) {
		this.reg_Set_real("x", H.sve * 10);
	} else {
		this.reg_Set_real("x", H.sve);
	}
	this.display_result();
};

Hp12c_machine.prototype.apocryphal = function (i)
{
	// to be overridden as necessary; this is here just for testing
	this.push();
	this.reg_Set_real("x", 140 + i);
	this.display_result();
};

Hp12c_machine.prototype.clear_prefix = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		return;	
	}

	var n = Math.abs(this.reg_real("x"));
	var order = Math.log(n) / Math.log(10);

	if (H.badnumber(order)) {
		// tends to zero
		order = 1;
	}

	if (order == Math.floor(order)) {
		order += 0.1;
	}

	n = n * Math.pow(10, H.display.display_len - Math.ceil(order));

	this.cli("clear_prefix");

	H.display.show(H.zeropad(n.toFixed(0), H.display.display_len));

	var self = this;
	window.setTimeout(function () {
		self.sti("clear_prefix");
		self.display_result_s(false, false);
	}, 1000);
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
	var index = Math.floor(Math.abs(this.index));
	if (index >= H.MEM_MAX) {
		this.display_error(H.ERROR_INDEX);
		return null;
	}
	return index;
};

Hp12c_machine.prototype.x_exchange_index = function ()
{
	var index = this.fix_index();

	if (index === null) {
		return;
	}

	this.sto_Swap_reg(index, "x");
	this.display_result();
};

Hp12c_machine.prototype.x_exchange_index_itself = function ()
{
	// TODO index should contain all bits from an integer x

	// (reg_Set_real calls reg_Set_tuple which casts an eventual
	// float index to integer.)

	var tmp = this.reg_real("x");
	this.reg_Set_real("x", this.index);
	this.index = tmp;
	this.display_result();
};

Hp12c_machine.prototype.mem_info = function ()
{
	H.display.display_meminfo(this.ram_available(), this.sto_mem_len());
	this.error_in_display = 1;
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

Hp12c_machine.prototype.dissect_index = function ()
{
	var sgn = H.binary_sgn(this.index);
	var index = H.cl5_round(Math.abs(this.index), 5);
	var counter = Math.floor(index) * sgn;
	index -= sgn * counter;
	index *= 1000;
	var cmp = Math.floor(index + 0.001);
	index = Math.max(0, index - cmp);
	index *= 100;
	var incr = Math.floor(index + 0.1);
	return [counter, cmp, incr];
};

Hp12c_machine.prototype.update_index = function (counter, cmp, incr)
{
	var sgn = H.binary_sgn(counter);
	counter = Math.abs(counter);
	this.index = sgn * (counter + cmp / 1000 + incr / 100000);
};

Hp12c_machine.prototype.f_isg = function ()
{
	var res = this.dissect_index();
	var counter = res[0], cmp = res[1], incr = res[2];

	counter += (incr === 0 ? 1 : incr);
	this.incr_ip(counter > cmp ? 1 : 0);
	this.update_index(counter, cmp, incr);
};

Hp12c_machine.prototype.f_dse = function ()
{
	var res = this.dissect_index();
	var counter = res[0], cmp = res[1], incr = res[2];

	counter -= (incr === 0 ? 1 : incr);
	// note that cmp >= 0; a negative counter means this is always True
	this.incr_ip(counter <= cmp ? 1 : 0);
	this.update_index(counter, cmp, incr);
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
	this.reg_Reset("x");
	this.display_result();
	this.pushed = 1; // do not push if user retries typing
};

Hp12c_machine.prototype.finish_arithmetic = function (res, a, b)
{
	// FIXM15 15C complex

	if (H.type === "16c") {
		var over = Math.abs(res) > H.value_max;
		this.set_overflow(over);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_real("x", H.arithmetic_round(res, a, b));
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

Hp12c_machine.prototype.alg_resolve = function ()
{
	// 12C-only algebric mode.
	var res;
	var ok = 1;

	if ((! this.algmode) || (this.alg_op <= 0)) {
		return ok;
	}

	var x = this.reg_real("x");
	var y = this.reg_real("y");

	if (this.alg_op == this.ALG_PLUS) {
		this.finish_arithmetic(y + x, x, y);
	} else if (this.alg_op == this.ALG_MINUS) {
		this.finish_arithmetic(y - x, x, y);
	} else if (this.alg_op == this.ALG_MULTIPLY) {
		this.finish_arithmetic(y * x, 0, 0);
	} else if (this.alg_op == this.ALG_DIVIDE) {
		res = y / x;
		if (H.badnumber(res)) {
			this.display_error(H.ERROR_DIVZERO);
			ok = 0;
		} else {
			this.finish_arithmetic(res, 0, 0);
		}
	} else if (this.alg_op == this.ALG_POWER) {
		res = Math.pow(y, x);
		if (H.badnumber(res)) {
			this.display_error(H.ERROR_DIVZERO);
			ok = 0;
		} else {
			this.finish_arithmetic(res, 0, 0);
		}
	}
	this.alg_op = 0;
	return ok;
};

Hp12c_machine.prototype.enter = function (g_modifier)
{
	if (this.algmode && this.alg_op) {
		this.alg_resolve();
	} else if (! this.algmode || ! g_modifier) {
		// pushes only if not =, or not in alg mode
		this.push();
		this.display_result();
		this.pushed = 1; // already pushed, do not push twice when user types new number
	} else {
		this.display_result();
	}
};

Hp12c_machine.prototype.plus = function ()
{ 
	// FIXM15 15c complex mode

	if (this.notation >= H.NOTATION_INT) {
		var xt = this.reg_tuple("x");
		var yt = this.reg_tuple("y");
		var calc = H.integer_plus([xt.h, xt.r], [yt.h, yt.r],
						this.negative_repr, this.wordsize);
		this.finish_arithmetic_int(calc);
		return;
	}

	if (this.algmode) {
		if (! this.alg_resolve()) {
			return;
		}
		this.alg_op = this.ALG_PLUS;
		this.push();
		this.display_result();
	} else {
		var x = this.reg_real("x");
		var y = this.reg_real("y");
		this.finish_arithmetic(y + x, x, y);
	}
};

Hp12c_machine.prototype.minus = function ()
{
	// FIXM15 15c complex mode

	if (this.notation >= H.NOTATION_INT) {
		var xt = this.reg_tuple("x");
		var yt = this.reg_tuple("y");
		var calc = H.integer_minus([yt.h, yt.r], [xt.h, xt.r],
						this.negative_repr, this.wordsize);
		this.finish_arithmetic_int(calc);
		return;
	}

	if (this.algmode) {
		if (! this.alg_resolve()) {
			return;
		}
		this.alg_op = this.ALG_MINUS;
		this.push();
		this.display_result();
	} else {
		var x = this.reg_real("x");
		var y = this.reg_real("y");
		this.finish_arithmetic(y - x, x, y);
	}
};

Hp12c_machine.prototype.multiply = function ()
{
	// FIXM15 15c complex mode

	if (this.notation >= H.NOTATION_INT) {
		var xt = this.reg_tuple("x");
		var yt = this.reg_tuple("y");
		var calc = H.integer_multiply([xt.h, xt.r], [yt.h, yt.r],
						this.negative_repr, this.wordsize);
		// make sure multiplication does not change carry
		calc.carry = this.get_carry();
		this.finish_arithmetic_int(calc);
		return;
	}

	if (this.algmode) {
		if (! this.alg_resolve()) {
			return;
		}
		this.alg_op = this.ALG_MULTIPLY;
		this.push();
		this.display_result();
	} else {
		var x = this.reg_real("x");
		var y = this.reg_real("y");
		this.finish_arithmetic(y * x, 0, 0);
	}
};

Hp12c_machine.prototype.divide = function ()
{
	// FIXM15 15c complex mode

	if (this.notation >= H.NOTATION_INT) {
		var xt = this.reg_tuple("x");
		var yt = this.reg_tuple("y");
		var calc = H.integer_divide([yt.h, yt.r], [xt.h, xt.r],
						this.negative_repr, this.wordsize,
						false);
		if (calc.overflow) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			calc.result = calc.result[0];
			this.finish_arithmetic_int(calc);
		}
		return;
	}

	if (this.algmode) {
		if (! this.alg_resolve()) {
			return;
		}
		this.alg_op = this.ALG_DIVIDE;
		this.push();
		this.display_result();
	} else {
		var res = this.reg_real("y") / this.reg_real("x");
		if (H.badnumber(res)) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.finish_arithmetic(res, 0, 0);
		}
	}
};

Hp12c_machine.prototype.poweryx = function ()
{ 
	// FIXM15 15c complex mode
	if (this.algmode) {
		if (! this.alg_resolve()) {
			return;
		}
		this.alg_op = this.ALG_POWER;
		this.push();
		this.display_result();
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
	// FIXM15 15c complex mode
	var res = Math.pow(10.0, this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.reciprocal = function ()
{
	// FIXM15 15c complex mode
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
	// FIXM15 15c complex mode
	var res = Math.pow(this.reg_real("x"), 2);
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.sqroot = function ()
{
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

	// FIXM15 complex
	var res = Math.pow(this.reg_real("x"), 0.5);
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
	// FIXM15 15c complex mode
	var res = Math.exp(this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.ln = function ()
{
	// FIXM15 15c complex mode
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
	// FIXM15 15c complex mode
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
	// FIXM15 15c complex mode
	var res = Math[f](H.radians(this.reg_real("x"), this.trigo));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.triginv = function (f)
{
	// FIXM15 15c complex mode
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
	// FIXM15 15c complex mode
	var res = H[f].call(null, this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.htriginv = function (f)
{
	// FIXM15 15c complex mode
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
	// FIXM15 15c complex mode?
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
	// FIXM15 15c complex mode
	this.save_lastx();
	this.reg_Set_real("x", H.degrees_to_radians(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_degrees = function ()
{
	// FIXM15 15c complex mode
	this.save_lastx();
	this.reg_Set_real("x", H.radians_to_degrees(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_hms = function ()
{
	// FIXM15 15c complex mode?
	this.save_lastx();
	this.reg_Set_real("x", H.hour_to_hms(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_hour = function () 
{
	// FIXM15 15c complex mode?
	this.save_lastx();
	this.reg_Set_real("x", H.hms_to_hour(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.pi = function ()
{
	this.push();
	this.reg_Set_real("x", Math.PI);
	this.display_result();
};

Hp12c_machine.prototype.random = function ()
{
	this.push();
	this.reg_Set_real("x", this.prng.random());
	this.display_result();
};

Hp12c_machine.prototype.random_sto = function ()
{
	var seed = this.reg_real("x");
	this.prng = new H.Prng(seed);
	this.display_result();
};

Hp12c_machine.prototype.rnd = function ()
{
	this.save_lastx();
	this.reg_Set_real("x", H.cl5_round(this.reg_real("x"), this.decimals));
	this.display_result();
};

Hp12c_machine.prototype.polar = function ()
{
	// FIXM15 15C complex
	var res = H.polar(this.reg_real("x"), this.reg_real("y"));
	var r = res[0];
	var angle = res[1];

	if (H.badnumber(r) || H.badnumber(angle)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", r);
		this.reg_Set_real("y", H.to_angle_mode(angle, this.trigo));
		this.display_result();
	}
};

Hp12c_machine.prototype.orthogonal = function ()
{
	// FIXM15 15C complex
	var r = this.reg_real("x");
	var angle = H.radians(this.reg_real("y"), this.trigo);
	var res = H.orthogonal(r, angle);
	var x = res[0];
	var y = res[1];

	if (H.badnumber(x) || H.badnumber(y)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", x);
		this.reg_Set_real("y", y);
		this.display_result();
	}
};

Hp12c_machine.prototype.fatorial = function ()
{
	// FIXM15 15C complex?
	if ((H.type !== "11c" && H.type !== "15c" && H.type !== "16c") &&
				(this.reg_real("x") < 0 || this.reg_real("x") != Math.floor(this.reg_real("x")))) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	if (this.reg_real("x") > 69.95) {
		this.save_lastx();
		this.reg_Set_real("x", H.value_max);
		this.display_result();
		return;
	}

	var res;

	if (H.type === "11c" || H.type === "15c") {
		res = H.fatorial_gamma(this.reg_real("x"));
	} else {
		res = H.fatorial(this.reg_real("x"));
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
	// FIXM15 15C complex?
	this.save_lastx();
	this.reg_Set_real("x", (Math.abs(this.reg_real("x")) -
				Math.floor(Math.abs(this.reg_real("x")))) *
					H.binary_sgn(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.percent = function ()
{
	// FIXM15 15C complex?
	var res = this.reg_real("y") * this.reg_real("x") / 100;
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.percentT = function ()
{
	// FIXM15 15C complex?
	if (! this.alg_resolve()) {
		return;
	}

	var res = 100 * this.reg_real("x") / this.reg_real("y");
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.deltapercent = function ()
{
	// FIXM15 15C complex?
	if (! this.alg_resolve()) {
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
	// "pos" comes correctly adjusted from dispatcher even in the
	// case of HP-16C (0..15, 16..31).
	this.reg_To_sto("x", pos);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.sto_index = function (pos)
{
	var index = this.fix_index();

	if (index === null) {
		return;
	}

	this.reg_To_sto("x", index);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.get_index = function ()
{
	this.push();
	this.reg_Set_real("x", this.index);
	this.display_result();
};

Hp12c_machine.prototype.set_index = function ()
{
	this.index = this.reg_real("x");
	this.display_result();
};

Hp12c_machine.prototype.tarithmetic = function (at, bt, op)
{
	// FIXM15 15C complex
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

Hp12c_machine.prototype.stoinfix_index = function (operation)
{
	// not implemented in 16c

	var index = this.fix_index();
 
	if (index === null) {
		return;
	}

	this.stoinfix(index, operation);
};

Hp12c_machine.prototype.stoinfix = function (pos, operation)
{
	// not implemented in 16c

	var a = this.sto_tuple(pos);
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
			return;
		}
	}

	if (Math.abs(a.r) > H.value_max) {
		this.display_error(H.ERROR_OVERFLOW);
		return;
	}

	this.sto_Set_tuple(pos, a);
	this.display_result();
};

Hp12c_machine.prototype.stoCF0 = function ()
{
	this.reg_To_sto("x", 0);
	this.finmemory[H.FIN_N] = 0;
	this.display_result();
};

Hp12c_machine.prototype.stoCFj = function ()
{
	if (this.finmemory[H.FIN_N] != Math.floor(this.finmemory[H.FIN_N]) ||
	    this.finmemory[H.FIN_N] < 0 ||
	    this.finmemory[H.FIN_N] >= H.MEM_MAX) {
		this.display_error(H.ERROR_MEMORY);
	} else {
		this.finmemory[H.FIN_N]++;
		this.reg_To_sto("x", this.finmemory[H.FIN_N]);
		this.njmemory[this.finmemory[H.FIN_N]] = 1; 
		this.display_result();
	}
};

Hp12c_machine.prototype.rclCFj = function ()
{
	if (this.finmemory[H.FIN_N] < 0 ||
	    this.finmemory[H.FIN_N] >= H.MEM_MAX ||
	    Math.floor(this.finmemory[H.FIN_N]) != this.finmemory[H.FIN_N]) {
		this.display_error(H.ERROR_MEMORY);
	} else {
		this.push();
		this.sto_To_reg(this.finmemory[H.FIN_N], "x");
		--this.finmemory[H.FIN_N];
		this.display_result();
	}
};

Hp12c_machine.prototype.rclNj = function ()
{
	if (this.finmemory[H.FIN_N] < 0 ||
            this.finmemory[H.FIN_N] >= H.MEM_MAX ||
            Math.floor(this.finmemory[H.FIN_N]) != this.finmemory[H.FIN_N]) {
		this.display_error(H.ERROR_MEMORY);
	} else {
		this.push();
		this.reg_Set_real("x", this.njmemory[this.finmemory[H.FIN_N]]);
		this.display_result();
	}
};

Hp12c_machine.prototype.stoNj = function ()
{
	if (this.finmemory[H.FIN_N] != Math.floor(this.finmemory[H.FIN_N]) ||
            this.finmemory[H.FIN_N] < 0 ||
            this.finmemory[H.FIN_N] >= H.MEM_MAX ||
	    this.reg_real("x") != Math.floor(this.reg_real("x")) || this.reg_real("x") <= 0) {
		this.display_error(H.ERROR_MEMORY);
	} else {
		this.njmemory[this.finmemory[H.FIN_N]] = this.reg_real("x");
		this.display_result();
	}
};

Hp12c_machine.prototype.stofin = function (pos)
{
	this.finmemory[pos] = this.reg_real("x");
	this.display_result();
	this.pushed = 1;
	this.do_fincalc = 1; // next fin. key runs calculation
};

Hp12c_machine.prototype.ston_12x = function ()
{
	var res = this.reg_real("x") * 12;
	if (Math.abs(res) > H.value_max) {
		this.display_error(H.ERROR_OVERFLOW);
		return;
	}
	this.reg_Set_real("x", res);
	this.stofin(0);
};

Hp12c_machine.prototype.stoi_12div = function ()
{
	this.reg_Set_real("x", this.reg_real("x") / 12);
	this.stofin(1);
};

Hp12c_machine.prototype.rcl = function (pos)
{
	this.push(); // every RCL pushes the result to stack
	this.sto_To_reg(pos, "x");
	this.display_result();
};

Hp12c_machine.prototype.rcl_index = function (pos)
{
	var index = this.fix_index();

	if (index === null) {
		return;
	}

	this.push(); // every RCL pushes the result to stack
	this.sto_To_reg(index, "x");
	this.display_result();
};

Hp12c_machine.prototype.rclfin = function (pos)
{
	this.push(); // every RCL pushes the result to stack
	this.reg_Set_real("x", this.finmemory[pos]);
	this.display_result();
};

Hp12c_machine.prototype.stat_sigma_rcl = function ()
{
	// FIXM15 15C complex?
	this.push();
	this.push();
	this.sto_To_reg(H.STAT_X, "x");
	this.sto_To_reg(H.STAT_Y, "y");
	this.display_result();
};

Hp12c_machine.prototype.stat_sigma_plus = function ()
{
	// FIXM15 15C complex?
	if (! this.alg_resolve()) {
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
	// FIXM15 15C complex?
	if (! this.alg_resolve()) {
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
	// FIXM15 15C complex?
	this.alg_op = 0;

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
	// FIXM15 15C complex?
	this.alg_op = 0;

	var res = H.stat_avg(this.sto_mem_ref());

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

Hp12c_machine.prototype.stat_stddev = function ()
{
	// FIXM15 15C complex?
	this.alg_op = 0;

	var res = H.stddev(this.sto_mem_ref());
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
		return;
	}

	this.save_lastx();
	this.push();
	this.reg_Set_real("x", res[1]);
	this.reg_Set_real("y", res[2]);
	this.display_result();
};

Hp12c_machine.prototype.stat_lr = function (is_x)
{
	// FIXM15 15C complex?
	this.alg_op = 0;

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
	// FIXM15 15C complex?
	this.alg_op = 0;

	var res = H.linear_regression(this.sto_mem_ref());
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		this.save_lastx();
		this.push();
		this.push();
		this.reg_Set_real("x", res[1]); // B
		this.reg_Set_real("y", res[2]); // A
		this.display_result();
	}
};

Hp12c_machine.prototype.permutations = function ()
{
	// FIXM15 15C complex?
	var x = this.reg_real("x");
	var y = this.reg_real("y");
	if (x < 0 || x != Math.floor(x) || x > 80 ||
	    y < 0 || y != Math.floor(y) || y > 80 ||
	    y < x) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		var res = H.permutations(y, x);
		if (H.badnumber(res)) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.pop();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.combinations = function ()
{
	// FIXM15 15C complex?
	var x = this.reg_real("x");
	var y = this.reg_real("y");
	if (x < 0 || x != Math.floor(x) || x > 80 ||
	    y < 0 || y != Math.floor(y) || y > 80 ||
	    y < x) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		var res = H.combinations(y, x);
		if (H.badnumber(res)) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.pop();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.simple_interest = function ()
{
	if (! this.alg_resolve()) {
		return;
	}

	var n = this.finmemory[H.FIN_N];
	var i = this.finmemory[H.FIN_I] / 100;
	var pv = this.finmemory[H.FIN_PV];
	this.push();
	this.push();
	this.push();

	this.reg_Set_real("x", n / 360 * -pv * i);
	this.reg_Set_real("y", -pv);
	this.reg_Set_real("z", n / 365 * -pv * i);

	this.display_result();
};

Hp12c_machine.prototype.sto_or_calc_fin = function (pos)
{
	if (! this.alg_resolve()) {
		return;
	}

	if (! this.do_fincalc) {
		this.stofin(pos);
	} else {
		this.cli("sto_or_calc_fin");
		H.display.show("running");

		var a = this;
		window.setTimeout(function () {
			a.sti("sto_or_calc_fin");
			var err = H.financecalc(pos, a.begin, a.compoundf, a.finmemory);
			if (err == -1) {
				// no error
				a.reg_Set_real("x", a.finmemory[pos]);
				a.display_result();
			} else {
				a.display_error(err);
			}
		}, 200);
	}
};

Hp12c_machine.prototype.npv = function ()
{
	this.alg_op = 0;
	this.push();
	// 16C does not have finance, so this is ok
	this.reg_Set_real("x", H.npv(this.finmemory[H.FIN_N], this.finmemory[H.FIN_I], this.sto_mem_ref(), this.njmemory));
	this.finmemory[H.FIN_PV] = this.x;
	this.display_result();
};

Hp12c_machine.prototype.irr = function ()
{
	this.alg_op = 0;

	H.display.show("running");
	// 16C does not have finance, so this is ok
	var res = H.irr_calc(this.finmemory[H.FIN_N], this.finmemory[H.FIN_I], this.sto_mem_ref(), this.njmemory);
	var err = res[0];
	this.finmemory[H.FIN_I] = res[1];
	if (err != -1) {
		this.display_error(err);
	} else {
		this.push();
		this.reg_Set_real("x", this.finmemory[H.FIN_I]);
		this.display_result();
	}
};


Hp12c_machine.prototype.date_date = function ()
{
	this.alg_op = 0;

	var base = H.date_interpret(this.reg_real("y"), this.dmy);
	if (base === null) {
		this.display_error(H.ERROR_DATE);
		return;
	}
	this.save_lastx();
	H.date_add(base, this.reg_real("x"));
	this.pop(); // eat original arguments 
	this.reg_Set_real("x", H.date_gen(base, this.dmy)); // and fill with newly calculated date
	this.display_result_date(base);
};

Hp12c_machine.prototype.date_dys = function ()
{
	this.alg_op = 0;

	var d2 = H.date_interpret(this.reg_real("x"), this.dmy);
	var d1 = H.date_interpret(this.reg_real("y"), this.dmy);
	if ((d1 === null) || (d2 === null)) {
		this.display_error(H.ERROR_DATE);
		return;
	}
	this.save_lastx();
	this.reg_Set_real("x", H.date_diff(d1, d2));
	this.reg_Set_real("y", H.date_diff30(d1, d2));
	this.display_result();
};

Hp12c_machine.prototype.amortization = function ()
{
	this.alg_op = 0;

	var requested_n = this.reg_real("x");
	var orig_n = this.finmemory[H.FIN_N];
	var i = this.finmemory[H.FIN_I] / 100;

	// AMORT rounds present value to shown decimals
	var pv = H.cl5_round(this.finmemory[H.FIN_PV], this.decimals);
	this.finmemory[H.FIN_PV] = pv;

	// AMORT rounds payment to shown decimals
	var pmt = H.cl5_round(this.finmemory[H.FIN_PMT], this.decimals);
	this.finmemory[H.FIN_PMT] = pmt;

	var res = H.amortization(requested_n, orig_n, i, pv, pmt, this.decimals, this.begin);
	var err = res[0];
	var tot_interest = res[1];
	var tot_amort = res[2];

	this.push();
	this.push();

	this.reg_Set_real("x", tot_interest); 
	this.reg_Set_real("y", tot_amort);
	this.reg_Set_real("z", requested_n);

	this.finmemory[H.FIN_N] += requested_n;
	this.finmemory[H.FIN_PV] += tot_amort;

	this.display_result();
};

Hp12c_machine.prototype.bond_price = function ()
{
	this.alg_op = 0;

	var desired_rate = this.finmemory[H.FIN_I];
	if (desired_rate <= -100) {
		this.display_error(H.ERROR_INTEREST);
		return;
	}

	var coupon_year = this.finmemory[H.FIN_PMT];

	var buy = H.date_interpret(this.reg_real("y"), this.dmy);
	if (buy === null) {
		this.display_error(H.ERROR_DATE);
		return;
	}

	var maturity = H.date_interpret(this.reg_real("x"), this.dmy);
	if (maturity === null) {
		this.display_error(H.ERROR_DATE);
		return;
	}

	var res = H.bond_price(desired_rate, coupon_year, buy, maturity);

	if (! res) {
		this.display_error(H.ERROR_INTEREST);
		return;
	} else if (res[0] >= 0) {
		this.display_error(res[0]);
		return;
	}

	this.push();
	this.push();
	this.finmemory[H.FIN_N] = res[1];
	this.reg_Set_real("x", res[1]);
	this.reg_Set_real("y", res[2]);
	this.display_result();
};

Hp12c_machine.prototype.bond_yield = function ()
{
	this.alg_op = 0;

	var coupon_year = this.finmemory[H.FIN_PMT];
	var buy = H.date_interpret(this.reg_real("y"), this.dmy);
	var maturity = H.date_interpret(this.reg_real("x"), this.dmy);
	var price = this.finmemory[H.FIN_PV];

	var res = H.bond_yield(coupon_year, buy, maturity, price);

	var err = res[0];
	var desired_rate = res[1];

	if (err >= 0) {
		this.display_error(err);
		return;
	}

	this.push();
	this.finmemory[H.FIN_I] = desired_rate;
	this.reg_Set_real("x", desired_rate);
	this.display_result();
};


Hp12c_machine.prototype.depreciation_sl = function ()
{
	this.alg_op = 0;

	var cost = this.finmemory[H.FIN_PV];
	var sell = this.finmemory[H.FIN_FV];
	var life = this.finmemory[H.FIN_N];
	var year = this.reg_real("x");

	var res = H.depreciation_sl(cost, sell, life, year);
	var err = res[0];
	var depr = res[1];
	var rest = res[2];

	if (err >= 0) {
		this.display_error(err);
		return;
	}
	
	this.push();
	this.push();
	this.reg_Set_real("x", depr);
	this.reg_Set_real("y", rest);
	this.display_result();
};

Hp12c_machine.prototype.depreciation_soyd = function ()
{
	this.alg_op = 0;

	var cost = this.finmemory[H.FIN_PV];
	var sell = this.finmemory[H.FIN_FV];
	var life = this.finmemory[H.FIN_N];
	var year = this.reg_real("x");

	var res = H.depreciation_soyd(cost, sell, life, year);
	var err = res[0];
	var depr = res[1];
	var rest = res[2];

	if (err >= 0) {
		this.display_error(err);
		return;
	}
	
	this.push();
	this.push();
	this.reg_Set_real("x", depr);
	this.reg_Set_real("y", rest);
	this.display_result();
};

Hp12c_machine.prototype.depreciation_db = function ()
{
	this.alg_op = 0;

	var cost = this.finmemory[H.FIN_PV];
	var sell = this.finmemory[H.FIN_FV];
	var life = this.finmemory[H.FIN_N];
	var year = this.reg_real("x");
	var db = this.finmemory[H.FIN_I] / 100;

	var res = H.depreciation_db(cost, sell, life, year, db);
	var err = res[0];
	var depr = res[1];
	var rest = res[2];

	if (err >= 0) {
		this.display_error(err);
		return;
	}

	this.push();
	this.push();
	this.reg_Set_real("x", depr);
	this.reg_Set_real("y", rest);
	this.display_result();
};

Hp12c_machine.prototype.display_program_opcode = function ()
{
	var instr = this.ram[this.ip];

	if (H.type === "16c") {
		instr = H.pgrm.hex_opcode(instr);
	}

	var txt = H.zeropad(this.ip.toFixed(0), H.ram_ADDR_SIZE) +
				"-" + instr;
	H.display.show(txt);
};

Hp12c_machine.prototype.prog_pr = function ()
{
	if (this.program_mode == H.INTERACTIVE) {
		this.program_mode = H.PROGRAMMING;
		// NOTE: entering programming mode does not reset instruction pointer
		// this.ip = 0;
		this.display_pgrm();
		this.display_program_opcode();
	}
};

Hp12c_machine.prototype.prog_bst_after = function ()
{
	this.sti("bst_after");
	this.display_result_s(false, false);
};

Hp12c_machine.prototype.gto_digit_add = function (n)
{
	if (n > 9) {
		this.display_error(H.ERROR_IMPROPER_N);
		return;
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

Hp12c_machine.prototype.ntest = function (var1, criteria, var2)
{
	if (var1 !== "0") {
		var1 = this.reg_tuple(var1);
	} else {
		var1 = {r: 0, h: 0, i: 0};
	}

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
		var1 = var1.r;
		var2 = var2.r;

		if (criteria == "==" || criteria == "=" || criteria == "===") {
			res = H.feq10(var1, var2);
		} else if (criteria == "<=") {
			res = var1 <= var2;
		} else if (criteria == "<") {
			res = var1 < var2;
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
	this.test(this.ntest("x", "==", "y"));
};

Hp12c_machine.prototype.test_x_ne_y = function ()
{
	this.test(! this.ntest("x", "==", "y"));
};

Hp12c_machine.prototype.test_x_less_0 = function ()
{
	this.test(this.ntest("x", "<", "0"));
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
	this.test(this.ntest("x", "==", "0"));
};

Hp12c_machine.prototype.test_x_ne0 = function ()
{
	this.test(! this.ntest("x", "==", "0"));
};

Hp12c_machine.prototype.gto_buf_clear = function ()
{
	this.gtoxx = "";
};

Hp12c_machine.prototype.nop = function ()
{
};

// FIXM15 unit test
Hp12c_machine.prototype.solve = function ()
{
	// FIXM15 15c
};

// FIXM15 unit test
Hp12c_machine.prototype.matrix = function ()
{
	// FIXM15 15C complex?
};

// FIXM15 unit test
Hp12c_machine.prototype.matrix_dim = function ()
{
	// FIXM15 15c
};

// FIXM15 unit test
Hp12c_machine.prototype.result15c = function ()
{
	// FIXM15 15c
};

// FIXM15 unit test
Hp12c_machine.prototype.test_15c = function ()
{
	// FIXM15 15c
};

// FIXM15 unit test
Hp12c_machine.prototype.integral = function ()
{
	// FIXM15 15C complex?
	// FIXM15 15c
};

// FIXM15 unit test
Hp12c_machine.prototype.complex_re_im = function ()
{
	// FIXM15 15c
};

Hp12c_machine.prototype.window_count = function ()
{
	if (this.notation < H.NOTATION_INT) {
		return 1;
	}

	var bits_per_digit = H.digit_bits[this.notation];
	var digits_on_display = H.win_digits[this.notation];
	var tot_digits = Math.ceil(this.wordsize / bits_per_digit);

	return Math.ceil(tot_digits / digits_on_display);
};

Hp12c_machine.prototype.set_window = function (nw)
{
	this.intwindow = nw;
	this.display_wordstatus();
	this.display_result_s(false, false);
};

Hp12c_machine.prototype.show_window = function (nw)
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	console.log("Setting window to " + nw);

	if (nw < 0 || nw >= this.window_count()) {
		this.display_error(H.ERROR_IMPROPER_N);
		return;
	}

	this.set_window(nw);
};

Hp12c_machine.prototype.prepare_for_integer_mode = function ()
{
	// still in integer mode at this point
	var x = this.reg_real("x");
	var mantissa = {r: 0, h: 0, i: 0};
	var exp2 = {r: 0, h: 0, i: 0};

	if (x !== 0 && ! H.badnumber(x)) {
		x = Math.abs(x);
		// rank of 1 is 1, so mantissa becomes >= 2**31 and < 2**32
		var rank = Math.floor(Math.log(Math.abs(x)) / Math.log(2)) + 1;
		mantissa = x * Math.pow(2, 32 - rank);
		exp2 = rank - 32;
		if (this.negative_repr <= 0) {
			mantissa = Math.abs(mantissa);
		}
		mantissa = Math.round(mantissa).toString();
		mantissa = H.string_to_integer(mantissa, this.negative_repr, 56, 10);
		exp2 = Math.round(exp2).toString();
		exp2 = H.string_to_integer(exp2, this.negative_repr, 56, 10);
	}

	this.wordsize = 56;
	// provisional setting so next commands accept integers
	this.notation = H.NOTATION_INT_HEX;

	this.reg_Set_tuple("x", exp2);
	this.reg_Set_tuple("y", mantissa);
	this.reg_Set_tuple("z", {r: 0, h: 0, i: 0});
	this.reg_Set_tuple("w", {r: 0, h: 0, i: 0});
	this.reg_Set_tuple("last_x", {r: 0, h: 0, i: 0});
};

Hp12c_machine.prototype.prepare_for_float_mode = function ()
{
	// still in integer mode at this point
	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	x = H.integer_to_string(x, this.negative_repr, this.wordsize,
					10, true);
	y = H.integer_to_string(y, this.negative_repr, this.wordsize,
					10, true);
	// ok if numbers exceed FP precision
	x = parseInt(x, 10);
	y = parseInt(y, 10);

	this.set_overflow(0);

	var y2x = y * Math.pow(2.0, x);

	if (y2x > H.value_max) {
		y2x = H.value_max;
		this.set_overflow(1);
	} else if (y2x < -H.value_max) {
		y2x = -H.value_max;
		this.set_overflow(1);
	} else if (H.badnumber(y2x)) {
		y2x = 0;
		this.set_overflow(1);
	}

	// provisional setting so next methods accept float values
	this.notation = H.NOTATION_FIX;

	this.reg_Set_tuple("x", {r: y2x, h: 0, i: 0});
	this.reg_Set_tuple("z", {r: 0, h: 0, i: 0});
	this.reg_Set_tuple("w", {r: 0, h: 0, i: 0});
	this.reg_Set_tuple("y", {r: 0, h: 0, i: 0});
	this.reg_Set_tuple("last_x", {r: 0, h: 0, i: 0});

	this.wordsize = 56;
};

Hp12c_machine.prototype.word_bit = function (t, n)
{
	if (n >= this.wordsize) {
		console.log("word_bit: n > wordsize");
		return 0;
	}

	return H.word_bit(t, n);
};

Hp12c_machine.prototype.word_Set_bit = function (t, n, v)
{
	if (n >= this.wordsize) {
		console.log("word_Set_bit: n > wordsize");
		return;
	}

	H.word_Set_bit(t, n, v);
};

Hp12c_machine.prototype.word_Set_msb = function (t, v)
{
	this.word_Set_bit(t, this.wordsize - 1, v);
};

Hp12c_machine.prototype.word_Set_lsb = function (t, v)
{
	this.word_Set_bit(t, 0, v);
};

Hp12c_machine.prototype.word_msb = function (t)
{
	return this.word_bit(t, this.wordsize - 1);
};

Hp12c_machine.prototype.word_lsb = function (t)
{
	return this.word_bit(t, 0);
};

Hp12c_machine.prototype.set_carry = function (v)
{
	if (H.type === "16c") {
		if (v) {
			this.do_sf(H.FLAG_CARRY);
		} else {
			this.do_cf(H.FLAG_CARRY);
		}
	}
};

Hp12c_machine.prototype.set_overflow = function (v)
{
	if (H.type === "16c") {
		if (v) {
			this.do_sf(H.FLAG_OVERFLOW);
		} else {
			this.do_cf(H.FLAG_OVERFLOW);
		}
	}
};

Hp12c_machine.prototype.get_carry = function (v)
{
	return this.flags[H.FLAG_CARRY];
};

Hp12c_machine.prototype.get_zeros_flag = function (v)
{
	return this.flags[H.FLAG_ZEROS];
};

Hp12c_machine.prototype.get_overflow = function (v)
{
	return this.flags[H.FLAG_OVERFLOW];
};

Hp12c_machine.prototype.shift_left_tuple = function (t)
{
	this.cast_wordsize(t);

	/*jslint bitwise: false */
	t.h = t.h << 1;
	if (t.r & 0x80000000) {
		t.h = t.h | 0x01;
	}
	t.r = t.r << 1;
	/*jslint bitwise: true */

	this.cast_wordsize(t);
	return t;
};

Hp12c_machine.prototype.shift_right_tuple = function (t)
{
	this.cast_wordsize(t);

	/*jslint bitwise: false */
	t.r = t.r >>> 1;
	if (t.h & 0x01) {
		t.r = t.r | 0x80000000;
	}
	t.h = t.h >>> 1;
	/*jslint bitwise: true */

	this.cast_wordsize(t);
	return t;
};

Hp12c_machine.prototype.shiftleft = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");
	this.cast_wordsize(t);

	this.set_carry(this.word_msb(t));
	this.shift_left_tuple(t);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.shiftright = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");
	this.cast_wordsize(t);

	this.set_carry(this.word_lsb(t));
	this.shift_right_tuple(t);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.leftjustify = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bits = 0;
	var t = this.reg_tuple("x");
	this.cast_wordsize(t);

	if (t.r === 0 && t.h === 0) {
		// do nothing
	} else {
		while (! this.word_msb(t)) {
			this.shift_left_tuple(t);
			++bits;
		}
	}

	this.save_lastx();
	this.push();
	this.reg_Set_tuple("y", t);
	this.reg_Set_real("x", bits);
	this.display_result();
};

Hp12c_machine.prototype.arithmeticshift = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");
	this.cast_wordsize(t);

	var signal = this.word_msb(t);
	this.set_carry(this.word_lsb(t));
	this.shift_right_tuple(t);
	if (this.wordsize > 1) {
		this.word_Set_msb(t, signal);
	}

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotateleftc = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");
	this.rotate_left_tuple(t, 1);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotaterightc = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");
	this.cast_wordsize(t);

	var lsb = this.word_lsb(t);
	var carry = this.get_carry();

	this.shift_right_tuple(t);

	this.set_carry(lsb);
	this.word_Set_msb(t, carry);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotate_left_tuple = function (t, rot_with_carry)
{
	this.cast_wordsize(t);

	/*jslint bitwise: false */
	var msb = this.word_msb(t);
	var carry = this.get_carry(t);

	this.shift_left_tuple(t);

	this.set_carry(msb);
	if (rot_with_carry) {
		this.word_Set_lsb(t, carry);
	} else {
		this.word_Set_lsb(t, msb);
	}
	/*jslint bitwise: true */

	this.cast_wordsize(t);

	return t;
};

Hp12c_machine.prototype.rotateleft = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");

	this.rotate_left_tuple(t, 0);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotate_right_tuple = function (t, rot_with_carry)
{

	this.cast_wordsize(t);

	/*jslint bitwise: false */

	var lsb = this.word_lsb(t);
	var carry = this.get_carry();

	this.shift_right_tuple(t);

	this.set_carry(lsb);
	if (rot_with_carry) {
		this.word_Set_msb(t, carry);
	} else {
		this.word_Set_msb(t, lsb);
	}

	this.cast_wordsize(t);

	/*jslint bitwise: true */
	return t;
};

Hp12c_machine.prototype.rotateright = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");

	this.rotate_right_tuple(t, 0);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotateleftn = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("y");
	var n = Math.abs(this.reg_real("x"));

	if (n < 0 || n > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	while (--n >= 0) {
		this.rotate_left_tuple(t, 0);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotaterightn = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("y");
	var n = Math.abs(this.reg_real("x"));

	if (n < 0 || n > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	while (--n >= 0) {
		this.rotate_right_tuple(t, 0);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotateleftcn = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("y");
	var n = Math.abs(this.reg_real("x"));

	if (n < 0 || n > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	while (--n >= 0) {
		this.rotate_left_tuple(t, 1);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotaterightcn = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("y");
	var n = Math.abs(this.reg_real("x"));

	if (n < 0 || n > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	while (--n >= 0) {
		this.rotate_right_tuple(t, 1);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.maskleft = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bits = Math.abs(this.reg_real("x"));

	if (bits < 0 || bits > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	var t = {r: 0xffffffff, h: 0xffffffff, i: 0};

	// convert 'bits 1' to 'bits 0'
	bits = this.wordsize - bits;

	while (--bits >= 0) {
		this.shift_left_tuple(t, 0);
	}

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.bitcount = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var t = this.reg_tuple("x");
	this.cast_wordsize(t);
	var bits = 0;
	/*jslint bitwise: false */
	while (t.r || t.h) {
		if (t.r & 0x01) {
			++bits;
		}
		if (t.h & 0x01) {
			++bits;
		}
		t.r = t.r >>> 1;
		t.h = t.h >>> 1;
	}
	/*jslint bitwise: true */

	this.save_lastx();
	this.reg_Set_real("x", bits);
	this.display_result();
};

Hp12c_machine.prototype.maskright = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bits = Math.abs(this.reg_real("x"));
	if (bits < 0 || bits > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}
	/*jslint bitwise: false */
	var t = {r: 0xffffffff, h: 0xffffffff, i: 0};

	if (bits <= 0) {
		t.h = t.r = 0;
	} else if (bits <= 32) {
		t.h = 0;
		t.r = t.r >>> (32 - bits);
	} else {
		t.h = t.h >>> (64 - bits);
	}
	/*jslint bitwise: true */

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.bit_xor = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	/*jslint bitwise: false */
	var z = { r: (x.r ^ y.r), 
		  h: (x.h ^ y.h),
		  i: 0 };
	/*jslint bitwise: true */

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", z);
	this.display_result();
};

Hp12c_machine.prototype.show_integer_diff = function (notation)
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	} else if (notation == this.notation) {
		// current notation already
		return;
	}
	
	this.cli("show_integer_diff");

	this.saved_notation = this.notation;
	this.notation = notation;
	this.display_result_s(true, false); // reset window, ! enable push

	var self = this;

	window.setTimeout(function () {
		self.sti("show_integer_diff");
		self.notation = self.saved_notation;
		self.display_result();
	}, 2000);
};

Hp12c_machine.prototype.show_integer_hex = function ()
{
	this.show_integer_diff(H.NOTATION_INT_HEX);
};

Hp12c_machine.prototype.show_integer_dec = function ()
{
	this.show_integer_diff(H.NOTATION_INT_DEC);
};

Hp12c_machine.prototype.show_integer_oct = function ()
{
	this.show_integer_diff(H.NOTATION_INT_OCT);
};

Hp12c_machine.prototype.show_integer_bin = function ()
{
	this.show_integer_diff(H.NOTATION_INT_BIN);
};

Hp12c_machine.prototype.integer_hex = function ()
{
	if (this.notation < H.NOTATION_INT) {
		this.prepare_for_integer_mode();
	}
	this.notation = H.NOTATION_INT_HEX;
	this.set_window(0);
};

Hp12c_machine.prototype.integer_dec = function ()
{
	if (this.notation < H.NOTATION_INT) {
		this.prepare_for_integer_mode();
	}
	this.notation = H.NOTATION_INT_DEC;
	this.set_window(0);
};

Hp12c_machine.prototype.integer_oct = function ()
{
	if (this.notation < H.NOTATION_INT) {
		this.prepare_for_integer_mode();
	}
	this.notation = H.NOTATION_INT_OCT;
	this.set_window(0);
};

Hp12c_machine.prototype.integer_bin = function ()
{
	if (this.notation < H.NOTATION_INT) {
		this.prepare_for_integer_mode();
	}
	this.notation = H.NOTATION_INT_BIN;
	this.set_window(0);
};

Hp12c_machine.prototype.set_bit = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bit = Math.abs(this.reg_real("x"));
	var y = this.reg_tuple("y");

	if (bit < 0 || bit >= this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	this.cast_wordsize(y);
	this.word_Set_bit(y, bit, 1);

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", y);
	this.display_result();
};

Hp12c_machine.prototype.clr_bit = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bit = Math.abs(this.reg_real("x"));
	var y = this.reg_tuple("y");

	if (bit < 0 || bit >= this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	this.cast_wordsize(y);
	this.word_Set_bit(y, bit, 0);

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", y);
	this.display_result();
};

Hp12c_machine.prototype.bit_question = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bit = Math.abs(this.reg_real("x"));
	var y = this.reg_tuple("y");

	if (bit < 0 || bit >= this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}
	
	this.save_lastx();
	this.pop();
	this.incr_ip(this.word_bit(y, bit) ? 0 : 1);

	this.display_result();
};

Hp12c_machine.prototype.sc_cpl1 = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	this.negative_repr = 1;
	this.display_wordstatus();
	this.display_result_s(true, false);
};

Hp12c_machine.prototype.sc_cpl2 = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	this.negative_repr = 2;
	this.display_wordstatus();
	this.display_result_s(true, false);
};

Hp12c_machine.prototype.sc_unsigned = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	this.negative_repr = 0;
	this.display_wordstatus();
	this.display_result_s(true, false);
};

Hp12c_machine.prototype.bit_not = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var x = this.reg_tuple("x");
	this.cast_wordsize(x);
	/*jslint bitwise: false */
	// reg_Set_tuple rips off excess bits
	var z = { r: ~x.r, 
		  h: ~x.h,
		  i: 0 };
	/*jslint bitwise: true */

	this.save_lastx();
	this.reg_Set_tuple("x", z);
	this.display_result();
};

Hp12c_machine.prototype.move_window_l = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var nw = this.intwindow + 1;
	if (nw >= 0 && nw < this.window_count()) {
		this.set_window(nw);
	}
};

Hp12c_machine.prototype.move_window_r = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var nw = this.intwindow - 1;
	if (nw >= 0 && nw < this.window_count()) {
		this.set_window(nw);
	}
};

Hp12c_machine.prototype.wsize = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var n = this.reg_real("x");
	if (n < 0 || n > 64) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}
	if (n === 0) {
		n = 64;
	}
	this.wordsize = n;
	this.save_lastx();
	this.cast_wordsize_in_accumulators();
	this.pop();
	this.display_wordstatus();
	this.display_result();
};

Hp12c_machine.prototype.status_16c = function ()
{
	var txt = "";

	if (this.negative_repr <= 0) {
		txt = "U";
	} else {
		txt = "" + this.negative_repr;
	}

	txt += "-";
	txt += H.zeropad("" + this.wordsize, 2);
	txt += "-";
	
	var i;
	for (i = 3; i >= 0; --i) {
		txt += (this.flags[i] ? "1" : "0");
	}

	this.cli("status_16c");

	H.display.show(txt);

	var self = this;
	window.setTimeout(function () {
		self.sti("status_16c");
		self.display_result_s(false, false);
	}, 1000);
};

Hp12c_machine.prototype.bit_and = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	/*jslint bitwise: false */
	var z = { r: (x.r & y.r), 
		  h: (x.h & y.h),
		  i: 0 };
	/*jslint bitwise: true */

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", z);
	this.display_result();
};

Hp12c_machine.prototype.bit_or = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	/*jslint bitwise: false */
	var z = { r: (x.r | y.r), 
		  h: (x.h | y.h),
		  i: 0 };
	/*jslint bitwise: true */

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", z);
	this.display_result();
};

Hp12c_machine.prototype.dsz = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		this.index = Math.round(this.index);
	}
	this.index--;
	this.incr_ip(this.index === 0 ? 1 : 0);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.isz = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		this.index = Math.round(this.index);
	}
	this.index++;
	this.incr_ip(this.index === 0 ? 1 : 0);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.rmd = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	if (x.r === 0 && x.h === 0) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	var t = H.integer_divide([y.h, y.r], [x.h, x.r], this.negative_repr,
				 this.wordsize, false);
	if (t.overflow) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	this.save_lastx();
	this.pop();
	// does not affect carry and overflow
	this.reg_Set_tuple("x", t.result[1]);
	this.display_result();
};

Hp12c_machine.prototype.dblr = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	var z = this.reg_tuple("z");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	this.cast_wordsize(z);
	if (x.r === 0 && x.h === 0) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	var t = H.integer_divide([y.h, y.r, z.h, z.r], [x.h, x.r],
				 this.negative_repr, this.wordsize, true);
	if (t.overflow) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	this.save_lastx();
	this.pop();
	this.pop();
	// does not affect carry and overflow
	this.reg_Set_tuple("x", t.result[1]);

	this.display_result();
};

Hp12c_machine.prototype.dblmult = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	this.cast_wordsize(x);
	this.cast_wordsize(y);

	var t = H.integer_multiply([y.h, y.r], [x.h, x.r], this.negative_repr,
					this.wordsize, true);

	this.save_lastx();
	// does not affect carry
	this.set_overflow(t.overflow);        // always false
	this.reg_Set_tuple("x", t.result[1]); // hi
	this.reg_Set_tuple("y", t.result[0]); // lo
	this.display_result();
};

Hp12c_machine.prototype.dbldiv = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	var z = this.reg_tuple("z");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	this.cast_wordsize(z);
	if (x.r === 0 && x.h === 0) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	var t = H.integer_divide([y.h, y.r, z.h, z.r], [x.h, x.r],
				 this.negative_repr, this.wordsize, true);
	if (t.overflow) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	this.save_lastx();
	this.pop();
	this.pop();
	this.set_carry(t.carry);
	this.set_overflow(t.overflow);
	this.reg_Set_tuple("x", t.result[0]);
	this.display_result();
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

H.INTERPOLATION_MAX = 50;

H.solve_infinity = function (val)
{
	if (val > Math.pow(10, 95)) {
		val = Math.pow(10, 95);
	} else if (val < -Math.pow(10, 95)) {
		val = -Math.pow(10, 95);
	}
	return val;
};

H.npv = function (n, i, cfj, nj)
{
	var res = cfj[0];
	var pmt = 0;
	for (var e = 1; e <= n; ++e) {
		var cf = cfj[e];
		for (var f = 1; f <= nj[e]; ++f) {
			++pmt;
			res += cf / Math.pow(1 + (i / 100), pmt);
		}
	}
	return res;
};

H.comppmtlim = function (i, n)
{
	if (Math.abs(i) < 0.00000001) {
		return n;
	} else {
		return (1 - Math.pow(1 + (i / 100), -n)) / (i / 100);
	}
};

H.calcNPV = function (is_n, n, i, pv, pmt, fv, begin, compoundf)
{
	if (n == Math.floor(n) || is_n) {
		return pv + 
			(1 + (i / 100) * (begin ? 1:0)) * pmt * H.comppmtlim(i, n) + 
			fv * Math.pow(1 + (i / 100), -n);
	} else if (! compoundf) {
		return pv * (1 + ((i / 100) * (n - Math.floor(n)))) + 
			(1 + (i / 100) * (begin ? 1:0)) * pmt * H.comppmtlim(i, Math.floor(n)) +
			fv * Math.pow(1 + (i / 100), -Math.floor(n));
	} else {
		return pv * Math.pow(1 + (i / 100), (n - Math.floor(n))) + 
			(1 + (i / 100) * (begin ? 1 : 0)) * pmt * H.comppmtlim(i, Math.floor(n)) +
			fv * Math.pow(1 + (i / 100), -Math.floor(n));
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
		price = 100 / Math.pow(1 + desired_rate / 200, coupons - 1 + dsc / E); // present-value price
		for (var e = 1; e <= coupons; ++e) {
			// accumulate present value of all future coupons
			price += (coupon_year / 2) / Math.pow(1 + desired_rate / 200, e - 1 + dsc / E); 
		}
	}
	tot_interest = (coupon_year / 2) * dcs / E;
	price -= tot_interest; // coupon fraction compound before we bought it

	if (H.badnumber(price) || H.badnumber(tot_interest)) {
		return [H.ERROR_INTEREST, 0, 0];
	}

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
	var firstNPV;
	var secondNPV;
	var interpolation_guess;
	var firstguess;
	var secondguess;
	var iteration = H.INTERPOLATION_MAX;

	var threshold = 0.000000000125;
	var threshold_order = H.irr_npvsum(n, cfj);

	if (threshold_order > 0) {
		threshold *= threshold_order;
	}

	if (i <= -100 || i > 10000000000) {
		i = 0;
	}

	firstguess = i + 1;
	secondguess = i;

	while (--iteration > 0) {
		i = firstguess;
		firstNPV = H.npv(n, i, cfj, nj);
		i = secondguess;
		secondNPV = H.npv(n, i, cfj, nj);

		if (i < -100 || i > 10000000000) {
			// pathological
			return [H.ERROR_IRR, i];
		}

		if (Math.abs(secondNPV) < threshold) {
			// we've made it
			return [-1, i];
		}

		var interpolation_B = (secondNPV - firstNPV) / (secondguess - firstguess); // B
		interpolation_guess = firstNPV - firstguess * interpolation_B; // A
		interpolation_guess /= -interpolation_B; // -A/B is the interpolation root
		interpolation_guess = H.solve_infinity(interpolation_guess);

		firstguess = secondguess;
		secondguess = interpolation_guess;
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

	var firstNPV;
	var secondNPV;
	var interpolation_guess;
	var firstguess;
	var secondguess;
	var saved = finarray[dependent];
	var iteration = H.INTERPOLATION_MAX;
	var threshold = 0.000000000125;
	var threshold_order = 0;

	// correct threshold so it is more "lax" when involved numbers are too big
	if (dependent != H.FIN_PV) {
		threshold_order += Math.abs(finarray[H.FIN_PV]);
	}
	if (dependent != H.FIN_PMT) {
		threshold_order += Math.abs(finarray[H.FIN_PMT]);
	}
	if (dependent != H.FIN_N && dependent != H.FIN_PMT) {
		threshold_order += Math.abs(finarray[H.FIN_N] * finarray[H.FIN_PMT]);
	}
	if (dependent != H.FIN_FV) {
		threshold_order += Math.abs(finarray[H.FIN_FV]);
	}
	if (threshold_order > 0) {
		threshold *= threshold_order;
	}

	if (dependent == H.FIN_N || dependent == H.FIN_I || threshold_order <= 0) {
		secondguess = 1;
	} else {
		// initial guess for interpolation must be of same order as other parameters
		secondguess = threshold_order;
	}

	interpolation_guess = 0;

	while (--iteration >= 0) {
		firstguess = secondguess;
		secondguess = interpolation_guess;

		finarray[dependent] = firstguess;

		if (finarray[H.FIN_I] <= -100) {
			break;
		}

		firstNPV = H.calcNPV(dependent === 0,
				finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
				finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);


		finarray[dependent] = secondguess;

		if (finarray[H.FIN_I] <= -100) {
			break;
		}

		secondNPV = H.calcNPV(dependent === 0,
				finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
				finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);

		if (Math.abs(secondNPV) < threshold) {
			if (dependent === 0) {
				if ((secondguess - Math.floor(secondguess)) > 0.003) {
					finarray[dependent] = Math.floor(finarray[dependent]) + 1;
				} else {
					finarray[dependent] = Math.floor(finarray[dependent]);
				}
			}
			return -1;
		}

		var interpolation_B = (secondNPV - firstNPV) / (secondguess - firstguess); // B
		interpolation_guess = firstNPV - firstguess * interpolation_B; // A
		interpolation_guess /= -interpolation_B; // -A/B is the interpolation root
		interpolation_guess = H.solve_infinity(interpolation_guess);
	}

	// puts back the original value, since the calculated one may be NaN
	finarray[dependent] = saved;
	return H.ERROR_INTEREST;
};

H.bond_yield = function (coupon_year, buy, maturity, price)
{
	var desired_rate;

	if (buy === null) {
		return [H.ERROR_DATE, 0];
	}

	if (maturity === null) {
		return [H.ERROR_DATE, 0];
	}

	if (price <= 0) {
		return [H.ERROR_INTEREST, 0];
	}

	var firstNPV;
	var secondNPV;
	var interpolation_guess;
	var firstguess;
	var secondguess;
	var iteration = H.INTERPOLATION_MAX;

	var threshold = 0.000000000125 * Math.abs(price);

	firstguess = 0;
	secondguess = firstguess + 1;

	while (--iteration > 0) {
		var res = H.bond_price(firstguess, coupon_year, buy, maturity);
		if (! res) {
			return [H.ERROR_INTEREST, 0];
		} else if (res[0] >= 0) {
			return [res[0], 0];
		}
		firstNPV = res[1] - price;

		res = H.bond_price(secondguess, coupon_year, buy, maturity);
		if (! res) {
			return [H.ERROR_INTEREST, 0];
		} else if (res[0] >= 0) {
			return [res[0], 0];
		}
		secondNPV = res[1] - price;

		if (firstguess < -100 || firstguess > 10000000000) {
			// pathological
			return [H.ERROR_INTEREST, 0];
		}

		if (Math.abs(secondNPV) < threshold) {
			// we've made it
			desired_rate = secondguess;
			break;
		}

		var interpolation_B = (secondNPV - firstNPV) / (secondguess - firstguess); // B
		interpolation_guess = firstNPV - firstguess * interpolation_B; // A
		interpolation_guess /= -interpolation_B; // -A/B is the interpolation root
		interpolation_guess = H.solve_infinity(interpolation_guess);

		firstguess = secondguess;
		secondguess = interpolation_guess;
	}

	return [-1, desired_rate];
};

H.depreciation_sl = function (cost, sell, life, year)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > Math.pow(10, 10)) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	if (year > life) {
		// bail out early to avoid slowness if year is absurdly big
		// linear depreciation does not make sense if year > life
		return [-1, 0, 0];
	}

	while (--year >= 0) {
		depr = (cost - sell) / life;
		if (H.badnumber(depr)) {
			return [H.ERROR_DIVZERO, 0, 0];
		}
		rest -= depr;
	}

	return [-1, depr, rest];
};

H.depreciation_soyd = function (cost, sell, life, year)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > Math.pow(10, 10)) {
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
		if (H.badnumber(depr)) {
			return [H.ERROR_DIVZERO, 0, 0];
		}
		rest -= depr;
	}

	return [-1, depr, rest];
};

H.depreciation_db = function (cost, sell, life, year, db)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > Math.pow(10, 10)) {
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
		if (H.badnumber(depr)) {
			return [H.ERROR_DIVZERO, 0, 0];
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
		console.log("feq: bad number");
		return false;
	}

	if (epsilon === undefined || epsilon === null) {
		epsilon = Math.pow(10, -10);
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

	// printf(" " + a + " " + b + " " + epsilon + " " + Math.abs(a - b) +
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

	if (a !== 0) {
		order = Math.floor(Math.log(Math.abs(a)) / Math.log(10));
	}
	if (b !== 0) {
		order = Math.min(order, Math.floor(Math.log(Math.abs(a)) / Math.log(10)));
	}
	if (order < -88) {
		// too small, let it go
		return r;
	}

	var scale = Math.pow(10, 11 - order);
	var r2 = Math.round(Math.abs(r) * scale) / scale * H.binary_sgn(r);
	// console.log("" + r + " " + r2);
	return r2;
};

H.feq10 = function (a, b) {
	if (a === undefined || a === null || b === undefined || b === null ||
					H.badnumber(a) || H.badnumber(b)) {
		return false;
	}

	var epsilon = 0; // exact comparison

	if (a === 0 || b === 0) {
		// comparison with pure zero is special case
		epsilon = Math.pow(10, -100);
	} else {
		var order = Math.floor(Math.max(Math.log(Math.abs(b)) / Math.log(10),
				       Math.log(Math.abs(a)) / Math.log(10))) + 1;

		if (H.badnumber(order)) {
			// either a or b tend to zero
			epsilon = Math.pow(10, -100);
		} else {
			epsilon = Math.pow(10, order - 10);
		}
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
	var angle = Math.atan2(y, x);
	var r = Math.sqrt(x * x + y * y);
	return [r, angle];
};

H.orthogonal = function (r, angle)
{
	return [r * Math.cos(angle), r * Math.sin(angle)];
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
		console.log("LR err type 1");
		return [0];
	}

	if (mem[H.STAT_N] <= 1) {
		console.log("LR err type 2");
		return [0];
	}

	if (H.feq(mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X] / mem[H.STAT_N], 0)) {
		console.log("LR err type 3");
		return [0];
	}

	// TODO implement test [ n Ex2 - (Ex)2] [ n Ey2 - (Ey)2] <= 0

	var avgx = mem[H.STAT_X] / mem[H.STAT_N];
	var avgy = mem[H.STAT_Y] / mem[H.STAT_N];

	var B = mem[H.STAT_XY] - mem[H.STAT_X] * mem[H.STAT_Y] / mem[H.STAT_N];
	B /= mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X] / mem[H.STAT_N];

	if (H.badnumber(B)) {
		console.log("LR err type 4");
		return [0];
	}

	var A = avgy - B * avgx;

	// note: vars are following the HP12C handbook convention
	// y=Bx+A, while the 11C and math convention is y=Ax+B.

	return [1, A, B];
};

H.stat_kr = function (mem, is_x, xx)
{
	var res = H.linear_regression(mem);

	if (! res[0]) {
		console.log("statkr error 1");
		return [0];
	}

	var A = res[1];
	var B = res[2];

	// note: vars are following the HP12C handbook convention
	// y=Bx+A, while the 11C and math convention is y=Ax+B.

	if (is_x) {
		if (H.feq((mem[H.STAT_N] * mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X]), 0)) {
			console.log("statkr error 2");
			return [0];
		}
	} else {
		if (H.feq((mem[H.STAT_N] * mem[H.STAT_Y2] - mem[H.STAT_Y] * mem[H.STAT_Y]), 0)) {
			console.log("statkr error 3");
			return [0];
		}
	}

	var rr1 = mem[H.STAT_XY] - mem[H.STAT_X] * mem[H.STAT_Y] / mem[H.STAT_N];
	var rr2 = mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X] / mem[H.STAT_N];
	var rr3 = mem[H.STAT_Y2] - mem[H.STAT_Y] * mem[H.STAT_Y] / mem[H.STAT_N];

	if (rr2 === 0 || rr3 === 0) {
		console.log("statkr error 5");
		return [0];
	}

	if ((rr2 * rr3) < 0) {
		console.log("statkr error 6");
		return [0];
	}

	var rr = Math.sqrt(rr2 * rr3);

	if (H.badnumber(rr) || rr < 0) {
		console.log("statkr error 6");
		return [0];
	}

	var r = rr1 / rr;

	var c;

	if (is_x) {
		if (B === 0) {
			console.log("statkr error 7");
			return [0];
		}
		c = (xx - A) / B;
	} else {
		c = A + B * xx;
	}

	if (H.badnumber(c)) {
		console.log("statkr error 8");
		return [0];
	}

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

/*jslint bitwise: false */

H.word_bit = function (t, n)
{
	var res = 0;
	if (n >= 32) {
		res = (t.h >>> (n - 32)) & 0x01; // 63..32 -> 31..0
	} else {
		res = (t.r >>> n) & 0x01; // 31..0
	}
	return res;
};

H.word_Set_bit = function (t, n, v) {
	if (n >= 32) {
		if (v) {
			t.h = t.h | (1 << (n - 32)); // 32..63 -> 0..31
		} else {
			t.h = t.h & (~(1 << (n - 32)));
		}
	} else {
		if (v) {
			t.r = t.r | (1 << n); // 0..31
		} else {
			t.r = t.r & (~(1 << n));
		}
	}
};

H.cast_wordsize = function (t, ws) {
	var maskl = 0;
	var maskh = 0;
	if (ws > 32) {
		maskl = 0xffffffff;
		maskh = 0xffffffff >>> (64 - ws); // 64..33 -> 0..31
	} else {
		maskl = 0xffffffff >>> (32 - ws); // 32..1 -> 0..31 (no 0-word size)
	}
	t.r = t.r & maskl;
	t.h = t.h & maskh;
};

H.spagint_to_digit = function (x, bit, radix, bits)
{
	var mult = 1;
	var n = 0;
	while (bits > 0 && bit < x.length) {
		if (x[bit]) {
			n += mult;
		}
		++bit;
		--bits;
		mult *= 2;
	}
	return n.toString(radix);
};

// multiplies a decimal number (as a string) by 2
// integer may be of any size
H.sdecimal_mult2 = function (sd)
{
	var carry = 0;
	var res = "";

	for (var i = sd.length - 1; i >= 0; --i) {
		var n = parseInt(sd.charAt(i), 10);
		n = n * 2 + carry;
		carry = Math.floor(n / 10);
		res = (n % 10).toString(10) + res;
	}

	if (carry) {
		res = carry.toString(10) + res;
	}

	return res;
};

H.binary_to_decimal = function (b)
{
	var dec = "0";

	for (var i = 0; i < b.length; ++i) {
		// make room to odd/even bit
		dec = H.sdecimal_mult2(dec);
		if (b.charAt(i) !== "0") {
			var dd = parseInt(dec.charAt(dec.length - 1), 10);
			dd += 1;
			dec = dec.substring(0, dec.length - 1) + dd.toString(10);
		}
	}

	return dec;
};

H.integer_to_string = function (x, cpl, ws, radix, omit_prefix)
{
	var number = "";
	var nsign = "";
	var nprefix = "";
	var bits = 4;

	if (! radix) {
		radix = 10;
	}

	H.cast_wordsize(x, ws);
	var s = H.make_spaghetti([x.h, x.r], ws, false);
	if (H.spagint_sgn(s, cpl) < 0) {
		nsign = "-";
		// does not matter if overflows for cpl = 2 and MIN_INT
		// because we interpret "s" as unsigned from this point
		// on, and ((unsigned) MIN_INT) == MAX_INT + 1
		H.spagint_inv(s, cpl);
	}

	if (radix === 2) {
		nprefix += "0b";
		bits = 1;
	} else if (radix === 8) {
		nprefix += "0";
		bits = 3;
	} else if (radix === 16) {
		nprefix += "0x";
		bits = 4;
	}

	var pradix = radix;

	if (radix === 10) {
		// convert to binary first
		pradix = 2;
		bits = 1;
	}
		
	var znumber = "";

	// fast, easy algorithm for 2^n radix
	for (var bit = 0; bit < ws; bit += bits) {
		var digit = H.spagint_to_digit(s, bit, pradix, bits);
		znumber = digit + znumber;
		if (digit !== '0') {
			// significant digit; move buffered digits
			number = znumber + number;
			znumber = "";
		}
	}

	if (radix === 10) {
		number = H.binary_to_decimal(number);
	}

	if (number.length <= 0) {
		number = "0";
	}

	if (omit_prefix) {
		nprefix = "";
	}

	return nsign + nprefix + number;
};

H.parse_digit = function (s, radix)
{
	var n = parseInt(s, radix);
	if (! n) {
		n = 0;
	}
	return n;
};

H.string_to_integer = function (s, cpl, ws, radix)
{
	// convert string s to spagint bits
	var sgn = 1;
	var spagint = H.spagint_make_zero(ws);
	var position = H.spagint_make_one(ws);

	s = "" + s;
	s = H.trim(s);
	s.toLowerCase();
	if (s.charAt(0) === '-') {
		if (cpl > 0) {
			sgn = -1;
		}
		s = s.substring(1);
	}

	if (! radix) {
		radix = 10;
		if (s.charAt(0) === '0') {
			// not decimal
			s = s.substring(1);
			if (s.charAt(0) === 'x') {
				radix = 16;
				s = s.substring(1);
			} else if (s.charAt(0) === 'b') {
				radix = 2;
				s = s.substring(1);
			} else {
				radix = 8;
			}
		}
	}
	var sradix = H.make_spaghetti([radix], ws, false);

	while (s.length > 0) {
		var digit = H.parse_digit(s.charAt(s.length - 1), radix);
		// digit *= position
		// i += digit (positioned)
		var sdigit = H.spagint_make_zero(ws);
		H.spagint_multiply(H.make_spaghetti([digit], ws, false), position, sdigit);
		H.spagint_u_s_sum(spagint, sdigit);
		// position *= radix
		var oldpos = H.spagint_copy(position);
		position = H.spagint_make_zero(ws);
		H.spagint_multiply(sradix, oldpos, position);
		s = s.substring(0, s.length - 1);
	}

	if (sgn < 1) {
		H.spagint_inv(spagint, cpl);
	}

	// convert from 'spagint' format to 2x32 register format
	var t = H.undo_spaghetti(spagint, ws, false);
	H.cast_wordsize(t, ws);

	return t;
};

H.make_spaghetti = function (a, ws, dbl)
{
	var s = [];
	var word, bit;

	for (word = 0; word < (dbl ? 2 : 1); ++word) {
		var idx = a.length - word * 2 - 1;
		var wh = 0;
		var wl = 0;
		if (idx >= 0) {
			wl = a[idx];
			if (idx >= 1) {
				wh = a[idx - 1];
			}
		}
		for (bit = 0; bit < ws; ++bit) {
			var bitval = 0;
			var mask = 0x01;
			mask = mask << (bit % 32); // 0..31
			if (bit >= 32) {
				bitval = (wh & mask) ? 1 : 0;
			} else {
				bitval = (wl & mask) ? 1 : 0;
			}
			s.push(bitval);
		}
	}
	return s;
};

H.undo_spaghetti = function (s, ws, dbl)
{
	var bitlimit = dbl ? (ws * 2) : ws;
	var ta = [{r: 0, h: 0, i: 0}, {r: 0, h: 0, i: 0}];

	for (var bit = 0; bit < bitlimit; ++bit) {
		var word = Math.floor(bit / ws);
		var wbit = bit % ws;
		if (s[bit]) {
			var mask = 1 << (wbit % 32); // 0..31
			if (wbit >= 32) {
				ta[word].h |= mask;
			} else {
				ta[word].r |= mask;
			}
		}
	}

	if (!dbl) {
		ta = ta[0];
	}

	return ta;
};

/*jslint bitwise: true */

H.spagint_shr = function (s)
{
	for (var i = 0; i < (s.length - 1); ++i) {
		s[i] = s[i + 1];
	}
	s[s.length - 1] = 0;
};

H.spagint_shl = function (s)
{
	for (var i = s.length - 1; i > 0; --i) {
		s[i] = s[i - 1];
	}
	s[0] = 0;
};

H.spagint_highbit = function (s)
{
	for (var i = s.length - 1; i >= 0; --i) {
		if (s[i]) {
			return i;
		}
	}

	return -1;
};

H.spagint_is_zero = function (s, cpl)
{
	if (H.spagint_highbit(s) < 0) {
		// 0x0000...0000 is always zero
		return true;
	} else if (cpl == 1) {
		// 0xffff...ffff is minus zero
		for (var i = 0; i < s.length; ++i) {
			if (! s[i]) {
				return false;
			}
		}
		return true;
	}

	return false;
};

H.spagint_sgn = function (s, cpl)
{
	if (cpl == 2 || cpl == 1) {
		if (s[s.length - 1]) {
			return -1;
		}
	}

	return 1;
};

H.spagint_copy = function (s, ws)
{
	if (!ws) {
		ws = s.length;
	}

	var t = [];
	for (var i = 0; i < ws; ++i) {
		var b = 0;
		if (i < s.length) {
			b = s[i];
		}
		t[i] = b;
	}
	return t;
};

// Add 1 bit size and extend signal if signed
H.spagint_extend = function (s, cpl)
{
	var t = H.spagint_copy(s, s.length + 1);
	if (cpl > 0) {
		t[t.length - 1] = s[s.length - 1];
	}
	return t;
};

H.spagint_u_s_sum = function (tgt, v)
{
	var i, carry, unsigned_overflow, last_carry, signed_overflow;

	carry = 0;
	last_carry = 0;

	for (i = 0; i < tgt.length && (carry || i < v.length); ++i) {
		var new_bit = (tgt[i] ? 1 : 0) + (carry ? 1 : 0) + (v[i] ? 1 : 0);
		last_carry = carry;
		carry = (new_bit > 1) ? 1 : 0;
		tgt[i] = new_bit % 2;
	}

	unsigned_overflow = !!carry;
	// signed oveflow hint from http://planetcalc.com/747/
	signed_overflow = (carry !== last_carry);

	return {result: tgt,
		carry: unsigned_overflow,
		unsigned_overflow: unsigned_overflow,
		signed_overflow: signed_overflow};
};

H.spagint_cpl1_to_cpl2 = function (s)
{
	if (s[s.length - 1]) {
		// no problem if overflow since 0xffff is zero in cpl1
		H.spagint_u_s_sum(s, H.spagint_make_one(s.length));
	}
	return s;
};

H.spagint_cpl2_to_cpl1 = function (s)
{
	var overflow = false;
	if (s[s.length - 1]) {
		H.spagint_u_s_sum(s, H.spagint_make_minus_one(2, s.length));
		overflow = ! s[s.length - 1];
	}
	return {result: s, overflow: overflow};
};

H.spagint_eq = function (s, t)
{
	for (var i = (Math.max(s.length, t.length) - 1); i >= 0; --i) {
		var sb = (i < s.length) ? s[i] : 0;
		var tb = (i < t.length) ? t[i] : 0;
		if (sb < tb) {
			// s < t
			return false;
		} else if (sb > tb) {
			// s > t
			return false;
		}
	}
	// equal
	return true;
};

H.spagint_ge = function (s, t)
{
	for (var i = (Math.max(s.length, t.length) - 1); i >= 0; --i) {
		var sb = (i < s.length) ? s[i] : 0;
		var tb = (i < t.length) ? t[i] : 0;
		if (sb < tb) {
			// s < t
			return false;
		} else if (sb > tb) {
			// s > t
			return true;
		}
	}
	// equal
	return true;
};

H.spagint_abs = function (t, cpl)
{
	var overflow = false;

	if (cpl <= 0 || H.spagint_sgn(t, cpl) > 0) {
		// positive
		return {result: t, overflow: overflow};
	}

	// if control gets here, value is signed AND negative

	if (cpl !== 1) {
		// downgrade to one's complement
		H.spagint_u_s_sum(t, H.spagint_make_minus_one(2, t.length));
		// if turned to positive, MIN_INT overflowed
		overflow = ! t[t.length - 1];
	}

	// one's complement: get positive just inverting all bits
	for (var i = 0; i < t.length; ++i) {
		t[i] = t[i] ? 0 : 1;
	}

	return {result: t, overflow: overflow};
};

H.spagint_inv = function (t, cpl)
{
	if (H.spagint_is_zero(t)) {
		// short circuit to avoid problems w/ overflow detection
		return {result: t, overflow: false};
	}

	var overflow = false;

	if (cpl <= 0) {
		console.log("cannot invert int unsigned");
		return {result: t, overflow: overflow};
	}

	// control reaches here if number is signed

	// conversion into one's complement
	for (var i = 0; i < t.length; ++i) {
		t[i] = t[i] ? 0 : 1;
	}

	if (cpl !== 1) {
		// promote to two's complement
		var sign = t[t.length - 1];
		H.spagint_u_s_sum(t, H.spagint_make_one(t.length));
		// if number is MIN_INT, conversion overflows and 
		// result becomes MIN_INT again (which is equal to
		// MAX_INT + 1 if bit string is taken as unsigned.
		// NOTE: this is a convention that this function MUST
		// keep!
		overflow = (sign !== t[t.length - 1]);
	}

	return {result: t, overflow: overflow};
};

H.spagint_neg = function (s, cpl)
{
	if (H.spagint_sgn(s, cpl) < 0) {
		// already negative, return "as is"
		return s;
	}

	// cannot overflow since s is positive
	H.spagint_inv(s, cpl);
	return s;
};

// make sure that word-size MSB contains the same
// sign as the empirical MSB in "s"
H.spagint_cast_sign = function (s, cpl, ws, dbl)
{
	if (cpl > 0) {
		var msb = s.length - 1;
		var ws_msb = ws * (dbl ? 2 : 1) - 1;
		s[ws_msb] = s[msb];
	}
};

// division core. only positive numbers and all having the same length
H.spagint_divide = function (a, b, c)
{
	// Caller must provide c.length >= a and >= b
	// add one bit for signed substraction in algorithm
	// c can stay the same length because c <= a and
	// a is always unsigned.
	a = H.spagint_copy(a, c.length + 1);
	b = H.spagint_copy(b, c.length + 1);

	var bn = H.spagint_copy(b);
	// cannot overflow because we made room just before
	H.spagint_inv(bn, 2);
	var one = H.spagint_make_one(a.length);

	while (H.spagint_ge(a, b) && ! H.spagint_is_zero(a) && ! H.spagint_is_zero(b)) {
		/*
		if (dbl) {
			Sleep(1000);
		}
		*/
		var order = H.spagint_highbit(a) - H.spagint_highbit(b) - 1;
		// Examples:
		// a = 100, b = 11, 2*b = 110 > a (cannot use shortcut)
		// a = 1000, b = 11, 2*b = 110 < a (may use shortcut)
		// a = 10000, b = 11, 4*b = 1100 < a (may use shortcut)
		// a = 1000000, b = 11, 16*b = 110000 < a (may use shortcut)

		// console.log("a " + a);
		// console.log("b " + b);
		// console.log("c " + c);
		if (order <= 0) {
			// naive algorithm; c++ and a -= b while a >= b
			H.spagint_u_s_sum(c, one);
			H.spagint_u_s_sum(a, bn);
		} else {
			// a > 2b
			// c += 2^order; a -= b * 2^order
			var power_2 = H.spagint_make_power2(a.length, order);
			var bto = H.spagint_make_zero(a.length);
			H.spagint_multiply(b, power_2, bto);
			// cannot overflow because bto > 0
			H.spagint_inv(bto, 2);
			H.spagint_u_s_sum(c, power_2);
			H.spagint_u_s_sum(a, bto);
		}
		// console.log("a' " + a);
		// console.log("b' " + b);
		// console.log("c' " + c);
	}

	return H.spagint_copy(a, c.length);
};

H.integer_divide = function (a, b, cpl, ws, dbl)
{
	a = H.make_spaghetti(a, ws, dbl);
	b = H.make_spaghetti(b, ws, false);

	if (H.spagint_is_zero(b)) {
		// avoid the case of a=0
		return {result: [H.undo_spaghetti(H.spagint_make_zero(ws), ws, false),
			         H.undo_spaghetti(H.spagint_make_zero(ws), ws, false)],
			carry: false, overflow: true};
	}

	var overflow = false;

	// console.log("divide ----------------------------");
	// console.log(" aj " + a);
	// console.log(" bj " + b);

	var sgn = H.spagint_sgn(a, cpl) * H.spagint_sgn(b, cpl);
	var sgna = H.spagint_sgn(a, cpl);

	// add 1 bit space to handle case a|b == MIN_INT
	a = H.spagint_extend(a, cpl);
	b = H.spagint_extend(b, cpl);
	// so these can't overflow
	H.spagint_abs(a, cpl);
	H.spagint_abs(b, cpl);
	b = H.spagint_copy(b, a.length);

	var c = H.spagint_make_zero(a.length);

	a = H.spagint_divide(a, b, c);

	// this test handles both possible overflow cases:
	// a) double mode, quotient does not fit in 1 word
	// b) normal mode, 2's complement, MIN_INT / -1 = MAX_INT + 1
	var magnitude = H.spagint_highbit(c);
	if (cpl <= 0) {
		overflow = magnitude >= ws;
	} else if (cpl == 1) {
		overflow = magnitude >= (ws - 1);
	} else {
		overflow = (magnitude >= (ws - 1) &&
				(sgn >= 0 ||
				 ! H.spagint_is_MININT_2(c, ws)));
	}

	// console.log("divide ----------------------------");
	// console.log("ai " + a);
	// console.log("bi " + b);
	// console.log("ci " + c);

	if (sgn < 0) {
		H.spagint_neg(c, cpl);
	}
	if (sgna < 0) {
		// dividend became the remainder
		// remainder inherits the signal from dividend
		// remainder cannot overflow because it is always smaller than divisor
		H.spagint_neg(a, cpl);
	}

	if (overflow) {
		H.spagint_cast_sign(c, cpl, ws, false);
	}

	var t = H.undo_spaghetti(c, ws, false);
	var has_remainder = ! H.spagint_is_zero(a, 0);
	var trmd = H.undo_spaghetti(a, ws, false);
	var res = [t, trmd];

	return {result: res, overflow: overflow, carry: has_remainder};
};

H.spagint_make_zero = function (ws)
{
	var t = [];
	for (var i = 0; i < ws; ++i) {
		t[i] = 0;
	}
	return t;
};

H.spagint_make_one = function (ws)
{
	var t = H.spagint_make_zero(ws);
	t[0] = 1;
	return t;
};

H.spagint_make_power2 = function (ws, exponent)
{
	var t = H.spagint_make_zero(ws);
	t[exponent] = 1;
	return t;
};

H.spagint_make_minus_one = function (cpl, ws)
{
	var t = H.spagint_make_one(ws);
	// cannot overflow because ws > 1
	H.spagint_inv(t, cpl);
	return t;
};

H.spagint_make_MIN_INT_2 = function (ws)
{	
	var t = H.spagint_make_zero(ws);
	t[t.length - 1] = 1;
	return t;
};

/*
H.spagint_make_MAX_INT_2 = function (ws)
{	
	var t = H.spagint_make_minus_one(2, ws);
	t[t.length - 1] = 0;
	return t;
};
*/

H.spagint_is_MININT_2 = function (n, ws)
{
	// test if (unsigned) n == (unsigned) (MIN_INT for given ws)
	var min_int = H.spagint_make_MIN_INT_2(ws); // 128 in 8 bits unsigned
	return H.spagint_eq(n, min_int);
};

// core of multiplication (handles positive numbers only)
H.spagint_multiply = function (a, b, c)
{
	a = H.spagint_copy(a, c.length);
	b = H.spagint_copy(b, c.length);

	while (! H.spagint_is_zero(a, 0)) {
		// console.log("a  " + a);
		// console.log("b  " + b);
		// console.log("c  " + c);
		if (! a[0]) {
			// even a; try make it odd (a/2)*(b*2)
			H.spagint_shr(a);
			H.spagint_shl(b);
		} else {
			// odd a; c += b, a -= 1
			var res = H.spagint_u_s_sum(c, b);
			a[0] = 0;
		}
		// console.log("c' " + c);
	}

	// console.log("cf " + c);
	return c;
};

H.integer_multiply = function (a, b, cpl, ws, dbl)
{
	a = H.make_spaghetti(a, ws, false);
	b = H.make_spaghetti(b, ws, false);
	// console.log("a' " + a);
	// console.log("b' " + b);
	var c = H.spagint_make_zero(ws * 2);
	var sgn = H.spagint_sgn(a, cpl) * H.spagint_sgn(b, cpl);
	var overflow = false;

	// add 1 bit space
	a = H.spagint_extend(a, cpl);
	b = H.spagint_extend(b, cpl);
	// so these can't overflow if a, b == MIN_INT
	H.spagint_abs(a, cpl);
	H.spagint_abs(b, cpl);

	// console.log("ultiply ----------------------------");
	var res = H.spagint_multiply(a, b, c);
	// console.log("multiply ----- " + c);

	if (!dbl) {
		var magnitude = H.spagint_highbit(c);
		if (cpl <= 0) {
			overflow = magnitude >= ws;
		} else if (cpl == 1) {
			overflow = magnitude >= (ws - 1);
		} else {
			// e.g. for 8 bits signed, if magnitude is 8 > 7,
			// it is overflow only if result is positive, or
			// result is exactly MIN_INT (-MIN_INT at this point)
			overflow = (magnitude >= (ws - 1) &&
					(sgn >= 0 ||
					 ! H.spagint_is_MININT_2(c, ws)));
		}
	}

	if (sgn < 0) {
		H.spagint_neg(c, cpl);
	}

	if (overflow) {
		H.spagint_cast_sign(c, cpl, ws, dbl);
	}

	var t = H.undo_spaghetti(c, ws, dbl);

	// multiplication resets carry
	return {result: t, overflow: overflow, carry: false};
};

H.integer_plus = function (a, b, cpl, ws)
{
	a = H.make_spaghetti(a, ws, false);
	b = H.make_spaghetti(b, ws, false);
	var c = H.spagint_make_zero(ws);
	var overflow = false;

	// console.log("plus a " + a);
	// console.log("plus b " + b);

	if (cpl === 1) {
		a = H.spagint_cpl1_to_cpl2(a, ws);
		b = H.spagint_cpl1_to_cpl2(b, ws);
	}

	H.spagint_u_s_sum(c, a);
	var res = H.spagint_u_s_sum(c, b);

	if (cpl <= 0) {
		overflow = res.unsigned_overflow;
	} else {
		overflow = res.signed_overflow;
	}

	// console.log("plus a' " + a);
	// console.log("plus b' " + b);
	// console.log("plus c " + c);

	if (cpl === 1) {
		if (H.spagint_cpl2_to_cpl1(c).overflow) {
			overflow = true;
		}
	}

	if (overflow) {
		H.spagint_cast_sign(c, cpl, ws, false);
	}

	// console.log("plus c' " + c);

	var t = H.undo_spaghetti(c, ws, false);

	// console.log("plus r " + t.r + " " + t.h);

	return {result: t, overflow: overflow, carry: res.carry};
};

H.integer_minus = function (a, b, cpl, ws)
{
	var iws = ws;
	if (cpl <= 0) {
		// make room for signal bit since we implement
		// subraction using signed summation of a+(-b)
		iws += 1;
	}
	a = H.make_spaghetti(a, iws, false);
	b = H.make_spaghetti(b, iws, false);
	var c = H.spagint_make_zero(iws);
	var overflow = false;
	var borrow = false;

	// console.log("minus a " + a);
	// console.log("minus b " + b);

	if (cpl === 1) {
		a = H.spagint_cpl1_to_cpl2(a, iws);
		b = H.spagint_cpl1_to_cpl2(b, iws);
	}

	// If (unsigned) b > (unsigned) a, there is borrow.
	// Or, there *would be* borrow in HP-16C, which does not
	// use a+(-b) technique.
	borrow = ! H.spagint_ge(a, b);

	// console.log("minus a " + a);
	// console.log("minus b " + b);

	if (H.spagint_inv(b, 2).overflow) {
		// b == MIN_INT and cpl == 2
		// x - MIN_INT always overflows because the result
		// becomes x + MAX_INT + 1
		overflow = true;
		// proceed with operation since HP-16C shows the
		// corpse of the calculation (lowest bits).
	}

	// console.log("minus B " + b);

	// c = a + (-b)
	H.spagint_u_s_sum(c, a);
	var res = H.spagint_u_s_sum(c, b);

	overflow = overflow || res.signed_overflow;
	if (cpl <= 0) {
		if (H.spagint_sgn(c) < 0) {
			// result < 0 in unsigned mode, underflow
			overflow = true;
		}
	}

	// console.log("minus c " + c);

	if (cpl === 1) {
		if (H.spagint_cpl2_to_cpl1(c).overflow) {
			overflow = true;
		}
	}

	if (overflow) {
		H.spagint_cast_sign(c, cpl, ws, false);
	}

	// console.log("minus C " + c);

	// cast from iws to ws does not cause problems because
	// a) ws = iws in signed mode
	// b) value is meaningless if negative (high bit 1)
	//    in unsigned mode, and high bit = 0 if positive.
	var t = H.undo_spaghetti(c, ws, false);

	// console.log("tuple " + t.r + " " + t.h);

	return {result: t, overflow: overflow, carry: borrow};
};

// assumes "a" is positive
// algorithm from "Hacker's Delight", p.205
H.integer_sqrt = function (a, cpl, ws)
{
	a = H.make_spaghetti(a, ws, false);

	var iws = ws;

	if (H.spagint_sgn(a, cpl) < 0) {
		// avoid the case of a<0
		return {result: H.undo_spaghetti(H.spagint_make_zero(ws), ws, false),
			carry: false, overflow: true};
	}

	if (H.spagint_is_zero(a)) {
		// avoid the case of a=0
		return {result: H.undo_spaghetti(H.spagint_make_zero(ws), ws, false),
			carry: false, overflow: false};
	}

	if (iws < 4) {
		iws = 4;
		a = H.spagint_copy(a, 4);
	}

	// get the number of significant bits in a
	var order = H.spagint_highbit(a);
	// first estimate is a bit above [a >> (bits / 2)]
	var two = H.spagint_make_power2(a.length, 1);
	var g0 = H.spagint_make_power2(a.length, 1 + Math.floor(order / 2));
	var g1 = H.spagint_make_zero(a.length);
	H.spagint_divide(a, g0, g1); // g1 = a / g0
	H.spagint_u_s_sum(g1, g0);   // g1 = g0 + a / g0
	H.spagint_shr(g1);           // g1 = (g0 + a / g0) / 2

	// console.log("sqrt ---------");
	// console.log("g0'  " + g0);
	// console.log("g1'  " + g1);

	while (! H.spagint_ge(g1, g0)) { // while g1 < g0
		// console.log("base " + a);
		g0 = g1;
		g1 = H.spagint_make_zero(a.length);
		H.spagint_divide(a, g0, g1); // g1 = a / g0
		H.spagint_u_s_sum(g1, g0);   // g1 = g0 + a / g0
		H.spagint_shr(g1);           // g1 = (g0 + a / g0) / 2
		// console.log("g0   " + g0);
		// console.log("g1   " + g1);
		// console.log("---");
		// Sleep(1000);
	}	

	var sq = H.spagint_make_zero(a.length);
	H.spagint_multiply(g0, g0, sq); // cannot overflow
	var carry = ! H.spagint_ge(sq, a); // isqrt(a)^2 < a
	// console.log("" + sq + " < " + a);

	return {result: H.undo_spaghetti(g0, ws, false), carry: carry, overflow: false};
};

H.integer_inv = function (a, cpl, ws)
{
	var overflow = false;
	var icpl = cpl;

	if (cpl === 0) {
		icpl = 2;
		overflow = true;
	}

	a = H.make_spaghetti(a, ws, false);
	var res = H.spagint_inv(a, icpl, ws);

	a = H.undo_spaghetti(res.result, ws, false);

	return {result: a, overflow: (overflow || res.overflow)};
};

H.integer_abs = function (a, cpl, ws)
{
	var overflow = false;
	var icpl = cpl;

	a = H.make_spaghetti(a, ws, false);
	var res = H.spagint_abs(a, icpl, ws);
	a = H.undo_spaghetti(res.result, ws, false);

	return {result: a, overflow: (overflow || res.overflow)};
};

H.integer_eq = function (a, b, cpl, ws)
{
	return ((a.r === b.r) && (a.h === b.h));
};

H.integer_lt = function (a, b, cpl, ws)
{
	a = [a.h, a.r];
	b = [b.h, b.r];
	a = H.make_spaghetti(a, ws, false);
	b = H.make_spaghetti(b, ws, false);
	var sgna = H.spagint_sgn(a, cpl);
	var sgnb = H.spagint_sgn(b, cpl);
	var res = false;

	if (sgna > sgnb) {
		// a >= 0 > b so a > b
		res = false;
	} else if (sgna < sgnb) {
		// a < 0 <= b so a < b
		res = true;
	} else {
		// a, b have the same signal
		// a, b negative: // "-2 < -1" is "65534 < 65535"
		// "a < b" is  "not a >= b"
		res = ! H.spagint_ge(a, b);
	}
	return res;
};

H.integer_le = function (a, b, cpl, ws)
{
	return H.integer_eq(a, b, cpl, ws) || H.integer_lt(a, b, cpl, ws);
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

/*jslint bitwise: false */

H.Prng = function (seed)
{
	if (seed === undefined) {
		seed = 1;
	}
	while (Math.abs(seed) > 0x80000000) {
		// move significant digits to 32-bit realm
		seed /= 1.987654321;
	}
	while (Math.abs(seed) < 0x40000000) {
		// move decimals to integer realm since bitwise manipulation is employed
		seed *= 1.9123456789;
	}

	/* Period parameters */  
	this.N = 624;
	this.M = 397;
	this.MMA = 0x9908b0df;   /* constant vector a */
	this.UMA = 0x80000000; /* most significant w-r bits */
	this.LMA = 0x7fffffff; /* least significant r bits */
 
	this.mt = [];          /* the array for the state vector */
	this.mti = this.N + 1; /* mti==N+1 means mt[N] is not initialized */

	this.init(seed);
};
 
/* initializes mt[N] with a seed */
H.Prng.prototype.init = function (seed)
{
	this.mt[0] = seed >>> 0;
	for (this.mti = 1; this.mti < this.N; this.mti++) {
		var s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
		this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + 
			(s & 0x0000ffff) * 1812433253) + this.mti;
		/* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
		/* In the previous versions, MSBs of the seed affect   */
		/* only MSBs of the array mt[].                        */
		/* 2002/01/09 modified by Makoto Matsumoto             */
		this.mt[this.mti] >>>= 0;
		/* for >32 bit machines */
	}
};
 
/* generates a random number on [0,0xffffffff]-interval */
H.Prng.prototype.gen32 = function ()
{
	var y;
	var mag01 = [0x0, this.MMA];
	/* mag01[x] = x * MMA  for x=0,1 */

	if (this.mti >= this.N) { /* generate N words at one time */
		var kk;

		if (this.mti === this.N + 1) {  /* if init() has not been called, */
			this.init(5489); /* a default initial seed is used */
		}

		for (kk = 0; kk < this.N - this.M; kk++) {
			y = (this.mt[kk] & this.UMA) | (this.mt[kk + 1] & this.LMA);
			this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
		}

		for (; kk < this.N - 1; kk++) {
			y = (this.mt[kk] & this.UMA) | (this.mt[kk + 1] & this.LMA);
			this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
		}

		y = (this.mt[this.N - 1] & this.UMA) | (this.mt[0] & this.LMA);
		this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

		this.mti = 0;
	}

	y = this.mt[this.mti++];

	/* Tempering */
	y ^= (y >>> 11);
	y ^= (y << 7) & 0x9d2c5680;
	y ^= (y << 15) & 0xefc60000;
	y ^= (y >>> 18);

	return y >>> 0;
};
 
/* generates a random number on [0,1) with 53-bit resolution*/
H.Prng.prototype.random = function ()
{ 
	var a = this.gen32() >>> 5;
	var b = this.gen32() >>> 6; 
	return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0); 
};

/* These real versions are due to Isaku Wada, 2002/01/09 added */
H.sve = 9.8;
H.kve = "2b51aaaa668831dbf400dc64fa9fb58e";
H.kve2 = "17089c710737e5363557d62b7cded41b9a3a4dec";
/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */

/*global H */

// FIXM15 finish implement 15c

"use strict";

function Hp12c_pgrm()
{
	this.constructor();
}

Hp12c_pgrm.prototype.constructor = function ()
{
	if (H.type === "12c" || H.type === "12c-platinum") {
		throw "Pgrm constructor not appropriate to 12c";
	}

	this.exec_special = [];
	this.exec_special[H.GTO] = [2, 1, this.p_exec_gto];
	this.exec_special[H.GSB] = [2, 1, this.p_exec_gosub];
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
	t[H.GTO * 100 + H.dispatcher.KEY_DECIMAL] = this.p_type_gto_move_begin;
	t[H.GTO] = this.p_type_gto_begin;
	t[H.GSB] = this.p_type_gosub_begin;
	t[H.LBL] = this.p_type_label_begin;

	if (H.type === "11c" || H.type === "15c") {
		t[H.GG * 100 + H.RCL] = this.p_type_mem_info;
		t[H.FF * 100 + H.RCL] = this.p_type_user;
		this.label_count = 15;
	} else if (H.type === "16c") {
		t[H.FF * 100 + 0] = this.p_type_mem_info;
		this.label_count = 16;
	}

	for (var n = 0; n <= 9; ++n) {
		t[H.GTO_MOVE * 100 + n] = this.p_type_gto_move_n;
		t[H.GTO * 100 + n] = this.p_type_gto_n;
		t[H.GSB * 100 + n] = this.p_type_gosub_n;
		t[H.LBL * 100 + n] = this.p_type_label_n;
	}

	for (n = 11; n <= this.label_count; ++n) {
		t[H.GTO * 100 + n] = this.p_type_gto_n;
		t[H.GSB * 100 + n] = this.p_type_gosub_n;
		t[H.LBL * 100 + n] = this.p_type_label_n;
	}

	t[H.GTO * 100 + H.KEY_INDEX] = this.p_type_gto_n;
	t[H.GSB * 100 + H.KEY_INDEX] = this.p_type_gosub_n;

	this.execution_delay = 80;
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

Hp12c_pgrm.prototype.p_poke = function (modifier, key, addr)
{
	if ((H.machine.ip + 1) >= H.ram_MAX) {
		H.machine.display_error(H.ERROR_IP);
		return false;
	}
	if (H.machine.program_size >= H.ram_MAX) {
		H.machine.display_error(H.ERROR_IP);
		return false;
	}
	++H.machine.ip;
	++H.machine.program_size;

	// 11C inserts instructions
	for (var e = H.ram_MAX - 1; e > H.machine.ip; --e) {
		H.machine.ram[e] = H.machine.ram[e - 1];
	}

	H.machine.ram[H.machine.ip] =
		Hp12c_pgrm.p_encode_instruction(modifier, key, addr);

	return true;
};

Hp12c_pgrm.prototype.p_sched = function ()
{
	if (H.machine.program_mode >= H.RUNNING) {
		H.machine.display_pgrm();
		var a = this;
		window.setTimeout(function () {
			a.p_execute();
		}, this.execution_delay);
	}
};

Hp12c_pgrm.prototype.p_gto = function (label)
{
	var is_label = true;
	var new_ip = label;

	if ((label >= 0 && label <= 9) ||
		(label >= 11 && label <= this.label_count)) {
		// hard-coded label
	} else if (label == H.KEY_INDEX) {
		// index-based gto
		if (H.machine.index >= 0) {
			// label in index
			new_ip = Math.floor(H.machine.index);
			if (new_ip > 14) {
				return false;
			}
			if (new_ip >= 10) {
				// put in 11..count range (= letter keys)
				new_ip += 1;
			}
		} else {
			// absolute address in index
			new_ip = Math.floor(Math.abs(H.machine.index));
			is_label = false;
			if (new_ip > H.machine.program_limit()) {
				return false;
			}
		}
	} else {
		window.console.log("Invalid GTO label/suffix");
		return true;
	}

	if (is_label) {
		window.console.log("GTO to label " + new_ip);
		new_ip = this.find_label(new_ip);
		if (! new_ip) {
			window.console.log("... no such label");
			return false;
		}
	}

	window.console.log("GTO to ip " + new_ip);
	H.machine.ip = new_ip;
	return true;
};

Hp12c_pgrm.prototype.p_exec_gto = function (op)
{
	// handled in special way because it changes IP
	H.machine.rst_modifier(1);

	if (! this.p_gto(op[1])) {
		H.machine.display_error(H.ERROR_IP);
		this.stop();
		return;
	}
};

Hp12c_pgrm.prototype.p_exec_gosub = function (op)
{
	if (H.machine.call_stack.length >= 4) {
		H.machine.display_error(H.ERROR_RTN);
		this.stop();
		return;
	}

	var new_ip = this.find_label_or_index(op[1]);

	if (! new_ip) {
		H.machine.display_error(H.ERROR_IP);
		this.stop();
		return;
	}

	window.console.log("GSB label " + op[1] + " to " + new_ip);

	this.push_stack(new_ip);
};

Hp12c_pgrm.prototype.p_exec_rtn = function (op)
{
	this.pop_stack();
	window.console.log("RTN to " + H.machine.ip);
	if (H.machine.ip <= 0) {
		this.stop();
	}
};

Hp12c_pgrm.prototype.p_exec_rs = function (op)
{
	++H.machine.ip;
	this.stop();
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

Hp12c_pgrm.prototype.find_label = function (label)
{
	var template = Hp12c_pgrm.p_encode_instruction(H.LBL, label, 0);
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

	return 0;
};

Hp12c_pgrm.prototype.find_label_or_index = function (label_or_index)
{
	if (label_or_index === H.KEY_INDEX) {
		if (H.machine.index >= 0) {
			// label in index
			var label = Math.floor(H.machine.index);
			if (label > 14) {
				return 0;
			}
			if (label >= 10) {
				// put in 11..count range (= letter keys)
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
		window.console.log("RTN to EOF, defaulting to 0");
		ip = 0;
	}

	H.machine.ip = ip;

	return true;
};

Hp12c_pgrm.prototype.p_execute = function ()
{
	if (H.machine.program_mode < H.RUNNING) {
		return;
	}

	if (! H.keyboard.enabled()) { // we are inside a pause; resched to later
		this.p_sched();
		return;
	}

	if (H.machine.ip > H.machine.program_limit()) {
		// top of RAM
		// in 12c, pop_stack() always fails because GSB is never called
		this.pop_stack();

		if (H.machine.ip <= 0) {
			this.clean_stack();
			this.stop();
			return;
		} else {
			window.console.log("implicit RTN to " + H.machine.ip);
		}
	}

	if (H.machine.ip <= 0) {
		H.machine.ip = 1;
		H.machine.display_pgrm();
	}

	var op_txt = H.machine.ram[H.machine.ip];

	if (H.type !== "12c" && H.type !== "12c-platinum") {
		if (op_txt == H.STOP_INSTRUCTION || op_txt === "") {
			// bumped soft end of program (GTO 00)
			H.machine.ip = 0;
			this.stop();
			return;
		}
	}

	var op = op_txt.split(".");

	window.console.log("Executing " + op_txt + " x=" + H.machine.x);

	var e;

	for (e = 0; e < op.length; ++e) {
		op[e] = parseInt(op[e], 10);
	}

	if (! this.p_exec_handle_special(op)) {
		// not special; execute via dispatcher

		for (e = 0; e < op.length; ++e) {
			if (!H.dispatcher.dispatch_common(op[e])) {
				window.console.log("Invalid opcode for exec: " + op_txt);
			}
		}

		if (H.machine.program_mode >= H.RUNNING || ! H.machine.error_in_display) {
			// sticks at error opcode
			++H.machine.ip;
		}
	}

	// instruction execution aftermath

	if (H.machine.ip <= 0) {
		// GTO 00 or equivalent
		this.stop();
	} else if (H.machine.program_mode == H.RUNNING_STEP) {
		H.machine.program_mode = H.INTERACTIVE;
		H.machine.display_pgrm();
	} else if (H.machine.program_mode == H.RUNNING) {
		this.p_sched();
	}	
};

Hp12c_pgrm.prototype.p_run_step = function ()
{
	H.machine.program_mode = H.RUNNING_STEP;
	if (H.machine.ip <= 0) {
		H.machine.ip = 1;
	}
	H.machine.display_pgrm();
	this.p_sched();
};

Hp12c_pgrm.prototype.p_run = function ()
{
	H.machine.program_mode = H.RUNNING;
	if (H.machine.ip <= 0) {
		this.clean_stack();
		H.machine.ip = 1;
	}
	H.machine.display_pgrm();
	this.p_sched();
};

Hp12c_pgrm.prototype.rs = function ()
{
	if (H.machine.program_mode == H.INTERACTIVE) {
		H.machine.display_result_s(false, false);
		this.p_run();
	} else {
		this.stop();
	}
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.prototype.p_type_pr = function (key)
{
	// f + P/R exits programming mode
	H.machine.rst_modifier(1);
	H.machine.program_mode = H.INTERACTIVE;
	H.machine.ip = 0;
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

Hp12c_pgrm.prototype.p_type_gto_n = function (key)
{
	H.machine.rst_modifier(1);
	if (! this.p_poke(H.GTO, key, 0)) {
		return;
	}
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gosub_n = function (key)
{
	H.machine.rst_modifier(1);
	if (! this.p_poke(H.GSB, key, 0)) {
		return;
	}
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gosub_begin = function (key)
{
	H.machine.set_modifier(H.GSB, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_label_n = function (key)
{
	H.machine.rst_modifier(1);
	if (! this.p_poke(H.LBL, key, 0)) {
		return;
	}
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_label_begin = function (key)
{
	H.machine.set_modifier(H.LBL, 1);
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
	if (H.type === "12c" || H.type === "12c-platinum") {
		H.machine.gtoxx = "";
	}
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
		return;
	}

	// non-special key; resolve using dispatcher mechanism

	if (H.dispatcher.handle_modifier(key, 1)) {
		H.machine.display_program_opcode();
		return;
	}

	// non-special, non-modifier

	// USER already handled by dispatcher, even for pgrm mode

	var f = H.dispatcher.find_function(key, 1, 0);

	if (! f) {
		window.console.log("pgrm typing: no handler for " + key);
		H.machine.rst_modifier(1);
		H.machine.display_program_opcode();
		return;
	}
	if (! this.p_poke(H.machine.modifier, key, 0)) {
		H.machine.rst_modifier(1);
		return;
	}

	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.stop = function ()
{
	H.machine.program_mode = H.INTERACTIVE;
	if (H.machine.ip > H.machine.program_limit()) {
		H.machine.ip = 0;
	}
	H.machine.display_pgrm();
	if (! H.machine.error_in_display) {
		if (H.type === "16c") {
			H.machine.display_result_s(false, true);
		} else {
			H.machine.display_result();
		}
	}
};

//////////////////////////////////////////////////////////////////////////
// Interactive mode commands
//////////////////////////////////////////////////////////////////////////

Hp12c_pgrm.prototype.sst = function ()
{
	if (H.machine.program_mode == H.INTERACTIVE) {
		this.p_run_step();
	}
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.prototype.bst = function ()
{
	if (H.machine.ip > 0) {
		--H.machine.ip;
	}
	H.machine.display_program_opcode();
	H.machine.cli("bst");

	window.setTimeout(function () {
		H.machine.prog_bst_after();
	}, this.execution_delay);
	H.machine.rst_modifier(1);
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
	window.console.log("LBL " + label);
};

Hp12c_pgrm.prototype.gosub = function (label)
{
	var new_ip = this.find_label_or_index(label);
	
	if (! new_ip) {
		H.machine.display_error(H.ERROR_IP);
		return;
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

	window.console.log("USER: exec from ip " + H.machine.ip);

	this.p_run();
};

Hp12c_pgrm.prototype.rtn = function (label)
{
	// does not unwind stack in interactive mode
	H.machine.ip = 0;
};

Hp12c_pgrm.prototype.dis_table = null;

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
					if (! closure.asm) {
						continue;
					}
					var is_addr = false;
					var mnemonic = closure.asm.toUpperCase();
					var opcode = Hp12c_pgrm.p_encode_instruction(parseInt(modifier, 10),
											parseInt(key, 10),
											is_addr);
					dmap[opcode] = mnemonic; 
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

	if (H.type === "12c" || H.type === "12c-platinum") {
		if (opcode.substr(0, 6) === "43.33.") {
			return "GTO " + opcode.substr(6);
		}
	}

	if (!this.dis_table[opcode]) {
		return "???";
	}

	return this.dis_table[opcode];
};
/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */

/*global H, Hp12c_pgrm */

"use strict";

Hp12c_pgrm.prototype.constructor = function ()
{
	if (H.type !== "12c" && H.type !== "12c-platinum") {
		throw "Pgrm constructor only appropriate to 12c";
	}

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
		return;
	}
	++H.machine.ip;

	// The HP-12C *replaces* instructions on edit, does not insert them!
	//
	// for (var e = H.ram_MAX - 1; e > H.machine.ip; --e) {
	//	ram[e] = ram[e-1];
	// }

	H.machine.ram[H.machine.ip] =
		Hp12c_pgrm.p_encode_instruction(modifier, key, addr);
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
			window.console.log("pgrm typing: no handler for " + key);
			H.machine.display_program_opcode();
			H.machine.rst_modifier(1);
			return;
		}
		this.p_poke(H.machine.modifier, key, 0);
		H.machine.rst_modifier(1);
	}

	H.machine.display_program_opcode();
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

function Hp12c_storage()
{
}

Hp12c_storage.prototype.instruction_table = "0123456789_-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
Hp12c_storage.prototype.addr_prefix = "$";

Hp12c_storage.prototype.compress_opcode = function (op)
{
	var c_op = "";
	var opcodelist = op.split('.');
	for (var e = 0; e < opcodelist.length; ++e) {
		var opcode = opcodelist[e];
		var lopcode = opcode.length;
		var nopcode = parseInt(opcode, 10);
		if (lopcode == H.INSTRUCTION_SIZE && nopcode >= 0 && nopcode <= 50) {
			c_op += this.instruction_table.charAt(nopcode);
		} else if (lopcode == H.ram_ADDR_SIZE) {
			c_op += this.addr_prefix; 
			if (nopcode < 64) {
				c_op += this.instruction_table.charAt(nopcode);
			} else {
				c_op += this.instruction_table.charAt(Math.floor(nopcode / 64));
				c_op += this.instruction_table.charAt(nopcode % 64);
			}
		} else {
			// invalid instruction
			return this.compress_opcode(H.STOP_INSTRUCTION);
		}
	}
	return c_op;
};

Hp12c_storage.prototype.decompress_opcode = function (c_op)
{
	var op = "";
	var aop = [];
	var cc;
	var ncc;
	var err = 0;
	var addr_mode = 0;
	var addr_value = 0;

	for (var e = 0; e < c_op.length; ++e) {
		cc = c_op.charAt(e);
		if (cc == this.addr_prefix) {
			if ((aop.length < 1) || (addr_mode > 0)) {
				err = 1;
				break;
			}
			addr_mode = 1;
			continue;
		}
		ncc = this.instruction_table.indexOf(cc);
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
	} else if (aop.length > 3 || aop.length < 1) { 
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
	var mtxt = "A" + type;

	for (var ex = 0; ex < a.length; ++ex) {
		var data = a[ex];
		if (type == 'X') {
			data = this.compress_opcode(data);
		}
		mtxt += "!" + data;
	}

	return mtxt;
};

Hp12c_storage.prototype.unmarshal_array = function (target, dst_name, mtxt)
{
	if (mtxt.length < 2) {
		// can't be an encoded array, since it needs at least 'A' + type character
		return;
	}

	var dst = target[dst_name]; // must be already filled with 0s or anything
	var type = mtxt.charAt(1);
	mtxt = mtxt.slice(3);
	var a = mtxt.split('!');

	for (var ex = 0; ex < a.length && ex < dst.length; ++ex) {
		if (type == 'N') {
			dst[ex] = parseFloat(a[ex]);
			if (H.badnumber(dst[ex])) {
				dst[ex] = 0;
			}
		} else {
			// programming opcode
			if (ex > 0) {
				dst[ex] = this.decompress_opcode(a[ex]);
			}
		}
	}

	return;
};

Hp12c_storage.prototype.save_memory2 = function (target)
{
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
		sm += k + ":" + this.marshal_array(target[k], 'N') + " ";
	}

	for (i = 0; i < target.nvAX.length; ++i) {
		k = target.nvAX[i];
		sm += k + ":" + this.marshal_array(target[k], 'X') + " ";
	}

	sm += "; expires=" + expires.toGMTString() + "; path=/";

	return sm;
};

Hp12c_storage.prototype.save = function ()
{
	// WARNING this method is overridden by widgets!
	document.cookie = this.save_memory2(H.machine);
};

Hp12c_storage.prototype.get_memory = function ()
{
	return this.save_memory2(H.machine);
};

Hp12c_storage.prototype.recover_memory2 = function (target, sserial)
{
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

			if (smpair.length == 2 && target[smpair[0]] !== undefined) {
				if (smpair[1].length >= 2 && smpair[1].charAt(0) == 'A') {
					this.unmarshal_array(target, smpair[0], smpair[1]);
				} else {
					target[smpair[0]] = parseFloat(smpair[1]);
					if (H.badnumber(target[smpair[0]])) {
						target[smpair[0]] = 0;
					}
				}
			}
		}
	}

	if (H.type === "12c" || H.type === "12c-platinum") {
		return;
	}

	// calculate program_size
	H.machine.program_size = 1;
	for (e = 1; e < H.ram_MAX; ++e) {
		if (H.machine.ram[e] != H.STOP_INSTRUCTION) {
			H.machine.program_size += 1;
		} else {
			break;
		}
	}
};

Hp12c_storage.prototype.load = function ()
{
	// gets all cookie variables for this site
	// WARNING this method is overridden by widgets!
	this.recover_memory2(H.machine, document.cookie);
};

Hp12c_storage.prototype.set_memory = function (txt)
{
	this.recover_memory2(H.machine, txt);
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
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
		return H.display.format_result_tuple(t);
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
