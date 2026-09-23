#!/usr/bin/env node
/**
 * WCAG Contrast Checker for OKLCH colors
 * Usage: node scripts/check-contrast.mjs
 */

// OKLCH to sRGB conversion
function oklchToSrgb(l, c, h) {
	const hRad = (h * Math.PI) / 180;
	const a = c * Math.cos(hRad);
	const b = c * Math.sin(hRad);

	// OKLab to linear sRGB
	let L = l / 100;
	let L_ = L + 0.3963377774 * a + 0.2158037573 * b;
	let M_ = L - 0.1055613458 * a - 0.0638541728 * b;
	let S_ = L - 0.0894841775 * a - 1.291485548 * b;

	L_ = L_ ** 3;
	M_ = M_ ** 3;
	S_ = S_ ** 3;

	// Linear sRGB
	let r = +4.0767416621 * L_ - 3.3077115913 * M_ + 0.2309699292 * S_;
	let g = -1.2684380046 * L_ + 2.6097574011 * M_ - 0.3413193965 * S_;
	let b_ = -0.0041960863 * L_ - 0.7034186147 * M_ + 1.707614701 * S_;

	// sRGB gamma correction
	function gammaCorrect(x) {
		return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
	}

	r = gammaCorrect(r);
	g = gammaCorrect(g);
	b_ = gammaCorrect(b_);

	// Clamp to [0, 1]
	r = Math.max(0, Math.min(1, r));
	g = Math.max(0, Math.min(1, g));
	b_ = Math.max(0, Math.min(1, b_));

	return { r, g, b: b_ };
}

// Relative luminance
function relativeLuminance({ r, g, b }) {
	const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const rLin = toLinear(r);
	const gLin = toLinear(g);
	const bLin = toLinear(b);
	return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

// Contrast ratio
function contrastRatio(lum1, lum2) {
	const lighter = Math.max(lum1, lum2);
	const darker = Math.min(lum1, lum2);
	return (lighter + 0.05) / (darker + 0.05);
}

// Parse OKLCH string like "oklch(44% 0.115 158)"
function parseOklch(str) {
	const match = str.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/);
	if (!match) throw new Error(`Invalid OKLCH: ${str}`);
	return {
		l: parseFloat(match[1]),
		c: parseFloat(match[2]),
		h: parseFloat(match[3]),
	};
}

// Check a color pair
function checkPair(name, fgStr, bgStr, isLargeText = false) {
	const fg = parseOklch(fgStr);
	const bg = parseOklch(bgStr);

	const fgRgb = oklchToSrgb(fg.l, fg.c, fg.h);
	const bgRgb = oklchToSrgb(bg.l, bg.c, bg.h);

	const fgLum = relativeLuminance(fgRgb);
	const bgLum = relativeLuminance(bgRgb);

	const ratio = contrastRatio(fgLum, bgLum);
	const required = isLargeText ? 3 : 4.5;
	const pass = ratio >= required;

	return {
		name,
		ratio: ratio.toFixed(2),
		required,
		pass,
		fgLum: fgLum.toFixed(4),
		bgLum: bgLum.toFixed(4),
	};
}

