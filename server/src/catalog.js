// Curated GenExpr call forms, not Max object-box constructor signatures.
// Sources and update procedure: docs/research.md and docs/development.md.
const reference = (domain, name) =>
  `https://docs.cycling74.com/reference/gen_${domain}_${name}/`;

export const catalog = [];
function add(name, parameters, description, options = {}) {
  const entry = {
    name, parameters, description, domain: 'common', kind: 'function', attributes: [],
    ...options,
  };
  entry.url ??= reference(entry.domain, entry.reference ?? name.toLowerCase());
  catalog.push(entry);
  return entry;
}

const unary = {
  abs: 'Absolute value.', ceil: 'Round toward positive infinity.',
  floor: 'Round toward negative infinity.', trunc: 'Discard the fractional part toward zero.',
  fract: 'Fractional component of a value.', sign: 'Return the sign of a value.',
  bool: 'Convert zero to zero and other values to one.', not: 'Test whether the input is zero.',
  neg: 'Negate the input.', exp: 'Exponential with base e.', exp2: 'Exponential with base two.',
  fastexp: 'Approximate exponential with base e.', ln: 'Natural logarithm.',
  log: 'Natural logarithm.', log10: 'Base-ten logarithm.', log2: 'Base-two logarithm.',
  sqrt: 'Square root.', sin: 'Sine; the angle is in radians.', cos: 'Cosine; the angle is in radians.',
  tan: 'Tangent; the angle is in radians.', asin: 'Inverse sine, returning radians.',
  acos: 'Inverse cosine, returning radians.', atan: 'Inverse tangent, returning radians.',
  sinh: 'Hyperbolic sine.', cosh: 'Hyperbolic cosine.', tanh: 'Hyperbolic tangent.',
  asinh: 'Inverse hyperbolic sine.', acosh: 'Inverse hyperbolic cosine.', atanh: 'Inverse hyperbolic tangent.',
  fastsin: 'Approximate sine.', fastcos: 'Approximate cosine.', fasttan: 'Approximate tangent.',
  degrees: 'Convert radians to degrees.', radians: 'Convert degrees to radians.',
  int: 'Convert to an integer.', float: 'Convert to a floating-point value.', pass: 'Return the input unchanged.',
};
for (const [name, description] of Object.entries(unary)) add(name, ['input'], description);
const binary = {
  add: 'Add two values.', sub: 'Subtract the second value from the first.', mul: 'Multiply two values.',
  div: 'Divide the first value by the second.', mod: 'Remainder after division.',
  rsub: 'Subtract the first value from the second.', rdiv: 'Divide the second value by the first.',
  rmod: 'Remainder of the second value divided by the first.',
  absdiff: 'Absolute difference between two values.', pow: 'Raise a base to an exponent.',
  fastpow: 'Approximate power function.', hypot: 'Length of a two-dimensional vector.',
  eq: 'One when the inputs are equal; otherwise zero.', neq: 'One when the inputs differ; otherwise zero.',
  gt: 'One when the first input is greater.', gte: 'One when the first input is greater or equal.',
  lt: 'One when the first input is less.', lte: 'One when the first input is less or equal.',
  eqp: 'Pass the first input when equal; otherwise zero.', neqp: 'Pass the first input when unequal; otherwise zero.',
  gtp: 'Pass the first input when greater; otherwise zero.', gtep: 'Pass the first input when greater or equal; otherwise zero.',
  ltp: 'Pass the first input when less; otherwise zero.', ltep: 'Pass the first input when less or equal; otherwise zero.',
  and: 'One when both inputs are nonzero.', or: 'One when either input is nonzero.',
  xor: 'One when exactly one input is nonzero.', step: 'Zero when the first input is below the second; otherwise one.',
};
for (const [name, description] of Object.entries(binary)) add(name, ['a', 'b'], description);
add('atan2', ['y', 'x'], 'Angle of a Cartesian vector, in radians.');
add('cartopol', ['x', 'y'], 'Convert Cartesian coordinates to radius and angle.', { returns: ['radius', 'angle'] });
add('poltocar', ['radius', 'angle'], 'Convert polar coordinates to Cartesian coordinates.', { returns: ['x', 'y'] });
for (const name of ['min', 'max']) add(name, ['a', 'b'], `Return the ${name === 'min' ? 'smallest' : 'largest'} input.`);
add('minimum', ['a', 'b'], 'Alias for min.', { reference: 'min' });
add('maximum', ['a', 'b'], 'Alias for max.', { reference: 'max' });
for (const name of ['clamp', 'clip', 'wrap', 'fold']) {
  add(name, ['input', 'low=0', 'high=1'], `${name === 'wrap' ? 'Wrap' : name === 'fold' ? 'Fold' : 'Constrain'} a value into a range.`);
}
add('mix', ['a', 'b', 'amount'], 'Interpolate between a and b; amount zero selects a, one selects b.');
add('smoothstep', ['a', 'b', 'amount'], 'Smoothly interpolate between a and b, with an amount clamped to zero through one.');
add('scale', ['input', 'inLow', 'inHigh', 'outLow', 'outHigh', 'exponent=1'], 'Map an input interval onto an output interval.');
add('selector', ['selection', '...'], 'Select a following input using a one-based selector; zero selects silence.');
add('switch', ['condition', 'ifTrue', 'ifFalse'], 'Choose a value according to a condition.');
add('noise', [], 'Generate noise in the range minus one through one.');

