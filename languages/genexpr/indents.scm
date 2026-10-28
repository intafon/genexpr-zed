[
  (selection_statement)
  (while_statement)
  (for_statement)
  (do_statement)
] @indent

(compound_statement
  "{" @start
  "}" @end) @indent

(function_declaration
  "{" @start
  "}" @end) @indent

(call_member_expression
  "(" @start
  ")" @end) @indent