// Theme definitions from layout.css
const themes = {
	'bi-light': {
		'base-100': 'oklch(98.4% 0.003 95)',
		'base-200': 'oklch(95.8% 0.005 95)',
		'base-300': 'oklch(91% 0.007 95)',
		'base-content': 'oklch(26% 0.012 95)',
		primary: 'oklch(44% 0.115 158)',
		'primary-content': 'oklch(98% 0.005 120)',
		secondary: 'oklch(40% 0.015 95)',
		'secondary-content': 'oklch(97% 0.005 95)',
		accent: 'oklch(63% 0.125 80)',
		'accent-content': 'oklch(24% 0.04 80)',
		neutral: 'oklch(30% 0.012 95)',
		'neutral-content': 'oklch(96% 0.005 95)',
		info: 'oklch(52% 0.08 240)',
		'info-content': 'oklch(97% 0.005 240)',
		success: 'oklch(50% 0.1 152)',
		'success-content': 'oklch(97% 0.01 152)',
		warning: 'oklch(66% 0.13 70)',
		'warning-content': 'oklch(25% 0.03 70)',
		error: 'oklch(52% 0.14 25)',
		'error-content': 'oklch(97% 0.01 25)',
	},
	'bi-dark': {
		'base-100': 'oklch(21% 0.008 95)',
		'base-200': 'oklch(17.5% 0.008 95)',
		'base-300': 'oklch(26% 0.01 95)',
		'base-content': 'oklch(90% 0.008 95)',
		primary: 'oklch(76% 0.135 155)',
		'primary-content': 'oklch(20% 0.045 155)',
		secondary: 'oklch(75% 0.012 95)',
		'secondary-content': 'oklch(20% 0.008 95)',
		accent: 'oklch(80% 0.12 85)',
		'accent-content': 'oklch(22% 0.035 85)',
		neutral: 'oklch(30% 0.012 95)',
		'neutral-content': 'oklch(90% 0.008 95)',
		info: 'oklch(68% 0.09 240)',
		'info-content': 'oklch(18% 0.02 240)',
		success: 'oklch(70% 0.11 150)',
		'success-content': 'oklch(18% 0.03 150)',
		warning: 'oklch(76% 0.13 75)',
		'warning-content': 'oklch(22% 0.03 75)',
		error: 'oklch(68% 0.14 25)',
		'error-content': 'oklch(18% 0.02 25)',
	},
};

const pairs = [
	// Text on backgrounds (body text - 4.5:1 required)
	['base-content on base-100', 'base-content', 'base-100', false],
	['base-content on base-200', 'base-content', 'base-200', false],
	['base-content on base-300', 'base-content', 'base-300', false],

	// Primary interactions
	['primary-content on primary', 'primary-content', 'primary', true],
	['secondary-content on secondary', 'secondary-content', 'secondary', true],
	['accent-content on accent', 'accent-content', 'accent', true],
	['neutral-content on neutral', 'neutral-content', 'neutral', true],

	// Semantic colors
	['info-content on info', 'info-content', 'info', true],
	['success-content on success', 'success-content', 'success', true],
	['warning-content on warning', 'warning-content', 'warning', true],
	['error-content on error', 'error-content', 'error', true],

	// Large text on backgrounds (3:1 required)
	['base-content on base-100 (large)', 'base-content', 'base-100', true],
	['primary on base-100', 'primary', 'base-100', true],
	['secondary on base-100', 'secondary', 'base-100', true],
	['accent on base-100', 'accent', 'base-100', true],
];

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    WCAG AA CONTRAST CHECK REPORT                             ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

let allPass = true;

for (const [themeName, theme] of Object.entries(themes)) {
	console.log(`┌─ ${themeName.toUpperCase()} ─────────────────────────────────────────────────`);
	console.log('│');

	for (const [pairName, fgKey, bgKey, isLarge] of pairs) {
		if (!theme[fgKey] || !theme[bgKey]) continue;

		const result = checkPair(pairName, theme[fgKey], theme[bgKey], isLarge);
		const status = result.pass ? '✅ PASS' : '❌ FAIL';
		const type = isLarge ? 'Large (3:1)' : 'Body (4.5:1)';

		console.log(`│  ${status} │ ${result.ratio}:1 (${type}) │ ${pairName}`);

		if (!result.pass) allPass = false;
	}

	console.log('│');
}

console.log('└──────────────────────────────────────────────────────────────────────────────\n');

if (allPass) {
	console.log('✅ ALL CONTRAST CHECKS PASSED - WCAG AA compliant');
	process.exit(0);
} else {
	console.log('❌ SOME CONTRAST CHECKS FAILED - WCAG AA not met');
	process.exit(1);
}