const constants = {
  pi: 'Ratio of circumference to diameter.', twopi: 'Two times pi.', halfpi: 'One half of pi.',
  invpi: 'One divided by pi.', e: 'Base of the natural logarithm.', phi: 'Golden ratio.',
  sqrt2: 'Square root of two.', sqrt1_2: 'Square root of one half.',
  ln2: 'Natural logarithm of two.', ln10: 'Natural logarithm of ten.',
  log2e: 'Base-two logarithm of e.', log10e: 'Base-ten logarithm of e.',
  degtorad: 'Multiply by this to convert degrees to radians.',
  radtodeg: 'Multiply by this to convert radians to degrees.',
};
for (const [name, description] of Object.entries(constants)) {
  add(name, [], description, { kind: 'constant' });
  add(name.toUpperCase(), [], description, { kind: 'constant', reference: name });
}
for (const [name, description] of Object.entries({
  samplerate: 'Host sample rate in samples per second.', vectorsize: 'Host signal vector size.',
  voice: 'Current voice number.', voicecount: 'Number of voices.',
  mc_channel: 'Current MC channel number.', mc_channelcount: 'Number of MC channels.',
  elapsed: 'Elapsed sample count.', fftsize: 'FFT size in an FFT processing context.',
  ffthop: 'FFT hop size.', fftoffset: 'FFT offset.', fftfullspect: 'Full-spectrum FFT flag.',
})) add(name, [], description, { domain: 'dsp', kind: 'constant' });

const attr = (name, defaultValue, description, values) => ({ name, default: defaultValue, description, ...(values ? { values } : {}) });
const interpolation = (defaultValue = 'linear') => attr('interp', defaultValue, 'Interpolation between stored samples.',
  ['none', 'step', 'linear', 'cosine', 'cubic', 'fastcubic', 'spline', 'spline6']);
const boundary = (name, defaultValue) => attr(name, defaultValue, 'Behavior for indices outside the available range.',
  ['ignore', 'wrap', 'fold', 'mirror', 'clip', 'clamp']);
const dsp = (name, parameters, description, options = {}) => add(name, parameters, description, { domain: 'dsp', ...options });

dsp('cycle', ['frequencyOrPhase=0'], 'Sine oscillator, or wavetable oscillator when a buffer is supplied. The index attribute selects whether the input is frequency or phase.', {
  attributes: [attr('index', 'freq', 'Interpret the input as frequency or phase.', ['freq', 'phase']), attr('name', '', 'Data or Buffer name for wavetable lookup.')],
});
dsp('phasor', ['frequency=0', 'reset=0'], 'Generate a repeating ramp from zero to one.', { attributes: [attr('phase', 0, 'Initial phase.')] });
dsp('triangle', ['phase', 'duty=0.5'], 'Triangle waveform driven by a phase input.');
dsp('train', ['period', 'width=0.5', 'phase=0'], 'Pulse train.');
for (const [name, description] of Object.entries({
  delta: 'Difference between current and previous input samples.',
  change: 'Sign of the change from the previous input sample.',
  dcblock: 'Remove the DC component using a high-pass filter.',
  fixnan: 'Replace NaN with zero.', fixdenorm: 'Replace denormal values with zero.',
  isnan: 'Test for a NaN value.', isdenorm: 'Test for a denormal value.',
  mstosamps: 'Convert milliseconds to samples.', sampstoms: 'Convert samples to milliseconds.',
  mtof: 'Convert MIDI note number to frequency.', ftom: 'Convert frequency to MIDI note number.',
  dbtoa: 'Convert decibels to linear amplitude.', atodb: 'Convert linear amplitude to decibels.',
  t60: 'Calculate the per-sample decay factor for a decay time in samples.',
  t60time: 'Calculate a decay time in samples from a decay factor.',
  phasewrap: 'Wrap a radian phase into minus pi through pi.',
})) dsp(name, ['input'], description);
dsp('accum', ['increment=1', 'reset=0'], 'Accumulate an increment each sample.', {
  attributes: [attr('init', 0, 'Initial accumulator value.'), attr('min', 0, 'Lower bound.'), attr('max', null, 'Upper bound.'), attr('resetmode', 'post', 'Reset before or after accumulation.', ['pre', 'post'])],
});
dsp('counter', ['increment=1', 'reset=0', 'maximum=0'], 'Count with optional wrapping; also return wrap information.', { attributes: [attr('init', 0, 'Initial counter value.')] });
dsp('latch', ['input', 'control'], 'Pass the input when control is nonzero; otherwise hold the last value.', { attributes: [attr('init', 0, 'Initial held value.')] });
dsp('sah', ['input', 'control', 'threshold=0'], 'Sample and hold on a control threshold crossing.', { attributes: [attr('init', 0, 'Initial held value.')] });
dsp('slide', ['input', 'up=1', 'down=1'], 'Smooth rising and falling values with separate slide times.', { attributes: [attr('init', 0, 'Initial output.')] });
dsp('rate', ['phase', 'multiplier=1'], 'Scale the rate of a phase ramp.', { attributes: [attr('sync', 'off', 'Synchronization mode.', ['off', 'lock', 'cycle'])] });
dsp('round', ['input', 'base=1'], 'Round to a multiple of base.', { attributes: [attr('mode', 'nearest', 'Rounding direction.', ['nearest', 'trunc', 'floor', 'ceil'])] });
dsp('interp', ['amount', 'a', 'b', '...'], 'Interpolate values; the mode determines how many inputs are used.', { attributes: [attr('mode', 'linear', 'Interpolation mode.', ['linear', 'cosine', 'cubic', 'spline', 'spline6'])] });

