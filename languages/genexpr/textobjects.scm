(function_declaration) @function.around

(function_declaration
  "{" . (_)* @function.inside . "}")

(comment) @comment.around
