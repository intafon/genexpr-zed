; Comments
(comment) @comment

; Strings
(string_literal) @string

; Numbers
(number_literal) @number

; Type specifiers (param, history, buffer, data, delay)
(type_specifier) @type

; Keywords
"require" @keyword.import

["if" "else"] @keyword.control

["while" "do" "for"] @keyword.control

["return" "break" "continue"] @keyword.return

; Function definitions
(function_declaration
  name: (identifier) @function)

; Function calls — identifier(args)
(postfix_expression
  object: (identifier) @function.call
  field: (call_member_expression))

; Method calls — obj.method(args)
(literal_member_expression
  field: (identifier) @function.method
  parameters: (call_member_expression))

; Property access — obj.prop
(literal_member_expression
  field: (identifier) @property)

; Inlet/outlet variables (in1, out2, etc.)
(inlet_outlet) @variable.special

; Operators
(assignment_operator) @operator

(binary_expression operator: _ @operator)

(unary_expression operator: _ @operator)

["?" ":"] @operator

; Punctuation
["(" ")" "[" "]" "{" "}"] @punctuation.bracket

[";" "," "."] @punctuation.delimiter

; Function parameters and named attributes
(function_declaration_parameter (identifier) @variable.parameter)
(function_declaration_parameter key: (identifier) @property)
(call_member_expression
  (identifier) @property
  "=")

; Bare inlet/outlet aliases are identifiers in the current grammar.
((identifier) @variable.special
  (#match? @variable.special "^(in|out)$"))

; Built-in constants. Generated from the server catalog by scripts/sync-highlights.mjs.
; BEGIN GENERATED CONSTANTS
((identifier) @constant.builtin
  (#match? @constant.builtin "^(DEGTORAD|E|HALFPI|INVPI|LN10|LN2|LOG10E|LOG2E|PHI|PI|RADTODEG|SQRT1_2|SQRT2|TWOPI|degtorad|e|elapsed|fftfullspect|ffthop|fftoffset|fftsize|halfpi|invpi|ln10|ln2|log10e|log2e|mc_channel|mc_channelcount|phi|pi|radtodeg|samplerate|sqrt1_2|sqrt2|twopi|vectorsize|voice|voicecount)$"))
; END GENERATED CONSTANTS