for (const name of ['peek', 'sample', 'nearest', 'lookup', 'wave']) {
  const wave = name === 'wave';
  dsp(name, wave ? ['buffer', 'phase', 'start', 'end', 'channel=0'] : ['buffer', 'index', 'channel=0'],
    `Read a Data or Buffer${wave ? ' region using a normalized phase' : ''}. Channel indices are zero-based.`, {
      attributes: [
        boundary('boundmode', wave ? 'wrap' : name === 'lookup' ? 'clamp' : 'ignore'),
        boundary('channelmode', wave || name === 'lookup' ? 'clamp' : 'ignore'),
        attr('channels', 1, 'Number of output channels.'),
        attr('index', wave ? 'wave' : name === 'peek' ? 'samples' : name === 'lookup' ? 'lookup' : 'phase', 'Index interpretation.', ['samples', 'phase', 'lookup', 'signal', 'wave']),
        interpolation(name === 'peek' || name === 'nearest' ? 'none' : 'linear'),
      ],
    });
}
for (const name of ['poke', 'splat']) dsp(name, ['buffer', 'value', 'index', 'channel=0', 'overdub?'], 'Write to a Data or Buffer. Channel indices are zero-based. The optional overdub input controls how much of the original value is preserved.', {
  attributes: [boundary('boundmode', name === 'splat' ? 'wrap' : 'ignore'), boundary('channelmode', name === 'splat' ? 'clamp' : 'ignore'),
    attr('index', 'samples', 'Index interpretation.', ['samples', 'phase', 'lookup', 'signal']),
    attr('overdubmode', name === 'splat' ? 'mix' : 'accum', 'Combine new and stored values.', ['accum', 'mix'])],
});
dsp('dim', ['buffer'], 'Length of a Data or Buffer in samples.');
dsp('channels', ['buffer'], 'Channel count of a Data or Buffer.');

add('Param', ['value=0'], 'Declare an externally controlled parameter. The identifier follows Param.', {
  kind: 'declaration', reference: 'param', attributes: [attr('min', null, 'Minimum parameter value.'), attr('max', null, 'Maximum parameter value.')],
});
dsp('History', ['value=0'], 'Declare a persistent value with a one-sample delay.', { kind: 'declaration', reference: 'history' });
dsp('Buffer', ['externalName=name'], 'Declare a reference to a Max buffer~. The external name may be omitted to use the declared identifier.', { kind: 'declaration', reference: 'buffer' });
dsp('Data', ['size', 'channels=1'], 'Declare local sample storage.', { kind: 'declaration', reference: 'data' });
dsp('Delay', ['size=samplerate', 'taps=1'], 'Declare a delay line; use its read and write methods.', {
  kind: 'declaration', reference: 'delay', attributes: [interpolation(), attr('feedback', 1, 'Feedback behavior in visual patching.', [0, 1])],
});
dsp('read', ['delay', '...'], 'Read one or more taps from a declared Delay.', { kind: 'method', receiver: 'Delay', attributes: [interpolation()] });
dsp('write', ['value'], 'Write a sample to a declared Delay.', { kind: 'method', receiver: 'Delay' });

for (const name of ['in', 'out', 'in1', 'in2', 'out1', 'out2']) add(name, [], `${name.startsWith('in') ? 'Input' : 'Output'} of the enclosing codebox.`, { kind: 'variable', url: 'https://docs.cycling74.com/userguide/gen/gen_genexpr/' });

export function findEntry(name, receiver) {
  return catalog.find(entry => entry.name === name && (receiver ? entry.receiver === receiver : entry.kind !== 'method'))
    ?? catalog.find(entry => entry.kind === 'declaration' && entry.name.toLowerCase() === name.toLowerCase());
}

export function signatureLabel(entry, name = entry.name) {
  if (['constant', 'variable'].includes(entry.kind)) return entry.name;
  const prefix = entry.kind === 'declaration' ? `${entry.name} ${name === entry.name ? 'name' : name}` : name;
  const parameters = [...entry.parameters, ...entry.attributes.map(a => `${a.name}=${a.default === null ? '…' : JSON.stringify(a.default)}`)];
  return `${prefix}(${parameters.join(', ')})${entry.returns ? ` → ${entry.returns.join(', ')}` : ''}`;
}
