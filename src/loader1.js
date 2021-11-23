module.exports = function (source) {
  return source.replace(/var/g, 'const')
}
