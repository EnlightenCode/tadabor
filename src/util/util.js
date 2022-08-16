export function normalize_text(text) {
  //normalize Arabic
  text = text.replace(/(ٱ)/g, "ا");

  //remove special characters
  text = text.replace(
    /([^\u0621-\u063A\u0641-\u064A\u0660-\u0669a-zA-Z 0-9])/g,
    ""
  );

  return text;
}

export function onlySpaces(str) {
  return str.trim().length === 0;
}