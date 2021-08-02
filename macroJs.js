"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var R = _interopRequireWildcard(require("ramda"));

var _icu = _interopRequireDefault(require("./icu"));

var _utils = require("./utils");

var _constants = require("./constants");

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var keepSpaceRe = /(?:\\(?:\r\n|\r|\n))+\s+/g;
var keepNewLineRe = /(?:\r\n|\r|\n)+\s+/g;

function normalizeWhitespace(text) {
  return text.replace(keepSpaceRe, " ").replace(keepNewLineRe, "\n").trim();
}

var MacroJs = /*#__PURE__*/function () {
  // Babel Types
  // Identifier of i18n object
  // Positional expressions counter (e.g. for placeholders `Hello {0}, today is {1}`)
  function MacroJs(_ref, _ref2) {
    var _this = this;

    var types = _ref.types;
    var i18nImportName = _ref2.i18nImportName;
    (0, _classCallCheck2.default)(this, MacroJs);
    (0, _defineProperty2.default)(this, "types", void 0);
    (0, _defineProperty2.default)(this, "i18nImportName", void 0);
    (0, _defineProperty2.default)(this, "_expressionIndex", void 0);
    (0, _defineProperty2.default)(this, "replacePathWithMessage", function (path, _ref3) {
      var id = _ref3.id,
          message = _ref3.message,
          values = _ref3.values,
          comment = _ref3.comment;
      var properties = [];
      var messageNode = isString(message) ? _this.types.stringLiteral(message) : message;

      if (id) {
        properties.push(_this.types.objectProperty(_this.types.identifier(_constants.ID), _this.types.stringLiteral(id)));

        if (process.env.NODE_ENV !== "production") {
          properties.push(_this.types.objectProperty(_this.types.identifier(_constants.MESSAGE), messageNode));
        }
      } else {
        properties.push(_this.types.objectProperty(_this.types.identifier(_constants.ID), messageNode));
      }

      if (comment) {
        properties.push(_this.types.objectProperty(_this.types.identifier(_constants.COMMENT), _this.types.stringLiteral(comment)));
      }

      if (Object.keys(values).length) {
        var valuesObject = Object.keys(values).map(function (key) {
          return _this.types.objectProperty(_this.types.identifier(key), values[key]);
        });
        properties.push(_this.types.objectProperty(_this.types.identifier(_constants.VALUES), _this.types.objectExpression(valuesObject)));
      }

      var newNode = _this.types.objectExpression(properties); // preserve line number


      newNode.loc = path.node.loc;
      path.addComment("leading", _constants.EXTRACT_MARK); // @ts-ignore

      path.replaceWith(newNode);
    });
    (0, _defineProperty2.default)(this, "replacePath", function (path) {
      // reset the expression counter
      _this._expressionIndex = (0, _utils.makeCounter)();

      if (_this.isDefineMessage(path.node)) {
        _this.replaceDefineMessage(path);

        return;
      }

      if (_this.types.isCallExpression(path.node) && _this.isIdentifier(path.node.callee, "t")) {
        _this.replaceTAsFunction(path);

        return;
      }

      var tokens = _this.tokenizeNode(path.node);

      var messageFormat = new _icu.default();

      var _messageFormat$fromTo = messageFormat.fromTokens(tokens),
          messageRaw = _messageFormat$fromTo.message,
          values = _messageFormat$fromTo.values,
          id = _messageFormat$fromTo.id,
          comment = _messageFormat$fromTo.comment;

      var message = normalizeWhitespace(messageRaw);

      _this.replacePathWithMessage(path, {
        id: id,
        message: message,
        values: values,
        comment: comment
      });
    });
    (0, _defineProperty2.default)(this, "replaceDefineMessage", function (path) {
      // reset the expression counter
      _this._expressionIndex = (0, _utils.makeCounter)();

      var descriptor = _this.processDescriptor(path.node.arguments[0]);

      path.replaceWith(descriptor);
    });
    (0, _defineProperty2.default)(this, "replaceTAsFunction", function (path) {
      var descriptor = _this.processDescriptor(path.node.arguments[0]);

      var newNode = _this.types.callExpression(_this.types.memberExpression(_this.types.identifier(_this.i18nImportName), _this.types.identifier("_")), [descriptor]);

      path.replaceWith(newNode);
    });
    (0, _defineProperty2.default)(this, "processDescriptor", function (descriptor) {
      _this.types.addComment(descriptor, "leading", _constants.EXTRACT_MARK);

      var messageIndex = descriptor.properties.findIndex(function (property) {
        return property.key.name === _constants.MESSAGE;
      });

      if (messageIndex === -1) {
        return descriptor;
      } // if there's `message` property, replace macros with formatted message


      var node = descriptor.properties[messageIndex]; // Inside message descriptor the `t` macro in `message` prop is optional.
      // Template strings are always processed as if they were wrapped by `t`.

      var tokens = _this.types.isTemplateLiteral(node.value) ? _this.tokenizeTemplateLiteral(node.value) : _this.tokenizeNode(node.value, true);
      var messageNode = node.value;

      if (tokens != null) {
        var messageFormat = new _icu.default();

        var _messageFormat$fromTo2 = messageFormat.fromTokens(tokens),
            messageRaw = _messageFormat$fromTo2.message,
            values = _messageFormat$fromTo2.values;

        var message = normalizeWhitespace(messageRaw);
        messageNode = _this.types.stringLiteral(message);

        _this.addValues(descriptor.properties, values);
      } // Don't override custom ID


      var hasId = descriptor.properties.findIndex(function (property) {
        return property.key.name === _constants.ID;
      }) !== -1;
      descriptor.properties[messageIndex] = _this.types.objectProperty(_this.types.identifier(hasId ? _constants.MESSAGE : _constants.ID), messageNode);
      return descriptor;
    });
    (0, _defineProperty2.default)(this, "addValues", function (obj, values) {
      var valuesObject = Object.keys(values).map(function (key) {
        return _this.types.objectProperty(_this.types.identifier(key), values[key]);
      });
      if (!valuesObject.length) return;
      obj.push(_this.types.objectProperty(_this.types.identifier("values"), _this.types.objectExpression(valuesObject)));
    });
    (0, _defineProperty2.default)(this, "tokenizeNode", function (node) {
      var ignoreExpression = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (_this.isI18nMethod(node)) {
        // t
        return _this.tokenizeTemplateLiteral(node);
      } else if (_this.isChoiceMethod(node)) {
        // plural, select and selectOrdinal
        return [_this.tokenizeChoiceComponent(node)]; // } else if (isFormatMethod(node.callee)) {
        //   // date, number
        //   return transformFormatMethod(node, file, props, root)
      } else if (!ignoreExpression) {
        return _this.tokenizeExpression(node);
      }
    });
    (0, _defineProperty2.default)(this, "tokenizeTemplateLiteral", function (node) {
      var tokenize = R.pipe(R.evolve({
        quasis: R.map(function (text) {
          // Don't output tokens without text.
          // if it's an unicode we keep the cooked value because it's the parsed value by babel (without unicode chars)
          var value = /\\u[a-fA-F0-9]{4}/g.test(text.value.raw) ? text.value.cooked : text.value.raw;
          if (value === "") return null;
          return {
            type: "text",
            value: _this.clearBackslashes(value)
          };
        }),
        expressions: R.map(function (exp) {
          return _this.types.isCallExpression(exp) ? _this.tokenizeNode(exp) : _this.tokenizeExpression(exp);
        })
      }), function (exp) {
        return (0, _utils.zip)(exp.quasis, exp.expressions);
      }, R.flatten, R.filter(Boolean));
      return tokenize(_this.types.isTaggedTemplateExpression(node) ? node.quasi : node);
    });
    (0, _defineProperty2.default)(this, "tokenizeChoiceComponent", function (node) {
      var format = node.callee.name.toLowerCase();

      var token = _objectSpread(_objectSpread({}, _this.tokenizeExpression(node.arguments[0])), {}, {
        format: format,
        options: {
          offset: undefined
        }
      });

      var props = node.arguments[1].properties;

      var _iterator = _createForOfIteratorHelper(props),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var attr = _step.value;
          var key = attr.key; // name is either:
          // NumericLiteral => convert to `={number}`
          // StringLiteral => key.value
          // Literal => key.name

          var name = _this.types.isNumericLiteral(key) ? "=".concat(key.value) : key.name || key.value;

          if (format !== "select" && name === "offset") {
            token.options.offset = attr.value.value;
          } else {
            var value = void 0;

            if (_this.types.isTemplateLiteral(attr.value)) {
              value = _this.tokenizeTemplateLiteral(attr.value);
            } else if (_this.types.isCallExpression(attr.value)) {
              value = _this.tokenizeNode(attr.value);
            } else {
              value = attr.value.value;
            }

            token.options[name] = value;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return token;
    });
    (0, _defineProperty2.default)(this, "tokenizeExpression", function (node) {
      if (_this.isArg(node)) {
        return {
          type: "arg",
          name: node.arguments[0].value
        };
      }

      return {
        type: "arg",
        name: _this.expressionToArgument(node),
        value: node
      };
    });
    (0, _defineProperty2.default)(this, "expressionToArgument", function (exp) {
      if (_this.types.isIdentifier(exp)) {
        return exp.name;
      } else if (_this.types.isStringLiteral(exp)) {
        return exp.value;
      } else {
        return _this._expressionIndex();
      }
    });
    (0, _defineProperty2.default)(this, "isIdentifier", function (node, name) {
      return _this.types.isIdentifier(node, {
        name: name
      });
    });
    (0, _defineProperty2.default)(this, "isDefineMessage", function (node) {
      return _this.types.isCallExpression(node) && _this.isIdentifier(node.callee, "defineMessage");
    });
    (0, _defineProperty2.default)(this, "isArg", function (node) {
      return _this.types.isCallExpression(node) && _this.isIdentifier(node.callee, "arg");
    });
    (0, _defineProperty2.default)(this, "isI18nMethod", function (node) {
      return _this.isIdentifier(node.tag, "t") || _this.types.isCallExpression(node.tag) && _this.isIdentifier(node.tag.callee, "t");
    });
    (0, _defineProperty2.default)(this, "isChoiceMethod", function (node) {
      return _this.types.isCallExpression(node) && (_this.isIdentifier(node.callee, "plural") || _this.isIdentifier(node.callee, "select") || _this.isIdentifier(node.callee, "selectOrdinal"));
    });
    this.types = types;
    this.i18nImportName = i18nImportName;
    this._expressionIndex = (0, _utils.makeCounter)();
  }

  (0, _createClass2.default)(MacroJs, [{
    key: "clearBackslashes",

    /**
     * We clean '//\` ' to just '`'
     */
    value: function clearBackslashes(value) {
      // if not we replace the extra scaped literals
      return value.replace(/\\`/g, "`");
    }
    /**
     * Custom matchers
     */

  }]);
  return MacroJs;
}();

exports.default = MacroJs;

var isString = function isString(s) {
  return typeof s === "string";
};