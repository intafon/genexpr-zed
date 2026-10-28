(function_declaration
  name: (identifier) @name) @item

; Each declared identifier gets an entry, including comma-separated declarations.
(declaration
  (type_specifier) @context
  (identifier) @name) @item
